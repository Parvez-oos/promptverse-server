import mongoose, { Schema, Document } from 'mongoose';

export interface IReportDocument extends Document {
  prompt: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  status: 'pending' | 'dismissed' | 'action_taken';
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReportDocument>(
  {
    prompt: {
      type: Schema.Types.ObjectId,
      ref: 'Prompt',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ['Inappropriate Content', 'Spam', 'Copyright Violation', 'Other'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'dismissed', 'action_taken'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReportDocument>('Report', reportSchema);
