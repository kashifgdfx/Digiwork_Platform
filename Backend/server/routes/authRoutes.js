const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const connectDB = require('../db');

const secret = () => process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  level: user.level,
  rating: user.rating,
  reviewCount: user.reviewCount,
  country: user.country,
  memberSince: user.memberSince,
  responseTime: user.responseTime,
  bio: user.bio,
  phone: user.phone,
  headline: user.headline,
  state: user.state,
  city: user.city,
  timezone: user.timezone,
  languages: user.languages,
  skills: user.skills,
  education: user.education,
  certifications: user.certifications,
  experience: user.experience,
  portfolio: user.portfolio,
  socialLinks: user.socialLinks,
  sellerMetrics: user.sellerMetrics,
  profileCompletion: user.profileCompletion,
  level: user.level || user.sellerMetrics?.level || 'New Seller',
});

const authenticatedUser = async (req) => {
  const token = req.cookies.token;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret());
    await connectDB();
    return User.findOne({ id: payload.userId }).lean();
  } catch {
    return null;
  }
};

router.post('/signup', async (req, res) => {
  try {
    await connectDB();
    const { name, username, email, password, country, bio } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ success: false, error: 'Please fill in all required fields (name, username, email, password)' });
    if (await User.findOne({ $or: [{ email }, { username }] })) return res.status(400).json({ success: false, error: 'User with this email or username already exists' });
    const user = await User.create({ id: `user-${Date.now()}`, name, username, email, password: await bcrypt.hash(password, 10), country: country || 'United States', bio: bio || '', memberSince: String(new Date().getFullYear()) });
    res.status(201).json({ success: true, message: 'User registered successfully!', user: { id: user.id, name: user.name, username: user.username, email: user.email } });
  } catch (error) { console.error('Signup error:', error); res.status(500).json({ success: false, error: error.message || 'Internal Server Error' }); }
});

router.post('/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    const userData = { userId: user.id, email: user.email, username: user.username, name: user.name };
    const token = jwt.sign(userData, secret(), { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
    res.json({ success: true, message: 'Login successful', user: publicUser(user) });
  } catch (error) { console.error('Login error:', error); res.status(500).json({ success: false, error: error.message || 'Internal Server Error' }); }
});

router.get('/me', async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ success: false, user: null, error: 'Unauthorized' });
  return res.json({ success: true, user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return res.json({ success: true });
});

module.exports = router;
