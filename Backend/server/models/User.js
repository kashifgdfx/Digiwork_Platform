const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
  language: { type: String, required: true, trim: true, maxlength: 80 },
  proficiency: { type: String, required: true, trim: true, maxlength: 40 },
}, { _id: true });

const EducationSchema = new mongoose.Schema({
  school: { type: String, required: true, trim: true, maxlength: 160 },
  degree: { type: String, required: true, trim: true, maxlength: 120 },
  fieldOfStudy: { type: String, trim: true, maxlength: 120 },
  fromYear: { type: Number, min: 1900, max: 2200 },
  toYear: { type: Number, min: 1900, max: 2200 },
}, { _id: true });

const CertificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  issuer: { type: String, required: true, trim: true, maxlength: 160 },
  year: { type: Number, min: 1900, max: 2200 },
}, { _id: true });

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true, maxlength: 160 },
  role: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  currentlyWorking: { type: Boolean, default: false },
}, { _id: true });

const PortfolioSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1200 },
  image: { type: String, trim: true, maxlength: 4000000 },
}, { _id: true });

const SocialLinksSchema = new mongoose.Schema({
  website: { type: String, trim: true, maxlength: 300 },
  linkedin: { type: String, trim: true, maxlength: 300 },
  github: { type: String, trim: true, maxlength: 300 },
  twitter: { type: String, trim: true, maxlength: 300 },
  instagram: { type: String, trim: true, maxlength: 300 },
}, { _id: false });

const MetricsSchema = new mongoose.Schema({
  level: { type: String, enum: ['Top Rated Seller', 'Level 2', 'Level 1', 'New Seller'], default: 'New Seller' },
  responseTime: { type: String, default: '1 hour' },
  responseRate: { type: Number, min: 0, max: 100, default: 100 },
  completedOrders: { type: Number, min: 0, default: 0 },
  activeOrders: { type: Number, min: 0, default: 0 },
  totalReviews: { type: Number, min: 0, default: 0 },
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
}, { _id: false });

const CompletionSchema = new mongoose.Schema({
  percentage: { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  // A user may buy and sell, but the role is also the server-side permission
  // boundary for administrative operations. Never accept this field from signup.
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer', index: true },
  accountStatus: { type: String, enum: ['active', 'declined', 'suspended'], default: 'active', index: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  avatar: { type: String, default: '/images/default-avatar.png' },
  headline: { type: String, trim: true, maxlength: 120, default: '' },
  level: { type: String, enum: ['Top Rated Seller', 'Level 2', 'Level 1', 'New Seller'], default: 'Level 1' },
  rating: { type: Number, default: 5 },
  reviewCount: { type: Number, default: 0 },
  country: { type: String, default: 'United States' },
  memberSince: { type: String, default: '2024' },
  responseTime: { type: String, default: '1 hour' },
  bio: { type: String, default: '' },
  state: { type: String, trim: true, maxlength: 100, default: '' },
  city: { type: String, trim: true, maxlength: 100, default: '' },
  timezone: { type: String, trim: true, maxlength: 80, default: '' },
  languages: { type: [LanguageSchema], default: [] },
  skills: { type: [{ type: String, trim: true, maxlength: 80 }], default: [] },
  education: { type: [EducationSchema], default: [] },
  certifications: { type: [CertificationSchema], default: [] },
  experience: { type: [ExperienceSchema], default: [] },
  portfolio: { type: [PortfolioSchema], default: [] },
  socialLinks: { type: SocialLinksSchema, default: () => ({}) },
  sellerMetrics: { type: MetricsSchema, default: () => ({}) },
  profileCompletion: { type: CompletionSchema, default: () => ({}) },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: null },
  socketId: { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
}, { timestamps: true });



UserSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
