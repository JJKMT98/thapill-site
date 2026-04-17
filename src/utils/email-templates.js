const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────
// Brand voice: full send / aura farming / gen-z / lock-in. Minimal
// corporate language. Short sentences. Electric green highlights.
// Mono UIDs & order numbers. No fluff.
// ─────────────────────────────────────────────────────────────────

function wrap(preheader, content) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#030306;font-family:'Helvetica Neue',Arial,sans-serif;color:#e8e8f0;">
<!-- preheader (shows as preview in inbox) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#030306;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
      <tr><td align="center" style="padding-bottom:28px;">
        <img src="${BASE_URL}/thapill-assets/logo.png" alt="thaPill" width="110" style="height:28px;width:auto;opacity:0.9;">
      </td></tr>
      <tr><td style="background:#0c0c18;border:1px solid #151525;border-radius:14px;padding:36px 28px;position:relative;overflow:hidden;">
        <div style="height:2px;background:linear-gradient(90deg,transparent,#00ff88,transparent);margin:-36px -28px 32px;"></div>
        ${content}
      </td></tr>
      <tr><td align="center" style="padding:24px 0 8px;">
        <div style="font-family:'Courier New',monospace;font-size:11px;color:#55556a;letter-spacing:1.5px;text-transform:uppercase;">
          // lock in. show up. repeat.
        </div>
        <div style="font-size:12px;color:#55556a;margin-top:10px;">
          <a href="mailto:hello@thapill.com" style="color:#00ff88;text-decoration:none;">hello@thapill.com</a>
          &nbsp;·&nbsp; &copy; ${new Date().getFullYear()} thaPill
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(text, href) {
  return `<a href="${href}" style="display:inline-block;padding:14px 32px;background:#00ff88;color:#030306;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;margin:10px 0;letter-spacing:0.5px;">${text}</a>`;
}

function tag(text) {
  return `<span style="display:inline-block;padding:4px 10px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);border-radius:20px;font-family:'Courier New',monospace;font-size:11px;color:#00ff88;letter-spacing:1px;text-transform:uppercase;">${text}</span>`;
}

const templates = {
  welcome(user, verifyToken) {
    return {
      subject: `locked in, ${user.first_name}.`,
      html: wrap(
        `you're in. verify your email to unlock the full stack of perks.`,
        `
        ${tag('// new member')}
        <h1 style="font-size:28px;font-weight:700;color:#e8e8f0;margin:16px 0 6px;line-height:1.15;">locked in, ${user.first_name}.</h1>
        <p style="color:#55556a;font-size:13px;font-family:'Courier New',monospace;letter-spacing:0.5px;margin:0 0 22px;">UID <strong style="color:#00ff88;">${user.uid}</strong> · referral code <strong style="color:#00ff88;">${user.referral_code}</strong></p>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 16px;">
          you just joined the most committed daily nootropic club on the internet. one bottle, six ingredients, zero BS — and now it's yours.
        </p>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 24px;">
          we loaded <strong style="color:#7733ff;">+100 pts</strong> into your account as a welcome. lock in your email and you're ready to show up.
        </p>
        <div style="text-align:center;margin:24px 0;">${btn('Verify email →', `${BASE_URL}/api/auth/verify/${verifyToken}`)}</div>
        <p style="color:#55556a;font-size:12px;margin-top:28px;">didn't sign up? ignore this email — no harm done.</p>
      `),
    };
  },

  orderConfirmation(order, items) {
    const itemRows = items.map((i) => `
      <tr>
        <td style="padding:12px 0;color:#e8e8f0;border-bottom:1px solid #151525;font-size:14px;">${i.name}</td>
        <td style="padding:12px 0;color:#55556a;text-align:center;border-bottom:1px solid #151525;font-family:'Courier New',monospace;font-size:12px;">×${i.quantity}</td>
        <td style="padding:12px 0;color:#e8e8f0;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #151525;font-size:14px;">£${(i.total_pence / 100).toFixed(2)}</td>
      </tr>
    `).join('');
    return {
      subject: `your aura's locked — order ${order.order_number}`,
      html: wrap(
        `order confirmed. we're prepping your stack.`,
        `
        ${tag('// order confirmed')}
        <h1 style="font-size:28px;font-weight:700;color:#00ff88;margin:16px 0 6px;line-height:1.15;">that's a lock in.</h1>
        <p style="color:#55556a;font-size:13px;font-family:'Courier New',monospace;letter-spacing:0.5px;margin:0 0 24px;">order <strong style="color:#e8e8f0;">${order.order_number}</strong></p>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 20px;">
          we got it. your stack is getting prepped. we'll hit your inbox again the second it ships.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 10px;">${itemRows}</table>
        <div style="display:flex;justify-content:space-between;padding:18px 0 4px;font-size:18px;font-weight:700;border-top:1px solid #151525;margin-top:8px;">
          <span style="color:#e8e8f0;">Total</span>
          <span style="color:#00ff88;font-family:'Courier New',monospace;">£${(order.total_pence / 100).toFixed(2)}</span>
        </div>
        ${order.points_earned > 0 ? `
          <div style="margin-top:24px;padding:14px 18px;background:rgba(119,51,255,0.1);border:1px solid rgba(119,51,255,0.25);border-radius:10px;">
            <span style="font-family:'Courier New',monospace;font-size:13px;color:#bb88ff;">+${order.points_earned} pts earned</span>
          </div>` : ''}
        <div style="text-align:center;margin:28px 0 8px;">${btn('Track this order →', `${BASE_URL}/tracking/${order.order_number}`)}</div>
        <p style="color:#55556a;font-size:12px;margin-top:20px;line-height:1.5;">
          one capsule a day. that's the whole routine. questions? reply to this email — a real human answers.
        </p>
      `),
    };
  },

  shipped(order, shipment) {
    return {
      subject: `on the move — ${order.order_number}`,
      html: wrap(
        `your thaPill just left the warehouse.`,
        `
        ${tag('// shipped')}
        <h1 style="font-size:28px;font-weight:700;color:#00ff88;margin:16px 0 6px;line-height:1.15;">it's on the move.</h1>
        <p style="color:#55556a;font-size:13px;font-family:'Courier New',monospace;letter-spacing:0.5px;margin:0 0 24px;">order <strong style="color:#e8e8f0;">${order.order_number}</strong></p>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 18px;">
          your aura just left the warehouse. inbound to your door.
        </p>
        ${shipment.tracking_number ? `
          <div style="background:#030306;border:1px solid #151525;border-radius:10px;padding:16px 18px;margin:14px 0;">
            <div style="font-size:11px;color:#55556a;text-transform:uppercase;letter-spacing:1px;font-family:'Courier New',monospace;margin-bottom:6px;">tracking</div>
            <div style="font-family:'Courier New',monospace;color:#00ff88;font-size:15px;font-weight:600;">${shipment.tracking_number}</div>
            ${shipment.carrier ? `<div style="font-size:12px;color:#55556a;margin-top:4px;">${shipment.carrier.replace(/-/g, ' ')}</div>` : ''}
          </div>` : ''}
        ${shipment.estimated_delivery ? `<p style="color:#55556a;font-size:13px;margin:0 0 16px;">ETA: <strong style="color:#e8e8f0;">${shipment.estimated_delivery}</strong></p>` : ''}
        <div style="text-align:center;margin:24px 0;">${btn('Live tracker →', `${BASE_URL}/tracking/${order.order_number}`)}</div>
      `),
    };
  },

  delivered(order) {
    return {
      subject: `it's here. lock in.`,
      html: wrap(
        `your thaPill just landed. time to show up.`,
        `
        ${tag('// delivered')}
        <h1 style="font-size:28px;font-weight:700;color:#00ff88;margin:16px 0 6px;line-height:1.15;">it's here.<br>lock in.</h1>
        <p style="color:#55556a;font-size:13px;font-family:'Courier New',monospace;letter-spacing:0.5px;margin:0 0 24px;">order <strong style="color:#e8e8f0;">${order.order_number}</strong></p>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 18px;">
          your stack just hit your doorstep. one capsule a day, every morning — that's the whole routine. start tomorrow.
        </p>
        <p style="font-size:14px;line-height:1.55;color:#55556a;margin:0 0 24px;">
          drop a review and we'll load <strong style="color:#7733ff;">+50 pts</strong> into your account for the assist.
        </p>
        <div style="text-align:center;margin:24px 0;">${btn('Drop a review →', `${BASE_URL}/dashboard`)}</div>
      `),
    };
  },

  pointsEarned(user, amount, reason) {
    return {
      subject: `+${amount} pts — ${reason}`,
      html: wrap(
        `you earned ${amount} points.`,
        `
        ${tag('// points earned')}
        <h1 style="font-size:32px;font-weight:700;color:#7733ff;margin:16px 0 6px;line-height:1.15;">+${amount} pts</h1>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 18px;">${reason}</p>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 24px;">
          balance: <strong style="color:#7733ff;font-family:'Courier New',monospace;">${user.points_balance} pts</strong> · every 100 pts = £1 off.
        </p>
        <div style="text-align:center;margin:20px 0;">${btn('View rewards →', `${BASE_URL}/rewards`)}</div>
      `),
    };
  },

  referralSuccess(referrer, friendName) {
    return {
      subject: `your aura is contagious — +500 pts`,
      html: wrap(
        `${friendName} just locked in via your link. +500 pts.`,
        `
        ${tag('// referral rewarded')}
        <h1 style="font-size:28px;font-weight:700;color:#00ff88;margin:16px 0 6px;line-height:1.15;">your aura is contagious.</h1>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 18px;">
          <strong style="color:#00ff88;">${friendName}</strong> just locked in using your code. we loaded <strong style="color:#7733ff;">+500 pts</strong> into your account — and a bonus <strong>+200 pts</strong> into theirs. everyone wins.
        </p>
        <p style="font-size:14px;line-height:1.55;color:#55556a;margin:0 0 22px;">
          keep spreading it. every lock-in earns you another <strong style="color:#7733ff;">500 pts</strong>.
        </p>
        <div style="text-align:center;margin:20px 0;">${btn('See your referrals →', `${BASE_URL}/referrals`)}</div>
      `),
    };
  },

  passwordReset(user, token) {
    return {
      subject: `reset your thaPill password`,
      html: wrap(
        `we got you. reset link below — expires in 1 hour.`,
        `
        ${tag('// password reset')}
        <h1 style="font-size:26px;font-weight:700;color:#e8e8f0;margin:16px 0 6px;line-height:1.15;">we got you.</h1>
        <p style="font-size:15px;line-height:1.55;color:#e8e8f0;margin:0 0 20px;">
          tap the button, set a new password, get back in. link expires in <strong style="color:#ff44aa;">1 hour</strong>.
        </p>
        <div style="text-align:center;margin:20px 0;">${btn('Reset password →', `${BASE_URL}/reset-password?token=${token}`)}</div>
        <p style="color:#55556a;font-size:12px;margin-top:20px;">didn't request this? ignore — your current password still works.</p>
      `),
    };
  },

  tierUpgrade(user, newTier) {
    const tierCopy = {
      'locked-in': {
        color: '#00ff88',
        label: 'LOCKED IN',
        lines: [
          'you hit the second tier. 1.5× earn rate from here on.',
          'free UK shipping on every order. forever.',
        ],
      },
      'elite': {
        color: '#7733ff',
        label: 'ELITE',
        lines: [
          '2× earn rate on everything. free shipping worldwide.',
          'priority support. early access to drops before anyone else.',
          'you\'re in the top tier of the top tier.',
        ],
      },
    };
    const t = tierCopy[newTier] || tierCopy['locked-in'];

    return {
      subject: `you just unlocked ${t.label}.`,
      html: wrap(
        `you hit the ${t.label} tier.`,
        `
        ${tag('// tier unlocked')}
        <h1 style="font-size:32px;font-weight:700;color:${t.color};margin:16px 0 6px;line-height:1.1;">${t.label}.</h1>
        <p style="font-size:16px;line-height:1.55;color:#e8e8f0;margin:0 0 24px;">
          ${user.first_name}, you just levelled up.
        </p>
        <div style="background:#030306;border:1px solid #151525;border-radius:10px;padding:20px;margin:14px 0 24px;">
          ${t.lines.map((l) => `<div style="color:#e8e8f0;font-size:14px;line-height:1.6;padding:4px 0;">→ ${l}</div>`).join('')}
        </div>
        <div style="text-align:center;margin:20px 0;">${btn('View your rewards →', `${BASE_URL}/rewards`)}</div>
      `),
    };
  },
};

module.exports = templates;
