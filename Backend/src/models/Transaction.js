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
    // Client-supplied key that makes a transfer safe to retry: a replayed
    // request with the same key returns the original transaction instead of
    // moving money twice (double-submit / network-retry protection).
    idempotencyKey: { type: String, default: null },
  },
  { timestamps: true }
);

transactionSchema.index({ senderAccount: 1, createdAt: -1 });
transactionSchema.index({ receiverAccount: 1, createdAt: -1 });
transactionSchema.index({ receiverEmail: 1, status: 1 });
// Sparse + unique: at most one transaction per idempotency key, but rows
// without a key (null) are exempt from the constraint.
transactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export default mongoose.model('Transaction', transactionSchema);
