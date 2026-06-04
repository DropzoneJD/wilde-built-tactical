/* Product detail + back-in-stock — product.js */
(function () {
  const S = window.WBTStore, ui = S.ui, F = S.fmt;
  const id = new URLSearchParams(location.search).get('id');
  const p = S.byId[id] || S.catalog[0];

  document.title = `${p.brand} ${p.title} — Wilde Built Tactical`;
  document.getElementById('crumb').innerHTML =
    `<a href="index.html">Home</a> / <a href="shop.html?cat=${p.cat}">${p.catLabel}</a> / ${p.title}`;

  const fav = S.fav.has(p.id);
  const thumbs = [p.cat, p.cat, p.cat, p.cat].map((c, i) =>
    `<div class="pdp__thumb ${i === 0 ? 'is-on' : ''}">${S.silo(c)}</div>`).join('');

  // ---- buy box: in-stock => qty + add; out => back-in-stock ----
  const buyBox = p.status === 'out'
    ? `<div class="bis" id="bisBox">
         <div class="flex items-center gap-12 mb-16"><i data-lucide="bell-ring" style="width:22px;color:var(--amber)"></i>
           <div><b>Out of stock — get notified</b><div class="tiny muted">High demand. We'll email you the moment it's restocked.</div></div></div>
         <div class="bis__row"><input class="input" id="bisEmail" type="email" placeholder="you@email.com">
           <button class="btn btn--amber" id="bisGo"><i data-lucide="bell"></i> Notify Me</button></div>
       </div>`
    : `<div class="flex gap-12 wrapf items-center" style="margin-bottom:14px">
         <div class="qty" id="qtyCtl"><button data-act="dec">−</button><span id="qtyVal">1</span><button data-act="inc">+</button></div>
         <button class="btn btn--primary btn--lg" style="flex:1 1 auto" id="addBtn"><i data-lucide="shopping-cart"></i> Add to Cart · ${F.money(p.price)}</button>
       </div>
       <button class="btn btn--block" id="buyNow"><i data-lucide="zap"></i> Buy Now</button>`;

  const fflNote = p.ffl
    ? `<div class="card" style="padding:13px 15px;margin-top:16px;background:var(--panel-2);display:flex;gap:11px;align-items:flex-start">
         <i data-lucide="map-pin" style="width:18px;color:var(--fde);flex:0 0 auto;margin-top:2px"></i>
         <div class="tiny"><b>Ships to your FFL.</b> This is a firearm — at checkout you'll pick a licensed dealer near you for pickup, background check & 10-day DROS. <a href="checkout.html" style="color:var(--fde)">Find your FFL →</a></div>
       </div>` : '';

  document.getElementById('pdp').innerHTML = `
    <div class="pdp__gallery fade-in">
      <div class="pdp__main">
        <div class="pcard__badges">${ui.badges(p)}</div>
        <div class="pcard__silo silo-box">${S.silo(p.cat)}</div>
      </div>
      <div class="pdp__thumbs">${thumbs}</div>
    </div>
    <div class="fade-in">
      <div class="pcard__brand" style="font-size:13px">${p.brand}</div>
      <h1>${p.title}</h1>
      <div class="flex items-center gap-12 mb-16">
        <span class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span>
        <span class="muted tiny">${p.rating} · ${p.reviews} reviews</span>
        <span class="badge badge--ca">${p.ca === 'roster' ? 'CA Roster' : p.ca === 'featureless' ? 'Featureless' : 'CA Legal'}</span>
      </div>
      <div class="pdp__price">
        <span class="price__now ${p.onSale ? 'sale' : ''}">${F.money(p.price)}</span>
        ${p.msrp > p.price ? `<span class="price__msrp" style="font-size:17px">${F.money(p.msrp)}</span>` : ''}
        ${p.onSale ? `<span class="badge badge--sale">Save ${F.money(p.save)}</span>` : ''}
      </div>
      <div class="${p.status === 'out' ? 'out-stock' : p.status === 'low' ? 'low-stock' : 'in-stock'} stock-line" style="margin-bottom:18px">
        <span class="dot"></span>${p.status === 'out' ? 'Out of stock' : p.status === 'low' ? `Only ${p.qty} left in stock` : 'In stock · ready to ship'}</div>
      ${buyBox}
      <button class="btn btn--ghost btn--sm" id="favBtn2" style="margin-top:12px"><i data-lucide="heart"></i> ${fav ? 'Saved' : 'Save for later'}</button>
      <div class="card" style="padding:12px 15px;margin-top:16px;display:flex;gap:11px;align-items:center;background:linear-gradient(120deg,rgba(194,161,123,.1),var(--panel))">
        <i data-lucide="credit-card" style="width:18px;color:var(--fde)"></i>
        <div class="tiny">Pay over time — <b style="color:var(--fde)">4 × ${F.money(Math.round(p.price / 4))}</b> interest-free. No impact to credit to check.</div>
      </div>
      ${fflNote}
      <div class="flex gap-16 mt-16 wrapf tiny muted">
        <span class="flex items-center gap-8"><i data-lucide="shield-check" style="width:15px;color:var(--od-bright)"></i> CA-legal verified</span>
        <span class="flex items-center gap-8"><i data-lucide="truck" style="width:15px;color:var(--od-bright)"></i> Ships statewide</span>
        <span class="flex items-center gap-8"><i data-lucide="rotate-ccw" style="width:15px;color:var(--od-bright)"></i> Easy returns</span>
      </div>
    </div>`;

  // specs + overview
  document.getElementById('specTable').innerHTML = p.specs.map(s => `<tr><td>${s[0]}</td><td>${s[1]}</td></tr>`).join('') +
    `<tr><td>Brand</td><td>${p.brand}</td></tr><tr><td>Category</td><td>${p.catLabel}</td></tr>`;
  document.getElementById('descText').textContent = p.desc;
  document.getElementById('skuVal').textContent = p.sku;
  document.getElementById('shipVal').textContent = p.ffl ? 'Licensed FFL (pickup)' : 'Your address';
  document.getElementById('caVal').textContent = p.ca === 'roster' ? 'DOJ Roster Approved' : p.ca === 'featureless' ? 'Featureless / CA Legal' : 'California Legal';

  // related (same category, then fill)
  let related = S.catalog.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  if (related.length < 4) related = related.concat(S.catalog.filter(x => x.id !== p.id && !related.includes(x)).slice(0, 4 - related.length));
  document.getElementById('relatedGrid').innerHTML = related.map(ui.productCard).join('');

  // ---- interactions ----
  let qty = 1;
  const qtyCtl = document.getElementById('qtyCtl');
  if (qtyCtl) qtyCtl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; qty = Math.max(1, qty + (b.dataset.act === 'inc' ? 1 : -1)); document.getElementById('qtyVal').textContent = qty; });
  const addBtn = document.getElementById('addBtn');
  if (addBtn) addBtn.addEventListener('click', () => { S.cart.add(p.id, qty); ui.toast(`Added ${qty} · ${p.title}`, 'check-circle-2'); ui.openCart(); });
  const buyNow = document.getElementById('buyNow');
  if (buyNow) buyNow.addEventListener('click', () => { S.cart.add(p.id, qty); location.href = 'checkout.html'; });

  // back-in-stock inline
  const bisGo = document.getElementById('bisGo');
  if (bisGo) bisGo.addEventListener('click', () => {
    const email = document.getElementById('bisEmail').value.trim();
    if (!/.+@.+\..+/.test(email)) { ui.toast('Enter a valid email', 'alert-triangle'); return; }
    S.bis.subscribe(p.id, email);
    const box = document.getElementById('bisBox'); box.classList.add('is-done');
    box.innerHTML = `<div class="flex items-center gap-12"><div style="width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:rgba(95,181,95,.14);border:1px solid var(--success);color:var(--success);flex:0 0 auto"><i data-lucide="check"></i></div>
      <div><b style="color:var(--success)">You're on the list!</b><div class="tiny muted">We'll email <b>${email}</b> the second ${p.title} is back. (${S.bis.count()} item${S.bis.count() === 1 ? '' : 's'} watched)</div></div></div>`;
    ui.icons(); ui.toast('Back-in-stock alert set', 'bell');
  });

  document.getElementById('favBtn2').addEventListener('click', e => { const on = S.fav.toggle(p.id); e.currentTarget.innerHTML = `<i data-lucide="heart"></i> ${on ? 'Saved' : 'Save for later'}`; ui.icons(); ui.toast(on ? 'Saved to favorites' : 'Removed', 'heart'); });

  // gallery thumbs (cosmetic)
  document.querySelectorAll('.pdp__thumb').forEach(t => t.addEventListener('click', () => { document.querySelectorAll('.pdp__thumb').forEach(x => x.classList.remove('is-on')); t.classList.add('is-on'); }));

  ui.icons();
})();
