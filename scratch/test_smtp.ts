import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSMTP() {
  console.log('=== SMTP CONFIGURATION TEST ===');
  
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secureStr = process.env.SMTP_SECURE;
  const fromName = process.env.SMTP_FROM_NAME || 'Innonsh Support';
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;

  console.log('Host:', host);
  console.log('Port:', portStr);
  console.log('User:', user);
  console.log('Secure:', secureStr);
  console.log('From Email:', fromEmail);

  if (!host || !portStr || !user || !pass) {
    console.error('❌ ERROR: Missing SMTP configuration in .env!');
    return;
  }

  const port = parseInt(portStr, 10);
  const isSecure = secureStr === 'true' || port === 465;

  console.log('\nInitializing transporter...');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    // Optional: add timeout to avoid hanging indefinitely if host is blocked
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  try {
    console.log('Testing SMTP connection handshake (verify)...');
    await transporter.verify();
    console.log('✅ SMTP Connection Handshake successful! Authentication passed.');

    console.log('\nSending test email to verify mail relay...');
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: user, // send to self
      subject: 'Innonsh SMTP Verification Test',
      text: 'Hello! This is a test email to verify that Innonsh Infra ERP SMTP configuration is working correctly.',
      html: '<h2>Innonsh SMTP Verification Test</h2><p>Hello! This is a test email to verify that Innonsh Infra ERP SMTP configuration is working correctly.</p>'
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error: any) {
    console.error('❌ SMTP TEST FAILED:');
    console.error(error);
  }
}

testSMTP();
