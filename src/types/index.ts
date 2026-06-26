import { Request } from 'express';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  photoURL: string;
  password: string;
  role: 'user' | 'creator' | 'admin';
  isPremium: boolean;
  premiumExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrompt {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  aiTool: string;
  tags: string[];
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Pro';
  thumbnail: string;
  visibility: 'public' | 'private';
  copyCount: number;
  forkCount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionFeedback?: string;
  isFeatured: boolean;
  trendingScore: number;
  creator: string | IUser;
  originalPrompt?: string | IPrompt;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id: string;
  prompt: string | IPrompt;
  user: string | IUser;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookmark {
  _id: string;
  prompt: string | IPrompt;
  user: string | IUser;
  createdAt: Date;
}

export interface IReport {
  _id: string;
  prompt: string | IPrompt;
  user: string | IUser;
  reason: string;
  description?: string;
  status: 'pending' | 'dismissed' | 'action_taken';
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  _id: string;
  user: string | IUser;
  stripePaymentId: string;
  amount: number;
  email: string;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
    isPremium: boolean;
  };
}
