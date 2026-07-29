const nodemailer = require('nodemailer');

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Sends the password-reset email. Throws if SMTP isn't configured or the
 * send fails - callers should catch and decide how to surface that (the
 * forgot-password endpoint deliberately doesn't leak failures to the
 * client, to avoid revealing whether an email address exists).
 */
const sendPasswordResetEmail = async (to, resetUrl) => {
  const client = getTransporter();
  if (!client) throw new Error('Email is not configured - set SMTP_HOST, SMTP_USER, SMTP_PASS');

  await client.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your Memory Art password',
    text: `Someone requested a password reset for this account. If that was you, set a new password here: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Someone requested a password reset for this account.</p>
        <p>If that was you, set a new password here:</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#1C2128;color:#F7F1E4;padding:12px 24px;border-radius:999px;text-decoration:none;">Reset password</a></p>
        <p style="color:#6b6558;font-size:13px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { isConfigured, sendPasswordResetEmail };
