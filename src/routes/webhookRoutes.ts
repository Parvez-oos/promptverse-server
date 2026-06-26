import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/webhookController';

const router = Router();

router.post('/', handleStripeWebhook);

export default router;
