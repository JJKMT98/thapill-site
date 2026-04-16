const nodemailer = require('nodemailer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    transporter = { sendMail: (opts) => console.log('[email-stub]', opts.to, opts.subject) };
  }
  return transporter;
}

async function send(to, subject, html) {
  const from = process.env.SMTP_FROM || 'thaPill <hello@thapill.com>';
  return getTransporter().sendMail({ from, to, subject, html });
}

async function sendVerification(user, token) {
  const link = `${BASE_URL}/api/auth/verify/${token}`;
  return send(user.email, 'Verify your thaPill account', `
    <div style="background:#030306;color:#e8e8f0;padding:40px;font-family:'Space Grotesk',Arial,sans-serif;">
      <h2 style="color:#00ff88;">Welcome to thaPill, ${user.first_name}.</h2>
      <p>Your UID: <strong style="font-family:'JetBrains Mono',monospace;color:#00ff88;">${user.uid}</strong></p>
      <p>Verify your email to unlock the full experience:</p>
      <a href="${link}" style="display:inline-block;padding:14px 32px;background:#00ff88;color:#030306;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">Verify Email</a>
      <p style="color:#55556a;font-size:13px;margin-top:24px;">If you didn't sign up, ignore this email.</p>
    </div>
  `);
}

async function sendPasswordReset(user, token) {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  return send(user.email, 'Reset your thaPill password', `
    <div style="background:#030306;color:#e8e8f0;padding:40px;font-family:'Space Grotesk',Arial,sans-serif;">
      <h2 style="color:#00ff88;">Password reset</h2>
      <p>Click below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="display:inline-block;padding:14px 32px;background:#00ff88;color:#030306;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">Reset Password</a>
      <p style="color:#55556a;font-size:13px;margin-top:24px;">If you didn't request this, ignore this email.</p>
    </div>
  `);
}

module.exports = { send, sendVerification, sendPasswordReset };
