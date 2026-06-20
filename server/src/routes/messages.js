// ─── Message Routes ─────────────────────────────────────────
import { Router } from 'express';
import { getConversations, getMessages, sendMessage, markAsRead } from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/conversations',          authenticate, getConversations);
router.get('/conversation/:userId',   authenticate, getMessages);
router.post('/',                      authenticate, sendMessage);
router.put('/read/:conversationId',   authenticate, markAsRead);

export default router;
