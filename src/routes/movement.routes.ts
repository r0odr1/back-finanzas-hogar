import { Router } from 'express';
import { create, list, update } from '../controllers/movement.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:householdId', authenticateToken, list);
router.post('/:householdId', authenticateToken, create);
router.patch('/:householdId/:movementId', authenticateToken, update);

export default router;