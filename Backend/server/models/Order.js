const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, gigId: { type: String, required: true }, gigTitle: { type: String, required: true }, gigImage: { type: String, required: true },
  buyerId: { type: String, required: true }, buyerName: { type: String, required: true }, sellerId: { type: String, required: true }, sellerName: { type: String, required: true }, sellerAvatar: { type: String, required: true },
  packageTier: { type: String, enum: ['Basic', 'Standard', 'Premium'], required: true }, price: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'delivered', 'completed', 'cancelled', 'revision'], default: 'in_progress' }, orderedAt: { type: String, required: true }, deliveryDate: { type: String, required: true }, progressPercent: { type: Number, default: 15 },
}, { timestamps: true });

OrderSchema.statics.progressForStatus = function progressForStatus(status) {
  switch (status) {
    case 'pending': return 10;
    case 'in_progress': return 50;
    case 'delivered': return 90;
    case 'completed': return 100;
    case 'cancelled': return 0;
    default: return 15;
  }
};

OrderSchema.pre('save', function syncProgress(next) {
  if (this.isModified('status')) {
    this.progressPercent = OrderSchema.statics.progressForStatus(this.status);
  }
  next();
});

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
