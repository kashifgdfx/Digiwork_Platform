const Notification = require('../models/Notification');
const User = require('../models/User');
const connectDB = require('../db');

let getIO = () => null;
try {
  ({ getIO } = require('../socket'));
} catch {
  getIO = () => null;
}

/**
 * Create a notification, persist it, and push it to the target user in realtime.
 *
 * @param {object} params
 * @param {string} params.userId  Recipient user id
 * @param {string} params.type    'message' | 'order' | 'review' | 'gig'
 * @param {string} params.title   Short headline
 * @param {string} params.message Body text
 * @param {string} [params.link]  Optional in-app link
 * @param {object} [params.meta]  Extra metadata
 */
async function createNotification({ userId, type, title, message, link = '', meta = {} }) {
  if (!userId) return null;

  try {
    await connectDB();

    const notification = await Notification.create({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      type: type || 'order',
      title: title || 'Notification',
      message: message || '',
      link,
      meta,
      read: false,
    });

    const payload = notification.toObject();

    // Realtime push (best-effort; never block the caller on socket failure).
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('notification', payload);
        io.to(`user:${userId}`).emit('notification:new', payload);
      }
    } catch (socketError) {
      console.warn('Notification socket emit failed:', socketError?.message);
    }

    return payload;
  } catch (error) {
    console.warn('createNotification failed:', error?.message);
    return null;
  }
}

async function unreadCountFor(userId) {
  if (!userId) return 0;
  await connectDB();
  return Notification.countDocuments({ userId, read: false });
}

module.exports = { createNotification, unreadCountFor };