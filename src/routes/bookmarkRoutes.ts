import { Router } from 'express';
import { toggleBookmark, getUserBookmarks, isBookmarked } from '../controllers/bookmarkController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getUserBookmarks);
router.get('/:promptId', authenticate, isBookmarked);
router.post('/:promptId', authenticate, toggleBookmark);

export default router;
