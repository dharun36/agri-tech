const mongoose = require('mongoose');
const DiseaseAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  disease: String,
  description: String,
  // Bilingual support
  bilingualData: {
    english: {
      disease: String,
      description: String
    },
    tamil: {
      disease: String,
      description: String
    }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

module.exports = mongoose.model('DiseaseAlert', DiseaseAlertSchema);