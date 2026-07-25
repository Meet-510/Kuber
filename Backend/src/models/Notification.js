import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['TRANSFER_SENT', 'TRANSFER_RECEIVED', 'TRANSFER_PENDING', 'GOAL_PROGRESS', 'SYSTEM'],
      default: 'SYSTEM',
    },
    read: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
