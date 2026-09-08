const router = require("express").Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Gig = require("../models/Gig");
const User = require("../models/User");
const connectDB = require("../db");

const secret = () => process.env.JWT_SECRET || "tumhara_super_secret_key_yahan_hoga";

async function authenticatedUser(req) {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret());
    await connectDB();
    return User.findOne({ id: payload.userId }).lean();
  } catch {
    return null;
  }
}

async function withSeller(gig) {
  const seller = await User.findOne({ id: gig.sellerId }).select('-password -__v').lean();
  return { ...gig, seller: seller || null };
}

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const filter = {};
    if (req.query.category)
      filter.category = {
        $regex: `^${req.query.category.trim()}$`,
        $options: "i",
      };
    if (req.query.search)
      filter.$or = [
        { title: { $regex: req.query.search.trim(), $options: "i" } },
        { description: { $regex: req.query.search.trim(), $options: "i" } },
        { tags: { $in: [new RegExp(req.query.search.trim(), "i")] } },
      ];
    if (req.query.minPrice || req.query.maxPrice) {
      filter.startingPrice = {};
      if (req.query.minPrice)
        filter.startingPrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice)
        filter.startingPrice.$lte = Number(req.query.maxPrice);
    }
    if (req.query.deliveryDays)
      filter["packages.basic.deliveryDays"] = {
        $lte: Number(req.query.deliveryDays),
      };
    if (req.query.sellerLevel && req.query.sellerLevel !== "All") {
      const sellers = await User.find({ 'sellerMetrics.level': req.query.sellerLevel }).select('id').lean();
      filter.sellerId = { $in: sellers.map((seller) => seller.id) };
    }
    let sort = { createdAt: -1 };
    if (req.query.sortBy === "rating") sort = { rating: -1 };
    if (req.query.sortBy === "reviews") sort = { reviewCount: -1 };
    if (req.query.sortBy === "price_asc") sort = { startingPrice: 1 };
    if (req.query.sortBy === "price_desc") sort = { startingPrice: -1 };
    const gigs = await Gig.find(filter).sort(sort).lean();
    res.json({ success: true, count: gigs.length, gigs: await Promise.all(gigs.map(withSeller)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    await connectDB();
    const body = req.body;
    const loggedInUser = await authenticatedUser(req);
    if (!loggedInUser) return res.status(401).json({ success: false, error: "Authentication required" });
    const { seller, sellerId, ...gigData } = body;
    if (!gigData.title || !gigData.description || !gigData.category || !gigData.subcategory || !gigData.startingPrice) {
      return res.status(400).json({ success: false, error: "Title, description, category, subcategory, and starting price are required" });
    }
    const gig = await Gig.create({
      ...gigData,
      sellerId: loggedInUser.id,
      id: body.id || `gig-${Date.now()}`,
      rating: body.rating || 5,
      reviewCount: body.reviewCount || 0,
      ordersInQueue: body.ordersInQueue || 0,
      faqs: body.faqs || [
        {
          question: "What is included in this gig?",
          answer: "All deliverables specified in the selected package tiers.",
        },
      ],
    });
    
    res.status(201).json({ success: true, gig: await withSeller(gig.toObject()) });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.message || "Failed to create gig" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await connectDB();
    const gig = await Gig.findOne({ id: req.params.id }).lean();
    if (!gig)
      return res.status(404).json({ success: false, error: "Gig not found" });
    res.json({ success: true, gig: await withSeller(gig) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/:id", async (logReq, logRes) => {
  try {
    await connectDB();
    const user = await authenticatedUser(logReq);
    if (!user) return logRes.status(401).json({ success: false, error: "Authentication required" });
    const result = await Gig.deleteOne({ id: logReq.params.id, sellerId: user.id });
    logRes.json({
      success: true,
      message: `Gig ${logReq.params.id} deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logRes.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;