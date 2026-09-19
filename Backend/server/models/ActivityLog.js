const mongoose = require('mongoose');

// Aggregated interaction batches from a visitor while a gig page is visible.
// We intentionally store counts, never mouse coordinates or keystroke content.
const ActivityLogSchema = new mongoose.Schema(
  {
    gigId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    mouseMoves: { type: Number, required: true, min: 0 },
    keyPresses: { type: Number, required: true, min: 0 },
    clicks: { type: Number, required: true, min: 0, default: 0 },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ gigId: 1, recordedAt: -1 });
ActivityLogSchema.index({ sellerId: 1, recordedAt: -1 });
ActivityLogSchema.index({ sellerId: 1, visitorId: 1, recordedAt: -1 });

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
