const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  conversationId: { type: String, required: true, trim: true },
  senderId: { type: String, required: true, trim: true },
  receiverId: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
  attachments: { type: [String], default: [] },
  sentAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date, default: null },
  seenAt: { type: Date, default: null },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  isRead: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
