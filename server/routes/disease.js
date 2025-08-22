const express = require('express');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { sendMail, testConnection } = require('../utils/mailer');



const API_URL = "https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.0-pro:generateContent?key=AIzaSyAqWH8BEYRNGeO9HNWYaOrVll_c4kaXPHk";
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
    const io = req.app.get('io'); // Get socket.io instance

    for (const user of usersNearby) {
      const alert = await DiseaseAlert.create({
        user: user._id,
        disease,
        description,
        location
      });
      alerts.push(alert._id);

      // Emit real-time alert to the specific user
      if (io) {
        io.to(`user-${user._id}`).emit('new-disease-alert', {
          alert: alert,
          message: `New disease alert: ${disease} detected in your area`
        });
      }
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


  async function handleImageDiagnosis(req, res) {
    // ... run model, get result ...
    const { label, confidence } = result;

    if (label && label.toLowerCase() !== 'healthy') {
      // build email
      const subject = `Alert: ${label} detected (${Math.round(confidence * 100)}%)`;
      const text = `A disease (${label}) was detected for user ${userId || 'unknown'}.
Confidence: ${Math.round(confidence * 100)}%
Image: ${req.body.imageUrl || 'attached'}
Time: ${new Date().toISOString()}`;

      try {
        await sendMail({
          to: userEmail, // determine the recipient (farmer/user)
          subject,
          text,
          html: `<p>${text}</p>`,
          // attachments: [{ filename: 'image.jpg', path: '/tmp/upload.jpg' }]
        });
        // respond or continue
      } catch (err) {
        console.error('Email send failed', err);
        // log, but don't block main flow — consider retry or queue
      }
    }

    res.json({ result });
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


router.post('/proxy', async (req, res) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from API" });
  }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ message: 'to, subject, and text are required' });
  }

  try {
    const result = await sendMail({
      to,
      subject,
      text,
      html: `<p>${text}</p>`
    });

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
});

// Enhanced email test endpoint with multiple fallbacks
router.post('/test-email-enhanced', async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ message: 'to, subject, and text are required' });
  }

  try {
    // Use enhanced mailer with fallbacks
    const { sendMail: sendMailEnhanced } = require('../utils/mailer-enhanced');

    const result = await sendMailEnhanced({
      to,
      subject,
      text,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; border-left: 4px solid #4CAF50;">
        <h2 style="color: #2E7D32;">🌱 AgriTech Disease Alert</h2>
        <p style="color: #333; line-height: 1.6;">${text}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from AgriTech Disease Detection System.<br>
          Time: ${new Date().toLocaleString()}
        </p>
      </div>`
    });

    res.json({
      success: true,
      messageId: result.messageId,
      method: result.method,
      message: `Email sent successfully via ${result.method}`
    });
  } catch (error) {
    console.error('Enhanced email test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'All email methods failed',
      suggestion: 'Check firewall settings or configure HTTP-based email services'
    });
  }
});
module.exports = router;
