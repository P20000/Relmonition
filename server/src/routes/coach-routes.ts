import { Router } from 'express';
import { 
  uploadChatHistory, 
  getUploadStatus,
  deleteContextUpload,
  getConversations,
  getMessages,
  streamChat,
  regenerateResponse,
  editLatestPrompt
} from '../controllers/coach-controller';

const router = Router();

// POST /api/v1/coach/upload
router.post('/upload', uploadChatHistory);

// GET /api/v1/coach/upload-status/:tenantId
router.get('/upload-status/:tenantId', getUploadStatus);

// DELETE /api/v1/coach/context/:tenantId/:uploadId
router.delete('/context/:tenantId/:uploadId', deleteContextUpload);

// AI Coach Sessions & Persistence
router.get('/sessions/:tenantId', getConversations);
router.get('/sessions/:tenantId/:sessionId/messages', getMessages);
router.post('/chat/stream', streamChat);
router.post('/chat/regenerate', regenerateResponse);
router.post('/chat/edit', editLatestPrompt);

export default router;
