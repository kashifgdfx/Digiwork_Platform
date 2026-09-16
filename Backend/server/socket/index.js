const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const connectDB = require('../db');
const { createNotification } = require('../utils/notify');

const JWT_SECRET = process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';
const activeUsers = new Map();
let ioInstance = null;

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

async function setPresenceStatus(userId, { online, socketId = null, lastSeen = null }) {
  if (!userId) return;
  await connectDB();
  await User.updateOne(
    { id: userId },
    {
      $set: {
        isOnline: Boolean(online),
        socketId,
        lastSeen: lastSeen || (online ? new Date() : new Date()),
      },
    }
  );
}

function buildMessagePayload(message, senderName = '', senderAvatar = '') {
  return {
    ...message.toObject(),
    id: message.id || message._id?.toString(),
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
  ioInstance = io;

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
    const userSockets = activeUsers.get(userId) || new Set();
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);
    activeUsers.set(userId, userSockets);
    socket.join(`user:${userId}`);

    if (wasOffline) {
      setPresenceStatus(userId, { online: true, socketId: socket.id, lastSeen: new Date() }).catch(() => undefined);
      io.emit('user_online', { userId, online: true, lastSeen: null });
    }

    socket.emit(
      'presence:snapshot',
      Array.from(activeUsers.keys()).map((activeUserId) => ({
        userId: activeUserId,
        online: true,
        lastSeen: null,
      }))
    );

    socket.on('join', (targetUserId) => {
      const roomId = targetUserId || userId;
      socket.join(`user:${roomId}`);
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

    socket.on('send-message', async ({ conversationId, receiverId, text, attachments = [], clientMessageId }) => {
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

        const messageId = typeof clientMessageId === 'string' && /^msg-[A-Za-z0-9-]{8,100}$/.test(clientMessageId)
          ? clientMessageId
          : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const message = await Message.create({
          id: messageId,
          conversationId,
          senderId: userId,
          receiverId,
          text: String(text).trim(),
          attachments,
          sentAt: new Date(),
          deliveredAt: null,
          seenAt: null,
          status: 'sent',
          isRead: false,
        });

        const receiverIsOnline = Boolean(activeUsers.get(receiverId)?.size);
        const deliveredStatus = receiverIsOnline ? 'delivered' : 'sent';

        const deliveredAt = receiverIsOnline ? new Date() : null;

        if (receiverIsOnline) {
          io.to(`user:${receiverId}`).emit('message:delivered', {
            conversationId,
            messageId: message.id,
            receiverId,
            deliveredAt,
          });
        }

        await Message.updateOne(
          { id: message.id },
          {
            $set: {
              status: deliveredStatus,
              deliveredAt,
              isRead: false, // receiver hasn't seen it yet
            },
          }
        );

        const unreadField = receiverId === conversation.buyerId ? 'unreadCountBuyer' : 'unreadCountSeller';
        const updatedConversation = await Conversation.findOneAndUpdate(
          { _id: conversation._id },
          {
            $set: {
              lastMessage: message.text,
              lastMessageTimestamp: message.sentAt,
            },
            $inc: { [unreadField]: 1 },
          },
          { new: true }
        ).lean();

        const payload = buildMessagePayload(message, socket.user.name, socket.user.avatar || '');
        const eventPayload = { message: payload, conversation: updatedConversation, unreadCount: updatedConversation?.[unreadField] || 0 };

        io.to(`conversation:${conversationId}`).emit('new_message', eventPayload);
        io.to(`user:${receiverId}`).emit('new_message', eventPayload);
        io.to(`user:${userId}`).emit('message_sent', { message: payload, conversation: updatedConversation });
        socket.emit('message_sent', { message: payload, conversation: updatedConversation });

        io.to(`user:${receiverId}`).emit('unread:update', { conversationId, unreadCount: updatedConversation?.[unreadField] || 0 });

        createNotification({
          userId: receiverId,
          type: 'message',
          title: `New message from ${socket.user.name}`,
          message: message.text,
          link: `/messages?conversationId=${encodeURIComponent(conversationId)}`,
          meta: { conversationId, senderId: userId },
        }).catch(() => undefined);
      } catch (error) {
        console.error('Socket send-message error:', error);
        socket.emit('message:error', { message: 'Unable to send message' });
      }
    });

    socket.on('mark_read', async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        await connectDB();

        const conversation = await Conversation.findOne({ id: conversationId }).lean();
        if (!conversation) return;

        const receiverId = userId;
        const senderId = conversation.buyerId === receiverId ? conversation.sellerId : conversation.buyerId;

        await Message.updateMany(
          {
            conversationId,
            receiverId,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              seenAt: new Date(),
              status: 'seen',
            },
          }
        );

        if (conversation.unreadCountBuyer > 0 && conversation.buyerId === receiverId) {
          await Conversation.updateOne({ _id: conversation._id }, { $set: { unreadCountBuyer: 0 } });
        }
        if (conversation.unreadCountSeller > 0 && conversation.sellerId === receiverId) {
          await Conversation.updateOne({ _id: conversation._id }, { $set: { unreadCountSeller: 0 } });
        }

        io.to(`user:${senderId}`).emit('messages_read', {
          conversationId,
          readerId: receiverId,
          seenAt: new Date(),
        });
      } catch (error) {
        console.error('Socket mark_read error:', error);
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
            isRead: true,
          },
        };

        if (messageId) {
          await Message.updateOne({ id: messageId }, update);
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

    // Client can request live online status for a list of userIds
    socket.on('presence:get', ({ userIds }) => {
      if (!Array.isArray(userIds)) return;
      const response = userIds.map((uid) => ({
        userId: uid,
        online: Boolean(activeUsers.get(uid)?.size),
        lastSeen: null,
      }));
      socket.emit('presence:snapshot', response);
    });

    socket.on('disconnect', () => {
      const userSockets = activeUsers.get(userId);
      userSockets?.delete(socket.id);

      if (!userSockets?.size) {
        activeUsers.delete(userId);
        const lastSeen = new Date();
        setPresenceStatus(userId, { online: false, socketId: null, lastSeen }).catch(() => undefined);
        io.emit('user_offline', {
          userId,
          online: false,
          lastSeen,
        });
      }
    });
  });

  return io;
}

function getIO() { return ioInstance; }
module.exports = { registerSocketServer, getIO };
