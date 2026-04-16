// Slide-out cart panel — injected into any page via <script src="/js/cart.js"></script>
(function () {
  const PANEL_HTML = `
<div class="cart-overlay" id="cartOverlay"></div>
<div class="cart-panel" id="cartPanel">
  <div class="cart-header">
    <h3>Your Cart</h3>
    <button class="cart-close" id="cartClose">&times;</button>
  </div>
  <div class="cart-body" id="cartBody">
    <div class="cart-empty" id="cartEmpty">
      <div class="cart-empty-icon">💊</div>
      <p>Your cart is empty</p>
      <a href="/#pricing" class="cart-shop-btn">Shop Now</a>
    </div>
    <div class="cart-items" id="cartItems"></div>
  </div>
  <div class="cart-footer" id="cartFooter" style="display:none;">
    <div class="cart-summary">
      <div class="cart-summary-row"><span>Subtotal</span><span id="cartSubtotal">£0.00</span></div>
      <div class="cart-summary-row"><span>Shipping</span><span class="cart-free">Free</span></div>
      <div class="cart-summary-row cart-total"><span>Total</span><span id="cartTotal">£0.00</span></div>
    </div>
    <a href="/checkout" class="cart-checkout-btn" id="cartCheckoutBtn">Checkout</a>
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
.cart-checkout-btn { display: block; width: 100%; padding: 14px; background: var(--electric); color: var(--bg); border: none; border-radius: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; text-align: center; text-decoration: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; margin-top: 16px; }
.cart-checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(0,255,136,0.3); }
@media (max-width: 480px) { .cart-panel { width: 100vw; } }
`;
  document.head.appendChild(STYLE);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = PANEL_HTML;
  document.body.appendChild(wrapper);

  const overlay = document.getElementById('cartOverlay');
  const panel = document.getElementById('cartPanel');
  const cartBody = document.getElementById('cartBody');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');

  function open() { overlay.classList.add('open'); panel.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() { overlay.classList.remove('open'); panel.classList.remove('open'); document.body.style.overflow = ''; }
  overlay.addEventListener('click', close);
  document.getElementById('cartClose').addEventListener('click', close);

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

  function fmt(pence) { return '£' + (pence / 100).toFixed(2); }

  async function refresh() {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      renderItems(data.items, data.total_pence);
      updateBadge(data.items.reduce((s, i) => s + i.quantity, 0));
    } catch { /* silent */ }
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
    cartTotal.textContent = fmt(total);

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
          <button class="cart-item-remove" data-remove="${i.id}">Remove</button>
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
    async add(productId, qty = 1) {
      await fetch('/api/cart/add', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({product_id: productId, quantity: qty}) });
      refresh();
      open();
    }
  };

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initTrigger(); refresh(); });
  } else {
    initTrigger();
    refresh();
  }
})();
