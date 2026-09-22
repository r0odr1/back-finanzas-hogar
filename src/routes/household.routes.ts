import { Router } from 'express';
import { create } from '../controllers/household.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateToken, create);

export default router;