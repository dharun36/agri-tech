#!/usr/bin/env node

const { sendMail, testConnection } = require('./mailer-enhanced');
const dotenv = require('dotenv');
dotenv.config();

async function runEmailTest() {
  console.log('=== AgriTech Email Test ===\n');

  // 1. Check environment variables
  console.log('Environment variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('SMTP_SECURE:', process.env.SMTP_SECURE || 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '***SET***' : 'NOT SET');
  console.log('MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '***SET***' : 'NOT SET');
  console.log('MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || 'NOT SET');
  console.log('');

  // 2. Test connection
  console.log('Testing mailer connection...');
  try {
    const connectionResult = await testConnection();
    console.log('Connection test result:', connectionResult);
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
  console.log('');

  // 3. Try sending a test email (if we have a test email address)
  const testEmail = process.env.TEST_EMAIL || process.env.SMTP_USER;
  if (testEmail) {
    console.log(`Attempting to send test email to: ${testEmail}`);
    try {
      const result = await sendMail({
        to: testEmail,
        subject: '🧪 AgriTech Email Test',
        text: 'This is a test email from AgriTech disease reporting system.\n\nIf you receive this, email notifications are working correctly!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2E7D32;">🧪 AgriTech Email Test</h2>
            <p>This is a test email from the AgriTech disease reporting system.</p>
            <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; padding: 16px; margin: 16px 0; border-radius: 8px;">
              <p><strong>✅ Email notifications are working correctly!</strong></p>
              <p>Test completed at: ${new Date().toLocaleString()}</p>
            </div>
            <p>This confirms that disease alert emails will be delivered successfully.</p>
          </div>
        `
      });
      console.log('✅ Test email sent successfully!');
      console.log('Result:', {
        messageId: result.messageId,
        method: result.method
      });
    } catch (error) {
      console.error('❌ Test email failed:', error.message);
      console.error('Full error:', error);
    }
  } else {
    console.log('⚠️ No test email address found. Set TEST_EMAIL environment variable to test email sending.');
  }

  console.log('\n=== Test Complete ===');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
AgriTech Email Test Tool

Usage: node test-mail.js [options]

Options:
  --help, -h     Show this help message
  
Environment Variables:
  Required for SMTP:
    SMTP_HOST      SMTP server hostname (e.g., smtp.gmail.com)
    SMTP_PORT      SMTP port (465 for SSL, 587 for TLS)
    SMTP_USER      SMTP username/email
    SMTP_PASS      SMTP password (use app password for Gmail)
    SMTP_SECURE    Set to "true" for port 465 (SSL)
    
  Optional/Fallback:
    EMAIL_FROM         From address (defaults to SMTP_USER)
    SENDGRID_API_KEY   SendGrid API key (HTTP fallback)
    MAILGUN_API_KEY    Mailgun API key (HTTP fallback)
    MAILGUN_DOMAIN     Mailgun domain (required with MAILGUN_API_KEY)
    TEST_EMAIL         Email address for test (defaults to SMTP_USER)

Examples:
  # Test with current environment
  node test-mail.js
  
  # Set test email and run
  TEST_EMAIL=your.email@example.com node test-mail.js
  `);
  process.exit(0);
}

runEmailTest().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});