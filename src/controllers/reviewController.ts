import { Response } from 'express';
import Review from '../models/Review';
import Prompt from '../models/Prompt';
import { AuthRequest } from '../types';

export const getPromptReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;

    const reviews = await Review.find({ prompt: promptId })
      .populate('user', 'name email photoURL')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const promptId = req.params.promptId as string;
    const { rating, comment } = req.body;

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    if (prompt.visibility === 'private') {
      res.status(403).json({ message: 'Cannot review private prompts.' });
      return;
    }

    const existingReview = await Review.findOne({
      prompt: promptId,
      user: req.user?._id,
    } as any);

    if (existingReview) {
      res.status(400).json({ message: 'You have already reviewed this prompt.' });
      return;
    }

    const review = await Review.create({
      prompt: promptId,
      user: req.user?._id,
      rating,
      comment,
    });

    await Prompt.findByIdAndUpdate(promptId, { $inc: { reviewCount: 1 } });

    const populatedReview = await Review.findById(review._id).populate(
      'user',
      'name email photoURL'
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: populatedReview,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404).json({ message: 'Review not found.' });
      return;
    }

    if (
      review.user.toString() !== req.user?._id &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({ message: 'Not authorized to delete this review.' });
      return;
    }

    const promptId = review.prompt;
    await Review.findByIdAndDelete(req.params.id);
    await Prompt.findByIdAndUpdate(promptId, { $inc: { reviewCount: -1 } });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentReviews = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const levels = ['Beginner', 'Intermediate', 'Pro'] as const;
    const reviewsPerLevel = 2;

    const reviewArrays = await Promise.all(
      levels.map((level) =>
        Review.find()
          .populate('user', 'name email photoURL')
          .populate({
            path: 'prompt',
            match: { difficultyLevel: level },
            select: 'title category aiTool difficultyLevel',
          })
          .sort({ createdAt: -1 })
          .limit(20)
      )
    );

    const reviews = reviewArrays
      .map((reviews) => reviews.filter((r) => r.prompt != null).slice(0, reviewsPerLevel))
      .flat()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ user: req.user?._id })
      .populate({
        path: 'prompt',
        select: 'title category aiTool',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
