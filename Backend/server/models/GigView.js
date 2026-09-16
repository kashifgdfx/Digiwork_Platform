const mongoose = require('mongoose');

const GigViewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    gigId: { type: String, required: true, index: true },
    sellerId: { type: String, default: '', index: true },
    visitorId: { type: String, required: true, index: true },
    country: { type: String, default: '' },
    device: { type: String, default: '' },
    browser: { type: String, default: '' },
    viewedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Indexes requested for analytics queries.
GigViewSchema.index({ gigId: 1, viewedAt: -1 });
GigViewSchema.index({ gigId: 1, visitorId: 1, viewedAt: -1 });
GigViewSchema.index({ sellerId: 1, viewedAt: -1 });

module.exports = mongoose.models.GigView || mongoose.model('GigView', GigViewSchema);