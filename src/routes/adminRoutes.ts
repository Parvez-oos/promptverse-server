import { Router } from 'express';
import {
  getAdminAnalytics,
  getAllPrompts,
  approvePrompt,
  rejectPrompt,
  toggleFeatured,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/analytics', authenticate, authorize('admin'), getAdminAnalytics);
router.get('/prompts', authenticate, authorize('admin'), getAllPrompts);
router.patch('/prompts/:id/approve', authenticate, authorize('admin'), approvePrompt);
router.patch('/prompts/:id/reject', authenticate, authorize('admin'), rejectPrompt);
router.patch('/prompts/:id/feature', authenticate, authorize('admin'), toggleFeatured);

export default router;
