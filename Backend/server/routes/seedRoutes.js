const router = require('express').Router();
const connectDB = require('../db');
const Gig = require('../models/Gig');
const Order = require('../models/Order');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Review = require('../models/Review');

router.all('/', async (req, res) => {
  try {
    await connectDB();
    const existingCount = await Gig.countDocuments();
    if (existingCount > 0 && req.query.force !== 'true') return res.json({ success: true, message: 'Database already populated', gigCount: existingCount });
    await Promise.all([Gig.deleteMany({}), Order.deleteMany({}), Conversation.deleteMany({}), Message.deleteMany({}), Review.deleteMany({})]);
    res.json({ success: true, message: 'Database cleared and ready for seed data', counts: { gigs: 0, orders: 0, reviews: 0, conversations: 0, messages: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Error seeding database' });
  }
});

module.exports = router;
