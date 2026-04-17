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

const templates = require('../utils/email-templates');

async function sendVerification(user, token) {
  const t = templates.welcome(user, token);
  return send(user.email, t.subject, t.html);
}

async function sendPasswordReset(user, token) {
  const t = templates.passwordReset(user, token);
  return send(user.email, t.subject, t.html);
}

async function sendOrderConfirmation(user, order, items) {
  const t = templates.orderConfirmation(order, items);
  return send(user.email, t.subject, t.html);
}

async function sendShipped(user, order, shipment) {
  const t = templates.shipped(order, shipment);
  return send(user.email, t.subject, t.html);
}

async function sendDelivered(user, order) {
  const t = templates.delivered(order);
  return send(user.email, t.subject, t.html);
}

async function sendReferralSuccess(referrer, friendName) {
  const t = templates.referralSuccess(referrer, friendName);
  return send(referrer.email, t.subject, t.html);
}

async function sendTierUpgrade(user, newTier) {
  const t = templates.tierUpgrade(user, newTier);
  return send(user.email, t.subject, t.html);
}

async function sendPointsEarned(user, amount, reason) {
  const t = templates.pointsEarned(user, amount, reason);
  return send(user.email, t.subject, t.html);
}

module.exports = {
  send,
  sendVerification, sendPasswordReset,
  sendOrderConfirmation, sendShipped, sendDelivered,
  sendReferralSuccess, sendTierUpgrade, sendPointsEarned,
};
