// Shipping gate — on page load, check if the visitor's country is blocked.
// If so, show a full-screen overlay in the site's tone.
(function () {
  if (sessionStorage.getItem('thapill_gate_dismissed')) return;

  fetch('/api/shipping').then(r => r.ok ? r.json() : null).then((rule) => {
    if (!rule || !rule.blocked) return;
    renderGate(rule);
  }).catch(() => {});

  function renderGate(rule) {
    const country = rule.country || 'your zip';
    const msg = rule.message || `thaPill hasn't plugged into ${country} yet — we're working the expansion. Drop your email and you'll be first in line when we do.`;

    const style = document.createElement('style');
    style.textContent = `
      .ship-gate { position: fixed; inset: 0; z-index: 99999; background: rgba(3,3,6,0.92); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: gateFade 0.4s ease; }
      @keyframes gateFade { from { opacity: 0; } to { opacity: 1; } }
      .ship-gate-card { background: var(--card, #0c0c18); border: 1px solid var(--border, #151525); border-radius: 16px; padding: 48px 36px; max-width: 520px; width: 100%; text-align: center; position: relative; overflow: hidden; }
      .ship-gate-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--electric, #00ff88), transparent); }
      .ship-gate-mark { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--neon-pink, #ff44aa); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; }
      .ship-gate-card h1 { font-size: 30px; font-weight: 700; margin-bottom: 14px; line-height: 1.15; }
      .ship-gate-card h1 em { color: var(--electric, #00ff88); font-style: normal; }
      .ship-gate-card p { color: var(--text-dim, #55556a); font-size: 15px; line-height: 1.5; margin-bottom: 28px; }
      .ship-gate-form { display: flex; gap: 8px; margin-bottom: 16px; }
      .ship-gate-form input { flex: 1; padding: 14px 16px; background: var(--surface, #08080f); border: 1px solid var(--border, #151525); border-radius: 10px; color: var(--text, #e8e8f0); font-family: 'Space Grotesk', sans-serif; font-size: 15px; outline: none; }
      .ship-gate-form input:focus { border-color: var(--electric, #00ff88); box-shadow: 0 0 0 3px rgba(0,255,136,0.1); }
      .ship-gate-form button { padding: 14px 24px; background: var(--electric, #00ff88); color: var(--bg, #030306); border: none; border-radius: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
      .ship-gate-form button:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(0,255,136,0.3); }
      .ship-gate-dismiss { background: none; border: none; color: var(--text-dim, #55556a); font-size: 12px; cursor: pointer; font-family: 'Space Grotesk', sans-serif; text-decoration: underline; }
      .ship-gate-dismiss:hover { color: var(--electric, #00ff88); }
      .ship-gate-success { color: var(--electric, #00ff88); font-size: 14px; font-family: 'JetBrains Mono', monospace; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'ship-gate';
    overlay.innerHTML = `
      <div class="ship-gate-card">
        <div class="ship-gate-mark">// ${country} · not shipping yet</div>
        <h1>Your aura's locked in.<br>We just <em>can't ship here yet.</em></h1>
        <p>${escapeHtml(msg)}</p>
        <form class="ship-gate-form" id="shipGateForm">
          <input type="email" name="email" placeholder="you@domain.com" required autocomplete="email">
          <button type="submit">Notify Me</button>
        </form>
        <button class="ship-gate-dismiss" id="shipGateDismiss">I'll peek around anyway →</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('shipGateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.email.value.trim();
      if (!email) return;
      // We'll wire a /api/waitlist endpoint later — for now store locally
      try {
        const list = JSON.parse(localStorage.getItem('thapill_waitlist') || '[]');
        list.push({ email, country, at: new Date().toISOString() });
        localStorage.setItem('thapill_waitlist', JSON.stringify(list));
      } catch {}
      overlay.querySelector('.ship-gate-card').innerHTML = `
        <div class="ship-gate-mark">// locked in</div>
        <h1>You're <em>first in line.</em></h1>
        <p>We'll hit your inbox the second thaPill plugs into ${country}. Stay locked in.</p>
        <button class="ship-gate-dismiss" onclick="document.querySelector('.ship-gate').remove()">Close</button>
      `;
    });

    document.getElementById('shipGateDismiss').addEventListener('click', () => {
      sessionStorage.setItem('thapill_gate_dismissed', '1');
      overlay.remove();
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
})();
