import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    savedAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, default: null },
    color: { type: String, default: '#1f5c3d' },
    icon: { type: String, default: '🎯' },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Goal', goalSchema);
