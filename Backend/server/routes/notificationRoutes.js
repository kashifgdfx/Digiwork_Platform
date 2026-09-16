const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const connectDB = require('../db');

const secret = () => process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';

function currentUserId(req) {
  const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  try {
    return token ? jwt.verify(token, secret()).userId : null;
  } catch {
    return null;
  }
}

router.get('/', async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    await connectDB();
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to load notifications' });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    await connectDB();
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to update notifications' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    await connectDB();
    const notification = await Notification.findOneAndUpdate(
      { id: req.params.id, userId },
      { $set: { read: true } },
      { new: true }
    ).lean();

    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });
    return res.json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to update notification' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    await connectDB();
    await Notification.deleteOne({ id: req.params.id, userId });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to delete notification' });
  }
});

module.exports = router;