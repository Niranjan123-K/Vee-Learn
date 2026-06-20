// ─── Credit Routes ──────────────────────────────────────────
import { Router } from 'express';
import { getBalance, getTransactionHistory, getCreditStats } from '../controllers/creditController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/balance', authenticate, getBalance);
router.get('/history', authenticate, getTransactionHistory);
router.get('/stats',   authenticate, getCreditStats);

export default router;
