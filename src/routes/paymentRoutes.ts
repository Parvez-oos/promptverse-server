import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPayments,
  getUserPayments,
} from '../controllers/paymentController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/confirm', authenticate, confirmPayment);
router.get('/', authenticate, authorize('admin'), getPayments);
router.get('/my-payments', authenticate, getUserPayments);

export default router;
