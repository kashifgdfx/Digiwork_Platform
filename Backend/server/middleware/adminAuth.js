const jwt = require('jsonwebtoken');
const User = require('../models/User');
const connectDB = require('../db');

const secret = () => process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';

/** Authoritative admin gate. Role is read from the database, never trusted from the JWT. */
async function adminAuth(req, res, next) {
  const bearer = req.get?.('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = req.cookies?.token || bearer;
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, secret());
    await connectDB();
    const user = await User.findOne({ id: payload.userId }).select('-password').lean();
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, error: 'Admin privileges required' });
    if (user.accountStatus && user.accountStatus !== 'active') return res.status(403).json({ success: false, error: 'Admin account is inactive' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired session' });
  }
}

module.exports = adminAuth;
