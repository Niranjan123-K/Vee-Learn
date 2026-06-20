// ─── User Routes ────────────────────────────────────────────
import { Router } from 'express';
import { getProfile, updateProfile, getLeaderboard, getTeachers } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/teachers',    getTeachers);
router.put('/profile',     authenticate, updateProfile);
router.get('/:id',         getProfile);

export default router;
