import { Router } from 'express';
import {
  getTenantData,
  createTenant,
  joinTenant,
  getUserTenants,
  regenerateConnectionCode,
  leaveTenant,
  deleteTenant,
} from '../controllers/tenant-controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateBody, createTenantSchema, joinTenantSchema } from '../utils/validation';

const router = Router();

// Secure all tenant endpoints with session authentication
router.use(authenticate);

// Relationship management
router.get('/user/:userId', getUserTenants);
router.post('/create', validateBody(createTenantSchema), createTenant);
router.post('/join', validateBody(joinTenantSchema), joinTenant);

// Tenant-specific operations (role-authorized)
router.get('/:tenantId', authorize(), getTenantData);
router.post('/:tenantId/regenerate-code', authorize('owner'), regenerateConnectionCode);
router.delete('/:tenantId/leave', authorize(), leaveTenant);
router.delete('/:tenantId', authorize('owner'), deleteTenant);

export default router;
