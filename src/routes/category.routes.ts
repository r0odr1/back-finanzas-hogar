import { Router } from 'express';
import { create, list, remove, update } from '../controllers/category.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:householdId', authenticateToken, list);
router.post('/:householdId', authenticateToken, create);
router.patch('/:householdId/:categoryId', authenticateToken, update);
router.delete('/:householdId/:categoryId', authenticateToken, remove);

export default router;