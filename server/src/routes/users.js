// ─── User Routes ────────────────────────────────────────────
import { Router } from 'express';
import { getProfile, updateProfile, getLeaderboard, getTeachers, uploadDp, uploadWallpaper, completeOnboarding } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/teachers',    authenticate, getTeachers);
router.put('/profile',     authenticate, updateProfile);
router.post('/complete-onboarding', authenticate, completeOnboarding);
router.post('/upload/dp',  authenticate, upload.single('dp'), uploadDp);
router.post('/upload/wallpaper', authenticate, upload.single('wallpaper'), uploadWallpaper);
router.get('/:id',         getProfile);

export default router;
