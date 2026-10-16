import { Router } from 'express';
import { create, list, remove, update } from '../controllers/budget.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:householdId', authenticateToken, list);
router.post('/:householdId', authenticateToken, create);
router.patch('/:householdId/:budgetId', authenticateToken, update);
router.delete('/:householdId/:budgetId', authenticateToken, remove);

export default router;