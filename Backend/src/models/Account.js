import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accountNumber: { type: String, unique: true },
    balance: { type: Number, default: 1000, min: 0 }, // Simulated $1,000 CAD starting balance
    currency: { type: String, default: 'CAD' },
  },
  { timestamps: true }
);

accountSchema.pre('save', function (next) {
  if (!this.accountNumber) {
    const rand = Math.floor(10000000 + Math.random() * 90000000);
    this.accountNumber = `CA${rand}`;
  }
  next();
});

accountSchema.index({ userId: 1 });

export default mongoose.model('Account', accountSchema);
