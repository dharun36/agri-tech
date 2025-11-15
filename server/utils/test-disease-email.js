#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('../models/User');
const DiseaseAlert = require('../models/disease');
const { sendMail } = require('../utils/mailer-enhanced');
const dotenv = require('dotenv');
dotenv.config();

async function testDiseaseReporting() {
  console.log('=== AgriTech Disease Report Email Test ===\n');

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agritech');
    console.log('✅ Connected to MongoDB\n');

    // 1. Check if we have any users with email addresses
    const usersWithEmail = await User.find({
      email: { $exists: true, $ne: '' }
    }).select('name email location').limit(5);

    console.log(`Found ${usersWithEmail.length} users with email addresses:`);
    usersWithEmail.forEach(user => {
      console.log(`- ${user.name || 'Unnamed'} (${user.email}) - Location: ${user.location ? 'Set' : 'Not set'}`);
    });

    if (usersWithEmail.length === 0) {
      console.log('⚠️ No users with email addresses found. Disease reports will not send emails.');
      console.log('To test, create a user with an email address in your database.\n');
      return;
    }

    // 2. Simulate a disease report
    const testLocation = {
      type: 'Point',
      coordinates: [80.2707, 13.0827] // Chennai coordinates as example
    };

    console.log('\nSimulating disease report...');
    console.log('Test location:', testLocation.coordinates);
    console.log('Searching for nearby users (within 10km)...');

    // Find users near the test location
    const usersNearby = await User.find({
      location: {
        $near: {
          $geometry: testLocation,
          $maxDistance: 10000 // 10km radius
        }
      }
    });

    console.log(`Found ${usersNearby.length} users nearby who should receive emails.`);

    if (usersNearby.length === 0) {
      console.log('⚠️ No users found near the test location. Trying with first user instead...');

      // Use the first user for testing
      if (usersWithEmail.length > 0) {
        const testUser = usersWithEmail[0];
        console.log(`\nSending test disease alert email to: ${testUser.email}`);

        try {
          const result = await sendMail({
            to: testUser.email,
            subject: 'Test Disease Alert: Tomato Blight detected in your area',
            text: `Dear ${testUser.name || 'Farmer'},\n\nA new disease has been detected in your area:\n\nDisease: Tomato Late Blight\nDescription: Fungal infection affecting tomato leaves and fruits\nLocation: ${testLocation.coordinates.join(', ')}\n\nThis is a TEST EMAIL from AgriTech development.\n\nBest regards,\nAgriTech Team`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">🚨 Disease Alert (TEST)</h2>
                <p>Dear ${testUser.name || 'Farmer'},</p>
                <p>A new disease has been detected in your area:</p>
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
                  <h3 style="margin: 0; color: #dc2626;">Tomato Late Blight</h3>
                  <p style="margin: 8px 0 0 0;">Fungal infection affecting tomato leaves and fruits</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;"><strong>Location:</strong> ${testLocation.coordinates.join(', ')}</p>
                </div>
                <p><strong style="color: #ff6600;">⚠️ This is a TEST EMAIL from AgriTech development.</strong></p>
                <p>Please check your AgriTech app for more details and recommended actions.</p>
                <p style="margin-top: 32px;">Best regards,<br><strong>AgriTech Team</strong></p>
              </div>
            `
          });

          console.log('✅ Test disease alert email sent successfully!');
          console.log('Result:', {
            messageId: result.messageId,
            method: result.method
          });

        } catch (error) {
          console.error('❌ Failed to send disease alert email:', error.message);
          console.error('Full error:', error);
        }
      }
    } else {
      console.log('\nUsers nearby who would receive emails:');
      for (const user of usersNearby) {
        if (user.email) {
          console.log(`- ${user.name || 'Unnamed'} (${user.email})`);
        }
      }
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }

  console.log('\n=== Test Complete ===');
  console.log('\nNext steps to fix email issues:');
  console.log('1. Copy server/.env.example to server/.env');
  console.log('2. Fill in your email credentials (Gmail, SendGrid, or Mailgun)');
  console.log('3. Restart your server');
  console.log('4. Run this test again to verify emails work');
}

testDiseaseReporting().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});