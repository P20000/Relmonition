import { Router } from 'express';
import {
  getTenantData,
  getDashboardData,
  createTenant,
  joinTenant,
  getUserTenants,
  regenerateConnectionCode,
  leaveTenant,
  deleteTenant,
} from '../controllers/tenant-controller';

const router = Router();

// Relationship management
router.get('/user/:userId', getUserTenants);
router.post('/create', createTenant);
router.post('/join', joinTenant);

// Tenant-specific operations
router.get('/:tenantId', getTenantData);
router.post('/:tenantId/regenerate-code', regenerateConnectionCode);
router.delete('/:tenantId/leave', leaveTenant);
router.delete('/:tenantId', deleteTenant);

export default router;
