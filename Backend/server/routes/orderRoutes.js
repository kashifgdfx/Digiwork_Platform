const router = require("express").Router();
const jwt = require("jsonwebtoken"); // JWT require karein
const Order = require("../models/Order");
const connectDB = require("../db");

// Helper function to get logged-in user ID from cookies
function getUserId(req) {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || "tumhara_super_secret_key_yahan_hoga",
    ).userId;
  } catch (err) {
    return null;
  }
}

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const filter = {};
    ["buyerId", "sellerId", "status"].forEach((key) => {
      if (req.query[key]) filter[key] = req.query[key];
    });
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req); // Token se current user ki ID nikaalo
    const body = req.body;

    const order = await Order.create({
      ...body,
      buyerId: body.buyerId || userId, // Agar body mein na ho toh token wali ID daal do
      id: body.id || `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      status: body.status || "in_progress",
      orderedAt:
        body.orderedAt ||
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
      progressPercent: body.progressPercent ?? 15,
    });
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to place order",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    await connectDB();
    const updateData = {};
    if (req.body.status) {
      updateData.status = req.body.status;
      updateData.progressPercent = ["delivered", "completed"].includes(
        req.body.status,
      )
        ? 100
        : req.body.status === "in_progress"
        ? 50
        : undefined;
    }
    if (typeof req.body.progressPercent === "number")
      updateData.progressPercent = req.body.progressPercent;
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      { new: true },
    );
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Error updating order" });
  }
});

module.exports = router;