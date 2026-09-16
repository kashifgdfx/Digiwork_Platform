const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Gig = require('../models/Gig');
const Order = require('../models/Order');
const Review = require('../models/Review');
const GigView = require('../models/GigView');
const WorkSession = require('../models/WorkSession');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const connectDB = require('../db');

const secret = () => process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';
const ACTIVE_ORDER_STATUSES = ['pending', 'in_progress', 'delivered', 'revision'];

function currentUserId(req) {
  const cookieToken = req.cookies?.token;
  const authorization = req.get?.('authorization') || req.headers?.authorization || '';
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = cookieToken || bearerToken;

  if (!token) return null;

  try {
    return jwt.verify(token, secret()).userId || null;
  } catch {
    return null;
  }
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function sessionEnd(session, now) {
  return session.isRunning ? now : (session.endedAt ? new Date(session.endedAt) : new Date(session.startedAt));
}

function sessionMinutes(session, now = new Date(), start = null) {
  const startedAt = new Date(session.startedAt);
  const endedAt = sessionEnd(session, now);
  const effectiveStart = start && startedAt < start ? start : startedAt;
  return Math.max(0, (endedAt - effectiveStart) / 60000);
}

function sumMinutes(sessions, now = new Date(), start = null) {
  return sessions.reduce((sum, session) => sum + sessionMinutes(session, now, start), 0);
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return 'N/A';
  if (minutes < 1) return '< 1 minute';
  if (minutes < 60) return `${Math.round(minutes)} minute${Math.round(minutes) === 1 ? '' : 's'}`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours === 1 ? '' : 's'}`;
}

function getMessagingPerformance(messages, sellerId) {
  const byConversation = new Map();
  for (const message of messages) {
    const conversationMessages = byConversation.get(message.conversationId) || [];
    conversationMessages.push(message);
    byConversation.set(message.conversationId, conversationMessages);
  }

  let received = 0;
  let replied = 0;
  const responseTimes = [];
  for (const conversationMessages of byConversation.values()) {
    conversationMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    for (let index = 0; index < conversationMessages.length; index += 1) {
      const message = conversationMessages[index];
      if (message.receiverId !== sellerId) continue;

      received += 1;
      const reply = conversationMessages.slice(index + 1).find((candidate) => candidate.senderId === sellerId);
      if (!reply) continue;

      replied += 1;
      responseTimes.push((new Date(reply.createdAt) - new Date(message.createdAt)) / 60000);
    }
  }

  const averageMinutes = responseTimes.length
    ? responseTimes.reduce((total, minutes) => total + minutes, 0) / responseTimes.length
    : NaN;

  return {
    responseRate: received ? round((replied / received) * 100, 1) : 0,
    responseTime: formatDuration(averageMinutes),
  };
}

router.get('/seller', async (req, res) => {
  try {
    const sellerId = currentUserId(req);
    if (!sellerId) return res.status(401).json({ success: false, error: 'Authentication required' });

    await connectDB();
    const [seller, gigs, conversations] = await Promise.all([
      User.findOne({ id: sellerId }).select('isOnline lastSeen').lean(),
      Gig.find({ sellerId }).select('id').lean(),
      Conversation.find({ sellerId }).select('id').lean(),
    ]);
    const gigIds = gigs.map((gig) => gig.id);
    const conversationIds = conversations.map((conversation) => conversation.id);
    const today = startOfDay();
    const weekStart = daysAgo(7);
    const monthStart = daysAgo(30);
    const gigViewQuery = { gigId: { $in: gigIds } };
    const messageQuery = { receiverId: sellerId };

    const [viewsToday, viewsWeek, viewsMonth, uniqueVisitors, orders, reviews, sessions, unreadMessages, messagesToday, messages] = await Promise.all([
      GigView.countDocuments({ ...gigViewQuery, viewedAt: { $gte: today } }),
      GigView.countDocuments({ ...gigViewQuery, viewedAt: { $gte: weekStart } }),
      GigView.countDocuments({ ...gigViewQuery, viewedAt: { $gte: monthStart } }),
      GigView.distinct('visitorId', gigViewQuery),
      Order.find({ sellerId }).lean(),
      Review.find({ sellerId }).select('rating').lean(),
      WorkSession.find({ sellerId }).lean(),
      Message.countDocuments({ ...messageQuery, isRead: false }),
      Message.countDocuments({ ...messageQuery, createdAt: { $gte: today } }),
      Message.find({ conversationId: { $in: conversationIds } })
        .select('conversationId senderId receiverId createdAt')
        .lean(),
    ]);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
    const activeOrders = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length;
    const revenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

    const averageRating = reviews.length
      ? round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length, 1)
      : 0;

    const uniqueVisitorCount = uniqueVisitors.length;
    const conversionRate = uniqueVisitorCount > 0 ? round((totalOrders / uniqueVisitorCount) * 100, 2) : 0;

    const now = new Date();
    const totalMinutes = sumMinutes(sessions, now);
    const todayMinutes = sumMinutes(sessions, now, today);
    const weekMinutes = sumMinutes(sessions, now, weekStart);
    const { responseRate, responseTime } = getMessagingPerformance(messages, sellerId);
    const resolvedOrders = completedOrders + cancelledOrders;
    const successRate = resolvedOrders ? round((completedOrders / resolvedOrders) * 100, 1) : 0;

    console.log('Seller ID:', sellerId);
    console.log('Gig IDs:', gigIds);
    console.log('Views Today:', viewsToday);
    console.log('Views Week:', viewsWeek);
    console.log('Views Month:', viewsMonth);
    console.log('Unique Visitors:', uniqueVisitorCount);
    console.log('Orders:', totalOrders);

    return res.json({
      success: true,
      gigAnalytics: {
        viewsToday,
        viewsWeek,
        viewsMonth,
        uniqueVisitors: uniqueVisitorCount,
        totalGigs: gigs.length,
        totalOrders,
        conversionRate,
      },
      sellerPerformance: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        activeOrders,
        revenue: round(revenue, 2),
        averageRating,
        responseRate,
        responseTime,
        completionRate: totalOrders ? round((completedOrders / totalOrders) * 100, 1) : 0,
        successRate,
        online: seller?.isOnline || false,
      },
      workAnalytics: {
        lastActive: seller?.lastSeen || null,
        totalSessions: sessions.length,
        runningSession: sessions.find((s) => s.isRunning) || null,
        totalHours: round(totalMinutes / 60, 1),
        todayHours: round(todayMinutes / 60, 1),
        weeklyHours: round(weekMinutes / 60, 1),
      },
      messagingAnalytics: {
        unreadMessages,
        messagesToday,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to load analytics' });
  }
});

router.get('/gig/:gigId', async (req, res) => {
  try {
    await connectDB();
    const gigId = req.params.gigId;
    const [viewsToday, viewsWeek, viewsMonth, uniqueVisitors, orders] = await Promise.all([
      GigView.countDocuments({ gigId, viewedAt: { $gte: startOfDay() } }),
      GigView.countDocuments({ gigId, viewedAt: { $gte: daysAgo(7) } }),
      GigView.countDocuments({ gigId, viewedAt: { $gte: daysAgo(30) } }),
      GigView.distinct('visitorId', { gigId }),
      Order.find({ gigId }).lean(),
    ]);
    const uniqueVisitorCount = uniqueVisitors.length;
    const totalOrders = orders.length;
    return res.json({
      success: true,
      gigAnalytics: {
        viewsToday,
        viewsWeek,
        viewsMonth,
        uniqueVisitors: uniqueVisitorCount,
        totalOrders,
        conversionRate: uniqueVisitorCount > 0 ? round((totalOrders / uniqueVisitorCount) * 100, 2) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to load gig analytics' });
  }
});

module.exports = router;
