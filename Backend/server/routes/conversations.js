const router = require('express').Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');
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

    const enriched = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
        const otherUser = otherUserId ? await User.findOne({ id: otherUserId }).lean() : null;

        const participant = otherUser
          ? {
              id: otherUser.id,
              name: otherUser.name || otherUser.username || otherUser.email || 'Unknown user',
              username: otherUser.username || otherUser.email?.split('@')[0] || 'unknown-user',
              email: otherUser.email || '',
              avatar: otherUser.avatar || '',
              level: otherUser.level || 'New Seller',
              responseTime: otherUser.responseTime || '1 hour',
              rating: otherUser.rating || 0,
              reviewCount: otherUser.reviewCount || 0,
              country: otherUser.country || '',
            }
          : {
              id: otherUserId || 'unknown-participant',
              name: 'Unknown user',
              username: 'unknown-user',
              email: '',
              avatar: '',
              level: 'New Seller',
              responseTime: '1 hour',
              rating: 0,
              reviewCount: 0,
              country: '',
            };

        return {
          ...conversation,
          participant,
          participantId: participant.id,
          participantName: participant.name,
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId,
        };
      })
    );

    return res.json({ success: true, count: enriched.length, conversations: enriched });
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