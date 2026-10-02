import { Router } from 'express';
import { list } from '../controllers/movement.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:householdId', authenticateToken, list);

export default router;