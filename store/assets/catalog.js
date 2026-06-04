/* ============================================================================
   WBT Storefront — catalog.js  (window.WBTStore)
   Consumer catalog derived from the SAME shared product data the command center
   uses (window.WBT from ../assets/js/data.js) so storefront stock == Armory stock.
   Adds consumer fields (specs, ratings, sale/MSRP, silhouettes), a localStorage
   cart, and back-in-stock subscriptions.
   ============================================================================ */
(function () {
  const WBT = window.WBT;
  const money = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = c => '$' + Math.round(c / 100).toLocaleString('en-US');

  // -------------------------------------------------- product silhouettes (SVG)
  const SILO = {
    rifle: '<svg viewBox="0 0 200 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M8 40h26l6-10h60l4 8h70a6 6 0 016 6v6H40l-4 10H22a6 6 0 01-6-6v-4H8z"/><path d="M52 38v-14h22v14"/><path d="M150 44v12h16"/><circle cx="120" cy="44" r="2" fill="currentColor"/><path d="M96 30l4-12h10l-2 12"/></svg>',
    pistol: '<svg viewBox="0 0 160 120" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"><path d="M22 34h112a6 6 0 016 6v16H86l-6 10H58l-4-10H40v30a8 8 0 01-8 8h-2a8 8 0 01-8-8V40a6 6 0 016-6z"/><path d="M44 56v22"/><circle cx="120" cy="45" r="2.4" fill="currentColor"/></svg>',
    shotgun: '<svg viewBox="0 0 200 70" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M10 34h150a6 6 0 016 6v4H56l-6 8H30a6 6 0 01-6-6v-2H10z"/><path d="M40 34v-8h70v8"/><path d="M150 44l24-2v6l-24 2"/></svg>',
    optic: '<svg viewBox="0 0 160 120" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"><rect x="30" y="44" width="100" height="34" rx="10"/><path d="M22 50h8M130 50h8M58 78v14H46M114 78v14h12"/><circle cx="80" cy="61" r="9"/><path d="M80 54v14M73 61h14"/></svg>',
    ammo: '<svg viewBox="0 0 140 120" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"><path d="M40 96V52l16-26 16 26v44z"/><path d="M40 64h32"/><rect x="86" y="60" width="34" height="40" rx="4"/><path d="M86 72h34"/></svg>',
    acc: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"><path d="M82 30a16 16 0 00-22 20L30 80a8 8 0 0011 11l30-30a16 16 0 0021-22l-12 12-9-2-2-9z"/></svg>',
    light: '<svg viewBox="0 0 160 90" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"><rect x="40" y="32" width="84" height="26" rx="6"/><path d="M124 36l16-6v26l-16-6"/><path d="M40 40H22M40 50H26"/></svg>',
    apparel: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"><path d="M44 26l16 10 16-10 22 12-10 18-10-4v44H42V52l-10 4-10-18z"/></svg>',
  };
  const silo = cat => SILO[cat] || SILO.acc;

  // -------------------------------------------------- consumer enrichment
  const ADJ = ['Battle-proven', 'CA-compliant', 'Range-ready', 'Duty-grade', 'Match-grade', 'Hard-use'];
  const DESC = {
    rifle: 'A California-legal build configured for reliability on the range and in the field. Featureless/fixed-mag compliant where required — shipped to your chosen FFL.',
    pistol: 'On the California DOJ Roster and cleared for DROS. A proven carry/duty platform tuned for accuracy and everyday reliability.',
    shotgun: 'A versatile, California-legal shotgun built for home defense and sport. Configured to ship compliant statewide.',
    optic: 'Crystal-clear glass and a rugged housing built to take recoil and weather. Co-witness ready and zero-hold dependable.',
    ammo: 'Consistent, clean-burning ammunition for training and defense. Ships to your door where legal — California restrictions apply at checkout.',
    acc: 'Precision-machined components and upgrades that bolt straight onto your platform. Built to spec, built to last.',
    light: 'High-output weapon and handheld lighting with the runtime and durability hard use demands.',
    apparel: 'Rep the brand. Soft, durable, and unmistakably Wilde Built Tactical.',
  };
  function specsFor(p) {
    const r = (n) => Math.floor((parseInt(p.id.slice(1)) * 9301 + n * 49297) % 233280) / 233280;
    if (p.cat === 'rifle') return [['Caliber', WBT.pick(['5.56 NATO', '.223 Wylde', '.308 Win', '6.5 Creedmoor'])], ['Barrel', WBT.pick(['16"', '18"', '20"']) + ' 4150 CMV'], ['Capacity', '10+1 (CA)'], ['Compliance', p.ca === 'featureless' ? 'Featureless' : 'Fixed-mag / CA'], ['Weight', (6 + r(1) * 2).toFixed(1) + ' lb']];
    if (p.cat === 'pistol') return [['Caliber', WBT.pick(['9mm', '.45 ACP', '10mm'])], ['Capacity', WBT.pick(['10+1 (CA)', '10 rd'])], ['Action', 'Striker-fired'], ['Roster', 'CA DOJ Approved'], ['Sights', WBT.pick(['Night sights', 'Optic-ready'])]];
    if (p.cat === 'shotgun') return [['Gauge', '12 GA'], ['Capacity', WBT.pick(['5+1', '7+1'])], ['Barrel', WBT.pick(['18.5"', '20"'])], ['Compliance', 'CA Legal']];
    if (p.cat === 'optic') return [['Type', WBT.pick(['Red Dot', 'Holographic', 'Prism', 'LPVO'])], ['Battery', WBT.pick(['50,000 hr', '25,000 hr'])], ['Mount', WBT.pick(['Picatinny', 'Absolute co-witness'])], ['Water', 'IPX7']];
    if (p.cat === 'ammo') return [['Caliber', p.model.split(' ')[0]], ['Grain', WBT.pick(['55gr', '115gr', '124gr', '230gr'])], ['Rounds', WBT.pick(['20', '50', '100'])], ['Casing', WBT.pick(['Brass', 'Nickel'])]];
    if (p.cat === 'light') return [['Output', WBT.pick(['1000 lm', '800 lm', '500 lm'])], ['Runtime', WBT.pick(['1.5 hr', '2 hr'])], ['Mount', 'M-LOK / Pic'], ['Switch', 'Ambi tape']];
    return [['Material', WBT.pick(['7075 Aluminum', 'Polymer', '4140 Steel'])], ['Finish', WBT.pick(['Anodized', 'Cerakote FDE', 'Nitride'])], ['Fitment', 'AR-15 / universal'], ['Origin', 'USA']];
  }

  // -------------------------------------------------- build catalog from WBT.inventory
  const NEW_CUTOFF = 6;
  const catalog = WBT.inventory.map((p, i) => {
    const seed = parseInt(p.id.slice(1));
    const onSale = (seed % 10) < 3;                 // ~30% on sale
    const isBlem = (seed % 17) === 0;               // a few blemished
    const isNew = i < NEW_CUTOFF || (seed % 13) === 0;
    const salePct = onSale ? [0.10, 0.12, 0.15, 0.18, 0.20][seed % 5] : 0;
    const price = p.price;                          // current/selling price (cents)
    const msrp = (onSale || isBlem) ? Math.round(price / (1 - (onSale ? salePct : 0.12)) / 100) * 100 : price;
    const status = p.qty === 0 ? 'out' : p.qty <= p.reorder ? 'low' : 'in';
    const rating = +(3.9 + (seed % 11) / 10).toFixed(1);
    return {
      id: p.id, cat: p.cat, catLabel: p.catLabel, brand: p.brand, title: p.model,
      sku: p.sku, price, msrp, onSale: msrp > price, isBlem, isNew,
      save: msrp - price, savePct: msrp > price ? Math.round((1 - price / msrp) * 100) : 0,
      qty: p.qty, reorder: p.reorder, status, ca: p.ca, serialized: p.serialized,
      rating, reviews: 8 + (seed % 7) * 17,
      desc: (DESC[p.cat] || DESC.acc), specs: specsFor(p),
      ffl: p.serialized,                            // serialized items require FFL transfer
      payments: Math.round(price / 100 / 4),        // 4-pay
    };
  });
  const byId = Object.fromEntries(catalog.map(p => [p.id, p]));

  const CATEGORIES = [
    { key: 'rifle', label: 'Rifles', icon: 'crosshair' },
    { key: 'pistol', label: 'Handguns', icon: 'target' },
    { key: 'shotgun', label: 'Shotguns', icon: 'crosshair' },
    { key: 'optic', label: 'Optics', icon: 'scan-eye' },
    { key: 'ammo', label: 'Ammunition', icon: 'package' },
    { key: 'acc', label: 'Accessories', icon: 'wrench' },
    { key: 'light', label: 'Lighting', icon: 'flashlight' },
    { key: 'apparel', label: 'Apparel', icon: 'shirt' },
  ];

  // -------------------------------------------------- cart (localStorage)
  const CART_KEY = 'wbt_cart_v1';
  const BIS_KEY = 'wbt_bis_v1';
  const FAV_KEY = 'wbt_fav_v1';
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const cart = {
    items() { return read(CART_KEY, {}); },          // { id: qty }
    count() { return Object.values(this.items()).reduce((a, b) => a + b, 0); },
    add(id, q = 1) { const c = this.items(); c[id] = (c[id] || 0) + q; write(CART_KEY, c); this._changed(); },
    set(id, q) { const c = this.items(); if (q <= 0) delete c[id]; else c[id] = q; write(CART_KEY, c); this._changed(); },
    remove(id) { const c = this.items(); delete c[id]; write(CART_KEY, c); this._changed(); },
    clear() { write(CART_KEY, {}); this._changed(); },
    lines() { const c = this.items(); return Object.keys(c).map(id => ({ p: byId[id], qty: c[id] })).filter(l => l.p); },
    subtotal() { return this.lines().reduce((s, l) => s + l.p.price * l.qty, 0); },
    _changed() { window.dispatchEvent(new CustomEvent('wbt:cart')); },
  };

  // -------------------------------------------------- back-in-stock
  const bis = {
    all() { return read(BIS_KEY, {}); },
    has(id) { return !!this.all()[id]; },
    subscribe(id, email) { const b = this.all(); b[id] = { email, at: Date.now() }; write(BIS_KEY, b); },
    count() { return Object.keys(this.all()).length; },
  };

  // -------------------------------------------------- favorites
  const fav = {
    all() { return read(FAV_KEY, []); },
    has(id) { return this.all().includes(id); },
    toggle(id) { let f = this.all(); f = f.includes(id) ? f.filter(x => x !== id) : f.concat(id); write(FAV_KEY, f); return f.includes(id); },
    count() { return this.all().length; },
  };

  window.WBTStore = { catalog, byId, CATEGORIES, cart, bis, fav, silo, fmt: { money, money0 } };
})();
