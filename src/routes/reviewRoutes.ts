import { Router } from 'express';
import {
  getPromptReviews,
  createReview,
  deleteReview,
  getRecentReviews,
  getUserReviews,
} from '../controllers/reviewController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/recent', getRecentReviews);
router.get('/prompt/:promptId', getPromptReviews);
router.get('/my-reviews', authenticate, getUserReviews);
router.post('/:promptId', authenticate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
