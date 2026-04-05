import { Router } from 'express';
import { getTenantData } from '../controllers/tenant-controller';

const router = Router();

router.get('/:tenantId', getTenantData);

export default router;
