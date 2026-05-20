import { Router } from 'express';
import { 
  uploadChatHistory, 
  getUploadStatus,
  deleteContextUpload,
  getConversations,
  getMessages,
  streamChat,
  regenerateResponse,
  editLatestPrompt,
  deleteConversation
} from '../controllers/coach-controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateBody, uploadChatSchema } from '../utils/validation';

const router = Router();

// Secure all coach endpoints with session authentication
router.use(authenticate);

// POST /api/v1/coach/upload
router.post('/upload', authorize(), validateBody(uploadChatSchema), uploadChatHistory);

// GET /api/v1/coach/upload-status/:tenantId
router.get('/upload-status/:tenantId', authorize(), getUploadStatus);

// DELETE /api/v1/coach/context/:tenantId/:uploadId
router.delete('/context/:tenantId/:uploadId', authorize(), deleteContextUpload);

// AI Coach Sessions & Persistence
router.get('/sessions/:tenantId', authorize(), getConversations);
router.delete('/sessions/:tenantId/:sessionId', authorize(), deleteConversation);
router.get('/sessions/:tenantId/:sessionId/messages', authorize(), getMessages);
router.post('/chat/stream', authorize(), streamChat);
router.post('/chat/regenerate', authorize(), regenerateResponse);
router.post('/chat/edit', authorize(), editLatestPrompt);

export default router;
