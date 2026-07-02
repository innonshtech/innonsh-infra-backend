import nodemailer from 'nodemailer';
import { env } from '../config/env.config';

// Configure transporter conditionally to prevent crashes if SMTP is unconfigured
const isSmtpConfigured = !!(
  env.SMTP_HOST &&
  env.SMTP_PORT &&
  env.SMTP_USER &&
  env.SMTP_PASS
);

let transporter: nodemailer.Transporter | null = null;

if (isSmtpConfigured) {
  const port = parseInt(env.SMTP_PORT || '465', 10);
  const isSecure = env.SMTP_SECURE === 'true' || port === 465;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  console.log(`[SMTP] Mailer initialized successfully. Host: ${env.SMTP_HOST}`);
} else {
  console.warn('[SMTP] SMTP configurations are missing in environment variables. Falling back to console-logging emails.');
}

/**
 * Sends a password reset email to a user.
 * @param email Recipient email address
 * @param resetToken Secure reset token
 * @param firstName User's first name for personalization
 */
export async function sendResetPasswordEmail(email: string, resetToken: string, firstName: string): Promise<boolean> {
  const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #059669; margin-bottom: 20px;">Innonsh Infra — Password Reset Request</h2>
      <p>Hello ${firstName || 'User'},</p>
      <p>We received a request to reset the password associated with your Innonsh Infra account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Reset Your Password</a>
      </div>
      <p style="color: #4b5563; font-size: 14px;">This password reset link is only valid for <strong>30 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">Innonsh Infra ERP Platform &copy; ${new Date().getFullYear()}</p>
    </div>
  `;

  if (transporter) {
    try {
      const fromName = env.SMTP_FROM_NAME || 'Innonsh Support';
      const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER;
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: 'Reset Your Innonsh Infra Password',
        html: htmlContent,
      });
      console.log(`[SMTP] Password reset email sent successfully to: ${email}`);
      return true;
    } catch (err: any) {
      console.error(`[SMTP] Failed to send email to ${email}:`, err.message);
      // Fail-safe: Log link so development flow does not break
      console.warn(`[SMTP Fallback] Reset link: ${resetLink}`);
      return false;
    }
  } else {
    // Development fallback
    console.log('\n=============================================================');
    console.log('📬 [SMTP DEV FALLBACK] PASSWORD RESET LINK GENERATED');
    console.log(`To: ${email} (${firstName})`);
    console.log(`Link: ${resetLink}`);
    console.log('=============================================================\n');
    return true;
  }
}
