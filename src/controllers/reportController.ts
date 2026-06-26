import { Response } from 'express';
import Report from '../models/Report';
import Prompt from '../models/Prompt';
import { AuthRequest } from '../types';

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const promptId = req.params.promptId as string;
    const { reason, description } = req.body;

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found.' });
      return;
    }

    const existingReport = await Report.findOne({
      prompt: promptId,
      user: req.user?._id,
    } as any);

    if (existingReport) {
      res.status(400).json({ message: 'You have already reported this prompt.' });
      return;
    }

    const report = await Report.create({
      prompt: promptId,
      user: req.user?._id,
      reason,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it.',
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      search,
      reason,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (reason) {
      query.reason = reason as string;
    }

    if (search) {
      query.$or = [
        { reason: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('prompt', 'title category aiTool')
        .populate('user', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: reports,
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

export const updateReportStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!report) {
      res.status(404).json({ message: 'Report not found.' });
      return;
    }

    if (status === 'action_taken') {
      await Prompt.findByIdAndUpdate(report.prompt, { status: 'rejected' });
    }

    res.status(200).json({
      success: true,
      message: 'Report status updated.',
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
