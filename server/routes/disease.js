
const express = require('express');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose');
// DiseaseAlert model (inline for now)
const DiseaseAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  disease: String,
  description: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});
const DiseaseAlert = mongoose.models.DiseaseAlert || mongoose.model('DiseaseAlert', DiseaseAlertSchema);

// POST /api/disease/report
// Body: { disease, description, location: { type: 'Point', coordinates: [lng, lat] } }
router.post('/report', async (req, res) => {
  const { disease, description, location } = req.body;
  if (!disease || !location || !Array.isArray(location.coordinates)) {
    return res.status(400).json({ message: 'Disease and location required' });
  }
  try {
    
    const usersNearby = await User.find({
      location: {
        $near: {
          $geometry: location,
          $maxDistance: 10000 
        }
      }
    });
    
    // Create in-app notifications for each user
    let alerts = [];
    for (const user of usersNearby) {
      const alert = await DiseaseAlert.create({
        user: user._id,
        disease,
        description,
        location
      });
      alerts.push(alert._id);
    }
    res.json({ notified: usersNearby.length, alerts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/disease/alerts?userId=xxx
router.get('/alerts', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    const alerts = await DiseaseAlert.find({ user: userId, read: false }).sort({ createdAt: -1 });
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/disease/alerts/read (mark all as read for a user)
router.patch('/alerts/read', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    await DiseaseAlert.updateMany({ user: userId, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
