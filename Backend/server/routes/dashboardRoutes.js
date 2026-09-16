const router = require("express").Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Gig = require("../models/Gig");
const Order = require("../models/Order");
const Review = require("../models/Review");
const connectDB = require("../db");

function sellerId(req) {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || "tumhara_super_secret_key_yahan_hoga",
    ).userId;
  } catch {
    return null;
  }
}

function profileSummary(user) {
  if (!user) return null;
  const checks = [
    user.avatar && user.avatar !== "/images/default-avatar.png",
    user.headline,
    user.bio,
    user.country,
    user.languages?.length,
    user.skills?.length,
    user.education?.length,
    user.experience?.length,
    user.portfolio?.length,
    Object.values(user.socialLinks || {}).some(Boolean),
  ];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    headline: user.headline,
    bio: user.bio,
    country: user.country,
    profileCompletion: { percentage: checks.filter(Boolean).length * 10 },
    sellerMetrics: user.sellerMetrics,
  };
}
router.get("/seller", async (req, res) => {
  try {
    const id = sellerId(req);
    if (!id)
      return res.status(401).json({ success: false, error: "Unauthorized: Please login first" });
    
    await connectDB();
    const user = await User.findOne(
      mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ id }, { _id: id }] }
        : { id },
    ).lean();

    const gigs = await Gig.find({ sellerId: id }).lean();
    const orders = await Order.find({ sellerId: id })
      .sort({ createdAt: -1 })
      .lean();
    const reviews = await Review.find({ sellerId: id }).select('rating').lean();
    const reviewStats = {
      averageRating: reviews.length ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 : 0,
      totalReviews: reviews.length,
      breakdown: [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((review) => review.rating === star).length })),
    };
    res.json({
      success: true,
      user: profileSummary(user),
      reviewStats,
      gigs: gigs.map((gig) => ({
        id: gig.id || gig._id.toString(),
        title: gig.title,
        category: gig.category,
        subcategory: gig.subcategory,
        startingPrice: gig.startingPrice,
        images: gig.images || [],
        rating: gig.rating || 5,
        reviewCount: gig.reviewCount || 0,
        ordersInQueue: gig.ordersInQueue || 0,
      })),
      orders: orders.map((order) => ({
        id: order.id || order._id.toString(),
        gigId: order.gigId,
        gigTitle: order.gigTitle,
        packageTier: order.packageTier,
        price: order.price,
        buyerName: order.buyerName || "Client",
        status: order.status,
        deliveryDate: order.deliveryDate,
      })),
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal Server Error",
      });
  }
});


router.patch("/seller", async (req, res) => {
  try {
    const id = sellerId(req);
    if (!id)
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Please login first" });
    if (!req.body.avatarUrl)
      return res
        .status(400)
        .json({ success: false, error: "Avatar URL is required" });
    await connectDB();
    const user = await User.findOneAndUpdate(
      mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ id }, { _id: id }] }
        : { id },
      { $set: { avatar: req.body.avatarUrl } },
      { new: true },
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "User not found in database" });
    res.json({
      success: true,
      message: "Profile picture updated successfully!",
      avatar: user.avatar,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal Server Error",
      });
  }
});

router.get("/seller/analytics", (_req, res) => {
  return res.redirect(307, "/api/analytics/seller");
});
router.get('/buyer', async (req, res) => {
  try {
    const id = sellerId(req);
    if (!id) return res.status(401).json({ success: false, error: 'Unauthorized: Please login first' });
    
    await connectDB();
    
    const user = await User.findOne(mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id }).lean();
    
    const orders = await Order.find({ buyerId: id }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      user: profileSummary(user),
      count: orders.length,
      orders: orders.map((order) => ({
        id: order.id || order._id.toString(),
        gigId: order.gigId,
        gigTitle: order.gigTitle,
        gigImage: order.gigImage,
        packageTier: order.packageTier,
        price: order.price,
        sellerId: order.sellerId,
        sellerName: order.sellerName || 'Freelancer',
        sellerAvatar: order.sellerAvatar,
        status: order.status,
        progressPercent: order.progressPercent || 0,
        orderedAt: order.orderedAt,
        deliveryDate: order.deliveryDate
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});
module.exports = router;
