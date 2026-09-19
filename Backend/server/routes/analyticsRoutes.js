const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Gig = require('../models/Gig');
const Order = require('../models/Order');
const Review = require('../models/Review');
const GigView = require('../models/GigView');
const ActivityLog = require('../models/ActivityLog');
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

const ANALYTICS_TIMEZONE = 'Asia/Kolkata';

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseAnalyticsRange(query) {
  const now = new Date();
  const range = String(query.range || '30d');
  let start = startOfDay(now);
  let end = endOfDay(now);

  if (range === 'yesterday') {
    start.setDate(start.getDate() - 1);
    end = endOfDay(start);
  } else if (range === '7d' || range === '30d' || range === '90d') {
    start.setDate(start.getDate() - (Number.parseInt(range, 10) - 1));
  } else if (range === 'month') {
    start.setDate(1);
  } else if (range === 'custom') {
    const requestedStart = new Date(String(query.start || ''));
    const requestedEnd = new Date(String(query.end || ''));
    if (!Number.isNaN(requestedStart.getTime()) && !Number.isNaN(requestedEnd.getTime()) && requestedStart <= requestedEnd) {
      start = startOfDay(requestedStart);
      end = endOfDay(requestedEnd);
    }
  }

  return { start, end, range };
}

function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ANALYTICS_TIMEZONE }).format(date);
}

function dailyKeys(start, end) {
  const keys = [];
  const cursor = startOfDay(start);
  while (cursor <= end) {
    keys.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
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

    const [viewsToday, viewsWeek, viewsMonth, uniqueVisitors, orders, reviews, sessions, unreadMessages, messagesToday, messages, activityTotals] = await Promise.all([
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
      ActivityLog.aggregate([
        { $match: { gigId: { $in: gigIds } } },
        { $group: { _id: null, totalMouseMoves: { $sum: '$mouseMoves' }, totalKeyPresses: { $sum: '$keyPresses' } } },
      ]),
    ]);

    const activity = activityTotals[0] || { totalMouseMoves: 0, totalKeyPresses: 0 };

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
        totalMouseMoves: activity.totalMouseMoves,
        totalKeyPresses: activity.totalKeyPresses,
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

// Historical, date-bucketed data for the seller analytics dashboard.
router.get('/seller/history', async (req, res) => {
  try {
    const sellerId = currentUserId(req);
    if (!sellerId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { start, end, range } = parseAnalyticsRange(req.query);
    await connectDB();
    const [gigs, conversations] = await Promise.all([
      Gig.find({ sellerId }).select('id').lean(),
      Conversation.find({ sellerId }).select('id').lean(),
    ]);
    const gigIds = gigs.map((gig) => gig.id);
    const conversationIds = conversations.map((conversation) => conversation.id);
    const dateMatch = { $gte: start, $lte: end };
    const day = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field, timezone: ANALYTICS_TIMEZONE } });

    const [revenueRows, orderRows, visitorRows, activityRows, workRows, messageRows, ratingRows, funnelCounts, activeVisitors] = await Promise.all([
      Order.aggregate([
        { $match: { sellerId, createdAt: dateMatch } },
        { $group: { _id: day('$createdAt'), revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0] } } } },
      ]),
      Order.aggregate([
        { $match: { sellerId, createdAt: dateMatch } },
        { $group: { _id: day('$createdAt'), orders: { $sum: 1 }, completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['pending', 'in_progress', 'revision', 'delivered']] }, 1, 0] } } } },
      ]),
      GigView.aggregate([
        { $match: { gigId: { $in: gigIds }, viewedAt: dateMatch } },
        { $group: { _id: day('$viewedAt'), views: { $sum: 1 }, visitorIds: { $addToSet: '$visitorId' } } },
        { $project: { views: 1, visitors: { $size: '$visitorIds' } } },
      ]),
      ActivityLog.aggregate([
        { $match: { sellerId, recordedAt: dateMatch } },
        { $group: { _id: day('$recordedAt'), mouseMoves: { $sum: '$mouseMoves' }, keyPresses: { $sum: '$keyPresses' }, clicks: { $sum: '$clicks' } } },
      ]),
      WorkSession.aggregate([
        { $match: { sellerId, startedAt: dateMatch } },
        { $group: { _id: day('$startedAt'), hours: { $sum: { $divide: ['$totalMinutes', 60] } }, sessions: { $sum: 1 } } },
      ]),
      Message.aggregate([
        { $match: { conversationId: { $in: conversationIds }, createdAt: dateMatch } },
        { $group: { _id: day('$createdAt'), messages: { $sum: 1 }, unread: { $sum: { $cond: [{ $and: [{ $eq: ['$receiverId', sellerId] }, { $eq: ['$isRead', false] }] }, 1, 0] } } } },
      ]),
      Review.aggregate([
        { $match: { sellerId, createdAt: dateMatch } },
        { $group: { _id: day('$createdAt'), rating: { $avg: '$rating' } } },
      ]),
      Promise.all([
        GigView.countDocuments({ gigId: { $in: gigIds }, viewedAt: dateMatch }),
        GigView.distinct('visitorId', { gigId: { $in: gigIds }, viewedAt: dateMatch }),
        ActivityLog.aggregate([{ $match: { sellerId, recordedAt: dateMatch } }, { $group: { _id: null, clicks: { $sum: '$clicks' } } }]),
        Message.countDocuments({ conversationId: { $in: conversationIds }, createdAt: dateMatch }),
        Order.countDocuments({ sellerId, createdAt: dateMatch }),
      ]),
      ActivityLog.distinct('visitorId', { sellerId, recordedAt: { $gte: new Date(Date.now() - 60 * 1000) } }),
    ]);

    const byDay = (rows) => new Map(rows.map((row) => [row._id, row]));
    const revenueByDay = byDay(revenueRows);
    const ordersByDay = byDay(orderRows);
    const visitorsByDay = byDay(visitorRows);
    const activityByDay = byDay(activityRows);
    const workByDay = byDay(workRows);
    const messagesByDay = byDay(messageRows);
    const ratingsByDay = byDay(ratingRows);
    const dates = dailyKeys(start, end);

    const history = dates.map((date) => ({
      date,
      revenue: round(revenueByDay.get(date)?.revenue || 0, 2),
      orders: ordersByDay.get(date)?.orders || 0,
      completedOrders: ordersByDay.get(date)?.completedOrders || 0,
      pendingOrders: ordersByDay.get(date)?.pendingOrders || 0,
      views: visitorsByDay.get(date)?.views || 0,
      visitors: visitorsByDay.get(date)?.visitors || 0,
      mouseMoves: activityByDay.get(date)?.mouseMoves || 0,
      keyPresses: activityByDay.get(date)?.keyPresses || 0,
      clicks: activityByDay.get(date)?.clicks || 0,
      hours: round(workByDay.get(date)?.hours || 0, 2),
      sessions: workByDay.get(date)?.sessions || 0,
      messages: messagesByDay.get(date)?.messages || 0,
      unreadMessages: messagesByDay.get(date)?.unread || 0,
      rating: round(ratingsByDay.get(date)?.rating || 0, 1),
    }));
    const [views, visitorIds, clickRows, messages, orders] = funnelCounts;
    const funnel = { visitors: visitorIds.length, views, clicks: clickRows[0]?.clicks || 0, messages, orders };

    return res.json({ success: true, range: { range, start, end }, history, funnel, live: { activeVisitors: activeVisitors.length } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to load analytics history' });
  }
});

// Receives throttled, aggregate interaction counts from a public gig page.
// No coordinates or key values are collected.
router.post('/track-activity', async (req, res) => {
  try {
    const gigId = String(req.body?.gigId || '').trim();
    const mouseMoves = Number(req.body?.mouseMoves);
    const keyPresses = Number(req.body?.keyPresses);
    const clicks = Number(req.body?.clicks);
    const visitorId = String(req.body?.visitorId || '').trim();

    if (!gigId) return res.status(400).json({ success: false, error: 'gigId is required' });
    if (!visitorId || !Number.isInteger(mouseMoves) || !Number.isInteger(keyPresses) || !Number.isInteger(clicks) || mouseMoves < 0 || keyPresses < 0 || clicks < 0) {
      return res.status(400).json({ success: false, error: 'Activity counts must be non-negative integers' });
    }
    if (!mouseMoves && !keyPresses && !clicks) return res.json({ success: true, recorded: false });

    await connectDB();
    const gig = await Gig.findOne({ id: gigId }).select('sellerId').lean();
    if (!gig) return res.status(404).json({ success: false, error: 'Gig not found' });

    const activity = await ActivityLog.create({
      gigId,
      sellerId: gig.sellerId,
      visitorId: visitorId.slice(0, 100),
      // One browser batch is capped to keep this anonymous endpoint abuse-resistant.
      mouseMoves: Math.min(mouseMoves, 1000),
      keyPresses: Math.min(keyPresses, 1000),
      clicks: Math.min(clicks, 1000),
      recordedAt: new Date(),
    });

    return res.status(201).json({ success: true, recorded: true, activity: activity.toObject() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to record activity' });
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
