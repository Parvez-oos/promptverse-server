import { Response } from 'express';
import User from '../models/User';
import Prompt from '../models/Prompt';
import Review from '../models/Review';
import Bookmark from '../models/Bookmark';
import Payment from '../models/Payment';
import Report from '../models/Report';
import { AuthRequest } from '../types';

export const getAdminAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalPrompts,
      pendingPrompts,
      totalReviews,
      totalPayments,
      totalReports,
      totalBookmarks,
      promptStats,
      paymentStats,
      monthlyData,
    ] = await Promise.all([
      User.countDocuments(),
      Prompt.countDocuments(),
      Prompt.countDocuments({ status: 'pending' }),
      Review.countDocuments(),
      Payment.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Bookmark.countDocuments(),
      Prompt.aggregate([
        { $group: { _id: null, totalCopies: { $sum: '$copyCount' } } },
      ]),
      Payment.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      Prompt.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            copies: { $sum: '$copyCount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPrompts,
        pendingPrompts,
        totalReviews,
        totalPayments,
        totalReports,
        totalBookmarks,
        totalCopies: promptStats[0]?.totalCopies || 0,
        totalRevenue: paymentStats[0]?.totalRevenue || 0,
        monthlyData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPrompts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      status,
      category,
      aiTool,
      difficultyLevel,
      sort = 'latest',
      page = '1',
      limit = '20',
    } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    if (category) {
      query.category = category as string;
    }

    if (aiTool) {
      query.aiTool = aiTool as string;
    }

    if (difficultyLevel) {
      query.difficultyLevel = difficultyLevel as string;
    }

    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'most_copied':
        sortOption = { copyCount: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'title_asc':
        sortOption = { title: 1 };
        break;
      case 'title_desc':
        sortOption = { title: -1 };
        break;
      case 'latest':
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const [prompts, total] = await Promise.all([
      Prompt.find(query)
        .populate('creator', 'name email')
        .sort(sortOption)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Prompt.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: prompts,
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

export const approvePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );

    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    await User.findByIdAndUpdate(prompt.creator, { role: 'creator' });

    res.status(200).json({
      success: true,
      message: 'Prompt approved successfully.',
      data: prompt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feedback } = req.body;

    if (!feedback) {
      res.status(400).json({ message: 'Rejection feedback is required.' });
      return;
    }

    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionFeedback: feedback },
      { new: true }
    );

    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Prompt rejected. Feedback sent to creator.',
      data: prompt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleFeatured = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    prompt.isFeatured = !prompt.isFeatured;
    await prompt.save();

    res.status(200).json({
      success: true,
      message: prompt.isFeatured ? 'Prompt featured.' : 'Prompt unfeatured.',
      data: prompt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
