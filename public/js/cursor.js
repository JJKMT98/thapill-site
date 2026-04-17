// Standalone pill cursor — injects its own DOM and runs anywhere.
// Skips if it detects the landing page (app.js handles cursor there),
// touch devices, reduced-motion users, or small screens.
(function () {
  if (document.getElementById('pillCursor')) return; // already present (e.g. landing page)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.innerWidth < 720) return;

  const NEON = '#00ff88';
  const NEON_BRIGHT = '#66ffbb';

  const style = document.createElement('style');
  style.textContent = `
    body { cursor: none; }
    .pill-cursor-std { position: fixed; z-index: 10001; pointer-events: none; width: 28px; height: 14px; transition: transform 0.08s ease; top: 0; left: 0; }
    .pill-cursor-std .shape { width: 100%; height: 100%; border-radius: 10px; background: linear-gradient(90deg, ${NEON} 50%, ${NEON_BRIGHT} 50%); box-shadow: 0 0 12px rgba(0,255,136,0.6), 0 0 30px rgba(0,255,136,0.2); transition: transform 0.2s, box-shadow 0.2s; }
    .pill-cursor-std.clicking .shape { transform: scale(0.7); box-shadow: 0 0 25px rgba(0,255,136,0.9), 0 0 60px rgba(0,255,136,0.4); }
    .pill-cursor-std.hovering .shape { transform: scale(1.4); box-shadow: 0 0 20px rgba(0,255,136,0.8), 0 0 50px rgba(0,255,136,0.3); }
    .pill-trail { position: fixed; z-index: 10000; pointer-events: none; border-radius: 50%; background: ${NEON}; opacity: 0; top: 0; left: 0; }
    .pill-aura { position: fixed; z-index: 9998; pointer-events: none; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%); transform: translate(-50%,-50%); top: 0; left: 0; }
  `;
  document.head.appendChild(style);

  const cursor = document.createElement('div');
  cursor.className = 'pill-cursor-std';
  cursor.innerHTML = '<div class="shape"></div>';
  document.body.appendChild(cursor);

  const aura = document.createElement('div');
  aura.className = 'pill-aura';
  document.body.appendChild(aura);

  const trail = [];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'pill-trail';
    const size = 4 - (i / 12) * 3;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    document.body.appendChild(p);
    trail.push({ el: p, x: 0, y: 0 });
  }

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my, ax = mx, ay = my;

  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup', () => cursor.classList.remove('clicking'));

  function tick() {
    cx += (mx - cx) * 0.35;
    cy += (my - cy) * 0.35;
    cursor.style.transform = `translate(${cx - 14}px,${cy - 7}px) rotate(${(mx - cx) * 0.8}deg)`;

    ax += (mx - ax) * 0.06;
    ay += (my - ay) * 0.06;
    aura.style.transform = `translate(${ax}px, ${ay}px) translate(-50%, -50%)`;

    let px = cx, py = cy;
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      t.x += (px - t.x) * (0.35 - i * 0.02);
      t.y += (py - t.y) * (0.35 - i * 0.02);
      t.el.style.transform = `translate(${t.x}px,${t.y}px)`;
      t.el.style.opacity = (1 - i / trail.length) * 0.5;
      px = t.x; py = t.y;
    }
    requestAnimationFrame(tick);
  }
  tick();

  // Live-bind hover states for interactive elements (including ones added later)
  const HOVER_SEL = 'a,button,input,select,textarea,[role="button"],.price-card,.float-badge,.social-card,.ingredient-card,.stat-card,.earn-card,.cart-item,.ref-stat';
  function bindHover(root) {
    root.querySelectorAll(HOVER_SEL).forEach((el) => {
      if (el.dataset.pillBound) return;
      el.dataset.pillBound = '1';
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
  }
  bindHover(document);
  new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && bindHover(n))))
    .observe(document.body, { childList: true, subtree: true });
})();
