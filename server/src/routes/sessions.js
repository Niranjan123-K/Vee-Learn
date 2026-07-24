// ─── Session Routes ─────────────────────────────────────────
import { Router } from 'express';
import {
  createSession,
  confirmSession,
  completeSession,
  cancelSession,
  getUserSessions,
  getSessionById,
  getSessionMessages,
  rejectSession,
  updateMeetingLink,
} from '../controllers/sessionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/',              authenticate, createSession);
router.get('/',               authenticate, getUserSessions);
router.get('/:id',            authenticate, getSessionById);
router.get('/:id/messages',   authenticate, getSessionMessages);
router.put('/:id/confirm',    authenticate, confirmSession);
router.put('/:id/meeting',    authenticate, updateMeetingLink);
router.put('/:id/reject',     authenticate, rejectSession);
router.put('/:id/complete',   authenticate, completeSession);
router.put('/:id/cancel',     authenticate, cancelSession);

export default router;
