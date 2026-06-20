// ─── Review Routes ──────────────────────────────────────────
import { Router } from 'express';
import { createReview, getReviewsForUser, getReviewForSession } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/',                authenticate, createReview);
router.get('/user/:userId',     getReviewsForUser);
router.get('/session/:sessionId', getReviewForSession);

export default router;
