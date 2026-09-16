const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
{
  id: { type: String, required: true, unique: true },

  buyerId: { type: String, required: true },

  sellerId: { type: String, required: true },

  gigId: { type: String, required: true },

  gigTitle: { type: String, required: true },

  lastMessage: {
    type: String,
    default: "",
  },

  lastMessageTimestamp: {
    type: Date,
    default: null,
  },

  unreadCount: {
    type: Number,
    default: 0,
  },

  unreadCountBuyer: {
    type: Number,
    default: 0,
  },

  unreadCountSeller: {
    type: Number,
    default: 0,
  },

  firstMessageAt: {
    type: Date,
    default: null,
  },

  lastReplyAt: {
    type: Date,
    default: null,
  },
},
{
  timestamps: true,
  versionKey: false,
}
);

ConversationSchema.index(
  { buyerId: 1, sellerId: 1, gigId: 1 },
  { unique: true },
);
ConversationSchema.index({ buyerId: 1, updatedAt: -1 });
ConversationSchema.index({ sellerId: 1, updatedAt: -1 });

module.exports =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
