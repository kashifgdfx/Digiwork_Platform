export type SellerLevel = 'Top Rated Seller' | 'Level 2' | 'Level 1' | 'New Seller';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  level: SellerLevel;
  rating: number;
  reviewCount: number;
  country: string;
  memberSince: string;
  responseTime: string;
  bio: string;
  languages: Array<Language | string>;
  phone?: string;
  headline?: string;
  state?: string;
  city?: string;
  timezone?: string;
  skills?: string[];
  education?: Education[];
  certifications?: Certification[];
  experience?: Experience[];
  portfolio?: PortfolioItem[];
  socialLinks?: SocialLinks;
  sellerMetrics?: SellerMetrics;
  profileCompletion?: { percentage: number };
}

export interface Language {
  _id?: string;
  language: string;
  proficiency: string;
}

export interface Education {
  _id?: string;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  fromYear?: number;
  toYear?: number;
}

export interface Certification {
  _id?: string;
  title: string;
  issuer: string;
  year?: number;
}

export interface Experience {
  _id?: string;
  company: string;
  role: string;
  description?: string;
  startDate: string;
  endDate?: string;
  currentlyWorking?: boolean;
}

export interface PortfolioItem {
  _id?: string;
  title: string;
  description?: string;
  image?: string;
}

export interface SocialLinks {
  website?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
}

export interface SellerMetrics {
  level: SellerLevel;
  responseTime: string;
  responseRate: number;
  completedOrders: number;
  activeOrders: number;
  totalReviews: number;
  averageRating: number;
}

export interface PackageTier {
  name: 'Basic' | 'Standard' | 'Premium';
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number | string;
  features: { name: string; included: boolean }[];
}

export interface GigFAQ {
  question: string;
  answer: string;
}

export interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  sellerId?: string;
  seller: User;
  images: string[];
  packages: {
    basic: PackageTier;
    standard: PackageTier;
    premium: PackageTier;
  };
  rating: number;
  reviewCount: number;
  startingPrice: number;
  tags: string[];
  ordersInQueue: number;
  faqs: GigFAQ[];
  isFeatured?: boolean;
}

export type OrderStatus = 'pending' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'revision';

export interface Order {
  id: string;
  gigId: string;
  gigTitle: string;
  gigImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  packageTier: 'Basic' | 'Standard' | 'Premium';
  price: number;
  status: OrderStatus;
  orderedAt: string;
  deliveryDate: string;
  progressPercent: number;
}

export interface Review {
  id: string;
  orderId: string;
  gigId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordStrengthResult {
  score: number;
  label: 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  color: string;
  width: number;
  valid: boolean;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export interface ReviewPayload { orderId: string; rating: number; comment: string; }
export interface ReviewStats { rating: number; reviewCount: number; }
export interface SellerRatingStats { averageRating: number; totalReviews: number; breakdown: Array<{ star: number; count: number }>; }

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  deliveredAt?: string | null;
  seenAt?: string | null;
  status?: 'sent' | 'delivered' | 'seen';
}

export interface Conversation {
  id: string;
  participant: User;
  buyerId?: string;
  sellerId?: string;
  gigId?: string;
  gigTitle?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

export interface NotificationItem {
  id: string;
  type: 'message' | 'order' | 'review' | 'gig';
  title?: string;
  message?: string;
  link?: string;
  meta?: Record<string, unknown>;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  text?: string;
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
  isRead?: boolean;
}

export interface GigAnalytics {
  viewsToday: number;
  viewsWeek: number;
  viewsMonth: number;
  uniqueVisitors: number;
  totalOrders: number;
  conversionRate: number;
}

export interface SellerPerformance {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  averageRating: number;
  responseRate: number;
  responseTime: string;
  level: SellerLevel;
  completionRate: number;
}

export interface WorkSession {
  id: string;
  orderId: string;
  sellerId: string;
  startedAt: string;
  endedAt?: string | null;
  totalMinutes: number;
  isRunning: boolean;
}

export interface WorkAnalytics {
  lastActive: string | null;
  totalSessions: number;
  runningSession: WorkSession | null;
  totalHours: number;
  todayHours: number;
  weeklyHours: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  gigCount: number;
  subcategories: string[];
  image: string;
}

export type UserRole = 'buyer' | 'seller';
