const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    gigId: { type: String, required: true, index: true, trim: true },
    sellerId: { type: String, required: true, index: true, trim: true },
    buyerId: { type: String, required: true, index: true, trim: true },
    buyerName: { type: String, required: true, trim: true, maxlength: 120 },
    buyerAvatar: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },
  },
  { timestamps: true, versionKey: false },
);
ReviewSchema.index({ gigId: 1, createdAt: -1 });
ReviewSchema.index({ sellerId: 1, createdAt: -1 });
module.exports =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);
