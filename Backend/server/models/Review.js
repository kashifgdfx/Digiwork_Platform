const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
module.exports = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
