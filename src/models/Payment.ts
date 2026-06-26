import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentDocument extends Document {
  user: mongoose.Types.ObjectId;
  stripePaymentId: string;
  amount: number;
  email: string;
  createdAt: Date;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripePaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPaymentDocument>('Payment', paymentSchema);
