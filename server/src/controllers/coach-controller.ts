import { Request, Response } from 'express';
import { TenantDatabaseManager } from '../tenant-manager';
import * as schema from '../db/schema';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

const tenantManager = new TenantDatabaseManager();

/**
 * POST /api/v1/coach/upload
 * Body: { tenantId: string, userId: string, fileName: string, fileContent: string, fileSize: number }
 */
export const uploadChatHistory = async (req: Request, res: Response) => {
  try {
    const { tenantId, userId, fileName, fileContent, fileSize } = req.body;

    if (!tenantId || !userId || !fileName || !fileContent) {
      return res.status(400).json({ error: 'Missing required fields for chat upload.' });
    }

    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const uploadId = crypto.randomUUID();

    await db.insert(schema.chatUploads).values({
      id: uploadId,
      tenantId,
      userId,
      fileName,
      fileContent,
      fileSize,
      processed: false,
      createdAt: new Date(),
    });

    res.status(201).json({ 
      message: 'Chat history uploaded successfully and queued for processing.', 
      uploadId 
    });
  } catch (error: any) {
    console.error('[Coach Controller] Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload chat history.', details: error.message });
  }
};

/**
 * GET /api/v1/coach/upload-status/:tenantId
 */
export const getUploadStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const { client: db } = await tenantManager.getDatabaseClient(tenantId);

    const uploads = await db.select().from(schema.chatUploads).where(eq(schema.chatUploads.tenantId, tenantId));

    res.json(uploads.map(u => ({
      id: u.id,
      fileName: u.fileName,
      processed: u.processed,
      createdAt: u.createdAt
    })));
  } catch (error: any) {
    console.error('[Coach Controller] Status Error:', error);
    res.status(500).json({ error: 'Failed to fetch upload status.' });
  }
};
