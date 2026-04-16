const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function wrap(content) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#030306;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <img src="${BASE_URL}/thapill-assets/logo.png" alt="thaPill" style="height:28px;">
  </div>
  <div style="background:#0c0c18;border:1px solid #151525;border-radius:14px;padding:36px 28px;">
    ${content}
  </div>
  <div style="text-align:center;margin-top:24px;font-size:12px;color:#55556a;">
    <p>&copy; ${new Date().getFullYear()} thaPill. All rights reserved.</p>
    <p>hello@thapill.com</p>
  </div>
</div></body></html>`;
}

function btn(text, href) {
  return `<a href="${href}" style="display:inline-block;padding:14px 32px;background:#00ff88;color:#030306;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;margin:16px 0;">${text}</a>`;
}

const templates = {
  welcome(user, verifyToken) {
    return {
      subject: 'Welcome to thaPill',
      html: wrap(`
        <h2 style="color:#00ff88;margin:0 0 8px;font-size:22px;">Welcome, ${user.first_name}.</h2>
        <p style="color:#e8e8f0;font-size:15px;line-height:1.5;">Your account is ready. Your unique ID is <strong style="font-family:monospace;color:#00ff88;">${user.uid}</strong>.</p>
        <p style="color:#e8e8f0;font-size:15px;">You've earned <strong style="color:#7733ff;">100 bonus points</strong> just for signing up.</p>
        <div style="text-align:center;margin:24px 0;">${btn('Verify Email', `${BASE_URL}/api/auth/verify/${verifyToken}`)}</div>
        <p style="color:#55556a;font-size:12px;">If you didn't create this account, you can ignore this email.</p>
      `),
    };
  },

  orderConfirmation(order, items) {
    const itemRows = items.map(i =>
      `<tr><td style="padding:8px 0;color:#e8e8f0;border-bottom:1px solid #151525;">${i.name}</td><td style="padding:8px 0;color:#55556a;text-align:center;border-bottom:1px solid #151525;">×${i.quantity}</td><td style="padding:8px 0;color:#e8e8f0;text-align:right;font-family:monospace;border-bottom:1px solid #151525;">£${(i.total_pence / 100).toFixed(2)}</td></tr>`
    ).join('');
    return {
      subject: `Order Confirmed — ${order.order_number}`,
      html: wrap(`
        <h2 style="color:#00ff88;margin:0 0 8px;font-size:22px;">Order Confirmed</h2>
        <p style="color:#e8e8f0;font-size:15px;">Order <strong style="font-family:monospace;color:#00ff88;">${order.order_number}</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">${itemRows}</table>
        <div style="text-align:right;font-size:18px;font-weight:700;color:#00ff88;margin:16px 0;">Total: £${(order.total_pence / 100).toFixed(2)}</div>
        ${order.points_earned > 0 ? `<p style="color:#7733ff;font-size:14px;">You earned <strong>${order.points_earned} points</strong> with this order.</p>` : ''}
        <div style="text-align:center;">${btn('Track Your Order', `${BASE_URL}/tracking/${order.order_number}`)}</div>
      `),
    };
  },

  shipped(order, shipment) {
    return {
      subject: `Your thaPill has shipped — ${order.order_number}`,
      html: wrap(`
        <h2 style="color:#00ff88;margin:0 0 8px;font-size:22px;">Your order has shipped!</h2>
        <p style="color:#e8e8f0;font-size:15px;">Order <strong style="font-family:monospace;">${order.order_number}</strong> is on its way.</p>
        ${shipment.tracking_number ? `<p style="color:#e8e8f0;font-size:14px;">Tracking: <strong style="font-family:monospace;">${shipment.tracking_number}</strong></p>` : ''}
        ${shipment.carrier ? `<p style="color:#55556a;font-size:14px;">Carrier: ${shipment.carrier.replace('-', ' ')}</p>` : ''}
        ${shipment.estimated_delivery ? `<p style="color:#55556a;font-size:14px;">Estimated delivery: ${shipment.estimated_delivery}</p>` : ''}
        <div style="text-align:center;margin:24px 0;">${btn('Track Order', `${BASE_URL}/tracking/${order.order_number}`)}</div>
      `),
    };
  },

  delivered(order) {
    return {
      subject: `Your thaPill has arrived — ${order.order_number}`,
      html: wrap(`
        <h2 style="color:#00ff88;margin:0 0 8px;font-size:22px;">Your thaPill has arrived.</h2>
        <p style="color:#e8e8f0;font-size:15px;">Order <strong style="font-family:monospace;">${order.order_number}</strong> has been delivered.</p>
        <p style="color:#e8e8f0;font-size:15px;">One capsule a day. Lock in.</p>
        <div style="text-align:center;margin:24px 0;">${btn('Leave a Review (+50 pts)', `${BASE_URL}/dashboard`)}</div>
      `),
    };
  },

  pointsEarned(user, amount, reason) {
    return {
      subject: `You earned ${amount} points`,
      html: wrap(`
        <h2 style="color:#7733ff;margin:0 0 8px;font-size:22px;">+${amount} points</h2>
        <p style="color:#e8e8f0;font-size:15px;">${reason}</p>
        <p style="color:#e8e8f0;font-size:15px;">Your balance: <strong style="color:#7733ff;">${user.points_balance} pts</strong></p>
        <div style="text-align:center;margin:24px 0;">${btn('View Rewards', `${BASE_URL}/rewards`)}</div>
      `),
    };
  },

  referralSuccess(referrer, friendName) {
    return {
      subject: 'Your friend just made a purchase!',
      html: wrap(`
        <h2 style="color:#00ff88;margin:0 0 8px;font-size:22px;">Referral reward!</h2>
        <p style="color:#e8e8f0;font-size:15px;"><strong>${friendName}</strong> just made their first purchase using your referral link.</p>
        <p style="color:#7733ff;font-size:18px;font-weight:700;">+500 points earned</p>
        <div style="text-align:center;margin:24px 0;">${btn('View Referrals', `${BASE_URL}/referrals`)}</div>
      `),
    };
  },

  passwordReset(user, token) {
    return {
      subject: 'Reset your thaPill password',
      html: wrap(`
        <h2 style="color:#00ff88;margin:0 0 8px;font-size:22px;">Password Reset</h2>
        <p style="color:#e8e8f0;font-size:15px;">Click below to reset your password. This link expires in 1 hour.</p>
        <div style="text-align:center;margin:24px 0;">${btn('Reset Password', `${BASE_URL}/reset-password?token=${token}`)}</div>
        <p style="color:#55556a;font-size:12px;">If you didn't request this, ignore this email.</p>
      `),
    };
  },

  tierUpgrade(user, newTier) {
    const colors = { 'locked-in': '#00ff88', elite: '#7733ff' };
    const color = colors[newTier] || '#00ff88';
    return {
      subject: `You've reached ${newTier.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}!`,
      html: wrap(`
        <h2 style="color:${color};margin:0 0 8px;font-size:22px;">Tier Upgrade!</h2>
        <p style="color:#e8e8f0;font-size:15px;">Congratulations ${user.first_name}, you've reached <strong style="color:${color};">${newTier.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong>.</p>
        <p style="color:#e8e8f0;font-size:15px;">${newTier === 'elite' ? '2x earn rate, free shipping, early access, and priority support.' : '1.5x earn rate and free shipping on every order.'}</p>
        <div style="text-align:center;margin:24px 0;">${btn('View Rewards', `${BASE_URL}/rewards`)}</div>
      `),
    };
  },
};

module.exports = templates;
