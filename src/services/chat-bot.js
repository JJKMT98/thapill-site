const AUTO_RESPONSES = [
  {
    keywords: ['ingredient', 'what\'s in', 'formula', 'contain', 'inside'],
    response: 'thaPill contains 6 fully-dosed ingredients: 100mg Natural Caffeine, 200mg L-Theanine, 500mg Lion\'s Mane, 300mg Bacopa Monnieri, 300mg Alpha-GPC, and 200mg Rhodiola Rosea. No proprietary blends, no fillers.',
  },
  {
    keywords: ['track', 'tracking', 'where is', 'delivery', 'shipped'],
    response: 'You can track your order at thapill.com/tracking — just enter your order number (e.g. TP-20260416-001). You\'ll also get email updates at each stage.',
  },
  {
    keywords: ['return', 'refund', 'money back'],
    response: 'We offer a 30-day satisfaction guarantee. If you\'re not happy, email hello@thapill.com and we\'ll sort it out. No hassle.',
  },
  {
    keywords: ['point', 'reward', 'earn'],
    response: 'You earn 10 points per £1 spent, plus bonuses: +100 for signing up, +200 on your first order, +500 per referral. 100 points = £1 off. Check your balance at thapill.com/rewards.',
  },
  {
    keywords: ['cancel', 'unsubscribe', 'stop'],
    response: 'You can cancel your subscription anytime from your dashboard. No lock-in, no penalties. If you need help, reply here and a team member will assist.',
  },
  {
    keywords: ['shipping', 'how long', 'when will'],
    response: 'We ship free across the UK via Royal Mail. Orders placed before 2pm ship same day. Standard delivery is 2-3 working days.',
  },
  {
    keywords: ['dosage', 'how many', 'how to take'],
    response: 'Take 1 capsule daily with water, ideally in the morning. Each bottle contains 30 capsules — a full month\'s supply.',
  },
];

function getAutoResponse(message) {
  const lower = message.toLowerCase();
  for (const entry of AUTO_RESPONSES) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.response;
    }
  }
  return null;
}

const FALLBACK = 'Thanks for reaching out! A member of our team will be with you shortly. In the meantime, feel free to check our FAQ or browse the site.';

module.exports = { getAutoResponse, FALLBACK };
