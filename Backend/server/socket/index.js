const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const connectDB = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';

function parseTokenFromHandshake(socket) {
  const authToken = socket.handshake.auth?.token;
  const cookieHeader = socket.handshake.headers?.cookie;

  if (authToken) return authToken;
  if (cookieHeader) {
    const parsed = cookie.parse(cookieHeader);
    return parsed.token || null;
  }

  return null;
}

function buildMessagePayload(message, senderName = '', senderAvatar = '') {
  return {
    ...message.toObject(),
    senderName,
    senderAvatar,
    timestamp: message.sentAt || message.createdAt,
    status: message.status || 'sent',
  };
}

function registerSocketServer(server, options = {}) {
  const io = new Server(server, {
    cors: {
      origin: options.allowedOrigins || ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = parseTokenFromHandshake(socket);
      if (!token) {
        return next(new Error('Unauthorized socket connection'));
      }

      const payload = jwt.verify(token, JWT_SECRET);
      if (!payload?.userId) {
        return next(new Error('Invalid token payload'));
      }

      await connectDB();
      const user = await User.findOne({ id: payload.userId }).lean();
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      };

      next();
    } catch (error) {
      next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    socket.emit('presence:update', {
      userId,
      online: true,
      lastSeen: null,
    });

    socket.on('join-user', () => {
      socket.join(`user:${userId}`);
    });

    socket.on('join-conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('typing:start', ({ conversationId, receiverId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId,
        receiverId,
        senderName: socket.user.name,
      });
    });

    socket.on('typing:stop', ({ conversationId, receiverId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId,
        receiverId,
      });
    });

    socket.on('send-message', async ({ conversationId, receiverId, text, attachments = [] }) => {
      try {
        if (!conversationId || !receiverId || !text || !String(text).trim()) {
          return socket.emit('message:error', { message: 'Missing message payload' });
        }

        await connectDB();

        const conversation = await Conversation.findOne({ id: conversationId }).lean();
        if (!conversation) {
          return socket.emit('message:error', { message: 'Conversation not found' });
        }

        const validParticipants = [conversation.buyerId, conversation.sellerId];
        if (!validParticipants.includes(userId) || !validParticipants.includes(receiverId)) {
          return socket.emit('message:error', { message: 'User not in this conversation' });
        }

        const message = await Message.create({
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          conversationId,
          senderId: userId,
          receiverId,
          text: String(text).trim(),
          attachments,
          sentAt: new Date(),
          deliveredAt: null,
          seenAt: null,
          status: 'sent',
        });

        const unreadField = receiverId === conversation.buyerId ? 'unreadCountBuyer' : 'unreadCountSeller';
        const updateDoc = {
          $set: {
            lastMessage: message.text,
            lastMessageTimestamp: message.sentAt,
          },
          $inc: { [unreadField]: 1 },
        };

        await Conversation.updateOne({ _id: conversation._id }, updateDoc);

        const payload = buildMessagePayload(message, socket.user.name, socket.user.avatar || '');

        io.to(`conversation:${conversationId}`).emit('receive-message', payload);
        io.to(`user:${receiverId}`).emit('message:received', {
          ...payload,
          receiverId,
        });
        socket.emit('message:sent', payload);
      } catch (error) {
        console.error('Socket send-message error:', error);
        socket.emit('message:error', { message: 'Unable to send message' });
      }
    });

    socket.on('message:seen', async ({ conversationId, messageId, senderId }) => {
      try {
        if (!conversationId || !senderId) return;
        await connectDB();

        const update = {
          $set: {
            seenAt: new Date(),
            status: 'seen',
          },
        };

        if (messageId) {
          await Message.updateOne({ _id: messageId }, update);
        } else {
          await Message.updateMany({ conversationId, senderId, receiverId: userId }, update);
        }

        io.to(`conversation:${conversationId}`).emit('message:seen', {
          conversationId,
          messageId,
          senderId,
          seenBy: userId,
          seenAt: new Date(),
        });
      } catch (error) {
        console.error('Socket message:seen error:', error);
      }
    });

    socket.on('disconnect', () => {
      const activeSockets = io.sockets.adapter.rooms.get(`user:${userId}`);
      if (activeSockets) {
        activeSockets.delete(socket.id);
      }

      io.emit('presence:update', {
        userId,
        online: false,
        lastSeen: new Date(),
      });
    });
  });

  return io;
}

module.exports = { registerSocketServer };
