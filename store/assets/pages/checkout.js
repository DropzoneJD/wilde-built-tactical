/* Checkout + FFL finder — checkout.js */
(function () {
  const S = window.WBTStore, ui = S.ui, F = S.fmt;

  // demo convenience: if the cart is empty, seed a firearm + ammo so the FFL
  // finder is contextual and the page is fully populated.
  if (S.cart.count() === 0) {
    const rifle = S.catalog.find(p => p.cat === 'rifle' && p.status !== 'out' && p.serialized);
    const ammo = S.catalog.find(p => p.cat === 'ammo' && p.status !== 'out');
    if (rifle) S.cart.add(rifle.id, 1);
    if (ammo) S.cart.add(ammo.id, 2);
  }

  let selectedFFL = S.ffl.getSelected();

  function lines() { return S.cart.lines(); }
  function hasFirearms() { return lines().some(l => l.p.ffl); }

  function renderSummary() {
    const ls = lines();
    const empty = ls.length === 0;
    document.getElementById('coEmpty').classList.toggle('hide', !empty);
    document.getElementById('coGrid').classList.toggle('hide', empty);
    if (empty) return;

    document.getElementById('coItems').innerHTML = ls.map(l => `
      <div class="flex gap-12" style="padding:9px 0;align-items:center">
        <div class="cart-line__media" style="width:44px;height:44px">${S.silo(l.p.cat)}</div>
        <div style="flex:1 1 auto;min-width:0">
          <div style="font-size:13px;font-weight:600">${l.p.brand} ${l.p.title}</div>
          <div class="tiny muted">Qty ${l.qty}${l.p.ffl ? ' · FFL item' : ''}</div>
        </div>
        <div class="mono" style="font-size:13px">${F.money(l.p.price * l.qty)}</div>
      </div>`).join('');

    const sub = S.cart.subtotal();
    const ship = sub >= 25000 ? 0 : 1499;
    const fflFee = (hasFirearms() && selectedFFL) ? selectedFFL.fee : 0;
    const tax = Math.round(sub * 0.0775);
    const total = sub + ship + fflFee + tax;

    document.getElementById('coTotals').innerHTML = `
      <div class="kv"><span class="muted">Subtotal</span><b>${F.money(sub)}</b></div>
      <div class="kv"><span class="muted">Shipping</span><b>${ship === 0 ? 'FREE' : F.money(ship)}</b></div>
      ${hasFirearms() ? `<div class="kv"><span class="muted">FFL transfer fee${selectedFFL ? ' · ' + selectedFFL.name.split(' ').slice(0, 2).join(' ') : ''}</span><b>${selectedFFL ? F.money(fflFee) : '—'}</b></div>` : ''}
      <div class="kv"><span class="muted">CA sales tax</span><b>${F.money(tax)}</b></div>
      <div class="kv" style="font-size:17px"><span>Total</span><b style="color:var(--fde)">${F.money(total)}</b></div>
      <div class="tiny muted text-right mt-8">or 4 × <b style="color:var(--fde)">${F.money(Math.round(total / 4))}</b> interest-free</div>`;

    // FFL card relevance
    const why = document.getElementById('fflWhy');
    if (!hasFirearms()) {
      why.innerHTML = 'No firearms in your cart — an FFL isn\'t required for this order. (Finder shown for demo.)';
    } else {
      const n = ls.filter(l => l.p.ffl).reduce((a, l) => a + l.qty, 0);
      why.innerHTML = `<b style="color:var(--fde)">${n} firearm${n === 1 ? '' : 's'}</b> in your order must ship to a licensed FFL for pickup + background check. Choose your dealer below.`;
    }
    updateNotice();
  }

  function updateNotice() {
    const btn = document.getElementById('placeOrder'), notice = document.getElementById('coNotice');
    if (hasFirearms() && !selectedFFL) {
      notice.innerHTML = '<span style="color:var(--amber)">Select an FFL transfer location to continue.</span>';
    } else if (selectedFFL) {
      notice.innerHTML = `Transfer to <b style="color:var(--fde)">${selectedFFL.name}</b>, ${selectedFFL.city}`;
    } else {
      notice.textContent = '';
    }
  }

  // mount the functional FFL finder
  S.ffl.mount('#fflMount', {
    onSelect(d) { selectedFFL = d; ui.toast('FFL set · ' + d.name, 'map-pin'); renderSummary(); }
  });

  // payment toggle (cosmetic)
  document.getElementById('payCard').addEventListener('click', e => { e.currentTarget.classList.add('btn--primary'); document.getElementById('payPlan').classList.remove('btn--primary'); });
  document.getElementById('payPlan').addEventListener('click', e => { e.currentTarget.classList.add('btn--primary'); document.getElementById('payCard').classList.remove('btn--primary'); ui.toast('4 interest-free payments selected', 'calendar'); });

  // place order
  document.getElementById('placeOrder').addEventListener('click', () => {
    if (hasFirearms() && !selectedFFL) {
      ui.toast('Choose an FFL transfer location first', 'alert-triangle');
      document.getElementById('fflCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const orderNo = 'WBT-' + (74000 + Math.floor(S.cart.subtotal() % 900 + 100));
    const total = S.cart.subtotal();
    confirmOrder(orderNo, total);
  });

  function confirmOrder(orderNo) {
    const ffl = selectedFFL;
    document.querySelector('.checkout-grid').outerHTML = `
      <div class="card card--pad fade-in" style="max-width:640px;margin:10px auto 50px;text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:6px auto 14px;background:rgba(95,181,95,.12);border:1px solid var(--success);color:var(--success)"><i data-lucide="check" style="width:30px;height:30px"></i></div>
        <div class="eyebrow" style="justify-content:center">Order Confirmed</div>
        <h2 style="font-size:28px;margin:10px 0 4px">Thank you — you're locked in.</h2>
        <p class="muted">Order <b class="mono" style="color:var(--fde)">${orderNo}</b> · a confirmation was emailed (demo).</p>
        ${ffl ? `<div class="card card--pad" style="text-align:left;margin-top:20px;background:var(--panel-2)">
          <div class="eyebrow mb-8"><i data-lucide="map-pin" style="width:13px"></i> Pick Up Your Firearm At</div>
          <b style="font-size:16px">${ffl.name}</b>
          <div class="muted" style="font-size:13.5px">${ffl.street}, ${ffl.city}, ${ffl.state} ${ffl.zip}</div>
          <div class="kv mt-16"><span class="muted">Transfer fee (due at pickup)</span><b>${F.money(ffl.fee)}</b></div>
          <div class="kv"><span class="muted">Hours</span><b>${ffl.hours}</b></div>
          <div class="kv"><span class="muted">Next step</span><b style="color:var(--fde)">10-day DROS begins on arrival</b></div>
          <p class="tiny muted" style="margin:12px 0 0">We'll ship your firearm to this dealer and email you when it arrives. Bring a CA ID + complete the 4473 and DROS at pickup.</p>
        </div>` : ''}
        <div class="flex gap-12 mt-24" style="justify-content:center"><a href="shop.html" class="btn btn--primary"><i data-lucide="store"></i> Keep Shopping</a>
          <a href="index.html" class="btn btn--ghost">Back to Home</a></div>
      </div>`;
    S.cart.clear(); S.ffl.setSelected(null);
    if (window.lucide) lucide.createIcons();
    ui.toast('Order placed · ' + orderNo, 'party-popper');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderSummary();
  window.addEventListener('wbt:cart', renderSummary);
  ui.icons();
})();
