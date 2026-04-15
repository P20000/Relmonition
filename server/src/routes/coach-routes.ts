import { Router } from 'express';
import { uploadChatHistory, getUploadStatus } from '../controllers/coach-controller';

const router = Router();

// POST /api/v1/coach/upload
router.post('/upload', uploadChatHistory);

// GET /api/v1/coach/upload-status/:tenantId
router.get('/upload-status/:tenantId', getUploadStatus);

export default router;
