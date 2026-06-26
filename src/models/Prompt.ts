import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptDocument extends Document {
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
  reviewCount: number;
  forkCount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionFeedback?: string;
  isFeatured: boolean;
  trendingScore: number;
  creator: mongoose.Types.ObjectId;
  originalPrompt?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const promptSchema = new Schema<IPromptDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    aiTool: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    difficultyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Pro'],
      default: 'Beginner',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    copyCount: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    forkCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionFeedback: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    trendingScore: {
      type: Number,
      default: 0,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalPrompt: {
      type: Schema.Types.ObjectId,
      ref: 'Prompt',
    },
  },
  { timestamps: true }
);

promptSchema.index({ title: 'text', tags: 'text', aiTool: 'text' });

export default mongoose.model<IPromptDocument>('Prompt', promptSchema);
