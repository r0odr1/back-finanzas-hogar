import { Router } from 'express';
import { monthlySummary } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:householdId/monthly', authenticateToken, monthlySummary);

export default router;