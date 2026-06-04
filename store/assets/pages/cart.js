/* ============================================================================
   WBT Storefront — cart.js
   Full cart page: line items, order summary, promo codes, recs.
   Re-renders on "wbt:cart" event so totals stay live.
   ============================================================================ */
(function () {
  const S = window.WBTStore, ui = S.ui, F = S.fmt;

  const SHIPPING_THRESHOLD = 25000; // $250 in cents
  const SHIPPING_COST = 1499;       // $14.99 in cents
  const TAX_RATE = 0.0775;
  const PROMOS = { RANGEDAY15: 0.10, VETERAN: 0.08 };

  let appliedPromo = null; // { code, pct }

  // ---------------------------------------------------------------------- helpers
  function shipping(sub) { return sub >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST; }
  function discount(sub) { return appliedPromo ? Math.round(sub * appliedPromo.pct) : 0; }
  function tax(sub, disc, ship) { return Math.round((sub - disc + ship) * TAX_RATE); }
  function total(sub) {
    const disc = discount(sub);
    const ship = shipping(sub - disc);
    const t = tax(sub, disc, ship);
    return { sub, disc, ship, t, total: sub - disc + ship + t };
  }

  // ---------------------------------------------------------------------- render
  function render() {
    const lines = S.cart.lines();
    const grid = document.getElementById('cartPageGrid');
    const countEl = document.getElementById('cartPageCount');
    const titleEl = document.getElementById('cartPageTitle');
    const recsSection = document.getElementById('alsoBuy');

    const n = S.cart.count();
    countEl.textContent = n === 0 ? 'Empty' : n === 1 ? '1 item' : n + ' items';

    if (!lines.length) {
      titleEl.textContent = 'Your Cart';
      grid.innerHTML = emptyStateHTML();
      renderRecs();
      recsSection.style.display = '';
      ui.icons();
      return;
    }

    titleEl.textContent = 'Your Cart';
    recsSection.style.display = '';

    const hasFFL = lines.some(l => l.p.ffl);
    grid.innerHTML = `
      <div id="cartLines">${linesHTML(lines)}</div>
      <div class="cart-summary-col" id="summaryCol">${summaryHTML(lines, hasFFL)}</div>
    `;

    wireLines();
    wirePromo();
    renderRecs(lines.map(l => l.p.id));
    ui.icons();
  }

  function linesHTML(lines) {
    return lines.map(l => {
      const p = l.p;
      const lineTotal = p.price * l.qty;
      const fflBadge = p.ffl ? `<span class="badge badge--ca" style="margin-left:6px"><i data-lucide="map-pin" style="width:11px"></i> FFL</span>` : '';
      return `
      <div class="cart-line-page fade-in" data-line-id="${p.id}">
        <a href="product.html?id=${p.id}" class="cart-line-media">
          ${S.silo(p.cat)}
        </a>
        <div class="cart-line-info">
          <div class="flex items-center gap-8 wrapf" style="margin-bottom:3px">
            <span class="pcard__brand">${p.brand}</span>
            ${fflBadge}
          </div>
          <a href="product.html?id=${p.id}" class="pcard__title" style="display:block;font-size:14.5px;font-weight:600;margin-bottom:4px;line-height:1.3;color:var(--text)">${p.title}</a>
          <div class="tiny muted">SKU: <span class="mono">${p.sku}</span></div>
          <div class="qty mt-8" data-qty-id="${p.id}">
            <button data-act="dec">−</button>
            <span>${l.qty}</span>
            <button data-act="inc">+</button>
          </div>
        </div>
        <div class="cart-line-right">
          <div class="price__now" style="font-family:var(--f-display);font-weight:800;font-size:19px;color:${p.onSale ? 'var(--amber)' : 'var(--text)'}">${F.money(lineTotal)}</div>
          ${l.qty > 1 ? `<div class="tiny muted">${F.money(p.price)} each</div>` : ''}
          <button class="cart-line__rm" data-rm="${p.id}" title="Remove item">
            <i data-lucide="trash-2" style="width:15px"></i>
          </button>
        </div>
      </div>`;
    }).join('');
  }

  function summaryHTML(lines, hasFFL) {
    const sub = S.cart.subtotal();
    const t = total(sub);
    const payEach = F.money(Math.round(t.total / 4));

    const discountRow = appliedPromo ? `
      <div class="kv discount-line">
        <span>
          <span class="mono" style="font-size:11px;color:var(--success)">${appliedPromo.code}</span>
          − ${Math.round(appliedPromo.pct * 100)}% off
        </span>
        <b style="color:var(--success)">−${F.money(t.disc)}</b>
      </div>` : '';

    const fflNotice = hasFFL ? `
      <div class="ffl-notice">
        <i data-lucide="map-pin"></i>
        <div>
          <b>FFL transfer required</b>
          <div class="tiny muted" style="margin-top:3px">One or more firearms in your cart ship to a licensed dealer. You'll select your FFL at checkout.</div>
        </div>
      </div>` : '';

    return `
    <div class="card card--pad">
      <div class="eyebrow mb-16">Order Summary</div>

      <div class="kv">
        <span class="muted">Subtotal (${S.cart.count()} item${S.cart.count() === 1 ? '' : 's'})</span>
        <b>${F.money(sub)}</b>
      </div>
      ${discountRow}
      <div class="kv">
        <span class="muted">Shipping</span>
        <b>${t.ship === 0 ? '<span style="color:var(--success)">FREE</span>' : F.money(t.ship)}</b>
      </div>
      ${t.ship > 0 ? `<div class="tiny muted" style="margin:-6px 0 8px;font-size:11.5px">Free shipping on orders <span style="color:var(--fde)">$250+</span></div>` : ''}
      <div class="kv">
        <span class="muted">Est. CA Tax (7.75%)</span>
        <b>${F.money(t.t)}</b>
      </div>
      <hr class="divider">
      <div class="kv" style="font-size:17px">
        <span><b>Total</b></span>
        <b style="color:var(--fde);font-family:var(--f-display);font-size:22px">${F.money(t.total)}</b>
      </div>
      <div class="tiny muted text-right" style="margin:-4px 0 14px">
        or 4 payments of <span style="color:var(--fde);font-family:var(--f-mono)">${payEach}</span> interest-free
      </div>

      <!-- promo code -->
      <div class="field" style="margin-bottom:12px">
        <label>Promo Code</label>
        <div class="promo-row">
          <input class="input" id="promoInput" type="text" placeholder="RANGEDAY15" autocomplete="off" style="text-transform:uppercase" ${appliedPromo ? 'disabled' : ''} value="${appliedPromo ? appliedPromo.code : ''}">
          ${appliedPromo
            ? `<button class="btn btn--sm btn--ghost" id="promoRemove" style="border-color:var(--danger);color:var(--danger)"><i data-lucide="x"></i></button>`
            : `<button class="btn btn--sm btn--primary" id="promoApply"><i data-lucide="tag"></i> Apply</button>`
          }
        </div>
        ${appliedPromo
          ? `<div class="tiny" style="color:var(--success);margin-top:6px"><i data-lucide="check-circle-2" style="width:12px;display:inline"></i> Code applied — ${Math.round(appliedPromo.pct * 100)}% off order</div>`
          : `<div class="tiny muted" style="margin-top:6px">Try <span class="mono" style="color:var(--fde)">RANGEDAY15</span> or <span class="mono" style="color:var(--fde)">VETERAN</span></div>`
        }
      </div>

      <a href="checkout.html" class="btn btn--primary btn--block btn--lg" style="gap:11px">
        <i data-lucide="lock"></i> Proceed to Checkout
      </a>
      <a href="shop.html" class="btn btn--ghost btn--block btn--sm" style="margin-top:10px;color:var(--muted)">
        <i data-lucide="arrow-left"></i> Continue Shopping
      </a>

      ${fflNotice}

      <div class="flex gap-16 mt-16 wrapf" style="border-top:1px solid var(--line);padding-top:14px">
        <div class="flex items-center gap-8 tiny muted"><i data-lucide="shield-check" style="width:14px;color:var(--od-bright)"></i> Secure checkout</div>
        <div class="flex items-center gap-8 tiny muted"><i data-lucide="truck" style="width:14px;color:var(--od-bright)"></i> Ships across CA</div>
        <div class="flex items-center gap-8 tiny muted"><i data-lucide="credit-card" style="width:14px;color:var(--od-bright)"></i> 4 easy payments</div>
      </div>
    </div>`;
  }

  function emptyStateHTML() {
    return `
    <div class="cart-empty-page fade-in">
      <div class="empty-icon"><i data-lucide="shopping-cart"></i></div>
      <h2 style="font-size:24px;margin-bottom:10px">Your Cart is Empty</h2>
      <p class="muted" style="max-width:360px;margin:0 auto 24px">You haven't added anything yet. Browse our CA-legal rifles, handguns, optics, and more.</p>
      <div class="flex gap-12" style="justify-content:center;flex-wrap:wrap">
        <a href="shop.html" class="btn btn--primary btn--lg"><i data-lucide="store"></i> Shop All Products</a>
        <a href="shop.html?cat=rifle" class="btn btn--lg"><i data-lucide="crosshair"></i> CA-Legal Rifles</a>
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------------- recs
  function renderRecs(excludeIds) {
    const exclude = new Set(excludeIds || []);
    const recs = S.catalog
      .filter(p => p.status !== 'out' && !exclude.has(p.id))
      .slice(0, 4);
    const grid = document.getElementById('recsGrid');
    if (grid) {
      grid.innerHTML = recs.map(p => ui.productCard(p)).join('');
      ui.icons();
    }
  }

  // ---------------------------------------------------------------------- wiring
  function wireLines() {
    document.querySelectorAll('[data-qty-id]').forEach(q => {
      q.addEventListener('click', e => {
        const btn = e.target.closest('button'); if (!btn) return;
        const id = q.dataset.qtyId;
        const cur = S.cart.items()[id] || 0;
        S.cart.set(id, btn.dataset.act === 'inc' ? cur + 1 : cur - 1);
        // set fires wbt:cart which triggers re-render
      });
    });

    document.querySelectorAll('[data-rm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.rm;
        const p = S.byId[id];
        S.cart.remove(id);
        ui.toast(p ? `Removed · ${p.title}` : 'Item removed', 'trash-2');
      });
    });
  }

  function wirePromo() {
    const applyBtn = document.getElementById('promoApply');
    const removeBtn = document.getElementById('promoRemove');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const input = document.getElementById('promoInput');
        const code = (input.value || '').trim().toUpperCase();
        if (!code) { ui.toast('Enter a promo code', 'alert-triangle'); return; }
        const pct = PROMOS[code];
        if (pct) {
          appliedPromo = { code, pct };
          render();
          ui.toast(`Code ${code} applied — ${Math.round(pct * 100)}% off!`, 'tag');
        } else {
          ui.toast(`Code "${code}" is not valid`, 'alert-triangle');
          input.style.borderColor = 'var(--danger)';
          setTimeout(() => { if (input) input.style.borderColor = ''; }, 1600);
        }
      });

      const input = document.getElementById('promoInput');
      if (input) {
        input.addEventListener('input', () => { input.value = input.value.toUpperCase(); });
        input.addEventListener('keydown', e => { if (e.key === 'Enter') applyBtn.click(); });
      }
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const prev = appliedPromo ? appliedPromo.code : '';
        appliedPromo = null;
        render();
        ui.toast(prev ? `Code ${prev} removed` : 'Promo removed', 'x');
      });
    }
  }

  // ---------------------------------------------------------------------- boot
  window.addEventListener('wbt:cart', render);
  render();
})();
