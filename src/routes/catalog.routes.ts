import { Router } from 'express';
import { getMovementCatalogsController } from '../controllers/catalog.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:householdId/movements', authenticateToken, getMovementCatalogsController);

export default router;