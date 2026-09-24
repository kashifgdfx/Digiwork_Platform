const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Gig = require('../models/Gig');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');
const connectDB = require('../db');
const adminAuth = require('../middleware/adminAuth');

router.use(adminAuth);

const safeUser = (user) => {
  const object = user.toObject ? user.toObject() : user;
  const { password, resetPasswordToken, resetPasswordExpires, __v, ...safe } = object;
  return safe;
};

router.get('/stats', async (_req, res) => {
  try {
    await connectDB();
    const [totalUsers, activeUsers, activeGigs, completedOrders, totalOrders, revenue, recentActivity, growth] = await Promise.all([
      User.countDocuments(), User.countDocuments({ accountStatus: { $ne: 'declined' } }),
      Gig.countDocuments({ $or: [{ moderationStatus: 'approved' }, { moderationStatus: { $exists: false } }] }),
      Order.countDocuments({ status: 'completed' }), Order.countDocuments(),
      Order.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      User.aggregate([{ $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, users: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);
    return res.json({ success: true, stats: { totalUsers, activeUsers, activeGigs, completedOrders, totalOrders, revenue: revenue[0]?.total || 0, recentActivity, growth } });
  } catch (error) { return res.status(500).json({ success: false, error: error.message || 'Unable to load admin statistics' }); }
});

router.get('/users', async (req, res) => {
  try {
    await connectDB(); const search = String(req.query.search || '').trim();
    const filter = search ? { $or: [{ name: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};
    return res.json({ success: true, users: (await User.find(filter).sort({ createdAt: -1 }).lean()).map(safeUser) });
  } catch (error) { return res.status(500).json({ success: false, error: error.message }); }
});

router.patch('/users/:id', async (req, res) => {
  try {
    await connectDB(); const updates = {};
    if (req.body.role !== undefined) { if (!['buyer', 'seller', 'admin'].includes(req.body.role)) return res.status(400).json({ success: false, error: 'Invalid role' }); updates.role = req.body.role; }
    if (req.body.accountStatus !== undefined) { if (!['active', 'declined', 'suspended'].includes(req.body.accountStatus)) return res.status(400).json({ success: false, error: 'Invalid account status' }); updates.accountStatus = req.body.accountStatus; }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, error: 'No supported changes supplied' });
    if (req.params.id === req.user.id && (updates.role !== undefined && updates.role !== 'admin' || updates.accountStatus && updates.accountStatus !== 'active')) return res.status(400).json({ success: false, error: 'You cannot remove your own admin access' });
    const user = await User.findOneAndUpdate({ id: req.params.id }, { $set: updates }, { new: true, runValidators: true }).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' }); return res.json({ success: true, user: safeUser(user) });
  } catch (error) { return res.status(500).json({ success: false, error: error.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try { if (req.params.id === req.user.id) return res.status(400).json({ success: false, error: 'You cannot delete your own account' }); await connectDB(); const deleted = await User.findOneAndDelete({ id: req.params.id }); if (!deleted) return res.status(404).json({ success: false, error: 'User not found' }); return res.json({ success: true }); }
  catch (error) { return res.status(500).json({ success: false, error: error.message }); }
});

router.get('/orders', async (_req, res) => { try { await connectDB(); return res.json({ success: true, orders: await Order.find().sort({ createdAt: -1 }).lean() }); } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
router.patch('/orders/:id', async (req, res) => {
  const valid = ['pending', 'in_progress', 'delivered', 'completed', 'cancelled', 'revision']; if (!valid.includes(req.body.status)) return res.status(400).json({ success: false, error: 'Invalid order status' });
  try { await connectDB(); const order = await Order.findOneAndUpdate({ id: req.params.id }, { $set: { status: req.body.status, progressPercent: Order.progressForStatus(req.body.status) } }, { new: true, runValidators: true }).lean(); if (!order) return res.status(404).json({ success: false, error: 'Order not found' }); return res.json({ success: true, order }); } catch (error) { return res.status(500).json({ success: false, error: error.message }); }
});

router.get('/gigs', async (_req, res) => { try { await connectDB(); return res.json({ success: true, gigs: await Gig.find().sort({ createdAt: -1 }).lean() }); } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
router.patch('/gigs/:id', async (req, res) => {
  if (!['pending', 'approved', 'rejected'].includes(req.body.moderationStatus)) return res.status(400).json({ success: false, error: 'Invalid moderation status' });
  try { await connectDB(); const gig = await Gig.findOneAndUpdate({ id: req.params.id }, { $set: { moderationStatus: req.body.moderationStatus, moderationNote: String(req.body.moderationNote || '').slice(0, 1000) } }, { new: true, runValidators: true }).lean(); if (!gig) return res.status(404).json({ success: false, error: 'Gig not found' }); return res.json({ success: true, gig }); } catch (error) { return res.status(500).json({ success: false, error: error.message }); }
});
router.delete('/gigs/:id', async (req, res) => { try { await connectDB(); const deleted = await Gig.findOneAndDelete({ id: req.params.id }); if (!deleted) return res.status(404).json({ success: false, error: 'Gig not found' }); return res.json({ success: true }); } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });

module.exports = router;
