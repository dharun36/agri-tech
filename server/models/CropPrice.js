const mongoose = require('mongoose');

const cropPriceSchema = new mongoose.Schema({
  crop_name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  market: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// IMPORTANT: Non-unique index - ALLOWS DUPLICATES
// Remove this line entirely to prevent Mongoose from auto-creating indexes
// cropPriceSchema.index({ crop_name: 1, city: 1, date: 1 });

const CropPrice = mongoose.model('CropPrice', cropPriceSchema);

module.exports = CropPrice;