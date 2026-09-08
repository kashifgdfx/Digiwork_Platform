const router = require('express').Router();
const Conversation = require('../models/Conversation');
const connectDB = require('../db');

const requiredText = (value) => typeof value === 'string' && value.trim().length > 0;

router.get('/:userId', async (req, res) => {
  const userId = req.params.userId?.trim();
  if (!requiredText(userId)) return res.status(400).json({ success: false, error: 'userId is required' });

  try {
    await connectDB();
    const conversations = await Conversation.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    }).sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({ success: false, error: 'Unable to load conversations' });
  }
});

router.post('/', async (req, res) => {
  const { buyerId, sellerId, gigId, gigTitle } = req.body || {};
  if (![buyerId, sellerId, gigId, gigTitle].every(requiredText)) {
    return res.status(400).json({ success: false, error: 'buyerId, sellerId, gigId, and gigTitle are required' });
  }
  if (buyerId.trim() === sellerId.trim()) {
    return res.status(400).json({ success: false, error: 'buyerId and sellerId must be different' });
  }

  const conversationData = {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    buyerId: buyerId.trim(),
    sellerId: sellerId.trim(),
    gigId: gigId.trim(),
    gigTitle: gigTitle.trim(),
  };

  try {
    await connectDB();
    const existing = await Conversation.findOne({
      buyerId: conversationData.buyerId,
      sellerId: conversationData.sellerId,
      gigId: conversationData.gigId,
    }).lean();
    if (existing) return res.json({ success: true, created: false, conversation: existing });

    const conversation = await Conversation.create(conversationData);
    return res.status(201).json({ success: true, created: true, conversation });
  } catch (error) {
    if (error.code === 11000) {
      const conversation = await Conversation.findOne({
        buyerId: conversationData.buyerId,
        sellerId: conversationData.sellerId,
        gigId: conversationData.gigId,
      }).lean();
      if (conversation) return res.json({ success: true, created: false, conversation });
    }
    console.error('Create conversation error:', error);
    return res.status(500).json({ success: false, error: 'Unable to create conversation' });
  }
});

module.exports = router;