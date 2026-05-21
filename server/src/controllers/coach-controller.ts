import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import crypto from 'crypto';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { queryRelationshipMemoryStream, processChatUpload } from '../services/ai/rag-service';
import AdmZip from 'adm-zip';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuthorizedRequest } from '../middleware/authorize';
import { Counter } from 'prom-client';

// Tracks completed AI Coach stream interactions per tenant and mode.
// A stream is counted only if it completed without abort (i.e., a full response was saved).
const coachStreamsTotal = new Counter({
  name: 'relmonition_coach_streams_total',
  help: 'Total completed AI Coach stream interactions',
  labelNames: ['tenant', 'mode'] as const,
});

// Tracks active (in-flight) AI Coach streams — decremented on finish/abort.
// Use this as a real-time concurrency gauge in Grafana.
const coachActiveStreams = new (require('prom-client').Gauge)({
  name: 'relmonition_coach_active_streams',
  help: 'Number of AI Coach SSE streams currently in flight',
  labelNames: ['tenant'] as const,
});

const tenantManager = new TenantDatabaseManager();

// Helper to validate session ownership
const validateSession = async (db: any, sessionId: string, tenantId: string, userId: string): Promise<boolean> => {
  const session = await db
    .select()
    .from(schema.coachConversations)
    .where(and(
      eq(schema.coachConversations.id, sessionId),
      eq(schema.coachConversations.tenantId, tenantId),
      eq(schema.coachConversations.userId, userId)
    ))
    .limit(1);
  return session.length > 0;
};

// ----------------------------------------------------
// SESSION MANAGEMENT
// ----------------------------------------------------

export const getConversations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as AuthorizedRequest).tenantId!;
    const userId = (req as AuthenticatedRequest).user!.userId;
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

export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as AuthorizedRequest).tenantId!;
    const userId = (req as AuthenticatedRequest).user!.userId;
    const sessionId = req.params.sessionId as string;
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const isOwner = await validateSession(db, sessionId, tenantId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access Denied: Invalid session context.' });
    }

    await db.delete(schema.coachMessages).where(eq(schema.coachMessages.conversationId, sessionId));
    await db.delete(schema.coachConversations).where(and(
      eq(schema.coachConversations.id, sessionId),
      eq(schema.coachConversations.tenantId, tenantId)
    ));

    res.json({ message: 'Conversation deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as AuthorizedRequest).tenantId!;
    const userId = (req as AuthenticatedRequest).user!.userId;
    const sessionId = req.params.sessionId as string;
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const isOwner = await validateSession(db, sessionId, tenantId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access Denied: Invalid session context.' });
    }

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
  try {
    const tenantId = (req as AuthorizedRequest).tenantId!;
    const userId = (req as AuthenticatedRequest).user!.userId;
    let { sessionId, query, mode = 'retrieval' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required.' });
    }

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
    } else {
      const isOwner = await validateSession(db, sessionId, tenantId, userId);
      if (!isOwner) {
        return res.status(403).json({ error: 'Access Denied: Invalid session context.' });
      }
    }

    // 2. Save User Message
    const userMessageId = crypto.randomUUID();
    await db.insert(schema.coachMessages).values({
      id: userMessageId,
      conversationId: sessionId,
      role: 'user',
      content: query,
      createdAt: new Date(),
    });

    // 3. Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Track this as an active in-flight stream
    coachActiveStreams.inc({ tenant: tenantId });

    // Handle abrupt disconnection
    let isFinished = false;
    const abortController = new AbortController();
    
    req.on('close', async () => {
      abortController.abort();
      // Decrement active streams gauge on disconnect
      coachActiveStreams.dec({ tenant: tenantId });
      if (!isFinished) {
        try {
          // If generation didn't finish, remove the "orphaned" user message
          const { client: cleanupDb } = await tenantManager.getDatabaseClient(tenantId);
          await cleanupDb.delete(schema.coachMessages).where(eq(schema.coachMessages.id, userMessageId));
          console.log(`[Coach] Cleaned up aborted message: ${userMessageId}`);
        } catch (e) {
          console.error('[Coach] Cleanup failed:', e);
        }
      }
    });

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
      isFinished = true;

      // Decrement active gauge and increment completed counter
      coachActiveStreams.dec({ tenant: tenantId });
      coachStreamsTotal.inc({ tenant: tenantId, mode });
    }

    res.write('event: end\ndata: done\n\n');
    res.end();
  } catch (error: any) {
    console.error('[Coach Stream] Error:', error);
    res.status(500).end();
  }
};

export const regenerateResponse = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as AuthorizedRequest).tenantId!;
    const userId = (req as AuthenticatedRequest).user!.userId;
    const { sessionId, mode = 'retrieval' } = req.body;

    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const isOwner = await validateSession(db, sessionId, tenantId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access Denied: Invalid session context.' });
    }

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
  try {
    const tenantId = (req as AuthorizedRequest).tenantId!;
    const userId = (req as AuthenticatedRequest).user!.userId;
    const { sessionId, newQuery, mode = 'retrieval' } = req.body;

    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const isOwner = await validateSession(db, sessionId, tenantId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access Denied: Invalid session context.' });
    }

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
    const tenantId = (req as AuthorizedRequest).tenantId!;
    const userId = (req as AuthenticatedRequest).user!.userId;
    const { fileName, fileContent, fileSize, strategy = 'append' } = req.body;

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

      // ZIP Bomb / DOS Mitigations
      const MAX_ZIP_FILES = 100;
      const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const MAX_TOTAL_UNCOMPRESSED_SIZE = 50 * 1024 * 1024; // 50MB
      let totalUncompressedSize = 0;
      let totalFiles = 0;

      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          totalFiles++;
          if (totalFiles > MAX_ZIP_FILES) {
            return res.status(400).json({ error: 'ZIP archive contains too many files (limit is 100).' });
          }
          if (entry.header.size > MAX_SINGLE_FILE_SIZE) {
            return res.status(400).json({ error: `File inside ZIP exceeds safe size limit of 10MB: ${entry.entryName}` });
          }
          totalUncompressedSize += entry.header.size;
          if (totalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_SIZE) {
            return res.status(400).json({ error: 'ZIP archive total uncompressed size exceeds safe limit of 50MB.' });
          }
        }
      }

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
    const tenantId = (req as AuthorizedRequest).tenantId!;
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
        const tenantId = (req as AuthorizedRequest).tenantId!;
    const uploadId = String(req.params.uploadId);
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    // 1. Delete associated embeddings (manual cascade to be safe)
    await db.delete(schema.embeddings).where(eq(schema.embeddings.chatUploadId, uploadId));

    // 2. Delete upload record
    await db.delete(schema.chatUploads).where(and(
      eq(schema.chatUploads.id, uploadId),
      eq(schema.chatUploads.tenantId, tenantId)
    ));

    res.json({ message: 'Context fragment deleted successfully.' });
  } catch (error: any) {
    console.error('[Coach Controller] Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete context fragment.' });
  }
};
