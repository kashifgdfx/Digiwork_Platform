const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const User = require('../models/User');
const connectDB = require('../db');
const { getIO } = require('../socket');

const secret = () => process.env.JWT_SECRET || 'tumhara_super_secret_key_yahan_hoga';
function currentUserId(req) { const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, ''); try { return token ? jwt.verify(token, secret()).userId : null; } catch { return null; } }
function serialize(review) { return { ...review, id: review.id || review._id?.toString() }; }
async function statsForGig(gigId) {
  const [summary] = await Review.aggregate([{ $match: { gigId } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  const stats = { rating: summary ? Math.round(summary.average * 10) / 10 : 0, reviewCount: summary?.count || 0 };
  await Gig.updateOne({ id: gigId }, { $set: stats });
  return stats;
}
function publish(event, review, stats) { const io = getIO(); if (io) io.emit(event, { review: serialize(review.toObject ? review.toObject() : review), stats, gigId: review.gigId, sellerId: review.sellerId }); }

router.post('/', async (req, res) => {
  try {
    const buyerId = currentUserId(req); const rating = Number(req.body.rating); const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    if (!buyerId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (!req.body.orderId || !Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) return res.status(400).json({ success: false, error: 'A rating from 1 to 5 and a comment are required' });
    await connectDB();
    const order = await Order.findOne({ id: req.body.orderId }).lean();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.buyerId !== buyerId) return res.status(403).json({ success: false, error: 'Only the buyer who placed this order can review it' });
    if (order.status !== 'completed') return res.status(409).json({ success: false, error: 'Reviews are available only after an order is completed' });
    if (order.sellerId === buyerId) return res.status(403).json({ success: false, error: 'Sellers cannot review their own gigs' });
    const buyer = await User.findOne({ id: buyerId }).lean();
    const review = await Review.create({ orderId: order.id, gigId: order.gigId, sellerId: order.sellerId, buyerId, buyerName: buyer?.name || order.buyerName, buyerAvatar: buyer?.avatar || '', rating, comment });
    const stats = await statsForGig(order.gigId); publish('reviewCreated', review, stats);
    res.status(201).json({ success: true, review: serialize(review.toObject()), stats });
  } catch (error) { if (error?.code === 11000) return res.status(409).json({ success: false, error: 'A review has already been submitted for this order' }); res.status(500).json({ success: false, error: error.message || 'Unable to submit review' }); }
});
router.get('/gig/:gigId', async (req, res) => {
  try {
    await connectDB();
    const reviews = await Review.find({ gigId: req.params.gigId }).sort({ createdAt: -1 }).lean();
    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? Math.round((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews) * 10) / 10
      : 0;

    res.json({
      success: true,
      reviews: reviews.map(serialize),
      stats: {
        rating: averageRating,
        reviewCount: totalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/seller/:sellerId', async (req, res) => { try { await connectDB(); const reviews = await Review.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 }).lean(); const totalReviews = reviews.length; const averageRating = totalReviews ? Math.round(reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews * 10) / 10 : 0; const breakdown = [5,4,3,2,1].map(star => ({ star, count: reviews.filter(review => review.rating === star).length })); res.json({ success: true, reviews: reviews.map(serialize), stats: { averageRating, totalReviews, breakdown } }); } catch (error) { res.status(500).json({ success: false, error: error.message }); } });
router.patch('/:id', async (req, res) => { try { const buyerId = currentUserId(req); const rating = Number(req.body.rating); const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : ''; if (!buyerId) return res.status(401).json({ success:false,error:'Authentication required' }); if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) return res.status(400).json({success:false,error:'A rating from 1 to 5 and a comment are required'}); await connectDB(); const review = await Review.findOneAndUpdate({_id:req.params.id,buyerId}, {$set:{rating,comment}}, {new:true}); if (!review) return res.status(404).json({success:false,error:'Review not found or not owned by you'}); const stats = await statsForGig(review.gigId); publish('reviewUpdated', review, stats); res.json({success:true,review:serialize(review.toObject()),stats}); } catch(error) { res.status(500).json({success:false,error:error.message}); } });
router.delete('/:id', async (req,res) => { try { const buyerId=currentUserId(req); if(!buyerId) return res.status(401).json({success:false,error:'Authentication required'}); await connectDB(); const review=await Review.findOneAndDelete({_id:req.params.id,buyerId}); if(!review) return res.status(404).json({success:false,error:'Review not found or not owned by you'}); const stats=await statsForGig(review.gigId); publish('reviewDeleted',review,stats); res.json({success:true,stats}); } catch(error) { res.status(500).json({success:false,error:error.message}); } });
module.exports = router;
