// Shared nav injection — adds consistent nav bar to all pages
(function () {
  if (document.getElementById('nav') || document.querySelector('.dash-nav, .rewards-nav, .ref-nav, .track-nav')) return;

  const nav = document.createElement('nav');
  nav.id = 'sharedNav';
  nav.innerHTML = `
    <a href="/"><img src="/thapill-assets/logo.png" alt="THAPILL" style="height:24px;opacity:0.9;"></a>
    <div style="display:flex;align-items:center;gap:16px;">
      <a href="/dashboard" class="nav-link" id="snDash" style="display:none;">Dashboard</a>
      <a href="/rewards" class="nav-link" id="snRewards" style="display:none;">Rewards</a>
      <button class="cart-trigger" data-cart-trigger aria-label="Cart" style="background:none;border:none;cursor:pointer;position:relative;padding:4px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text,#e8e8f0);"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <span class="cart-badge"></span>
      </button>
      <a href="/login" class="nav-link" id="snAuth">Log In</a>
      <button id="snLogout" style="display:none;background:none;border:1px solid var(--border,#151525);padding:5px 12px;border-radius:6px;color:var(--text-dim,#55556a);cursor:pointer;font-size:12px;font-family:inherit;">Log Out</button>
    </div>
  `;
  Object.assign(nav.style, {
    position: 'fixed', top: '0', width: '100%', zIndex: '1000',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 48px', background: 'rgba(3,3,6,0.92)',
    borderBottom: '1px solid var(--border,#151525)', backdropFilter: 'blur(30px)',
  });
  const links = nav.querySelectorAll('.nav-link');
  links.forEach(a => {
    Object.assign(a.style, { color: 'var(--text-dim,#55556a)', textDecoration: 'none', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', transition: 'color 0.2s' });
    a.addEventListener('mouseenter', () => a.style.color = 'var(--electric,#00ff88)');
    a.addEventListener('mouseleave', () => a.style.color = 'var(--text-dim,#55556a)');
  });

  document.body.prepend(nav);

  fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(data => {
    if (data && data.user) {
      document.getElementById('snAuth').style.display = 'none';
      document.getElementById('snDash').style.display = '';
      document.getElementById('snRewards').style.display = '';
      document.getElementById('snLogout').style.display = '';
    }
  }).catch(() => {});

  document.getElementById('snLogout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });
})();
