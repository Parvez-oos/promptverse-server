import { Response } from 'express';
import Bookmark from '../models/Bookmark';
import Prompt from '../models/Prompt';
import { AuthRequest } from '../types';

export const toggleBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const promptId = req.params.promptId as string;

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    const existingBookmark = await Bookmark.findOne({
      prompt: promptId,
      user: req.user?._id,
    });

    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      res.status(200).json({
        success: true,
        message: 'Bookmark removed.',
        isBookmarked: false,
      });
    } else {
      await Bookmark.create({
        prompt: promptId,
        user: req.user?._id,
      });
      res.status(200).json({
        success: true,
        message: 'Prompt bookmarked.',
        isBookmarked: true,
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserBookmarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '12',
    } = req.query;

    const query = { user: req.user?._id };
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookmarks, total] = await Promise.all([
      Bookmark.find(query)
        .populate({
          path: 'prompt',
          populate: {
            path: 'creator',
            select: 'name email photoURL',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Bookmark.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookmarks,
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

export const isBookmarked = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const promptId = req.params.promptId as string;

    const bookmark = await Bookmark.findOne({
      prompt: promptId,
      user: req.user?._id,
    });

    res.status(200).json({
      success: true,
      isBookmarked: !!bookmark,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
