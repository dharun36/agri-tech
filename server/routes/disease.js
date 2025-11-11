const express = require('express');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose');
// node-fetch v3 is ESM only - either use import or downgrade to v2
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
// Use enhanced mailer which provides SMTP + HTTP (SendGrid/Mailgun) fallbacks
const { sendMail, testConnection } = require('../utils/mailer-enhanced');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/disease-images/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const DiseaseAlert = require('../models/disease');



// POST /api/disease/report
// Body: { disease, description, location: { type: 'Point', coordinates: [lng, lat] } }
router.post('/report', async (req, res) => {
  const { disease, description, location, bilingualData } = req.body;
  if (!disease || !location || !Array.isArray(location.coordinates)) {
    return res.status(400).json({ message: 'Disease and location required' });
  }
  try {
    console.log('🔍 Disease report received:', { disease, location: location.coordinates });

    const usersNearby = await User.find({
      location: {
        $near: {
          $geometry: location,
          $maxDistance: 500000  // 500km radius for testing (was 10000)
        }
      }
    });

    console.log(`📍 Found ${usersNearby.length} users within 500km of [${location.coordinates.join(', ')}]`);

    // Create in-app notifications for each user
    let alerts = [];
    const io = req.app.get('io'); // Get socket.io instance

    for (const user of usersNearby) {
      const alertData = {
        user: user._id,
        disease,
        description,
        location
      };

      // Add bilingual data if available
      if (bilingualData && bilingualData.english && bilingualData.tamil) {
        alertData.bilingualData = bilingualData;
      }

      const alert = await DiseaseAlert.create(alertData);
      alerts.push(alert._id);

      // Emit real-time alert to the specific user
      if (io) {
        io.to(`user-${user._id}`).emit('new-disease-alert', {
          alert: alert,
          message: `New disease alert: ${disease} detected in your area`
        });
      }

      // Send email notification (non-blocking)
      if (user.email) {
        console.log(`📧 Sending email to: ${user.email}`);
        sendMail({
          to: user.email,
          subject: `Disease Alert: ${disease} detected in your area`,
          text: `Dear ${user.name || 'Farmer'},\n\nA new disease has been detected in your area:\n\nDisease: ${disease}\nDescription: ${description}\nLocation: ${location.coordinates.join(', ')}\n\nPlease check your AgriTech app for more details.\n\nBest regards,\nAgriTech Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">🚨 Disease Alert</h2>
              <p>Dear ${user.name || 'Farmer'},</p>
              <p>A new disease has been detected in your area:</p>
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
                <h3 style="margin: 0; color: #dc2626;">${disease}</h3>
                <p style="margin: 8px 0 0 0;">${description}</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;"><strong>Location:</strong> ${location.coordinates.join(', ')}</p>
              </div>
              <p>Please check your AgriTech app for more details and recommended actions.</p>
              <p style="margin-top: 32px;">Best regards,<br><strong>AgriTech Team</strong></p>
            </div>
          `
        }).catch(err => {
          console.error(`Failed to send email to ${user.email}:`, err.message);
        });
      }
    }
    res.json({ notified: usersNearby.length, alerts });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/disease/predict - Endpoint to predict plant disease from image
router.post('/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Read the image file
    const imagePath = path.join(__dirname, '..', req.file.path);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Call the Hugging Face model API
    console.log(`Calling Hugging Face API for image: ${req.file.path}`);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: base64Image }),
      }
    );

    // Delete the temporary file after sending to the API
    fs.unlinkSync(imagePath);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Hugging Face API error:', errorData);
      return res.status(response.status).json({ error: 'Disease prediction failed', details: errorData });
    }

    const result = await response.json();
    console.log('HF API response:', JSON.stringify(result).substring(0, 200) + '...');

    // Make sure the response is in expected format
    const formattedResult = Array.isArray(result) ? result : [{
      label: result.label || "Unknown",
      score: result.score || 0
    }];

    return res.json(formattedResult);
  } catch (error) {
    console.error('Disease prediction error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
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

// PATCH /api/disease/alerts/:alertId/read (mark single alert as read)
router.patch('/alerts/:alertId/read', async (req, res) => {
  const { alertId } = req.params;
  if (!alertId) return res.status(400).json({ message: 'alertId required' });
  try {
    const alert = await DiseaseAlert.findByIdAndUpdate(
      alertId,
      { $set: { read: true } },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json({ success: true, alert });
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



// POST /api/disease/send-summary
// Send email summary of recent alerts for a user
router.post('/send-summary', async (req, res) => {
  const { userId, email, period = 7 } = req.body; // period in days

  if (!userId || !email) {
    return res.status(400).json({ message: 'userId and email are required' });
  }

  try {
    // Get recent alerts for the user
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const alerts = await DiseaseAlert.find({
      user: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    if (alerts.length === 0) {
      return res.json({ message: 'No recent alerts to send' });
    }

    // Group alerts by disease
    const summary = {};
    alerts.forEach(alert => {
      if (!summary[alert.disease]) {
        summary[alert.disease] = {
          count: 0,
          latestDate: alert.createdAt,
          description: alert.description
        };
      }
      summary[alert.disease].count++;
      if (alert.createdAt > summary[alert.disease].latestDate) {
        summary[alert.disease].latestDate = alert.createdAt;
      }
    });

    // Create email content
    let emailText = `Disease Alert Summary (Last ${period} days)\n\n`;
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">🌱 Disease Alert Summary</h2>
        <p>Here's your disease alert summary for the last ${period} days:</p>
        <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px;">
    `;

    Object.entries(summary).forEach(([disease, info]) => {
      emailText += `- ${disease}: ${info.count} alert(s), latest: ${new Date(info.latestDate).toLocaleDateString()}\n`;
      emailHtml += `
        <div style="margin-bottom: 16px; padding: 12px; background-color: white; border-radius: 4px; border-left: 4px solid #4CAF50;">
          <h4 style="margin: 0; color: #2E7D32;">${disease}</h4>
          <p style="margin: 4px 0; color: #666;">Count: ${info.count} alert(s)</p>
          <p style="margin: 4px 0; color: #666;">Latest: ${new Date(info.latestDate).toLocaleDateString()}</p>
        </div>
      `;
    });

    emailHtml += `
        </div>
        <p style="margin-top: 20px;">Total alerts: <strong>${alerts.length}</strong></p>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          This summary was generated on ${new Date().toLocaleString()}<br>
          AgriTech Disease Detection System
        </p>
      </div>
    `;

    const result = await sendMail({
      to: email,
      subject: `📊 AgriTech: Disease Alert Summary (${alerts.length} alerts)`,
      text: emailText,
      html: emailHtml
    });

    res.json({
      success: true,
      message: 'Summary email sent successfully',
      alertCount: alerts.length,
      method: result.method
    });

  } catch (error) {
    console.error('Error sending summary email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
