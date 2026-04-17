// Slide-out cart panel — injected into any page via <script src="/js/cart.js"></script>
(function () {
  const PANEL_HTML = `
<div class="cart-overlay" id="cartOverlay"></div>
<div class="cart-panel" id="cartPanel">
  <div class="cart-header">
    <h3 data-i18n="cart.title">Your Cart</h3>
    <button class="cart-close" id="cartClose" title="Continue shopping">&times;</button>
  </div>
  <div class="cart-body" id="cartBody">
    <div class="cart-empty" id="cartEmpty">
      <div class="cart-empty-icon">💊</div>
      <p data-i18n="cart.empty">Your cart is empty</p>
      <a href="/#pricing" class="cart-shop-btn" data-i18n="cart.shopNow">Shop Now</a>
    </div>
    <div class="cart-items" id="cartItems"></div>
  </div>
  <div class="cart-footer" id="cartFooter" style="display:none;">
    <div class="cart-summary">
      <div class="cart-summary-row"><span data-i18n="cart.subtotal">Subtotal</span><span id="cartSubtotal">£0.00</span></div>
      <div class="cart-summary-row"><span id="cartShipLabel">Shipping</span><span id="cartShipping">—</span></div>
      <div class="cart-summary-row cart-total"><span data-i18n="cart.total">Total</span><span id="cartTotal">£0.00</span></div>
    </div>
    <div class="cart-ctas" id="cartCtas"></div>
    <button class="cart-continue" id="cartContinue" data-i18n="cart.continue">Continue shopping</button>
  </div>
</div>`;

  const STYLE = document.createElement('style');
  STYLE.textContent = `
.cart-trigger { position: relative; cursor: pointer; background: none; border: none; padding: 6px; display: flex; align-items: center; }
.cart-trigger svg { width: 22px; height: 22px; stroke: var(--text); fill: none; stroke-width: 1.5; }
.cart-badge { position: absolute; top: -2px; right: -6px; background: var(--electric); color: var(--bg); font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.cart-badge.bounce { transform: scale(1.4); }
.cart-badge:empty { display: none; }
.cart-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9990; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
.cart-overlay.open { opacity: 1; pointer-events: auto; }
.cart-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 100vw; background: var(--surface); border-left: 1px solid var(--border); z-index: 9991; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
.cart-panel.open { transform: translateX(0); }
.cart-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
.cart-header h3 { font-size: 18px; font-weight: 600; }
.cart-close { background: none; border: none; color: var(--text-dim); font-size: 28px; cursor: pointer; padding: 0 4px; line-height: 1; transition: color 0.2s; }
.cart-close:hover { color: var(--text); }
.cart-body { flex: 1; overflow-y: auto; padding: 16px 24px; }
.cart-body::-webkit-scrollbar { width: 4px; }
.cart-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.cart-empty { text-align: center; padding: 60px 0; color: var(--text-dim); }
.cart-empty-icon { font-size: 48px; margin-bottom: 12px; }
.cart-empty p { margin-bottom: 20px; }
.cart-shop-btn { display: inline-block; padding: 10px 24px; background: var(--electric); color: var(--bg); border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
.cart-item { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid rgba(21,21,37,0.6); animation: cartSlideIn 0.3s ease-out; }
@keyframes cartSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
.cart-item-img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; background: var(--card); }
.cart-item-info { flex: 1; }
.cart-item-name { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.cart-item-type { font-size: 11px; color: var(--text-dim); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.cart-item-bottom { display: flex; justify-content: space-between; align-items: center; }
.cart-qty { display: flex; align-items: center; gap: 0; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.cart-qty button { background: var(--card); border: none; color: var(--text); width: 28px; height: 28px; font-size: 14px; cursor: pointer; transition: background 0.2s; }
.cart-qty button:hover { background: var(--border); }
.cart-qty span { font-family: 'JetBrains Mono', monospace; font-size: 13px; min-width: 28px; text-align: center; line-height: 28px; }
.cart-item-price { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; }
.cart-item-remove { background: none; border: none; color: var(--text-dim); font-size: 12px; cursor: pointer; padding: 4px 0; transition: color 0.2s; margin-top: 4px; }
.cart-item-remove:hover { color: var(--neon-pink); }
.cart-footer { padding: 20px 24px; border-top: 1px solid var(--border); }
.cart-summary-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-dim); margin-bottom: 8px; }
.cart-summary-row.cart-total { color: var(--text); font-size: 18px; font-weight: 700; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
.cart-total span:last-child { color: var(--electric); }
.cart-free { color: var(--electric); }
.cart-ctas { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.cart-cta { display: block; width: 100%; padding: 13px; border-radius: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; text-align: center; text-decoration: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; border: 1px solid transparent; }
.cart-cta.primary { background: var(--electric); color: var(--bg); border-color: var(--electric); }
.cart-cta.primary:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(0,255,136,0.3); }
.cart-cta.secondary { background: transparent; color: var(--text); border-color: var(--border); }
.cart-cta.secondary:hover { border-color: var(--electric); color: var(--electric); }
.cart-cta.express { background: #000; color: var(--text); border-color: var(--border); display: flex; align-items: center; justify-content: center; gap: 8px; }
.cart-cta.express:hover { border-color: var(--electric); }
.cart-cta.express .cart-cta-sub { font-size: 11px; color: var(--text-dim); font-family: 'JetBrains Mono', monospace; }
.cart-cta-divider { display: flex; align-items: center; gap: 10px; color: var(--text-dim); font-size: 11px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0; }
.cart-cta-divider::before, .cart-cta-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.cart-continue { background: none; border: none; color: var(--text-dim); font-size: 12px; cursor: pointer; width: 100%; padding: 10px; margin-top: 8px; font-family: 'Space Grotesk', sans-serif; transition: color 0.2s; }
.cart-continue:hover { color: var(--electric); }
@media (max-width: 480px) { .cart-panel { width: 100vw; } }
`;
  document.head.appendChild(STYLE);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = PANEL_HTML;
  document.body.appendChild(wrapper);
  if (window.Locale && window.Locale.applyToDOM) window.Locale.applyToDOM(wrapper);

  const overlay = document.getElementById('cartOverlay');
  const panel = document.getElementById('cartPanel');
  const cartBody = document.getElementById('cartBody');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');
  const cartShipping = document.getElementById('cartShipping');
  const cartShipLabel = document.getElementById('cartShipLabel');
  const cartCtas = document.getElementById('cartCtas');
  const cartContinue = document.getElementById('cartContinue');

  let shippingRule = null;
  async function loadShipping() {
    try {
      const res = await fetch('/api/shipping');
      if (res.ok) shippingRule = await res.json();
    } catch { shippingRule = null; }
  }

  let authState = null;
  function checkAuth() {
    return fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      authState = d && d.user ? d.user : null;
      return authState;
    }).catch(() => { authState = null; return null; });
  }

  function open() { overlay.classList.add('open'); panel.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { overlay.classList.remove('open'); panel.classList.remove('open'); document.body.style.overflow = ''; }
  overlay.addEventListener('click', close);
  document.getElementById('cartClose').addEventListener('click', close);
  cartContinue.addEventListener('click', close);

  let badge = null;

  function initTrigger() {
    const triggers = document.querySelectorAll('[data-cart-trigger]');
    triggers.forEach(t => {
      t.addEventListener('click', (e) => { e.preventDefault(); open(); refresh(); });
    });
    badge = document.querySelector('.cart-badge');
  }

  function updateBadge(count) {
    if (!badge) badge = document.querySelector('.cart-badge');
    if (!badge) return;
    badge.textContent = count > 0 ? count : '';
    if (count > 0) {
      badge.classList.add('bounce');
      setTimeout(() => badge.classList.remove('bounce'), 300);
    }
  }

  function fmt(pence) {
    if (window.Locale && typeof window.Locale.price === 'function') return window.Locale.price(pence);
    return '£' + (pence / 100).toFixed(2);
  }

  async function refresh() {
    const [cartRes] = await Promise.all([
      fetch('/api/cart').then(r => r.ok ? r.json() : Promise.reject(new Error('cart fetch failed'))),
      checkAuth(),
      loadShipping(),
    ]).catch(() => [{ items: [], total_pence: 0 }, null, null]);
    const data = cartRes || { items: [], total_pence: 0 };
    renderItems(data.items, data.total_pence);
    updateBadge(data.items.reduce((s, i) => s + i.quantity, 0));
  }

  function tt(key, fallback) {
    return (window.Locale && window.Locale.t) ? window.Locale.t(key, fallback) : fallback;
  }

  function renderCtas() {
    if (authState) {
      cartCtas.innerHTML = `
        <a href="/checkout" class="cart-cta primary">${tt('cart.checkout', 'Checkout')}</a>
        <a href="/checkout?express=1" class="cart-cta express" title="Uses your saved shipping address">
          <span>${tt('cart.express', 'Express Checkout')}</span>
        </a>`;
    } else {
      cartCtas.innerHTML = `
        <a href="/register?next=/checkout" class="cart-cta primary">${tt('cart.createAcct', 'Create Account & Checkout')}</a>
        <a href="/checkout" class="cart-cta secondary">${tt('cart.checkoutGuest', 'Checkout as Guest')}</a>
        <div class="cart-cta-divider">${tt('cart.orLogin', 'or log in')}</div>
        <a href="/login?next=/checkout" class="cart-cta secondary">${tt('nav.login', 'Log In')}</a>`;
    }
  }

  function renderItems(items, total) {
    if (!items.length) {
      cartEmpty.style.display = '';
      cartItems.innerHTML = '';
      cartFooter.style.display = 'none';
      return;
    }
    cartEmpty.style.display = 'none';
    cartFooter.style.display = '';
    cartSubtotal.textContent = fmt(total);

    const shipPence = shippingRule ? shippingRule.price_pence : 0;
    const shipCountry = shippingRule?.country ? ' · ' + shippingRule.country : '';
    cartShipLabel.textContent = tt('cart.shipping', 'Shipping') + shipCountry;
    if (shipPence <= 0) {
      cartShipping.textContent = tt('cart.free', 'Free');
      cartShipping.style.color = 'var(--electric)';
    } else {
      cartShipping.textContent = fmt(shipPence);
      cartShipping.style.color = 'var(--text)';
    }
    cartTotal.textContent = fmt(total + shipPence);
    renderCtas();

    cartItems.innerHTML = items.map(i => `
      <div class="cart-item" data-id="${i.id}">
        <img src="${i.image_url || '/thapill-assets/hero-bottle.png'}" alt="${i.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-type">${i.type === 'subscription' ? 'Monthly' : 'One-time'}</div>
          <div class="cart-item-bottom">
            <div class="cart-qty">
              <button data-qty-dec="${i.id}">−</button>
              <span>${i.quantity}</span>
              <button data-qty-inc="${i.id}">+</button>
            </div>
            <div class="cart-item-price">${fmt(i.price_pence * i.quantity)}</div>
          </div>
          <button class="cart-item-remove" data-remove="${i.id}">${tt('cart.remove', 'Remove')}</button>
        </div>
      </div>
    `).join('');

    cartItems.querySelectorAll('[data-qty-dec]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.qtyDec;
        const item = items.find(i => i.id == id);
        if (item.quantity <= 1) return removeItem(id);
        await fetch('/api/cart/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({quantity: item.quantity - 1}) });
        refresh();
      });
    });
    cartItems.querySelectorAll('[data-qty-inc]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.qtyInc;
        const item = items.find(i => i.id == id);
        await fetch('/api/cart/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({quantity: item.quantity + 1}) });
        refresh();
      });
    });
    cartItems.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn.dataset.remove));
    });
  }

  async function removeItem(id) {
    await fetch('/api/cart/' + id, { method: 'DELETE' });
    refresh();
  }

  // Public API
  window.thaPillCart = {
    open, close, refresh,
    async add(ref, qty = 1) {
      const payload = { quantity: qty };
      if (typeof ref === 'object' && ref) {
        if (ref.slug) payload.slug = ref.slug;
        if (ref.product_id) payload.product_id = ref.product_id;
      } else {
        payload.product_id = Number(ref);
      }

      let res;
      try {
        res = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        throw new Error('Network error — please try again');
      }
      if (!res.ok) {
        let msg = 'Could not add to cart';
        try { const body = await res.json(); if (body.error) msg = body.error; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      await Promise.all([checkAuth(), loadShipping()]);
      renderItems(data.items, data.total_pence);
      updateBadge(data.items.reduce((s, i) => s + i.quantity, 0));
      if (data.items.length) renderCtas();
      open();
    },
  };

  // Re-render cart when user switches currency or language
  document.addEventListener('locale:change', () => refresh());
  document.addEventListener('locale:ready',  () => refresh());

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initTrigger(); refresh(); });
  } else {
    initTrigger();
    refresh();
  }
})();
