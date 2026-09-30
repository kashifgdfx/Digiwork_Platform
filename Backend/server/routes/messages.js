const router = require('express').Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const connectDB = require('../db');
const { getIO } = require('../socket');

const requiredText = (value) => typeof value === 'string' && value.trim().length > 0;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const validAttachment = (value) => {
  if (typeof value !== 'string') return false;
  const match = value.match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return false;
  const mimeType = match[1].toLowerCase();
  const allowed = mimeType.startsWith('image/') || [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv', 'application/zip', 'application/octet-stream',
  ].includes(mimeType);
  return allowed && Buffer.from(match[2], 'base64').length <= MAX_ATTACHMENT_BYTES;
};

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
  const { conversationId, senderId, receiverId, text = '', clientMessageId } = req.body || {};
  const attachments = req.body?.attachments ?? [];
  if (![conversationId, senderId, receiverId].every(requiredText) || typeof text !== 'string' || text.length > 5000) {
    return res.status(400).json({ success: false, error: 'conversationId, senderId, receiverId, and valid text are required' });
  }
  if (!Array.isArray(attachments) || attachments.length > 1 || attachments.some((attachment) => !validAttachment(attachment))) {
    return res.status(400).json({ success: false, error: 'Attach one supported file up to 5MB' });
  }
  if (!text.trim() && attachments.length === 0) {
    return res.status(400).json({ success: false, error: 'Message text or an attachment is required' });
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

    const messageId = typeof clientMessageId === 'string' && /^msg-[A-Za-z0-9-]{8,100}$/.test(clientMessageId)
      ? clientMessageId
      : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const message = await Message.create({
      id: messageId,
      conversationId: conversation.id,
      senderId: senderId.trim(),
      receiverId: receiverId.trim(),
      text: text.trim(),
      attachments,
    });

    const unreadField = receiverId.trim() === conversation.buyerId ? 'unreadCountBuyer' : 'unreadCountSeller';
    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversation._id },
      {
        $set: { lastMessage: message.text || '📎 Attachment', lastMessageTimestamp: message.createdAt },
        $inc: { [unreadField]: 1 },
      },
      { new: true }
    ).lean();

    const sender = await User.findOne({ id: senderId.trim() }).select('name avatar').lean();
    const storedMessage = message.toObject();
    const messagePayload = {
      ...storedMessage,
      id: storedMessage.id,
      senderName: sender?.name || 'User',
      senderAvatar: sender?.avatar || '',
      timestamp: storedMessage.sentAt || storedMessage.createdAt,
      status: storedMessage.status || 'sent',
    };
    const eventPayload = {
      message: messagePayload,
      conversation: updatedConversation,
      unreadCount: updatedConversation?.[unreadField] || 0,
    };
    const io = getIO();

    if (io) {
      io.to(`user:${receiverId.trim()}`).emit('new_message', eventPayload);
      io.to(`user:${senderId.trim()}`).emit('message_sent', eventPayload);
    }

    return res.status(201).json({ success: true, message: messagePayload });
  } catch (error) {
    console.error('Create message error:', error);
    return res.status(error.name === 'ValidationError' ? 400 : 500).json({
      success: false,
      error: error.name === 'ValidationError' ? error.message : 'Unable to send message',
    });
  }
});

module.exports = router;
