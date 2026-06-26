import { Response } from 'express';
import User from '../models/User';
import Prompt from '../models/Prompt';
import Bookmark from '../models/Bookmark';
import Review from '../models/Review';
import { AuthRequest } from '../types';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      role,
      isPremium,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role as string;
    }

    if (isPremium !== undefined && isPremium !== '') {
      query.isPremium = isPremium === 'true';
    }

    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      case 'name_desc':
        sortOption = { name: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const promptCount = await Prompt.countDocuments({ creator: user._id });
        return {
          ...user,
          totalPrompts: promptCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithCounts,
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

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const promptCount = await Prompt.countDocuments({ creator: user._id });

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        totalPrompts: promptCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;

    if (!['user', 'creator', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role.' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Prompt.deleteMany({ creator: req.params.id }),
      Bookmark.deleteMany({ user: req.params.id }),
      Review.deleteMany({ user: req.params.id }),
    ]);

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted.',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, photoURL } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { name, photoURL } },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTopCreators = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creators = await User.find({ role: { $in: ['creator', 'admin'] } })
      .select('-password')
      .lean();

    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        const promptCount = await Prompt.countDocuments({ creator: creator._id, status: 'approved' });
        const totalCopies = await Prompt.aggregate([
          { $match: { creator: creator._id } },
          { $group: { _id: null, total: { $sum: '$copyCount' } } },
        ]);
        const totalBookmarks = await Bookmark.countDocuments({
          prompt: { $in: (await Prompt.find({ creator: creator._id }).select('_id')).map((p) => p._id) },
        });

        return {
          ...creator,
          totalPrompts: promptCount,
          totalCopies: totalCopies[0]?.total || 0,
          totalBookmarks,
        };
      })
    );

    creatorsWithStats.sort((a, b) => b.totalPrompts - a.totalPrompts);

    res.status(200).json({
      success: true,
      data: creatorsWithStats.slice(0, 6),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const promptCount = await Prompt.countDocuments({ creator: user._id });

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        totalPrompts: promptCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
