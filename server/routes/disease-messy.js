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
        
        // Simple bilingual email template  
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Disease Alert</title>
          <style>
            .email-container { font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 24px; text-align: center; }
            .content { padding: 24px; }
            .alert-box { background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .disease-info { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #dc2626; }
            .action-list { background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .action-item { margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e0e7ff; }
            .action-item:last-child { border-bottom: none; }
            .urgent-banner { background: #fbbf24; color: #92400e; padding: 12px; border-radius: 6px; margin: 16px 0; font-weight: bold; }
            .cta-button { background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 16px 0; font-weight: bold; }
            .support-box { background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
            .language-toggle { text-align: center; margin: 16px 0; }
            .lang-btn { background: #6b7280; color: white; padding: 8px 16px; margin: 0 4px; border: none; border-radius: 4px; cursor: pointer; }
            .lang-btn.active { background: #dc2626; }
            .tamil-content { display: none; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
            .disclaimer { font-size: 12px; color: #6b7280; margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 6px; }
            @media only screen and (max-width: 600px) {
              .email-container { margin: 0; }
              .content, .header, .footer { padding: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🌾 AgriTech Disease Alert System</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">தாவர நோய் எச்சரிக்கை அமைப்பு</p>
            </div>

            <!-- Language Toggle -->
            <div class="language-toggle">
              <button class="lang-btn active" onclick="showEnglish()">English</button>
              <button class="lang-btn" onclick="showTamil()">தமிழ்</button>
            </div>

            <!-- English Content -->
            <div class="content english-content">
              <div class="urgent-banner">
                🚨 URGENT: ${englishContent.alertTitle}
              </div>

              <h2>Hello ${user.name || 'Farmer'},</h2>
              <p style="font-size: 16px; line-height: 1.6;">${englishContent.mainMessage}</p>

              <div class="disease-info">
                <h3 style="color: #dc2626; margin: 0 0 12px 0;">
                  🦠 ${englishContent.diseaseLabel}: <strong>${disease}</strong>
                </h3>
                <p style="margin: 8px 0;"><strong>${englishContent.descriptionLabel}:</strong> ${description}</p>
                <p style="margin: 8px 0; color: #6b7280;"><strong>${englishContent.locationLabel}:</strong> ${location.coordinates.join(', ')}</p>
              </div>

              <div class="alert-box">
                <h3 style="color: #dc2626;">⚠️ ${englishContent.urgencyTitle}</h3>
                <p>${englishContent.urgencyText}</p>
              </div>

              <div class="action-list">
                <h3 style="color: #059669;">✅ ${englishContent.actionTitle}</h3>
                ${englishContent.actions.map((action, index) => 
                  `<div class="action-item">
                    <strong>${index + 1}.</strong> ${action}
                  </div>`
                ).join('')}
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="#" class="cta-button">📱 ${englishContent.appLinkText}</a>
              </div>

              <div class="support-box">
                <p><strong>📞 ${englishContent.supportText}</strong></p>
                <p style="color: #6b7280; margin: 8px 0;">Email: support@agritech.com | Phone: +91-9876543210</p>
              </div>
            </div>

            <!-- Tamil Content -->
            <div class="content tamil-content">
              <div class="urgent-banner">
                🚨 அவசரம்: ${tamilContent.alertTitle}
              </div>

              <h2>வணக்கம் ${user.name || 'விவசாயி'},</h2>
              <p style="font-size: 16px; line-height: 1.6;">${tamilContent.mainMessage}</p>

              <div class="disease-info">
                <h3 style="color: #dc2626; margin: 0 0 12px 0;">
                  🦠 ${tamilContent.diseaseLabel}: <strong>${disease}</strong>
                </h3>
                <p style="margin: 8px 0;"><strong>${tamilContent.descriptionLabel}:</strong> ${description}</p>
                <p style="margin: 8px 0; color: #6b7280;"><strong>${tamilContent.locationLabel}:</strong> ${location.coordinates.join(', ')}</p>
              </div>

              <div class="alert-box">
                <h3 style="color: #dc2626;">⚠️ ${tamilContent.urgencyTitle}</h3>
                <p>${tamilContent.urgencyText}</p>
              </div>

              <div class="action-list">
                <h3 style="color: #059669;">✅ ${tamilContent.actionTitle}</h3>
                ${tamilContent.actions.map((action, index) => 
                  `<div class="action-item">
                    <strong>${index + 1}.</strong> ${action}
                  </div>`
                ).join('')}
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="#" class="cta-button">📱 ${tamilContent.appLinkText}</a>
              </div>

              <div class="support-box">
                <p><strong>📞 ${tamilContent.supportText}</strong></p>
                <p style="color: #6b7280; margin: 8px 0;">Email: support@agritech.com | Phone: +91-9876543210</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="english-content">
                <p>${englishContent.footer}</p>
                <div class="disclaimer">${englishContent.disclaimer}</div>
              </div>
              <div class="tamil-content">
                <p>${tamilContent.footer}</p>
                <div class="disclaimer">${tamilContent.disclaimer}</div>
              </div>
            </div>
          </div>

          <script>
            function showEnglish() {
              document.querySelectorAll('.english-content').forEach(el => el.style.display = 'block');
              document.querySelectorAll('.tamil-content').forEach(el => el.style.display = 'none');
              document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
              document.querySelector('.lang-btn:first-child').classList.add('active');
            }
            function showTamil() {
              document.querySelectorAll('.english-content').forEach(el => el.style.display = 'none');
              document.querySelectorAll('.tamil-content').forEach(el => el.style.display = 'block');
              document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
              document.querySelector('.lang-btn:last-child').classList.add('active');
            }
          </script>
        </body>
        </html>
        `;

        const textContent = `
=== DISEASE ALERT / நோய் எச்சரிக்கை ===

Dear ${user.name || 'Farmer'} / அன்புள்ள ${user.name || 'விவசாயி'},

🚨 URGENT: A plant disease has been detected in your area!
🚨 அவசரம்: உங்கள் பகுதியில் ஒரு தாவர நோய் கண்டறியப்பட்டுள்ளது!

DISEASE INFORMATION / நோய் தகவல்:
- Disease / நோய்: ${disease}
- Description / விளக்கம்: ${description}
- Location / இடம்: ${location.coordinates.join(', ')}

IMMEDIATE ACTIONS REQUIRED / உடனடி நடவடிக்கைகள் தேவை:

ENGLISH:
1. Inspect your crops immediately for similar symptoms
2. Isolate affected plants if found
3. Consult with agricultural experts
4. Apply appropriate treatment measures
5. Monitor neighboring crops closely

தமிழ்:
1. இதே போன்ற அறிகுறிகளுக்காக உங்கள் பயிர்களை உடனடியாக ஆய்வு செய்யুங்கள்
2. பாதிக்கப்பட்ட தாவரங்களை கண்டால் தனிமைப்படுத்துங்கள்
3. விவசாய நிபுணர்களை அணுகுங்கள்
4. பொருத்தமான சிகிச்சை நடவடிக்கைகளைப் பயன்படுத்துங்கள்
5. அண்டை பயிர்களை நெருக்கமாக கண்காணிக்கவும்

SUPPORT / ஆதரவு:
📞 Phone: +91-9876543210
📧 Email: support@agritech.com

Best regards / வணக்கம்,
AgriTech Team / AgriTech குழு
        `;

        // Simple bilingual email template  
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Disease Alert</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .alert-box { background: #fef2f2; border: 2px solid #fca5a5; border-radius: 6px; padding: 15px; margin: 15px 0; }
            .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
            .action-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin: 15px 0; }
            .button { background: #16a34a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .divider { border-top: 2px solid #e5e5e5; margin: 20px 0; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #dc2626; margin: 0 0 10px 0; }
            h3 { color: #059669; margin: 15px 0 10px 0; }
            .lang-label { background: #6b7280; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin: 10px 0; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Disease Alert / நோய் எச்சரிக்கை</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">AgriTech Smart Agriculture System</p>
            </div>
            
            <div class="content">
              <!-- English Content -->
              <div class="lang-label">🇺🇸 ENGLISH</div>
              
              <h2>Hello ${user.name || 'Farmer'}!</h2>
              
              <div class="alert-box">
                <h3>🦠 Disease Detected: ${disease}</h3>
                <p><strong>Description:</strong> ${description}</p>
                <p><strong>Location:</strong> Near ${location.coordinates.join(', ')}</p>
                <p><strong>⚠️ Important:</strong> This disease can spread to your crops. Take immediate action!</p>
              </div>
              
              <div class="action-box">
                <h3>✅ What You Should Do:</h3>
                <ul>
                  <li><strong>Check your crops</strong> for similar symptoms immediately</li>
                  <li><strong>Isolate infected plants</strong> from healthy ones</li>
                  <li><strong>Contact agricultural experts</strong> for professional advice</li>
                  <li><strong>Apply proper treatment</strong> if needed</li>
                  <li><strong>Monitor nearby crops</strong> regularly</li>
                </ul>
              </div>
              
              <div class="info-box">
                <p><strong>📞 Need Help?</strong></p>
                <p>📧 Email: support@agritech.com</p>
                <p>📱 Phone: +91-9876543210</p>
                <a href="#" class="button">📱 Open AgriTech App</a>
              </div>
              
              <!-- Divider -->
              <div class="divider"></div>
              
              <!-- Tamil Content -->
              <div class="lang-label">🇮🇳 தமிழ்</div>
              
              <h2>வணக்கம் ${user.name || 'விவசாயி'}!</h2>
              
              <div class="alert-box">
                <h3>🦠 நோய் கண்டறியப்பட்டது: ${disease}</h3>
                <p><strong>விளக்கம்:</strong> ${description}</p>
                <p><strong>இடம்:</strong> ${location.coordinates.join(', ')} அருகில்</p>
                <p><strong>⚠️ முக்கியம்:</strong> இந்த நோய் உங்கள் பயிர்களுக்கு பரவலாம். உடனே நடவடிக்கை எடுங்கள்!</p>
              </div>
              
              <div class="action-box">
                <h3>✅ நீங்கள் செய்ய வேண்டியது:</h3>
                <ul>
                  <li><strong>உங்கள் பயிர்களை சரிபார்க்கவும்</strong> - இதே அறிகுறிகள் உள்ளதா என பாருங்கள்</li>
                  <li><strong>நோயுள்ள செடிகளை தனிமைப்படுத்துங்கள்</strong> - ஆரோக்கியமான செடிகளிலிருந்து தனித்து வையுங்கள்</li>
                  <li><strong>விவசாய நிபுணர்களை தொடர்பு கொள்ளுங்கள்</strong> - நிபுணர் ஆலோசனை பெறுங்கள்</li>
                  <li><strong>தேவையான சிகிச்சை அளியுங்கள்</strong> - உரிய மருந்து தெளிக்கவும்</li>
                  <li><strong>அருகிலுள்ள பயிர்களை கண்காணிக்கவும்</strong> - தொடர்ந்து பார்த்துக் கொள்ளுங்கள்</li>
                </ul>
              </div>
              
              <div class="info-box">
                <p><strong>📞 உதவி வேண்டுமா?</strong></p>
                <p>📧 மின்னஞ்சல்: support@agritech.com</p>
                <p>📱 தொலைபேசி: +91-9876543210</p>
                <a href="#" class="button">📱 AgriTech பயன்பாட்டைத் திறக்கவும்</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>AgriTech Team / AgriTech குழு</strong></p>
              <p>Smart Agriculture Solutions / ஸ்மார்ட் விவசாய தீர்வுகள்</p>
              <p style="margin-top: 10px; font-size: 11px;">
                This alert is based on nearby farmer reports. Always consult local experts.<br>
                இந்த எச்சரிக்கை அருகிலுள்ள விவசாயிகளின் அறிக்கையின் அடிப்படையில் உள்ளது.
              </p>
            </div>
          </div>
        </body>
        </html>
        `;

        const textContent = `
=== DISEASE ALERT / நோய் எச்சரிக்கை ===

🇺🇸 ENGLISH:
===============
Dear ${user.name || 'Farmer'},

🚨 URGENT: Disease detected in your area!

Disease: ${disease}
Description: ${description}
Location: Near ${location.coordinates.join(', ')}

WHAT TO DO:
✓ Check your crops for similar symptoms
✓ Isolate infected plants from healthy ones  
✓ Contact agricultural experts for advice
✓ Apply proper treatment if needed
✓ Monitor nearby crops regularly

Need help? 
📧 Email: support@agritech.com
📱 Phone: +91-9876543210

Best regards,
AgriTech Team
Smart Agriculture Solutions

🇮🇳 தமிழ்:
============
அன்புள்ள ${user.name || 'விவசாயி'},

🚨 அவசரம்: உங்கள் பகுதியில் நோய் கண்டறியப்பட்டுள்ளது!

நோய்: ${disease}
விளக்கம்: ${description}
இடம்: ${location.coordinates.join(', ')} அருகில்

என்ன செய்ய வேண்டும்:
✓ உங்கள் பயிர்களில் இதே அறிகுறிகள் உள்ளதா பாருங்கள்
✓ நோயுள்ள செடிகளை ஆரோக்கியமான செடிகளிலிருந்து தனித்து வையுங்கள்
✓ விவசாய நிபுணர்களிடம் ஆலோசனை பெறுங்கள்  
✓ தேவையான சிகிச்சை அளியுங்கள்
✓ அருகிலுள்ள பயிர்களை தொடர்ந்து கண்காணிக்கவும்

உதவி வேண்டுமா?
📧 மின்னஞ்சல்: support@agritech.com
📱 தொலைபேசி: +91-9876543210

நன்றி,
AgriTech குழு
ஸ்மார்ட் விவசாய தீர்வுகள்

---
This alert is based on nearby farmer reports.
இந்த எச்சரிக்கை அருகிலுள்ள விவசாயிகளின் அறிக்கையின் அடிப்படையில்.
        `;

        sendMail({
          to: user.email,
          subject: `🚨 Disease Alert / நோய் எச்சரிக்கை: ${disease}`,
          text: textContent,
          html: htmlTemplate
        }).catch(error => {
          console.error(`❌ Failed to send email to ${user.email}:`, error);
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
