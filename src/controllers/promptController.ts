import { Response } from 'express';
import Prompt from '../models/Prompt';
import Review from '../models/Review';
import Bookmark from '../models/Bookmark';
import { AuthRequest } from '../types';

export const getAllPrompts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      aiTool,
      difficultyLevel,
      sort,
      page = '1',
      limit = '12',
    } = req.query;

    const query: any = { status: 'approved' };

    if (req.user) {
      query.$or = [
        { visibility: 'public' },
        {
          visibility: 'private',
          creator: req.user._id,
        },
      ];
    } else {
      query.visibility = 'public';
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
      query.difficultyLevel = {
        $regex: new RegExp(`^${(difficultyLevel as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      };
    }

    let sortOption: any = { createdAt: -1 };

    switch (sort) {
      case 'most_copied':
        sortOption = { copyCount: -1 };
        break;
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let prompts: any[];
    let total: number;

    if (!difficultyLevel) {
      const levels = ['Beginner', 'Intermediate', 'Pro'] as const;
      const perLevel = Math.floor(limitNum / levels.length);

      const results = await Promise.all(
        levels.map((level) =>
          Prompt.find({ ...query, difficultyLevel: level })
            .populate('creator', 'name email photoURL')
            .sort(sortOption)
            .skip(skip)
            .limit(perLevel)
            .lean()
        )
      );

      prompts = results.flat();

      const totalResults = await Promise.all(
        levels.map((level) =>
          Prompt.countDocuments({ ...query, difficultyLevel: level })
        )
      );
      total = totalResults.reduce((sum, count) => sum + count, 0);
    } else {
      [prompts, total] = await Promise.all([
        Prompt.find(query)
          .populate('creator', 'name email photoURL')
          .sort(sortOption)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Prompt.countDocuments(query),
      ]);
    }

    const promptIds = prompts.map((p) => p._id);
    const ratings = await Review.aggregate([
      { $match: { prompt: { $in: promptIds } } },
      {
        $group: {
          _id: '$prompt',
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const ratingMap = new Map();
    ratings.forEach((r) => ratingMap.set(r._id.toString(), r));

    let promptsWithRating = prompts.map((prompt) => ({
      ...prompt,
      averageRating: ratingMap.get(prompt._id.toString())?.averageRating || 0,
      reviewCount: prompt.reviewCount || 0,
    }));

    if (sort === 'popular') {
      promptsWithRating.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }

    res.status(200).json({
      success: true,
      data: promptsWithRating,
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

export const getFeaturedPrompts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prompts = await Prompt.find({
      status: 'approved',
      visibility: 'public',
    })
      .populate('creator', 'name email photoURL')
      .sort({ copyCount: -1, createdAt: -1 })
      .limit(6)
      .lean();

    const promptIds = prompts.map((p) => p._id);
    const ratings = await Review.aggregate([
      { $match: { prompt: { $in: promptIds } } },
      {
        $group: {
          _id: '$prompt',
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const ratingMap = new Map();
    ratings.forEach((r) => ratingMap.set(r._id.toString(), r));

    const promptsWithRating = prompts.map((prompt) => ({
      ...prompt,
      averageRating: ratingMap.get(prompt._id.toString())?.averageRating || 0,
      reviewCount: prompt.reviewCount || 0,
    }));

    res.status(200).json({
      success: true,
      data: promptsWithRating,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPromptById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prompt = await Prompt.findById(req.params.id)
      .populate('creator', 'name email photoURL role')
      .lean();

    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    if (prompt.status !== 'approved') {
      const isCreator = req.user?._id === prompt.creator?._id?.toString();
      const isAdmin = req.user?.role === 'admin';
      if (!isCreator && !isAdmin) {
        res.status(404).json({ message: 'Prompt not found.' });
        return;
      }
    }

    const isCreator = req.user?._id === prompt.creator?._id?.toString();
    if (prompt.visibility === 'private' && !isCreator && !req.user?.isPremium && req.user?.role !== 'admin') {
      const { content, ...publicPrompt } = prompt;
      res.status(200).json({
        success: true,
        data: { ...publicPrompt, isLocked: true },
      });
      return;
    }

    const ratings = await Review.aggregate([
      { $match: { prompt: prompt._id } },
      {
        $group: {
          _id: '$prompt',
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    let isBookmarked = false;
    if (req.user) {
      const bookmark = await Bookmark.findOne({
        prompt: prompt._id,
        user: req.user._id,
      });
      isBookmarked = !!bookmark;
    }

    res.status(200).json({
      success: true,
      data: {
        ...prompt,
        averageRating: ratings[0]?.averageRating || 0,
        reviewCount: prompt.reviewCount || 0,
        isBookmarked,
        isLocked: false,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      content,
      category,
      aiTool,
      tags,
      difficultyLevel,
      thumbnail,
      visibility,
    } = req.body;

    const userPromptCount = await Prompt.countDocuments({ creator: req.user?._id });
    if (userPromptCount >= 3 && req.user?.role !== 'creator' && req.user?.role !== 'admin') {
      res.status(403).json({
        message: 'Free users can only add up to 3 prompts. Upgrade to creator to add more.',
        upgradeRequired: true,
      });
      return;
    }

    const prompt = await Prompt.create({
      title,
      description,
      content,
      category,
      aiTool,
      tags: tags || [],
      difficultyLevel,
      thumbnail: thumbnail || '',
      visibility: visibility || 'public',
      copyCount: 0,
      status: 'pending',
      creator: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: 'Prompt created successfully. It will be visible after admin approval.',
      data: prompt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    if (
      prompt.creator.toString() !== req.user?._id &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({ message: 'Not authorized to update this prompt.' });
      return;
    }

    const updatedPrompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Prompt updated successfully.',
      data: updatedPrompt,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    if (
      prompt.creator.toString() !== req.user?._id &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({ message: 'Not authorized to delete this prompt.' });
      return;
    }

    await Promise.all([
      Prompt.findByIdAndDelete(req.params.id),
      Review.deleteMany({ prompt: req.params.id }),
      Bookmark.deleteMany({ prompt: req.params.id }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Prompt deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const incrementCopyCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { $inc: { copyCount: 1 } },
      { new: true }
    );

    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Copy count incremented.',
      data: { copyCount: prompt.copyCount },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrendingPrompts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const prompts = await Prompt.find({
      status: 'approved',
      visibility: 'public',
    })
      .populate('creator', 'name email photoURL')
      .lean();

    const promptIds = prompts.map((p) => p._id);

    const [ratings, bookmarks] = await Promise.all([
      Review.aggregate([
        { $match: { prompt: { $in: promptIds } } },
        { $group: { _id: '$prompt', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
      ]),
      Bookmark.countDocuments({ prompt: { $in: promptIds }, createdAt: { $gte: sevenDaysAgo } }),
    ]);

    const ratingMap = new Map();
    ratings.forEach((r) => ratingMap.set(r._id.toString(), r));

    const scored = prompts.map((prompt) => {
      const ageHours = (now.getTime() - new Date(prompt.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.max(0, 1 - ageHours / (7 * 24));
      const rating = ratingMap.get(prompt._id.toString());
      const reviewWeight = (rating?.reviewCount || 0) * 0.3;
      const ratingWeight = (rating?.averageRating || 0) * 0.4;
      const copyWeight = Math.log(prompt.copyCount + 1) * 0.2;
      const score = (recencyFactor * 50) + (ratingWeight * 10) + (reviewWeight * 5) + (copyWeight * 5);

      return {
        ...prompt,
        averageRating: rating?.averageRating || 0,
        reviewCount: rating?.reviewCount || 0,
        trendingScore: Math.round(score * 100) / 100,
      };
    });

    scored.sort((a, b) => b.trendingScore - a.trendingScore);
    const topTrending = scored.slice(0, 12);

    res.status(200).json({ success: true, data: topTrending });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const forkPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const original = await Prompt.findById(req.params.id);
    if (!original) {
      res.status(404).json({ message: 'Original prompt not found.' });
      return;
    }

    if (original.visibility === 'private' && original.creator.toString() !== req.user?._id && !req.user?.isPremium) {
      res.status(403).json({ message: 'Cannot fork a private prompt.' });
      return;
    }

    const forked = await Prompt.create({
      title: `${original.title} (Fork)`,
      description: original.description,
      content: original.content,
      category: original.category,
      aiTool: original.aiTool,
      tags: original.tags,
      difficultyLevel: original.difficultyLevel,
      thumbnail: original.thumbnail,
      visibility: 'public',
      status: 'pending',
      creator: req.user?._id,
      originalPrompt: original._id,
    });

    await Prompt.findByIdAndUpdate(req.params.id, { $inc: { forkCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Prompt forked successfully. It will be visible after admin approval.',
      data: forked,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await Prompt.distinct('category', { status: 'approved' });
    res.status(200).json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAITools = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aiTools = await Prompt.distinct('aiTool', { status: 'approved' });
    res.status(200).json({ success: true, data: aiTools });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
