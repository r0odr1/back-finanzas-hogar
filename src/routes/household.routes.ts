import { Router } from 'express';
import { create } from '../controllers/household.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { addMember, listMembers } from '../controllers/household-member.controller';

const router = Router();

router.post('/', authenticateToken, create);
router.post('/:householdId/members', authenticateToken, addMember);
router.get('/:householdId/members', authenticateToken, listMembers);

export default router;