const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../db');

const secret = () => process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const COLLECTIONS = new Set(['languages', 'education', 'certifications', 'experience', 'portfolio']);
const PROFILE_FIELDS = new Set([
  'name', 'username', 'phone', 'headline', 'bio', 'country', 'state', 'city', 'timezone',
  'socialLinks',
]);

const clean = (value, max = 2000) => typeof value === 'string'
  ? value.replace(/[<>]/g, '').trim().slice(0, max)
  : value;

const safeUrl = (value) => !value || (/^https?:\/\//i.test(value) && !/^javascript:/i.test(value));

const publicUser = (user) => {
  const value = user.toObject ? user.toObject() : user;
  const { password, __v, _id, ...safeUser } = value;
  return safeUser;
};

const calculateCompletion = (user) => {
  const checks = [
    Boolean(user.avatar && user.avatar !== '/images/default-avatar.png'),
    Boolean(user.headline),
    Boolean(user.bio),
    Boolean(user.country),
    user.languages?.length > 0,
    user.skills?.length > 0,
    user.education?.length > 0,
    user.experience?.length > 0,
    user.portfolio?.length > 0,
    Object.values(user.socialLinks || {}).some(Boolean),
  ];
  return checks.filter(Boolean).length * 10;
};

const serialize = (user) => {
  user.profileCompletion = { percentage: calculateCompletion(user) };
  return publicUser(user);
};

const requireUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });
    const payload = jwt.verify(token, secret());
    await connectDB();
    const user = await User.findOne({ id: payload.userId });
    if (!user) return res.status(401).json({ success: false, error: 'User session is no longer valid' });
    req.authUser = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
};

const validateCollectionItem = (collection, item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return 'A valid object is required';
  if (collection === 'languages' && (!clean(item.language, 80) || !clean(item.proficiency, 40))) return 'Language and proficiency are required';
  if (collection === 'education' && (!clean(item.school, 160) || !clean(item.degree, 120))) return 'School and degree are required';
  if (collection === 'certifications' && (!clean(item.title, 160) || !clean(item.issuer, 160))) return 'Title and issuer are required';
  if (collection === 'experience' && (!clean(item.company, 160) || !clean(item.role, 160) || !item.startDate)) return 'Company, role, and start date are required';
  if (collection === 'portfolio' && !clean(item.title, 160)) return 'Portfolio title is required';
  return null;
};

const sanitizeCollectionItem = (collection, item) => {
  const fields = {
    languages: ['language', 'proficiency'],
    education: ['school', 'degree', 'fieldOfStudy', 'fromYear', 'toYear'],
    certifications: ['title', 'issuer', 'year'],
    experience: ['company', 'role', 'description', 'startDate', 'endDate', 'currentlyWorking'],
    portfolio: ['title', 'description', 'image'],
  }[collection];
  return fields.reduce((result, field) => {
    if (item[field] !== undefined) result[field] = typeof item[field] === 'string' ? clean(item[field]) : item[field];
    return result;
  }, {});
};

router.get('/', requireUser, (req, res) => res.json({ success: true, user: serialize(req.authUser) }));

router.get('/:username', async (req, res) => {
  try {
    await connectDB();
    const user = await User.findOne({ username: clean(req.params.username, 80) }).select('-password -__v').lean();
    if (!user) return res.status(404).json({ success: false, error: 'Profile not found' });
    user.profileCompletion = { percentage: calculateCompletion(user) };
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to load profile' });
  }
});

router.patch('/', requireUser, async (req, res) => {
  try {
    const updates = {};
    for (const [field, value] of Object.entries(req.body || {})) {
      if (!PROFILE_FIELDS.has(field)) continue;
      if (field === 'socialLinks') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return res.status(400).json({ success: false, error: 'socialLinks must be an object' });
        updates.socialLinks = ['website', 'linkedin', 'github', 'twitter', 'instagram'].reduce((links, key) => {
          links[key] = clean(value[key], 300) || '';
          return links;
        }, {});
        if (Object.values(updates.socialLinks).some((value) => !safeUrl(value))) return res.status(400).json({ success: false, error: 'Social links must use http or https URLs' });
      } else if (field === 'username') {
        const username = clean(value, 40);
        if (!/^[a-zA-Z0-9_]+$/.test(username || '')) return res.status(400).json({ success: false, error: 'Username may contain only letters, numbers, and underscores' });
        const existing = await User.findOne({ username, id: { $ne: req.authUser.id } });
        if (existing) return res.status(409).json({ success: false, error: 'Username is already in use' });
        updates[field] = username;
      } else {
        updates[field] = clean(value, field === 'bio' ? 3000 : 200);
      }
    }
    if (updates.name !== undefined && !updates.name) return res.status(400).json({ success: false, error: 'Name is required' });
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, error: 'No valid profile changes supplied' });
    Object.assign(req.authUser, updates);
    await req.authUser.save();
    return res.json({ success: true, user: serialize(req.authUser) });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to update profile' });
  }
});

router.patch('/avatar', requireUser, async (req, res) => {
  const { avatar } = req.body || {};
  if (typeof avatar !== 'string' || !/^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/.test(avatar)) {
    return res.status(400).json({ success: false, error: 'Avatar must be a PNG, JPEG, or WebP image upload' });
  }
  if (Buffer.byteLength(avatar, 'utf8') > MAX_AVATAR_BYTES) return res.status(413).json({ success: false, error: 'Avatar must be smaller than 4MB' });
  req.authUser.avatar = avatar;
  await req.authUser.save();
  return res.json({ success: true, user: serialize(req.authUser) });
});

router.post('/skills', requireUser, async (req, res) => {
  const skill = clean(req.body?.skill, 80);
  if (!skill) return res.status(400).json({ success: false, error: 'Skill is required' });
  if (!req.authUser.skills.includes(skill)) req.authUser.skills.push(skill);
  await req.authUser.save();
  return res.status(201).json({ success: true, user: serialize(req.authUser) });
});

router.delete('/skills/:id', requireUser, async (req, res) => {
  const skill = clean(decodeURIComponent(req.params.id), 80);
  const originalLength = req.authUser.skills.length;
  req.authUser.skills = req.authUser.skills.filter((value) => value !== skill);
  if (req.authUser.skills.length === originalLength) return res.status(404).json({ success: false, error: 'Skill not found' });
  await req.authUser.save();
  return res.json({ success: true, user: serialize(req.authUser) });
});

for (const collection of COLLECTIONS) {
  router.post(`/${collection}`, requireUser, async (req, res) => {
    const error = validateCollectionItem(collection, req.body);
    if (error) return res.status(400).json({ success: false, error });
    const item = sanitizeCollectionItem(collection, req.body);
    if (collection === 'portfolio' && !safeUrl(item.image)) return res.status(400).json({ success: false, error: 'Portfolio image must use an http or https URL' });
    if (collection === 'experience' && item.currentlyWorking) delete item.endDate;
    req.authUser[collection].push(item);
    await req.authUser.save();
    return res.status(201).json({ success: true, user: serialize(req.authUser), item: req.authUser[collection].at(-1) });
  });

  router.delete(`/${collection}/:id`, requireUser, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid item id' });
    const items = req.authUser[collection];
    const item = items.id(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Profile item not found' });
    item.deleteOne();
    await req.authUser.save();
    return res.json({ success: true, user: serialize(req.authUser) });
  });

  router.patch(`/${collection}/:id`, requireUser, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid item id' });
    const item = req.authUser[collection].id(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Profile item not found' });
    const error = validateCollectionItem(collection, req.body);
    if (error) return res.status(400).json({ success: false, error });
    Object.assign(item, sanitizeCollectionItem(collection, req.body));
    if (collection === 'portfolio' && !safeUrl(item.image)) return res.status(400).json({ success: false, error: 'Portfolio image must use an http or https URL' });
    if (collection === 'experience' && item.currentlyWorking) item.endDate = undefined;
    await req.authUser.save();
    return res.json({ success: true, user: serialize(req.authUser), item });
  });
}

module.exports = router;
