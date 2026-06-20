// ─── Skill Routes ───────────────────────────────────────────
import { Router } from 'express';
import { getAllSkills, addUserSkill, removeUserSkill, getUserSkills } from '../controllers/skillController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/',                getAllSkills);
router.post('/user-skills',    authenticate, addUserSkill);
router.delete('/user-skills/:id', authenticate, removeUserSkill);
router.get('/user/:userId',    getUserSkills);

export default router;
