import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmarkDocument extends Document {
  prompt: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmarkDocument>(
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
  },
  { timestamps: true }
);

bookmarkSchema.index({ prompt: 1, user: 1 }, { unique: true });

export default mongoose.model<IBookmarkDocument>('Bookmark', bookmarkSchema);
