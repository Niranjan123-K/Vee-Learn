// ─── Analytics Routes ───────────────────────────────────────
import { Router } from 'express';
import { getDashboardStats, getActivityData } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/activity',  authenticate, getActivityData);

export default router;
