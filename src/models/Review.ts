import mongoose, { Schema, Document } from 'mongoose';

export interface IReviewDocument extends Document {
  prompt: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ prompt: 1, user: 1 }, { unique: true });

export default mongoose.model<IReviewDocument>('Review', reviewSchema);
