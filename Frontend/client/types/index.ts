export type SellerLevel = 'Top Rated Seller' | 'Level 2' | 'Level 1' | 'New Seller';

export interface User {
  id: string;
  name: string;
  username: string;
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

export type OrderStatus = 'in_progress' | 'delivered' | 'completed' | 'revision';

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
  gigId: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerCountry: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  gigId?: string;
  gigTitle?: string;
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
