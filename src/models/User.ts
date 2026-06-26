import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  photoURL: string;
  password: string;
  role: 'user' | 'creator' | 'admin';
  isPremium: boolean;
  premiumExpiry?: Date;
  firebaseUid?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    photoURL: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'creator', 'admin'],
      default: 'user',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiry: {
      type: Date,
    },
    firebaseUid: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUserDocument>('User', userSchema);
