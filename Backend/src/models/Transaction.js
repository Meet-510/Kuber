import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    senderAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    receiverAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    senderEmail: { type: String, required: true },
    receiverEmail: { type: String, required: true },
    senderName: { type: String, default: '' },
    receiverName: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0.01 },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    type: {
      type: String,
      enum: ['TRANSFER', 'DEPOSIT'],
      default: 'TRANSFER',
    },
    pendingToken: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
