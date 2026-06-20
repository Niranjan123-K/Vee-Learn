// ─── Match Routes ───────────────────────────────────────────
import { Router } from 'express';
import { findMatches } from '../controllers/matchController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, findMatches);

export default router;
