const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  buyerId: { type: String, required: true, trim: true },
  sellerId: { type: String, required: true, trim: true },
  gigId: { type: String, required: true, trim: true },
  gigTitle: { type: String, required: true, trim: true, maxlength: 200 },
  lastMessage: { type: String, default: '', trim: true, maxlength: 5000 },
  lastMessageTimestamp: { type: Date, default: null },
  unreadCount: { type: Number, default: 0, min: 0 },
  unreadCountBuyer: { type: Number, default: 0, min: 0 },
  unreadCountSeller: { type: Number, default: 0, min: 0 },
}, { timestamps: true, versionKey: false });

ConversationSchema.index({ buyerId: 1, sellerId: 1, gigId: 1 }, { unique: true });
ConversationSchema.index({ buyerId: 1, updatedAt: -1 });
ConversationSchema.index({ sellerId: 1, updatedAt: -1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
