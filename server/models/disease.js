const mongoose = require('mongoose');
const { translateObject } = require('../services/translationService');

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
    },
    // Optional: Hindi localization (frontend already checks for 'hindi')
    hindi: {
      disease: String,
      description: String
    }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  readAt: { type: Date }
});
// Geo index for proximity queries
DiseaseAlertSchema.index({ location: '2dsphere' });

// Auto-translate to supported locales before save (best-effort)
DiseaseAlertSchema.pre('save', async function (next) {
  try {
    // Ensure english base
    if (!this.bilingualData) this.bilingualData = {};
    const baseEn = {
      disease: this.bilingualData.english?.disease || this.disease || '',
      description: this.bilingualData.english?.description || this.description || ''
    };
    this.bilingualData.english = baseEn;

    // Translate to Tamil if missing or empty
    const needsTa = !this.bilingualData.tamil || !this.bilingualData.tamil.disease || !this.bilingualData.tamil.description;
    if (needsTa && (baseEn.disease || baseEn.description)) {
      try {
        const { translated } = await translateObject(baseEn, 'en', 'ta');
        this.bilingualData.tamil = {
          disease: translated.disease || this.bilingualData.tamil?.disease,
          description: translated.description || this.bilingualData.tamil?.description
        };
      } catch (e) {
        // best-effort; keep whatever exists
      }
    }

    // Translate to Hindi if schema supports it and missing
    const needsHi = this.bilingualData && (!this.bilingualData.hindi || !this.bilingualData.hindi.disease || !this.bilingualData.hindi.description);
    if (needsHi && (baseEn.disease || baseEn.description)) {
      try {
        const { translated } = await translateObject(baseEn, 'en', 'hi');
        this.bilingualData.hindi = {
          disease: translated.disease || this.bilingualData.hindi?.disease,
          description: translated.description || this.bilingualData.hindi?.description
        };
      } catch (e) {
        // best-effort; keep whatever exists
      }
    }

    return next();
  } catch (err) {
    // Don't block saves on translation failures
    return next();
  }
});

module.exports = mongoose.model('DiseaseAlert', DiseaseAlertSchema);