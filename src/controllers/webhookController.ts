import { Request, Response } from 'express';
import stripe from '../configs/stripe';
import Payment from '../models/Payment';
import User from '../models/User';

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const userId = paymentIntent.metadata?.userId;
      const email = paymentIntent.metadata?.email;

      if (!userId || !email) {
        console.error('Webhook: Missing metadata on payment intent', paymentIntentId);
        res.json({ received: true });
        return;
      }

      const existingPayment = await Payment.findOne({ stripePaymentId: paymentIntentId });
      if (existingPayment) {
        res.json({ received: true });
        return;
      }

      await Payment.create({
        user: userId,
        stripePaymentId: paymentIntentId,
        amount: (paymentIntent.amount_received || paymentIntent.amount) / 100,
        email,
      });

      await User.findByIdAndUpdate(userId, {
        isPremium: true,
        premiumExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      console.log(`Webhook: Premium activated for user ${userId}`);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.error('Webhook: Payment failed for intent', paymentIntent.id, paymentIntent.last_payment_error);
      break;
    }

    default:
      console.log('Webhook: Unhandled event type', event.type);
  }

  res.json({ received: true });
};
