const crypto = require('crypto');
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const GigView = require('../models/GigView');
const Gig = require('../models/Gig');
const connectDB = require('../db');

const secret = () => process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function currentUserId(req) {
  const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  try {
    return token ? jwt.verify(token, secret()).userId : null;
  } catch {
    return null;
  }
}

function buildVisitorId(req, providedVisitorId) {
  if (providedVisitorId && String(providedVisitorId).trim()) return String(providedVisitorId).trim();
  const authId = currentUserId(req);
  if (authId) return `user:${authId}`;
  const fingerprint = `${req.ip || ''}|${req.headers['user-agent'] || ''}`;
  return `anon:${crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 24)}`;
}

router.post('/', async (req, res) => {
  try {
    const { gigId, sellerId: providedSellerId, country = '', device = '', browser = '', visitorId: providedVisitorId } = req.body || {};
    if (!gigId) return res.status(400).json({ success: false, error: 'gigId is required' });

    await connectDB();

    const visitorId = buildVisitorId(req, providedVisitorId);
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);

    // Dedupe: same visitor + same gig within 30 minutes counts once.
    const existing = await GigView.findOne({ gigId, visitorId, viewedAt: { $gte: since } }).lean();
    if (existing) {
      return res.json({ success: true, counted: false, view: existing });
    }

    let sellerId = providedSellerId || '';
    if (!sellerId) {
      const gig = await Gig.findOne({ id: gigId }).select('sellerId').lean();
      sellerId = gig?.sellerId || '';
    }

    const view = await GigView.create({
      id: `gv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      gigId,
      sellerId,
      visitorId,
      country,
      device,
      browser: String(browser).slice(0, 200),
      viewedAt: new Date(),
    });

    return res.status(201).json({ success: true, counted: true, view: view.toObject() });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to record gig view' });
  }
});

router.get('/:gigId', async (req, res) => {
  try {
    await connectDB();
    const totalViews = await GigView.countDocuments({ gigId: req.params.gigId });
    return res.json({ success: true, totalViews });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Unable to load gig views' });
  }
});

module.exports = router;