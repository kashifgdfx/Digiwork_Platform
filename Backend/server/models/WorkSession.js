const mongoose = require('mongoose');

const WorkSessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    startedAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date, default: null },
    totalMinutes: { type: Number, default: 0 },
    isRunning: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Indexes requested for work analytics queries.
WorkSessionSchema.index({ sellerId: 1, startedAt: -1 });
WorkSessionSchema.index({ orderId: 1, isRunning: 1 });

module.exports = mongoose.models.WorkSession || mongoose.model('WorkSession', WorkSessionSchema);