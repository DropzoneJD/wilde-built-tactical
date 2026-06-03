/* ============================================================================
   WILDE BUILT TACTICAL — shared mock data layer  (window.WBT)
   One consistent, California-flavored dataset for the whole command center.
   Seeded RNG => stable across reloads (no jumping charts). Pseudo-functional:
   pages read/write window.WBT and persist UI tweaks to localStorage.
   ============================================================================ */
(function () {
  // -------------------------------------------------- seeded RNG (mulberry32)
  let _s = 0x57425447; // "WBTG"
  function rnd() { _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const pick = a => a[Math.floor(rnd() * a.length)];
  const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const money = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const moneyK = c => { const d = c / 100; return d >= 1000 ? '$' + (d / 1000).toFixed(1) + 'k' : '$' + d.toFixed(0); };
  const pad = (n, w) => String(n).padStart(w, '0');

  // -------------------------------------------------- reference vocab
  const CATS = {
    rifle:  { label: 'Rifles',       icon: 'crosshair',  serialized: true },
    pistol: { label: 'Handguns',     icon: 'target',     serialized: true },
    shotgun:{ label: 'Shotguns',     icon: 'crosshair',  serialized: true },
    optic:  { label: 'Optics',       icon: 'scan-eye',   serialized: false },
    ammo:   { label: 'Ammunition',   icon: 'box',        serialized: false },
    acc:    { label: 'Accessories',  icon: 'wrench',     serialized: false },
    light:  { label: 'Lighting',     icon: 'flashlight', serialized: false },
    apparel:{ label: 'Apparel',      icon: 'shirt',      serialized: false },
  };

  const PRODUCTS = [
    // --- rifles (CA legal / featureless flavor) ---
    ['rifle','BCM','RECCE-16 KMR-A (CA Compliant)', 189900, 142000, true,  'roster'],
    ['rifle','Daniel Defense','DDM4 V7 — CA Featureless', 209900, 159000, true, 'featureless'],
    ['rifle','Ruger','AR-556 MPR Featureless', 109900, 79000, true, 'featureless'],
    ['rifle','Springfield Armory','SAINT Victor CA', 119900, 88000, true, 'featureless'],
    ['rifle','IWI','Zion-15 Featureless', 99900, 74000, true, 'featureless'],
    ['rifle','Sig Sauer','M400 TREAD CA', 114900, 86000, true, 'featureless'],
    ['rifle','Aero Precision','M4E1 Featureless Build', 124900, 92000, true, 'featureless'],
    ['rifle','Tikka','T3x Tac A1 6.5CM', 184900, 141000, true, 'rifle'],
    ['rifle','Bergara','B-14 HMR .308', 119900, 89000, true, 'rifle'],
    // --- handguns (CA roster) ---
    ['pistol','Glock','17 Gen5 (CA Roster)', 59900, 44000, true, 'roster'],
    ['pistol','Glock','19 Gen5 MOS (CA Roster)', 64900, 48000, true, 'roster'],
    ['pistol','Sig Sauer','P320 X-Compact (CA Roster)', 74900, 56000, true, 'roster'],
    ['pistol','Smith & Wesson','M&P9 M2.0 Compact', 56900, 41000, true, 'roster'],
    ['pistol','Springfield Armory','Hellcat OSP (CA Roster)', 56900, 42000, true, 'roster'],
    ['pistol','CZ','P-10 C (CA Roster)', 52900, 39000, true, 'roster'],
    ['pistol','Walther','PDP Compact', 64900, 49000, true, 'roster'],
    // --- shotguns ---
    ['shotgun','Beretta','1301 Tactical (CA)', 134900, 102000, true, 'shotgun'],
    ['shotgun','Mossberg','590 Shockwave CA', 49900, 36000, true, 'shotgun'],
    ['shotgun','Benelli','M4 Tactical (CA)', 219900, 169000, true, 'shotgun'],
    // --- optics ---
    ['optic','Aimpoint','PRO Patrol Rifle Optic', 44900, 32000, false],
    ['optic','Holosun','507C X2 Green Dot', 33900, 22000, false],
    ['optic','Holosun','HE509T-RD Enclosed', 47900, 33000, false],
    ['optic','Vortex','Strikefire II Red/Green', 24900, 16000, false],
    ['optic','Trijicon','MRO 2.0 Green Dot', 53900, 41000, false],
    ['optic','EOTech','EXPS3-0 Holographic', 73900, 58000, false],
    ['optic','Primary Arms','SLx MicroPrism 1x', 29900, 19000, false],
    ['optic','Vortex','Venom 6 MOA Red Dot', 22900, 15000, false],
    // --- ammo ---
    ['ammo','Federal','9mm 115gr FMJ — 50rd', 1899, 1100, false],
    ['ammo','PMC','5.56 X-Tac 55gr — 20rd', 1299, 800, false],
    ['ammo','Speer','Gold Dot 9mm 124gr +P — 50rd', 4499, 3000, false],
    ['ammo','Hornady','Critical Defense 9mm — 25rd', 2999, 1900, false],
    ['ammo','CCI','Mini-Mag .22LR — 100rd', 1399, 800, false],
    ['ammo','Federal','12ga 00 Buckshot — 25rd', 2799, 1800, false],
    ['ammo','Magtech','.45 ACP 230gr FMJ — 50rd', 3299, 2200, false],
    ['ammo','Hornady','6.5 Creedmoor 140gr ELD-M — 20rd', 4299, 2900, false],
    // --- accessories ---
    ['acc','Magpul','PMAG 10/30 AR/M4 (CA)', 1599, 850, false],
    ['acc','Magpul','MOE Grip', 1899, 1100, false],
    ['acc','BCM','Gunfighter Charging Handle', 8499, 6000, false],
    ['acc','Geissele','SSA-E 2-Stage Trigger', 24000, 17500, false],
    ['acc','Ferro Concepts','Slingster Sling', 4900, 3300, false],
    ['acc','Magpul','MS4 Dual QD Sling', 5999, 4200, false],
    // --- lighting (Nightstick / Streamlight / Surefire from their site) ---
    ['light','Streamlight','TLR-7A Weapon Light', 16900, 12000, false],
    ['light','Nightstick','TWM-30 Weapon-Mounted Light', 12900, 8500, false],
    ['light','Surefire','X300U-B 1000lm', 30900, 24000, false],
    ['light','Streamlight','ProTac HL-X 1000lm', 9900, 6800, false],
    // --- apparel ---
    ['apparel','Wilde Built Tactical','WBT Tactical Tee — Coyote', 2999, 1000, false],
    ['apparel','Wilde Built Tactical','WBT FlexFit Hat — Multicam', 3499, 1300, false],
    ['apparel','Wilde Built Tactical','WBT Morale Patch Set', 1499, 400, false],
  ];

  const SUPPLIERS = ['RSR Group','Lipsey\'s','Sports South','Davidson\'s','Zanders','Direct / Mfg', 'Chattanooga'];
  const BINS = ['A','B','C','D','VAULT'];

  // -------------------------------------------------- build inventory
  const inventory = PRODUCTS.map((p, i) => {
    const [cat, brand, model, price, cost, serialized, ca] = p;
    const reorder = serialized ? between(2, 5) : (cat === 'ammo' ? between(20, 60) : between(8, 20));
    // make some items intentionally low / out to drive alerts
    let qty;
    const roll = rnd();
    if (roll < 0.14) qty = 0;
    else if (roll < 0.34) qty = between(1, reorder);           // below reorder
    else qty = reorder + between(2, serialized ? 14 : 90);
    const sku = brand.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() + '-' + pad(1000 + i, 4);
    const velocity = +(rnd() * (cat === 'ammo' ? 9 : cat === 'pistol' || cat === 'rifle' ? 2.2 : 4)).toFixed(1);
    return {
      id: 'P' + pad(i + 1, 3), cat, catLabel: CATS[cat].label, icon: CATS[cat].icon,
      brand, model, sku, price, cost, serialized, ca: ca || 'none',
      qty, reorder, supplier: pick(SUPPLIERS), bin: pick(BINS) + between(1, 18),
      margin: Math.round(((price - cost) / price) * 100),
      velocity,                                   // units/day trailing
      daysCover: velocity > 0 ? Math.round(qty / velocity) : 999,
      mtdSold: between(serialized ? 0 : 8, serialized ? 14 : 220),
    };
  });
  const invById = Object.fromEntries(inventory.map(p => [p.id, p]));

  // -------------------------------------------------- customers (CA, statewide)
  const FIRST = ['Marcus','Diego','Tyler','Hector','Ryan','Cody','Jordan','Andre','Brandon','Luis','Kyle','Travis','Nathan','Sergio','Derek','Owen','Garrett','Mason','Trevor','Ivan','Wade','Colton','Beau','Rafael','Logan','Shane','Dustin','Marco','Blake','Elias'];
  const LAST = ['Reyes','Caldwell','Nguyen','Vargas','Brooks','Hahn','Salazar','Mercer','Tran','Okafor','Boyd','Castillo','Hollis','Ramos','Pruitt','Beckett','Delgado','Fowler','Quintana','Stryker','Maddox','Cortez','Ashby','Vance','Limon','Rhodes','Engel','Soto','Marsh','Yates'];
  const CITIES = ['San Diego','Escondido','Chula Vista','El Cajon','Oceanside','Carlsbad','Temecula','Riverside','Vista','Santee','La Mesa','Poway','Murrieta','Bakersfield','Fresno','Long Beach','Irvine','San Jose','Sacramento','Corona'];
  const SEGMENTS = [['vip','VIP / Collector','fde'],['regular','Regular','od'],['new','New Buyer','blue'],['lapsed','Lapsed','steel']];
  const TIERS = ['Recruit','Operator','Vanguard','Elite'];

  const customers = Array.from({ length: 64 }, (_, i) => {
    const f = pick(FIRST), l = pick(LAST);
    const orders = between(1, 22);
    const ltv = orders * between(8000, 95000);
    const seg = orders >= 10 ? SEGMENTS[0] : (rnd() < 0.2 ? SEGMENTS[3] : orders >= 4 ? SEGMENTS[1] : SEGMENTS[2]);
    const lastDays = seg[0] === 'lapsed' ? between(120, 400) : between(0, 90);
    return {
      id: 'C' + pad(1000 + i, 4), name: f + ' ' + l,
      email: (f[0] + l).toLowerCase() + '@' + pick(['gmail.com','outlook.com','proton.me','yahoo.com']) ,
      phone: '(' + pick(['619','760','858','951','661','559']) + ') ' + between(200, 989) + '-' + pad(between(0, 9999), 4),
      city: pick(CITIES) + ', CA', orders, ltv, seg: seg[0], segLabel: seg[1], segColor: seg[2],
      tier: TIERS[Math.min(3, Math.floor(orders / 6))], points: between(120, 8400),
      lastDays, fflOnFile: rnd() < 0.3, marketingOptIn: rnd() < 0.82,
    };
  }).sort((a, b) => b.ltv - a.ltv);
  const custById = Object.fromEntries(customers.map(c => [c.id, c]));

  // -------------------------------------------------- orders (online + in-store)
  const CHANNELS = [['online','Online','blue'],['instore','In-Store','fde']];
  const OSTATUS = [['fulfilled','Fulfilled','success'],['processing','Processing','amber'],['dros','DROS Hold','steel'],['ship','Shipping','blue'],['ready','Ready for Pickup','od']];
  const orders = Array.from({ length: 48 }, (_, i) => {
    const cust = pick(customers);
    const nItems = between(1, 4);
    const items = Array.from({ length: nItems }, () => { const p = pick(inventory); return { id: p.id, name: p.brand + ' ' + p.model, qty: p.serialized ? 1 : between(1, 4), price: p.price, cat: p.cat }; });
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const ch = pick(CHANNELS);
    const hasFirearm = items.some(it => invById[it.id]?.serialized);
    let st = hasFirearm && rnd() < 0.5 ? OSTATUS[2] : pick(OSTATUS);
    return {
      id: 'WBT-' + pad(74210 - i, 5), custId: cust.id, customer: cust.name, city: cust.city,
      daysAgo: i === 0 ? 0 : between(0, 30), items, nItems: items.reduce((s, it) => s + it.qty, 0),
      total, channel: ch[0], channelLabel: ch[1], channelColor: ch[2],
      status: st[0], statusLabel: st[1], statusColor: st[2], hasFirearm,
    };
  });

  // -------------------------------------------------- abandoned carts + recovery engine
  // Recovery ladder: T+1h reminder -> T+24h 5% -> T+72h 10% -> T+7d 15% final
  const RECOVERY_STAGES = [
    { key: 'reminder', label: 'Reminder Sent', wait: '1 hour', discount: 0,  channel: 'Email' },
    { key: 'd5',       label: '5% Nudge',      wait: '24 hours', discount: 5,  channel: 'Email + SMS' },
    { key: 'd10',      label: '10% Offer',     wait: '72 hours', discount: 10, channel: 'SMS' },
    { key: 'd15',      label: '15% Final Call', wait: '7 days',  discount: 15, channel: 'Email' },
  ];
  const carts = Array.from({ length: 22 }, (_, i) => {
    const cust = pick(customers);
    const nItems = between(1, 3);
    const items = Array.from({ length: nItems }, () => { const p = pick(inventory.filter(x => x.cat !== 'rifle' || rnd() < .5)); return { id: p.id, name: p.brand + ' ' + p.model, price: p.price, cat: p.cat }; });
    const value = items.reduce((s, it) => s + it.price, 0);
    const hoursAgo = between(1, 220);
    let stageIdx = hoursAgo < 1 ? 0 : hoursAgo < 24 ? 0 : hoursAgo < 72 ? 1 : hoursAgo < 168 ? 2 : 3;
    const recovered = rnd() < 0.27;
    return {
      id: 'AC-' + pad(3100 + i, 4), custId: cust.id, customer: cust.name, email: cust.email,
      items, value, hoursAgo, stageIdx, stage: RECOVERY_STAGES[stageIdx], recovered,
      optIn: cust.marketingOptIn,
    };
  }).sort((a, b) => a.hoursAgo - b.hoursAgo);

  // -------------------------------------------------- promotions / campaigns / loyalty
  const promos = [
    { code: 'RANGEDAY15', label: 'Range Day — 15% Optics', type: 'Category', scope: 'Optics', value: '15%', uses: 142, cap: 300, revenue: 1840000, status: 'active', ends: 6 },
    { code: 'CALEGAL10', label: 'CA Featureless Build Special', type: 'Category', scope: 'Rifles', value: '10%', uses: 64, cap: 150, revenue: 5210000, status: 'active', ends: 12 },
    { code: 'AMMOCAN', label: 'Bulk Ammo — Buy 3 Get 1', type: 'BOGO', scope: 'Ammunition', value: 'B3G1', uses: 318, cap: 1000, revenue: 2730000, status: 'active', ends: 3 },
    { code: 'WELCOME5', label: 'New Operator Welcome', type: 'Cart', scope: 'First Order', value: '5%', uses: 89, cap: 0, revenue: 940000, status: 'active', ends: 0 },
    { code: 'VETERAN', label: 'Military / LE Appreciation', type: 'Identity', scope: 'Verified', value: '8%', uses: 211, cap: 0, revenue: 3120000, status: 'active', ends: 0 },
    { code: 'BLACKFRI', label: 'Black Friday Doorbusters', type: 'Storewide', scope: 'Sitewide', value: '20%', uses: 0, cap: 500, revenue: 0, status: 'scheduled', ends: 175 },
    { code: 'SPRINGSND', label: 'Spring Sendoff (expired)', type: 'Storewide', scope: 'Sitewide', value: '12%', uses: 402, cap: 400, revenue: 6610000, status: 'ended', ends: -8 },
  ];
  const campaigns = [
    { name: 'Abandoned Cart Recovery', channel: 'Email + SMS', kind: 'Automation', sent: 1284, open: 61, click: 24, rev: 4120000, status: 'live' },
    { name: 'Lapsed Buyer Win-Back', channel: 'Email', kind: 'Automation', sent: 642, open: 48, click: 17, rev: 2880000, status: 'live' },
    { name: 'New Arrivals — CA Roster Drops', channel: 'Email', kind: 'Broadcast', sent: 5210, open: 54, click: 19, rev: 6340000, status: 'live' },
    { name: 'Back-in-Stock: 5.56 Bulk', channel: 'SMS', kind: 'Triggered', sent: 388, open: 88, click: 41, rev: 1910000, status: 'live' },
    { name: 'Birthday Range Credit', channel: 'Email', kind: 'Automation', sent: 96, open: 67, click: 33, rev: 720000, status: 'live' },
    { name: 'Optics Clearance Blast', channel: 'Email', kind: 'Broadcast', sent: 4980, open: 0, click: 0, rev: 0, status: 'draft' },
  ];

  // -------------------------------------------------- staff
  const staff = [
    { name: 'Cole Wilde', role: 'Owner / FFL Holder', loc: 'San Diego', sales: 0, isOwner: true, on: true, certs: ['FFL 01','CA COE','ATF Compliant'] },
    { name: 'Marcus Reyes', role: 'Store Manager', loc: 'San Diego', sales: 8420000, on: true, certs: ['DROS Cert','Range Safety'] },
    { name: 'Dani Cortez', role: 'Sales / DROS Specialist', loc: 'San Diego', sales: 6110000, on: true, certs: ['DROS Cert'] },
    { name: 'Trevor Maddox', role: 'Gunsmith', loc: 'San Diego', sales: 1740000, on: false, certs: ['Armorer: AR','Armorer: Glock'] },
    { name: 'Sergio Limon', role: 'Sales Associate', loc: 'Escondido', sales: 5230000, on: true, certs: ['DROS Cert'] },
    { name: 'Beau Ashby', role: 'Sales / Range Officer', loc: 'Escondido', sales: 4470000, on: true, certs: ['Range Safety','First Aid'] },
    { name: 'Owen Beckett', role: 'Shipping / FFL Transfers', loc: 'San Diego', sales: 980000, on: false, certs: ['Shipping Cert'] },
  ];

  // -------------------------------------------------- CA compliance / DROS pipeline
  const DROS_STATUS = [['waiting','10-Day Wait','amber'],['ready','Eligible — Release','success'],['hold','Hold / Review','danger'],['delayed','DOJ Delayed','steel']];
  const dros = Array.from({ length: 14 }, (_, i) => {
    const cust = pick(customers);
    const fire = pick(inventory.filter(p => p.serialized));
    const day = between(0, 12);
    let st;
    if (day >= 10) st = DROS_STATUS[1];
    else if (rnd() < 0.12) st = DROS_STATUS[3];
    else if (rnd() < 0.08) st = DROS_STATUS[2];
    else st = DROS_STATUS[0];
    return {
      id: 'DROS-' + pad(88100 + i, 5), customer: cust.name, custId: cust.id,
      item: fire.brand + ' ' + fire.model, serial: 'SN' + between(10000000, 99999999),
      cat: fire.catLabel, day, daysLeft: Math.max(0, 10 - day),
      status: st[0], statusLabel: st[1], statusColor: st[2],
      rosterOk: fire.cat === 'pistol' ? fire.ca === 'roster' : true,
    };
  }).sort((a, b) => b.day - a.day);

  // bound book (A&D — acquisition & disposition) sample
  const boundBook = Array.from({ length: 10 }, (_, i) => {
    const fire = pick(inventory.filter(p => p.serialized));
    const acq = rnd() < 0.6;
    return {
      line: 1420 - i, type: acq ? 'Acquisition' : 'Disposition',
      mfg: fire.brand, model: fire.model.split(' (')[0], serial: 'SN' + between(10000000, 99999999),
      cat: fire.catLabel, daysAgo: between(0, 40),
      party: acq ? pick(SUPPLIERS) : pick(customers).name,
    };
  });

  // -------------------------------------------------- KPI time series (30/90 day)
  function series(days, base, drift, noise, weekend) {
    const out = []; let v = base;
    for (let i = days; i >= 0; i--) {
      const dow = (i) % 7;
      const wk = weekend && (dow === 0 || dow === 6) ? 1.45 : 1;
      v = v + drift + (rnd() - 0.5) * noise;
      out.push({ t: i, v: Math.max(0, Math.round(v * wk)) });
    }
    return out;
  }
  const revenue90 = series(90, 920000, 1800, 260000, true);     // cents/day
  const traffic90 = series(90, 240, 0.4, 120, true);            // site sessions (x10) / foot traffic
  const orders90  = series(90, 38, 0.05, 16, true);

  const sum = (arr, n) => arr.slice(-n).reduce((s, d) => s + d.v, 0);
  const revMTD = sum(revenue90, 30);
  const revPrev = sum(revenue90.slice(0, 60), 30);

  // sales by channel + category (for donut/bars)
  const byChannel = [{ k: 'In-Store', v: 6240000, c: '#c2a17b' }, { k: 'Online', v: 4880000, c: '#4d7ea3' }, { k: 'Phone Order', v: 1310000, c: '#6b7d4a' }];
  const byCategory = [
    { k: 'Handguns', v: 3820000 }, { k: 'Rifles', v: 4310000 }, { k: 'Ammunition', v: 1960000 },
    { k: 'Optics', v: 1540000 }, { k: 'Accessories', v: 980000 }, { k: 'Lighting', v: 420000 }, { k: 'Apparel', v: 210000 },
  ];

  // -------------------------------------------------- forecast (restock intelligence)
  const forecast = inventory
    .filter(p => p.velocity > 0)
    .map(p => {
      const projected14 = Math.round(p.velocity * 14);
      const shortfall = projected14 - p.qty;
      return {
        id: p.id, name: p.brand + ' ' + p.model, cat: p.catLabel, qty: p.qty,
        velocity: p.velocity, daysCover: p.daysCover, projected14,
        recommend: shortfall > 0 ? Math.ceil(shortfall / 5) * 5 : 0,
        confidence: between(72, 96),
      };
    })
    .sort((a, b) => a.daysCover - b.daysCover);

  // -------------------------------------------------- derived headline KPIs
  const lowStock = inventory.filter(p => p.qty > 0 && p.qty <= p.reorder);
  const outStock = inventory.filter(p => p.qty === 0);
  const invValueCost = inventory.reduce((s, p) => s + p.qty * p.cost, 0);
  const invValueRetail = inventory.reduce((s, p) => s + p.qty * p.price, 0);
  const drosPending = dros.filter(d => d.status === 'waiting' || d.status === 'delayed').length;
  const drosReady = dros.filter(d => d.status === 'ready').length;
  const activeCarts = carts.filter(c => !c.recovered);
  const cartValue = activeCarts.reduce((s, c) => s + c.value, 0);

  // -------------------------------------------------- expose
  window.WBT = {
    // helpers
    fmt: { money, moneyK, pad, pct: (n) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%' },
    rnd, pick, between,
    // reference
    CATS, RECOVERY_STAGES, SUPPLIERS, TIERS,
    // collections
    inventory, invById, customers, custById, orders, carts, promos, campaigns, staff, dros, boundBook, forecast,
    // series
    series: { revenue90, traffic90, orders90, byChannel, byCategory },
    // headline numbers
    kpi: {
      revMTD, revPrev, revDelta: +(((revMTD - revPrev) / revPrev) * 100).toFixed(1),
      ordersMTD: sum(orders90, 30), aov: Math.round(revMTD / sum(orders90, 30)),
      invValueCost, invValueRetail, invUnits: inventory.reduce((s, p) => s + p.qty, 0),
      skuCount: inventory.length, lowStock: lowStock.length, outStock: outStock.length,
      drosPending, drosReady, activeCarts: activeCarts.length, cartValue,
      members: customers.length, optInRate: Math.round(customers.filter(c => c.marketingOptIn).length / customers.length * 100),
      conversion: 3.4, foot: 184,
    },
    lowStockList: lowStock, outStockList: outStock,
  };
})();
