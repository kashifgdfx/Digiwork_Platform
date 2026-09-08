const router = require('express').Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const connectDB = require('../db');

const requiredText = (value) => typeof value === 'string' && value.trim().length > 0;

router.get('/:conversationId', async (req, res) => {
  const conversationId = req.params.conversationId?.trim();
  if (!requiredText(conversationId)) return res.status(400).json({ success: false, error: 'conversationId is required' });

  try {
    await connectDB();
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
    return res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ success: false, error: 'Unable to load messages' });
  }
});

router.post('/', async (req, res) => {
  const { conversationId, senderId, receiverId, text } = req.body || {};
  if (![conversationId, senderId, receiverId, text].every(requiredText)) {
    return res.status(400).json({ success: false, error: 'conversationId, senderId, receiverId, and text are required' });
  }
  if (senderId.trim() === receiverId.trim()) {
    return res.status(400).json({ success: false, error: 'senderId and receiverId must be different' });
  }

  try {
    await connectDB();
    const conversation = await Conversation.findOne({ id: conversationId.trim() });
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    if (![conversation.buyerId, conversation.sellerId].includes(senderId.trim()) ||
        ![conversation.buyerId, conversation.sellerId].includes(receiverId.trim())) {
      return res.status(403).json({ success: false, error: 'Both users must belong to the conversation' });
    }

    const message = await Message.create({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId: conversation.id,
      senderId: senderId.trim(),
      receiverId: receiverId.trim(),
      text: text.trim(),
    });

    const unreadField = receiverId.trim() === conversation.buyerId ? 'unreadCountBuyer' : 'unreadCountSeller';
    await Conversation.updateOne({ _id: conversation._id }, {
      $set: { lastMessage: message.text, lastMessageTimestamp: message.createdAt },
      $inc: { [unreadField]: 1 },
    });

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Create message error:', error);
    return res.status(error.name === 'ValidationError' ? 400 : 500).json({
      success: false,
      error: error.name === 'ValidationError' ? error.message : 'Unable to send message',
    });
  }
});

module.exports = router;