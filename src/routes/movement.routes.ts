import { Router } from 'express';
import { create, list } from '../controllers/movement.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:householdId', authenticateToken, list);
router.post('/:householdId', authenticateToken, create);

export default router;