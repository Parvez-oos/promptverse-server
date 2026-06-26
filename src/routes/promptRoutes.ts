import { Router } from 'express';
import {
  getAllPrompts,
  getFeaturedPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  incrementCopyCount,
  getCategories,
  getAITools,
  getTrendingPrompts,
  forkPrompt,
} from '../controllers/promptController';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth';

const router = Router();

router.get('/', optionalAuth, getAllPrompts);
router.get('/featured', getFeaturedPrompts);
router.get('/trending', getTrendingPrompts);
router.get('/categories', getCategories);
router.get('/ai-tools', getAITools);
router.get('/:id', optionalAuth, getPromptById);
router.post('/', authenticate, authorize('user', 'creator', 'admin'), createPrompt);
router.put('/:id', authenticate, updatePrompt);
router.delete('/:id', authenticate, deletePrompt);
router.patch('/:id/copy', authenticate, incrementCopyCount);
router.post('/:id/fork', authenticate, forkPrompt);

export default router;
