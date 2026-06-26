import { Response } from 'express';
import Prompt from '../models/Prompt';
import Review from '../models/Review';
import Bookmark from '../models/Bookmark';
import { AuthRequest } from '../types';

export const getUserAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    const [
      totalPrompts,
      totalCopiesResult,
      totalSaved,
      totalReviews,
      monthlyData,
      aiToolData,
    ] = await Promise.all([
      Prompt.countDocuments({ creator: userId }),
      Prompt.aggregate([
        { $match: { creator: userId as any } },
        { $group: { _id: null, total: { $sum: '$copyCount' } } },
      ]),
      Bookmark.countDocuments({ user: userId }),
      Review.countDocuments({ user: userId }),
      Prompt.aggregate([
        { $match: { creator: userId as any } },
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
      Prompt.aggregate([
        { $match: { creator: userId as any } },
        { $group: { _id: '$aiTool', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPrompts,
        totalCopies: totalCopiesResult[0]?.total || 0,
        totalSaved,
        totalReviews,
        monthlyData,
        aiToolData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCreatorAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    const [
      totalPrompts,
      totalCopies,
      totalBookmarks,
      totalReviews,
      promptData,
      monthlyData,
    ] = await Promise.all([
      Prompt.countDocuments({ creator: userId }),
      Prompt.aggregate([
        { $match: { creator: userId as any } },
        { $group: { _id: null, total: { $sum: '$copyCount' } } },
      ]),
      Bookmark.countDocuments({
        prompt: { $in: (await Prompt.find({ creator: userId }).select('_id')).map((p) => p._id) },
      }),
      Review.countDocuments({
        prompt: { $in: (await Prompt.find({ creator: userId }).select('_id')).map((p) => p._id) },
      }),
      Prompt.find({ creator: userId }).select('title copyCount createdAt').sort({ createdAt: -1 }),
      Prompt.aggregate([
        { $match: { creator: userId as any } },
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
        totalPrompts,
        totalCopies: totalCopies[0]?.total || 0,
        totalBookmarks,
        totalReviews,
        promptData,
        monthlyData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPrompts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      aiTool,
      status,
      sort = 'latest',
      page = '1',
      limit = '20',
    } = req.query;

    const query: any = { creator: req.user?._id };

    if (search) {
      query.$text = { $search: search as string };
    }

    if (category) {
      query.category = category as string;
    }

    if (aiTool) {
      query.aiTool = aiTool as string;
    }

    if (status) {
      query.status = status as string;
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
    const skip = (pageNum - 1) * limitNum;

    const [prompts, total] = await Promise.all([
      Prompt.find(query)
        .populate('creator', 'name email photoURL')
        .sort(sortOption)
        .skip(skip)
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
