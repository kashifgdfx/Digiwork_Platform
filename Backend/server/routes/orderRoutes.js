const router = require("express").Router();
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const User = require("../models/User");
const connectDB = require("../db");
const { getIO } = require("../socket");
const { createNotification } = require("../utils/notify");

const secret = () => process.env.JWT_SECRET || "tumhara_super_secret_key_yahan_hoga";

function getUserId(req) {
  const cookieToken = req.cookies?.token;
  const authorization = req.get?.('authorization') || req.headers?.authorization || '';
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = cookieToken || bearerToken;

  if (!token) return null;

  try {
    return jwt.verify(token, secret()).userId || null;
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
  if (order.buyerId) {
    io.to(`user:${order.buyerId}`).emit(event, payload);
    io.to(`user:${order.buyerId}`).emit("order:update", payload);
  }
  if (order.sellerId) {
    io.to(`user:${order.sellerId}`).emit(event, payload);
    io.to(`user:${order.sellerId}`).emit("order:update", payload);
  }
}

// GET Orders
router.get("/", async (req, res) => {
  try {
    await connectDB();
    const filter = {};
    ["buyerId", "sellerId", "status"].forEach((key) => {
      if (req.query[key]) filter[key] = req.query[key];
    });
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST Order (Yeh main create order wala route hai)
router.post("/", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const body = req.body;
    const currentBuyerId = body.buyerId || userId;

    console.log("Creating Order - Logged in User ID:", userId);
    console.log("Assigned Buyer ID:", currentBuyerId);

    if (!currentBuyerId) {
      return res.status(401).json({ success: false, error: "Authentication required to place order" });
    }

    // Self-Purchase Check
    if (body.sellerId === currentBuyerId) {
      return res.status(400).json({ 
        success: false, 
        error: "Bhai, aap apni khud ki gig purchase nahi kar sakte!" 
      });
    }

    const orderStatus = body.status || "in_progress";
    let progress = body.progressPercent;
    if (progress === undefined) {
      try {
        progress = typeof Order.progressForStatus === 'function' ? Order.progressForStatus(orderStatus) : 15;
      } catch (e) {
        progress = 15;
      }
    }

    const order = await Order.create({
      ...body,
      buyerId: currentBuyerId,
      id: body.id || `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      status: orderStatus,
      orderedAt:
        body.orderedAt ||
        new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      progressPercent: progress,
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
      }).catch(() => {});
    }

    return res.status(201).json({ success: true, order: serialized });
  } catch (error) {
    console.error("❌ Order creation error details:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to place order" });
  }
});

// PATCH Order
router.patch("/:id", async (req, res) => {
  try {
    await connectDB();
    const updateData = {};
    
    if (req.body.status) {
      updateData.status = req.body.status;
      try {
        updateData.progressPercent = typeof Order.progressForStatus === 'function' 
          ? Order.progressForStatus(req.body.status) 
          : 50;
      } catch (e) {
        updateData.progressPercent = 50;
      }
    }
    
    if (typeof req.body.progressPercent === "number" && !updateData.progressPercent) {
      updateData.progressPercent = req.body.progressPercent;
    }

    const order = await Order.findOneAndUpdate({ id: req.params.id }, { $set: updateData }, { new: true });
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    const serialized = order.toObject();
    const event = STATUS_EVENT[order.status] || "order-progress";
    broadcastOrder(event, serialized);

    if (order.status === "in_progress") {
      await createNotification({
        userId: order.buyerId,
        type: "order",
        title: "Order in progress",
        message: `"${order.gigTitle}" is now being worked on by the seller.`,
        link: "/dashboard/buyer",
        meta: { orderId: order.id },
      }).catch(() => {});
    }

    if (order.status === "revision") {
      await createNotification({
        userId: order.sellerId,
        type: "order",
        title: "Revision requested",
        message: `The buyer requested a revision for "${order.gigTitle}".`,
        link: "/dashboard/seller",
        meta: { orderId: order.id },
      }).catch(() => {});
    }

    if (order.status === "cancelled") {
      if (order.sellerId) {
        await createNotification({
          userId: order.sellerId,
          type: "order",
          title: "Order cancelled",
          message: `"${order.gigTitle}" has been cancelled.`,
          link: "/dashboard/seller",
          meta: { orderId: order.id },
        }).catch(() => {});
      }
      if (order.buyerId) {
        await createNotification({
          userId: order.buyerId,
          type: "order",
          title: "Order cancelled",
          message: `Your order for "${order.gigTitle}" has been cancelled.`,
          link: "/dashboard/buyer",
          meta: { orderId: order.id },
        }).catch(() => {});
      }
    }

    if (order.status === "delivered") {
      await createNotification({
        userId: order.buyerId,
        type: "order",
        title: "Order delivered",
        message: `"${order.gigTitle}" was delivered. Please review the work.`,
        link: "/dashboard/buyer",
        meta: { orderId: order.id, action: "leave-review" },
      }).catch(() => {});
      await createNotification({
        userId: order.buyerId,
        type: "review",
        title: "Leave a review",
        message: `Share your experience for "${order.gigTitle}".`,
        link: "/dashboard/buyer",
        meta: { orderId: order.id },
      }).catch(() => {});
    }

    if (order.status === "completed") {
      await createNotification({
        userId: order.sellerId,
        type: "order",
        title: "Order completed",
        message: `"${order.gigTitle}" was marked completed. Funds released.`,
        link: "/dashboard/seller",
        meta: { orderId: order.id },
      }).catch(() => {});
    }

    return res.json({ success: true, order: serialized });
  } catch (error) {
    console.error("Order update error:", error);
    return res.status(500).json({ success: false, error: error.message || "Error updating order" });
  }
});

module.exports = router;