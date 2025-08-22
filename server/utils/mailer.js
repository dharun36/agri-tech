const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true', // true for 465 (SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Enhanced connection settings for Gmail SSL
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds  
  socketTimeout: 60000, // 60 seconds
  // Remove custom TLS settings for SSL
  debug: false, // Set to true for debugging
  logger: false
});

async function sendMail({ to, subject, text, html, attachments }) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    attachments,
  });
  return info;
}

// Test SMTP connection
async function testConnection() {
  try {
    await transporter.verify();
    console.log('SMTP connection successful');
    return { success: true, message: 'SMTP connection verified' };
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendMail, testConnection };