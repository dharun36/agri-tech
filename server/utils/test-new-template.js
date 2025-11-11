// Test the new simple bilingual email template
require('dotenv').config();
const { sendMail } = require('./mailer-enhanced');

const testUser = {
  name: 'Test Farmer',
  email: 'rdharun36@gmail.com'
};

const disease = 'Late Blight';
const description = 'Brown spots on leaves with white fuzzy growth underneath';
const location = { coordinates: [77.5946, 12.9716] }; // Bangalore coordinates

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
      
      <h2>Hello ${testUser.name || 'Farmer'}!</h2>
      
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
      
      <h2>வணக்கம் ${testUser.name || 'விவசாயி'}!</h2>
      
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
Dear ${testUser.name || 'Farmer'},

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
அன்புள்ள ${testUser.name || 'விவசாயி'},

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

async function testNewTemplate() {
  console.log('🧪 Testing New Bilingual Email Template');
  console.log('=======================================\n');

  try {
    const result = await sendMail({
      to: testUser.email,
      subject: `🚨 Disease Alert / நோய் எச்சரிக்கை: ${disease} (TEST)`,
      text: textContent,
      html: htmlTemplate
    });

    console.log('✅ New bilingual email template sent successfully!');
    console.log('📧 Email details:', {
      to: testUser.email,
      subject: `Disease Alert: ${disease}`,
      method: result.method || 'SMTP'
    });
    console.log('\n🎨 Template features:');
    console.log('- ✅ Both English and Tamil content in single email');
    console.log('- ✅ Clear language section labels');
    console.log('- ✅ Simple, clean design (no complex JavaScript)');
    console.log('- ✅ Works in all email clients');
    console.log('- ✅ Responsive design for mobile devices');
    console.log('- ✅ Clear action items in both languages');
    console.log('- ✅ Emergency styling with red alerts');
    console.log('- ✅ Support contact information');

  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
  }
}

testNewTemplate();