import { Response } from 'express';
import stripe from '../configs/stripe';
import Payment from '../models/Payment';
import User from '../models/User';
import { AuthRequest } from '../types';

export const createPaymentIntent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (user.isPremium) {
      res.status(400).json({ message: 'You already have an active premium subscription.' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500,
      currency: 'usd',
      metadata: {
        userId: req.user?._id || '',
        email: req.user?.email || '',
      },
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: 500,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Payment initiation failed.' });
  }
};

export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      res.status(400).json({ message: 'Payment has not been completed.' });
      return;
    }

    const existingPayment = await Payment.findOne({ stripePaymentId: paymentIntentId });

    if (existingPayment) {
      res.status(200).json({
        success: true,
        message: 'Payment already processed.',
        data: existingPayment,
      });
      return;
    }

    const payment = await Payment.create({
      user: req.user?._id,
      stripePaymentId: paymentIntentId,
      amount: paymentIntent.amount_received / 100,
      email: req.user?.email,
    });

    await User.findByIdAndUpdate(req.user?._id, {
      isPremium: true,
      premiumExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({
      success: true,
      message: 'Payment confirmed. Welcome to Premium!',
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Payment confirmation failed.' });
  }
};

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { email: { $regex: search as string, $options: 'i' } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { amount: -1 };
        break;
      case 'lowest':
        sortOption = { amount: 1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ user: req.user?._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
