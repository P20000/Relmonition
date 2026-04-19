import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import crypto from 'crypto';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { queryRelationshipMemoryStream, processChatUpload } from '../services/ai/rag-service';
import AdmZip from 'adm-zip';

const tenantManager = new TenantDatabaseManager();

// ----------------------------------------------------
// SESSION MANAGEMENT
// ----------------------------------------------------

export const getConversations = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const userId = req.query.userId as string;
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const conversations = await db
      .select()
      .from(schema.coachConversations)
      .where(and(
        eq(schema.coachConversations.tenantId, tenantId),
        eq(schema.coachConversations.userId, userId)
      ))
      .orderBy(desc(schema.coachConversations.createdAt));

    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const sessionId = req.params.sessionId as string;
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const messages = await db
      .select()
      .from(schema.coachMessages)
      .where(eq(schema.coachMessages.conversationId, sessionId))
      .orderBy(schema.coachMessages.createdAt);

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

// ----------------------------------------------------
// STREAMING CHAT
// ----------------------------------------------------

export const streamChat = async (req: Request, res: Response) => {
  let { tenantId, userId, sessionId, query, mode = 'retrieval' } = req.body;

  if (!tenantId || !query) {
    return res.status(400).json({ error: 'tenantId and query are required.' });
  }

  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    // 1. Ensure Session exists or create new
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      await db.insert(schema.coachConversations).values({
        id: sessionId,
        tenantId,
        userId,
        title: query.substring(0, 40) + '...',
        createdAt: new Date()
      });
    }

    // 2. Save User Message
    await db.insert(schema.coachMessages).values({
      id: crypto.randomUUID(),
      conversationId: sessionId,
      role: 'user',
      content: query,
      createdAt: new Date(),
    });

    // 3. Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Handle abrupt disconnection
    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    // 4. Stream response
    let fullContent = '';
    const stream = queryRelationshipMemoryStream(tenantId, query, mode, abortController.signal);

    // Send sessionId header first so frontend knows if it's a new conversation
    res.write(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`);

    for await (const chunk of stream) {
      fullContent += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    // 5. Save Assistant Message on completion
    if (!abortController.signal.aborted && fullContent) {
      await db.insert(schema.coachMessages).values({
        id: crypto.randomUUID(),
        conversationId: sessionId,
        role: 'assistant',
        content: fullContent,
        createdAt: new Date(),
      });
    }

    res.write('event: end\ndata: done\n\n');
    res.end();
  } catch (error: any) {
    console.error('[Coach Stream] Error:', error);
    res.status(500).end();
  }
};

export const regenerateResponse = async (req: Request, res: Response) => {
  const { tenantId, sessionId, mode = 'retrieval' } = req.body;

  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    // 1. Get latest user message
    const history = await db
      .select()
      .from(schema.coachMessages)
      .where(eq(schema.coachMessages.conversationId, sessionId))
      .orderBy(desc(schema.coachMessages.createdAt));

    const lastAssistant = history.find(m => m.role === 'assistant');
    const lastUser = history.find(m => m.role === 'user');

    if (!lastUser) return res.status(400).json({ error: 'No message to regenerate.' });

    // 2. Delete the latest assistant response if it exists
    if (lastAssistant) {
      await db.delete(schema.coachMessages).where(eq(schema.coachMessages.id, lastAssistant.id));
    }

    // 3. Re-trigger stream with same query
    req.body.query = lastUser.content;
    return streamChat(req, res);
  } catch (error: any) {
    res.status(500).json({ error: 'Regeneration failed.' });
  }
};

export const editLatestPrompt = async (req: Request, res: Response) => {
  const { tenantId, sessionId, newQuery, mode = 'retrieval' } = req.body;

  try {
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    // 1. Get latest messages
    const history = await db
      .select()
      .from(schema.coachMessages)
      .where(eq(schema.coachMessages.conversationId, sessionId))
      .orderBy(desc(schema.coachMessages.createdAt));

    const lastAssistant = history.find(m => m.role === 'assistant');
    const lastUser = history.find(m => m.role === 'user');

    if (!lastUser) return res.status(400).json({ error: 'No message to edit.' });

    // 2. Delete old pair
    if (lastAssistant) {
      await db.delete(schema.coachMessages).where(eq(schema.coachMessages.id, lastAssistant.id));
    }
    await db.delete(schema.coachMessages).where(eq(schema.coachMessages.id, lastUser.id));

    // 3. Stream new query
    req.body.query = newQuery;
    return streamChat(req, res);
  } catch (error: any) {
    res.status(500).json({ error: 'Edit failed.' });
  }
};

// ----------------------------------------------------
// FILE UPLOADS (Original Logic)
// ----------------------------------------------------

export const uploadChatHistory = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId, fileName, fileContent, fileSize, strategy = 'append' } = req.body;

    if (!tenantId || !userId || !fileName || !fileContent) {
      return res.status(400).json({ error: 'Missing required fields for chat upload.' });
    }

    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    // 1. If strategy is 'replace', wipe existing context for this tenant
    // (We do this once at the start of the upload session)
    if (strategy === 'replace') {
      console.log(`[Coach] Executing 'replace' strategy for tenant ${tenantId}`);
      const existingUploads = await db.select({ id: schema.chatUploads.id })
        .from(schema.chatUploads)
        .where(eq(schema.chatUploads.tenantId, tenantId));
      
      const uploadIds = existingUploads.map(u => u.id);
      if (uploadIds.length > 0) {
        await db.delete(schema.embeddings).where(inArray(schema.embeddings.chatUploadId, uploadIds));
        await db.delete(schema.chatUploads).where(eq(schema.chatUploads.tenantId, tenantId));
      }
    }

    // 2. Handle ZIP Extraction or Direct Upload
    const filesToProcess: { name: string; content: string; size: number }[] = [];

    if (fileName.toLowerCase().endsWith('.zip')) {
      console.log(`[Coach] Extracting ZIP: ${fileName}`);
      const zip = new AdmZip(Buffer.from(fileContent, 'base64'));
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        // Strictly only .txt files as requested
        if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.txt')) {
          const content = entry.getData().toString('utf8');
          filesToProcess.push({
            name: entry.entryName,
            content: content,
            size: entry.header.size
          });
        }
      }
      
      if (filesToProcess.length === 0) {
        return res.status(400).json({ error: 'No .txt files found in the ZIP archive.' });
      }
    } else {
      filesToProcess.push({ name: fileName, content: fileContent, size: fileSize });
    }

    // 3. Process each file (as fragments)
    const processedIds: string[] = [];

    for (const file of filesToProcess) {
      const uploadId = crypto.randomUUID();
      await db.insert(schema.chatUploads).values({
        id: uploadId,
        tenantId,
        userId,
        fileName: file.name,
        fileContent: file.content,
        fileSize: file.size,
        processed: false,
        createdAt: new Date(),
      });

      // Trigger background processing
      processChatUpload(tenantId, uploadId, file.content).catch(err => {
        console.error(`[Coach Process Error] ${uploadId}:`, err);
      });
      
      processedIds.push(uploadId);
    }

    res.status(201).json({ 
      message: fileName.toLowerCase().endsWith('.zip')
        ? `ZIP extracted: ${filesToProcess.length} .txt fragments ingested.`
        : 'Context ingested and processing started.', 
      uploadIds: processedIds 
    });
  } catch (error: any) {
    console.error('[Coach Controller] Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload chat history.', details: error.message });
  }
};

export const getUploadStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const uploads = await db.select().from(schema.chatUploads).where(eq(schema.chatUploads.tenantId, tenantId));

    res.json(uploads.map(u => ({
      id: u.id,
      fileName: u.fileName,
      fileSize: u.fileSize,
      processed: u.processed,
      processingProgress: u.processingProgress || 0,
      createdAt: u.createdAt
    })));
  } catch (error: any) {
    console.error('[Coach Controller] Status Error:', error);
    res.status(500).json({ error: 'Failed to fetch upload status.' });
  }
};

export const deleteContextUpload = async (req: Request, res: Response) => {
  try {
    const { tenantId, uploadId } = req.params;
    const { client: db } = await tenantManager.getDatabaseClient(tenantId as string);

    // 1. Delete associated embeddings (manual cascade to be safe)
    await db.delete(schema.embeddings).where(eq(schema.embeddings.chatUploadId, uploadId as string));

    // 2. Delete upload record
    await db.delete(schema.chatUploads).where(and(
      eq(schema.chatUploads.id, uploadId as string),
      eq(schema.chatUploads.tenantId, tenantId as string)
    ));

    res.json({ message: 'Context fragment deleted successfully.' });
  } catch (error: any) {
    console.error('[Coach Controller] Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete context fragment.' });
  }
};
