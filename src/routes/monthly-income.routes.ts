import { Router } from 'express';
import { list, save  } from '../controllers/monthly-income.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:householdId', authenticateToken, list);
router.put('/:householdId', authenticateToken, save);

export default router;