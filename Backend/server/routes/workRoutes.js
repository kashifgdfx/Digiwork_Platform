const router = require('express').Router();
const jwt = require('jsonwebtoken');
const WorkSession = require('../models/WorkSession');
const Order = require('../models/Order');
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

function serialize(session) {
  return { ...session, id: session.id || session._id?.toString() };
}

router.post('/start', async (req, res) => {
  try {
    const sellerId = currentUserId(req);
    if (!sellerId) return res.status(401).json({ success: false, error: 'Authentication required' });
    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) return res.status(400).json({ success: false, error: 'orderId is required' });

    await connectDB();
    const order = await Order.findOne({ id: orderId }).lean();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.sellerId !== sellerId) return res.status(403).json({ success: false, error: 'Only the seller can start work on this order' });

    let session = await WorkSession.findOne({ orderId, sellerId, isRunning: true });
    if (!session) {
      session = await WorkSession.create({
        id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        orderId,
        sellerId,
        startedAt: new Date(),
        isRunning: true,
      });
    }

    return res.status(201).json({ success: true, session: serialize(session.toObject()) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to start work session' });
  }
});

router.post('/stop', async (req, res) => {
  try {
    const sellerId = currentUserId(req);
    if (!sellerId) return res.status(401).json({ success: false, error: 'Authentication required' });
    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) return res.status(400).json({ success: false, error: 'orderId is required' });

    await connectDB();
    const session = await WorkSession.findOne({ orderId, sellerId, isRunning: true });
    if (!session) return res.status(404).json({ success: false, error: 'No running session for this order' });

    const endedAt = new Date();
    const totalMinutes = Math.max(0, Math.round((endedAt - new Date(session.startedAt)) / 60000));
    session.endedAt = endedAt;
    session.totalMinutes = totalMinutes;
    session.isRunning = false;
    await session.save();

    return res.json({ success: true, session: serialize(session.toObject()) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to stop work session' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const sellerId = currentUserId(req);
    if (!sellerId) return res.status(401).json({ success: false, error: 'Authentication required' });
    await connectDB();
    const sessions = await WorkSession.find({ sellerId }).sort({ startedAt: -1 }).lean();
    const now = new Date();
    const totalMinutes = sessions.reduce(
      (sum, s) => sum + (s.isRunning ? (now - new Date(s.startedAt)) / 60000 : (s.totalMinutes || 0)),
      0,
    );
    return res.json({
      success: true,
      count: sessions.length,
      running: sessions.find((s) => s.isRunning) || null,
      totalMinutes: Math.round(totalMinutes),
      sessions: sessions.slice(0, 50).map(serialize),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to load work summary' });
  }
});

module.exports = router;