import { Router } from 'express';
import { getCreatorAnalytics, getMyPrompts, getUserAnalytics } from '../controllers/dashboardController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/user/analytics', authenticate, authorize('user', 'creator', 'admin'), getUserAnalytics);
router.get('/creator/analytics', authenticate, authorize('creator', 'admin'), getCreatorAnalytics);
router.get('/creator/prompts', authenticate, authorize('creator', 'admin'), getMyPrompts);

export default router;
