const crypto = require('crypto');

const ALPHA = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

function generateUID() {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHA[bytes[i] % ALPHA.length];
  }
  return `TP-${code}`;
}

function generateReferralCode(firstName) {
  const base = firstName.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (base.length >= 2) return `${base}-PILL`;
  return generateUID();
}

module.exports = { generateUID, generateReferralCode };
