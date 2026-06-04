/* ============================================================================
   WBT Storefront — store.js  (window.WBTStore.ui)
   Shared shell: header/nav, cart drawer, mobile menu, search, toasts, product
   card renderer, add-to-cart + back-in-stock flows. Requires catalog.js.
   ============================================================================ */
(function () {
  const S = window.WBTStore, F = S.fmt;

  // ----------------------------------------------------------- header / footer
  function headerHTML() {
    const nav = [
      ['Rifles', 'shop.html?cat=rifle'], ['Handguns', 'shop.html?cat=pistol'],
      ['Optics', 'shop.html?cat=optic'], ['Ammo', 'shop.html?cat=ammo'],
      ['Accessories', 'shop.html?cat=acc'],
    ].map(([t, h]) => `<a href="${h}">${t}</a>`).join('') +
      `<a href="shop.html?sale=1" class="sale">Sale</a>`;
    return `
    <div class="announce">⚡ Free shipping on orders $250+ across CA · Payment plans available · <a href="checkout.html">FFL transfer at checkout →</a></div>
    <div class="header"><div class="wrap header__row">
      <button class="icon-btn menu-toggle" id="mNavBtn" aria-label="Menu"><i data-lucide="menu"></i></button>
      <a class="brand" href="index.html">
        <span class="brand__mark"><i data-lucide="crosshair"></i></span>
        <span><b>WILDE BUILT</b><span>TACTICAL</span></span>
      </a>
      <nav class="mainnav">${nav}</nav>
      <div class="header__search">
        <i data-lucide="search"></i>
        <input id="hSearch" placeholder="Search rifles, optics, ammo…" autocomplete="off">
      </div>
      <div class="header__tools">
        <a class="icon-btn" href="shop.html" title="Account"><i data-lucide="user"></i></a>
        <a class="icon-btn" href="shop.html?fav=1" title="Saved" id="favBtn"><i data-lucide="heart"></i><span class="cart-count hide" id="favCount"></span></a>
        <button class="icon-btn" id="cartBtn" title="Cart"><i data-lucide="shopping-cart"></i><span class="cart-count hide" id="cartCount"></span></button>
      </div>
    </div></div>`;
  }

  function footerHTML() {
    const col = (h, links) => `<div><h4>${h}</h4>${links.map(l => `<a href="${l[1]}">${l[0]}</a>`).join('')}</div>`;
    return `<div class="footer"><div class="wrap">
      <div class="footer__top">
        <div>
          <a class="brand" href="index.html" style="margin-bottom:14px">
            <span class="brand__mark"><i data-lucide="crosshair"></i></span>
            <span><b>WILDE BUILT</b><span>TACTICAL</span></span>
          </a>
          <p class="muted" style="font-size:13.5px;max-width:280px">California's largest selection of CA-legal firearms. We ship compliant statewide and transfer to your local FFL.</p>
          <div class="flex gap-8 mt-16" style="font-family:var(--f-mono);font-size:12px;color:var(--fde)"><i data-lucide="phone" style="width:15px"></i> (619) 667-9453</div>
        </div>
        ${col('Shop', [['Rifles', 'shop.html?cat=rifle'], ['Handguns', 'shop.html?cat=pistol'], ['Optics', 'shop.html?cat=optic'], ['Ammunition', 'shop.html?cat=ammo'], ['On Sale', 'shop.html?sale=1']])}
        ${col('Support', [['FFL Transfers', 'checkout.html'], ['Shipping & CA Law', '#'], ['Payment Plans', '#'], ['Back-in-Stock Alerts', 'shop.html'], ['Contact', '#']])}
        ${col('Company', [['About WBT', '#'], ['CA Compliance', '#'], ['Blog', '#'], ['Owner Login', '../index.html']])}
      </div>
      <div class="footer__bottom">
        <span>© 2026 WILDE BUILT TACTICAL · FFL 01 · SAN DIEGO, CA</span>
        <span>MOCK STORE · ALL DATA FICTIONAL · CA-LEGAL · 21+ ONLY</span>
      </div>
    </div></div>`;
  }

  // ----------------------------------------------------------- cart drawer
  function cartDrawerHTML() {
    return `
    <div class="drawer-veil" id="cartVeil"></div>
    <aside class="cart-drawer" id="cartDrawer" aria-label="Cart">
      <div class="cart-drawer__head">
        <i data-lucide="shopping-cart" style="width:20px;color:var(--fde)"></i>
        <h3>Your Cart</h3><span class="badge" id="cartHeadCount">0</span>
        <button class="icon-btn" id="cartClose" style="margin-left:auto"><i data-lucide="x"></i></button>
      </div>
      <div class="cart-drawer__items" id="cartItems"></div>
      <div class="cart-drawer__foot" id="cartFoot"></div>
    </aside>`;
  }

  function renderCart() {
    const lines = S.cart.lines();
    const itemsEl = document.getElementById('cartItems');
    const footEl = document.getElementById('cartFoot');
    document.getElementById('cartHeadCount').textContent = S.cart.count();
    if (!lines.length) {
      itemsEl.innerHTML = `<div class="cart-empty"><i data-lucide="shopping-cart"></i><div>Your cart is empty.</div>
        <a href="shop.html" class="btn btn--primary btn--sm" style="margin-top:16px"><i data-lucide="store"></i> Start shopping</a></div>`;
      footEl.innerHTML = '';
      icons(); return;
    }
    itemsEl.innerHTML = lines.map(l => `
      <div class="cart-line">
        <div class="cart-line__media">${S.silo(l.p.cat)}</div>
        <div class="cart-line__info">
          <b>${l.p.brand} ${l.p.title}</b>
          <div class="tiny muted">${l.p.sku}${l.p.ffl ? ' · FFL item' : ''}</div>
          <div class="qty" data-id="${l.p.id}">
            <button data-act="dec">−</button><span>${l.qty}</span><button data-act="inc">+</button>
          </div>
        </div>
        <div style="text-align:right">
          <div class="mono" style="color:var(--fde)">${F.money(l.p.price * l.qty)}</div>
          <button class="cart-line__rm" data-rm="${l.p.id}"><i data-lucide="trash-2" style="width:15px"></i></button>
        </div>
      </div>`).join('');
    const sub = S.cart.subtotal();
    const ship = sub >= 25000 ? 0 : 1499;
    footEl.innerHTML = `
      <div class="kv"><span class="muted">Subtotal</span><b>${F.money(sub)}</b></div>
      <div class="kv"><span class="muted">Shipping</span><b>${ship === 0 ? 'FREE' : F.money(ship)}</b></div>
      <div class="kv" style="font-size:16px"><span>Total</span><b style="color:var(--fde)">${F.money(sub + ship)}</b></div>
      <a href="checkout.html" class="btn btn--primary btn--block" style="margin-top:14px"><i data-lucide="lock"></i> Secure Checkout</a>
      <div class="tiny muted text-center mt-8">or 4 interest-free payments · <span style="color:var(--fde)">${F.money(Math.round((sub + ship) / 4))}</span></div>`;
    // wire qty + remove
    itemsEl.querySelectorAll('.qty').forEach(q => q.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const id = q.dataset.id, cur = S.cart.items()[id] || 0;
      S.cart.set(id, b.dataset.act === 'inc' ? cur + 1 : cur - 1);
    }));
    itemsEl.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => S.cart.remove(b.dataset.rm)));
    icons();
  }

  function openCart() { renderCart(); document.getElementById('cartDrawer').classList.add('is-open'); document.getElementById('cartVeil').classList.add('is-open'); }
  function closeCart() { document.getElementById('cartDrawer').classList.remove('is-open'); document.getElementById('cartVeil').classList.remove('is-open'); }

  function syncBadges() {
    const n = S.cart.count(), el = document.getElementById('cartCount');
    if (el) { el.textContent = n; el.classList.toggle('hide', n === 0); }
    const fn = S.fav.count(), fe = document.getElementById('favCount');
    if (fe) { fe.textContent = fn; fe.classList.toggle('hide', fn === 0); }
  }

  // ----------------------------------------------------------- mobile nav
  function mNavHTML() {
    const items = [['Rifles', 'shop.html?cat=rifle'], ['Handguns', 'shop.html?cat=pistol'], ['Optics', 'shop.html?cat=optic'], ['Ammunition', 'shop.html?cat=ammo'], ['Accessories', 'shop.html?cat=acc'], ['On Sale', 'shop.html?sale=1'], ['All Products', 'shop.html']];
    return `<div class="mnav-veil" id="mNavVeil"></div><nav class="mnav" id="mNav">
      <div class="flex items-center justify-between mb-16"><span class="eyebrow">Menu</span><button class="icon-btn" id="mNavClose"><i data-lucide="x"></i></button></div>
      ${items.map(i => `<a href="${i[1]}">${i[0]}</a>`).join('')}
    </nav>`;
  }

  // ----------------------------------------------------------- product card
  function badges(p) {
    let b = '';
    if (p.status === 'out') b += `<span class="badge badge--out">Out of Stock</span>`;
    else if (p.isNew) b += `<span class="badge badge--new">New</span>`;
    if (p.onSale) b += `<span class="badge badge--sale">−${p.savePct}%</span>`;
    if (p.isBlem) b += `<span class="badge badge--blem">Blem</span>`;
    if (p.ca === 'roster') b += `<span class="badge badge--ca">CA Roster</span>`;
    else if (p.ca === 'featureless') b += `<span class="badge badge--ca">Featureless</span>`;
    return b;
  }
  function stockLine(p) {
    if (p.status === 'out') return `<div class="stock-line out-stock"><span class="dot"></span>Out of stock</div>`;
    if (p.status === 'low') return `<div class="stock-line low-stock"><span class="dot"></span>Only ${p.qty} left</div>`;
    return `<div class="stock-line in-stock"><span class="dot"></span>In stock${p.ffl ? ' · ships to FFL' : ''}</div>`;
  }
  function priceHTML(p) {
    return `<div class="price">
      <span class="price__now ${p.onSale ? 'sale' : ''}">${F.money(p.price)}</span>
      ${p.msrp > p.price ? `<span class="price__msrp">${F.money(p.msrp)}</span>` : ''}
      ${p.onSale ? `<span class="price__save">Save ${F.money(p.save)}</span>` : ''}
    </div>`;
  }
  function productCard(p) {
    const fav = S.fav.has(p.id);
    const cta = p.status === 'out'
      ? `<button class="btn btn--ghost btn--block btn--sm" data-notify="${p.id}"><i data-lucide="bell"></i> Notify Me</button>`
      : `<button class="btn btn--primary btn--block btn--sm" data-add="${p.id}"><i data-lucide="shopping-cart"></i> Add to Cart</button>`;
    return `<div class="pcard fade-in">
      <a class="pcard__media" href="product.html?id=${p.id}">
        <div class="pcard__badges">${badges(p)}</div>
        <div class="pcard__silo silo-box">${S.silo(p.cat)}</div>
      </a>
      <button class="pcard__fav ${fav ? 'is-on' : ''}" data-fav="${p.id}" title="Save"><i data-lucide="heart"></i></button>
      <div class="pcard__body">
        <div class="pcard__brand">${p.brand}</div>
        <div class="pcard__title"><a href="product.html?id=${p.id}">${p.title}</a></div>
        <div class="pcard__meta"><span class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span><span class="pcard__rating">${p.rating} (${p.reviews})</span></div>
        ${priceHTML(p)}
        ${stockLine(p)}
        <div class="pcard__cta">${cta}</div>
      </div>
    </div>`;
  }

  // ----------------------------------------------------------- add to cart + notify
  function addToCart(id) { const p = S.byId[id]; if (!p) return; S.cart.add(id, 1); toast(`Added · ${p.brand} ${p.title}`, 'check-circle-2'); openCart(); }

  function notifyModal(id) {
    const p = S.byId[id]; if (!p) return;
    const subscribed = S.bis.has(id);
    const veil = document.createElement('div');
    veil.className = 'drawer-veil is-open'; veil.style.zIndex = 150; veil.style.display = 'grid'; veil.style.placeItems = 'center'; veil.style.padding = '20px';
    veil.innerHTML = `<div class="card card--pad" style="width:min(440px,100%)" onclick="event.stopPropagation()">
      <div class="flex items-center gap-12 mb-16">
        <div class="cart-line__media" style="width:48px;height:48px">${S.silo(p.cat)}</div>
        <div><div class="eyebrow">Back-in-Stock Alert</div><b>${p.brand} ${p.title}</b></div>
      </div>
      <div id="bisBody">
        <p class="muted tiny mb-16">We'll email you the moment <b>${p.title}</b> is restocked. No spam — just the drop.</p>
        <div class="field"><label>Email address</label><input class="input" id="bisEmail" type="email" placeholder="you@email.com" value="${subscribed ? S.bis.all()[id].email : ''}"></div>
        <button class="btn btn--primary btn--block" id="bisGo"><i data-lucide="bell"></i> ${subscribed ? 'Update Alert' : 'Notify Me When Available'}</button>
        ${subscribed ? '<div class="tiny" style="color:var(--success);text-align:center;margin-top:10px">✓ You\'re already on the list</div>' : ''}
      </div>
    </div>`;
    veil.addEventListener('click', () => veil.remove());
    document.body.appendChild(veil); icons();
    document.getElementById('bisGo').addEventListener('click', () => {
      const email = document.getElementById('bisEmail').value.trim();
      if (!/.+@.+\..+/.test(email)) { toast('Enter a valid email', 'alert-triangle'); return; }
      S.bis.subscribe(id, email);
      document.getElementById('bisBody').innerHTML = `<div style="text-align:center;padding:14px 0">
        <div style="width:54px;height:54px;border-radius:50%;display:grid;place-items:center;margin:0 auto 12px;background:rgba(95,181,95,.12);border:1px solid var(--success);color:var(--success)"><i data-lucide="check"></i></div>
        <b>You're on the list.</b><p class="muted tiny mt-8">We'll alert <b>${email}</b> when ${p.title} is back. ${S.bis.count()} item${S.bis.count() === 1 ? '' : 's'} watched.</p>
        <button class="btn btn--ghost btn--sm mt-16" onclick="this.closest('.drawer-veil').remove()">Done</button></div>`;
      icons(); toast('Back-in-stock alert set', 'bell');
    });
  }

  // ----------------------------------------------------------- toast / icons
  function toast(msg, icon) {
    let stack = document.getElementById('toast-stack');
    if (!stack) { stack = document.createElement('div'); stack.id = 'toast-stack'; document.body.appendChild(stack); }
    const el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = `<i data-lucide="${icon || 'check-circle-2'}"></i><span>${msg}</span>`;
    stack.appendChild(el); icons();
    setTimeout(() => { el.style.transition = 'opacity .3s,transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; setTimeout(() => el.remove(), 320); }, 3000);
  }
  function icons() { if (window.lucide) window.lucide.createIcons(); }

  // ----------------------------------------------------------- global delegation
  function wireGlobal() {
    document.body.addEventListener('click', e => {
      const add = e.target.closest('[data-add]'); if (add) { addToCart(add.dataset.add); return; }
      const nf = e.target.closest('[data-notify]'); if (nf) { notifyModal(nf.dataset.notify); return; }
      const fv = e.target.closest('[data-fav]'); if (fv) { const on = S.fav.toggle(fv.dataset.fav); fv.classList.toggle('is-on', on); syncBadges(); toast(on ? 'Saved to favorites' : 'Removed', on ? 'heart' : 'heart-off'); return; }
    });
  }

  // ----------------------------------------------------------- mount
  function mount() {
    const h = document.getElementById('site-header'); if (h) h.innerHTML = headerHTML();
    const f = document.getElementById('site-footer'); if (f) f.innerHTML = footerHTML();
    document.body.insertAdjacentHTML('beforeend', cartDrawerHTML() + mNavHTML());
    if (!document.getElementById('toast-stack')) document.body.insertAdjacentHTML('beforeend', '<div id="toast-stack"></div>');

    const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
    on('cartBtn', 'click', () => { renderCart(); openCart(); });
    on('cartClose', 'click', closeCart); on('cartVeil', 'click', closeCart);
    on('mNavBtn', 'click', () => { document.getElementById('mNav').classList.add('is-open'); document.getElementById('mNavVeil').classList.add('is-open'); });
    const closeM = () => { document.getElementById('mNav').classList.remove('is-open'); document.getElementById('mNavVeil').classList.remove('is-open'); };
    on('mNavClose', 'click', closeM); on('mNavVeil', 'click', closeM);
    on('hSearch', 'keydown', e => { if (e.key === 'Enter' && e.target.value.trim()) location.href = 'shop.html?q=' + encodeURIComponent(e.target.value.trim()); });

    window.addEventListener('wbt:cart', () => { syncBadges(); if (document.getElementById('cartDrawer').classList.contains('is-open')) renderCart(); });
    wireGlobal(); syncBadges(); icons();
  }

  S.ui = { mount, productCard, priceHTML, badges, stockLine, addToCart, notifyModal, renderCart, openCart, closeCart, toast, icons, silo: S.silo };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
