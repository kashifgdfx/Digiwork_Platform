const router = require("express").Router();
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const User = require("../models/User");
const connectDB = require("../db");
const { getIO } = require("../socket");
const { createNotification } = require("../utils/notify");

function getUserId(req) {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "tumhara_super_secret_key_yahan_hoga").userId;
  } catch (err) {
    return null;
  }
}

const STATUS_EVENT = {
  pending: "order-progress",
  in_progress: "order-progress",
  revision: "order-progress",
  delivered: "order-delivered",
  completed: "order-completed",
  cancelled: "order-progress",
};

function broadcastOrder(event, order) {
  const io = getIO();
  if (!io) return;
  const payload = { order };
  io.to(`user:${order.buyerId}`).emit(event, payload);
  io.to(`user:${order.sellerId}`).emit(event, payload);
  io.to(`user:${order.buyerId}`).emit("order:update", payload);
  io.to(`user:${order.sellerId}`).emit("order:update", payload);
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
    const userId = getUserId(req);
    const body = req.body;

    const order = await Order.create({
      ...body,
      buyerId: body.buyerId || userId,
      id: body.id || `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      status: body.status || "in_progress",
      orderedAt:
        body.orderedAt ||
        new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      progressPercent: body.progressPercent ?? Order.progressForStatus(body.status || "in_progress"),
    });

    const serialized = order.toObject();
    broadcastOrder("order-created", serialized);

    if (order.sellerId) {
      await createNotification({
        userId: order.sellerId,
        type: "order",
        title: "New order received",
        message: `${order.buyerName || "A buyer"} ordered "${order.gigTitle}".`,
        link: "/dashboard/seller",
        meta: { orderId: order.id },
      });
    }

    res.status(201).json({ success: true, order: serialized });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to place order" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    await connectDB();
    const updateData = {};
    if (req.body.status) {
      updateData.status = req.body.status;
      updateData.progressPercent = Order.progressForStatus(req.body.status);
    }
    if (typeof req.body.progressPercent === "number" && !updateData.progressPercent) {
      updateData.progressPercent = req.body.progressPercent;
    }

    const order = await Order.findOneAndUpdate({ id: req.params.id }, { $set: updateData }, { new: true });
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    const serialized = order.toObject();
    const event = STATUS_EVENT[order.status] || "order-progress";
    broadcastOrder(event, serialized);

    if (order.status === "delivered") {
      await createNotification({
        userId: order.buyerId,
        type: "order",
        title: "Order delivered",
        message: `"${order.gigTitle}" was delivered. Please review the work.`,
        link: "/dashboard/buyer",
        meta: { orderId: order.id, action: "leave-review" },
      });
      await createNotification({
        userId: order.buyerId,
        type: "review",
        title: "Leave a review",
        message: `Share your experience for "${order.gigTitle}".`,
        link: "/dashboard/buyer",
        meta: { orderId: order.id },
      });
    }

    if (order.status === "completed") {
      await createNotification({
        userId: order.sellerId,
        type: "order",
        title: "Order completed",
        message: `"${order.gigTitle}" was marked completed. Funds released.`,
        link: "/dashboard/seller",
        meta: { orderId: order.id },
      });
    }

    res.json({ success: true, order: serialized });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Error updating order" });
  }
});

module.exports = router;