const router = require("express").Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Gig = require("../models/Gig");
const User = require("../models/User");
const connectDB = require("../db");
const { getIO } = require("../socket");
const { createNotification } = require("../utils/notify");

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
    const filter = { $and: [{ $or: [{ moderationStatus: 'approved' }, { moderationStatus: {$exists: false } }] }] };
    if (req.query.category)
      filter.category = {
        $regex: `^${req.query.category.trim()}$`,
        $options: "i",
      };
    if (req.query.search)
      filter.$and.push({$or: [
        { title: { $regex: req.query.search.trim(),$options: "i" } },
        { description: { $regex: req.query.search.trim(),$options: "i" } },
        { tags: { $in: [new RegExp(req.query.search.trim(), "i")] } },
      ] });
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
    
    if (loggedInUser.role === 'buyer') {
      await User.updateOne({ id: loggedInUser.id }, { $set: { role: 'seller' } });
      loggedInUser.role = 'seller';
    }
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
      moderationStatus: 'pending',
    });

    const gigObject = gig.toObject();
    const gigWithSeller = await withSeller(gigObject);

    // 1. Notify the seller that gig is submitted for review
    await createNotification({
      userId: loggedInUser.id,
      type: "gig",
      title: "Gig published",
      message: `Your gig "${gig.title}" was submitted for admin review.`,
      link: `/gigs/${gig.id}`,
      meta: { gigId: gig.id },
    });

    // 2. Notify all admins in database and send email via Nodemailer
    try {
      const Notification = require("../models/Notification");
      const admins = await User.find({
        $or: [
          { email: "kashifqureshi9758@gmail.com" },
          { role: "admin" },
        ],
      }).lean();

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          // Don't send admin notification to the seller themselves if they are an admin creating a gig
          if (admin.id === loggedInUser.id) continue;

          await Notification.create({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId: admin.id || admin._id.toString(),
            type: "gig",
            title: "New Gig Pending Approval",
            message: `${loggedInUser.name} has created a new gig titled "${gig.title}". Please review and approve it.`,
            link: "/admin/dashboard",
            meta: { gigId: gig._id },
            read: false,
          });
        }
      }

      const nodemailer = require("nodemailer");
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT || 587);
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const adminEmails = admins.map(a => a.email).filter(Boolean);
        const recipients = adminEmails.length > 0 ? adminEmails : ["kashifqureshi9758@gmail.com"];

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || smtpUser,
          to: recipients.join(", "),
          subject: "New Gig Pending Approval",
          text: `${loggedInUser.name} has submitted the gig "${gig.title}" for moderation and approval. Please review it in the admin dashboard.`,
        });
      }
    } catch (adminNotificationError) {
      console.error("Admin notification/email failed:", adminNotificationError);
    }

    // Broadcast to all connected clients so gig listings update in real-time.
    const io = getIO();
    if (io) {
      io.emit("gig:new", { gig: gigWithSeller });
    }

    res.status(201).json({ success: true, gig: gigWithSeller });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to create gig" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await connectDB();
    const gig = await Gig.findOne({ id: req.params.id }).lean();
    if (!gig)
      return res.status(404).json({ success: false, error: "Gig not found" });
    const viewer = await authenticatedUser(req);
    const visible = !gig.moderationStatus || gig.moderationStatus === 'approved';
    if (!visible && viewer?.id !== gig.sellerId && viewer?.role !== 'admin') {
      return res.status(404).json({ success: false, error: "Gig not found" });
    }
    res.json({ success: true, gig: await withSeller(gig) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    await connectDB();
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ success: false, error: "Authentication required" });
    const { id, _id, sellerId, seller, ...updates } = req.body || {};
    const gig = await Gig.findOneAndUpdate(
      { id: req.params.id, sellerId: user.id },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!gig) return res.status(404).json({ success: false, error: "Gig not found" });
    res.json({ success: true, gig: await withSeller(gig) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to update gig" });
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