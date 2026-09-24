const mongoose = require("mongoose");

const FeatureSchema = new mongoose.Schema(
  { name: String, included: { type: Boolean, default: true } },
  { _id: false },
);


const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["Basic", "Standard", "Premium"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    deliveryDays: { type: Number, required: true },
    revisions: mongoose.Schema.Types.Mixed,
    features: { type: [FeatureSchema], default: [] },
  },
  { _id: false },
);
const GigSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, required: true },
    sellerId: { type: String, required: true, index: true },
    images: { type: [String], default: [] },
    packages: {
      basic: PackageSchema,
      standard: PackageSchema,
      premium: PackageSchema,
    },
    rating: { type: Number, default: 5 },
    reviewCount: { type: Number, default: 0 },
    startingPrice: { type: Number, required: true, index: true },
    tags: { type: [String], default: [] },
    ordersInQueue: { type: Number, default: 0 },
    faqs: { type: [Object], default: [] },
    isFeatured: { type: Boolean, default: false },
    moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    moderationNote: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Gig || mongoose.model("Gig", GigSchema);
