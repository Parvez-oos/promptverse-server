import { Router } from 'express';
import { testPrompt } from '../controllers/aiController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/test', authenticate, testPrompt);

export default router;
