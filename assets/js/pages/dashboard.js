/* Command Center — dashboard.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE;

  // ---------- KPI cards ----------
  const kpis = [
    { label: 'Revenue · MTD', icon: 'dollar-sign', val: F.moneyK(K.revMTD), delta: K.revDelta, accent: true, foot: 'vs prior 30 days' },
    { label: 'Orders · MTD', icon: 'receipt-text', val: K.ordersMTD.toLocaleString(), delta: 8.2, foot: 'AOV ' + F.money(K.aov) },
    { label: 'Inventory Value', icon: 'boxes', val: F.moneyK(K.invValueRetail), delta: -2.1, foot: K.invUnits.toLocaleString() + ' units · ' + K.skuCount + ' SKUs' },
    { label: 'DROS Pending', icon: 'shield-check', val: K.drosPending, delta: null, foot: K.drosReady + ' eligible to release', warn: true },
    { label: 'Carts at Risk', icon: 'shopping-cart', val: F.moneyK(K.cartValue), delta: null, foot: K.activeCarts + ' active · recovery live', warn: true },
    { label: 'Conversion', icon: 'target', val: K.conversion + '%', delta: 0.4, foot: K.foot + ' visits today' },
  ];
  document.getElementById('kpiRow').innerHTML = kpis.map(k => {
    const col = 'col-2'; // 6 across on 12-grid
    const d = k.delta === null ? '' :
      `<span class="delta ${k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat'}">
        <i data-lucide="${k.delta > 0 ? 'trending-up' : k.delta < 0 ? 'trending-down' : 'minus'}" style="width:13px;height:13px"></i>${F.pct(k.delta)}</span>`;
    return `<div class="${col}" style="grid-column:span 2"><div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value">${k.val}</div>
      <div class="stat__foot">${d}<span class="${k.warn ? '' : 'muted'}" style="${k.warn ? 'color:var(--amber)' : ''}">${k.foot}</span></div>
    </div></div>`;
  }).join('');
  // make KPI row 6-up
  document.getElementById('kpiRow').style.gridTemplateColumns = 'repeat(6,1fr)';

  // ---------- revenue chart (in-store vs online split from 90d series) ----------
  const rev = W.series.revenue90.slice(-30);
  const labels = rev.map((_, i) => 'D-' + (29 - i)).map((s, i) => i % 3 === 0 ? s : '');
  const instore = rev.map(d => Math.round(d.v * 0.57));
  const online = rev.map(d => Math.round(d.v * 0.43));
  ui.line(document.getElementById('revChart'), rev.map((_, i) => labels[i]),
    [{ label: 'In-Store', data: instore, color: P.fde, fill: true }, { label: 'Online', data: online, color: P.blue, fill: true }],
    { yMoney: true });

  // ---------- channel donut ----------
  ui.donut(document.getElementById('channelChart'),
    W.series.byChannel.map(c => c.k), W.series.byChannel.map(c => c.v),
    W.series.byChannel.map(c => c.c), { money: true });

  // ---------- category bars ----------
  const cats = W.series.byCategory.slice().sort((a, b) => b.v - a.v);
  ui.bars(document.getElementById('catChart'), cats.map(c => c.k), cats.map(c => c.v),
    { horizontal: true, money: true, colors: cats.map((_, i) => ui.hexA(P.fde, 1 - i * 0.1)) });

  // ---------- AI briefing ----------
  const brief = [
    ['trending-up', 'var(--success)', `Revenue is <b>${F.pct(K.revDelta)}</b> vs the prior 30 days — Rifles & Optics leading. Escondido outpacing SD by 11%.`],
    ['flame', 'var(--amber)', `<b>5.56 bulk ammo</b> velocity up 34% this week. Only <b>${W.invById['P029']?.qty ?? '12'} cases</b> of cover left — restock flagged.`],
    ['shopping-cart', 'var(--fde)', `<b>${K.activeCarts} carts</b> (${F.moneyK(K.cartValue)}) in the recovery ladder. 5 hit the 10% offer stage overnight.`],
    ['shield-alert', 'var(--danger)', `<b>${K.drosReady} DROS</b> cleared the 10-day wait — ready for pickup. 1 transaction flagged for DOJ review.`],
  ];
  document.getElementById('briefing').innerHTML = brief.map(([ic, c, t]) =>
    `<div class="brief-line"><i data-lucide="${ic}" style="color:${c}"></i><div>${t}</div></div>`).join('') +
    `<button class="btn btn--ghost btn--sm w-full mt-16" onclick="WBT.ui.toast('Full briefing generated (demo)','brain-circuit')"><i data-lucide="sparkles"></i> Generate full briefing</button>`;

  // ---------- restock alerts ----------
  const lows = W.lowStockList.concat(W.outStockList).slice(0, 6);
  document.getElementById('restock').innerHTML = lows.map(p => {
    const out = p.qty === 0;
    return `<div class="mini-stat">
      <div style="min-width:0"><div class="t-strong" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">${p.brand} ${p.model}</div>
        <div class="tiny mono muted">${p.sku} · ${p.catLabel}</div></div>
      <span class="tag ${out ? 'tag--danger' : 'tag--amber'}">${out ? 'OUT' : p.qty + ' left'}</span>
    </div>`;
  }).join('') + `<a href="forecast.html" class="btn btn--ghost btn--sm w-full mt-16"><i data-lucide="radar"></i> View forecast</a>`;

  // ---------- orders table ----------
  const recent = W.orders.slice(0, 7);
  document.getElementById('ordersTable').innerHTML =
    `<thead><tr><th>Order</th><th>Customer</th><th>Channel</th><th>Items</th><th class="num">Total</th><th>Status</th></tr></thead><tbody>` +
    recent.map(o => `<tr class="clickable" onclick="WBT.ui.toast('Opening ${o.id} (demo)','receipt-text')">
      <td class="mono t-strong">${o.id}</td>
      <td>${o.customer}<div class="tiny muted">${o.city}</div></td>
      <td><span class="tag tag--${o.channelColor}">${o.channelLabel}</span></td>
      <td class="num">${o.nItems}</td>
      <td class="num t-strong">${F.money(o.total)}</td>
      <td><span class="tag tag--${o.statusColor}"><span class="dot"></span>${o.statusLabel}</span></td>
    </tr>`).join('') + `</tbody>`;

  // ---------- compliance snapshot ----------
  document.getElementById('compliance').innerHTML = `
    <div class="kv"><span class="muted">10-Day waits active</span><b style="color:var(--amber)">${K.drosPending}</b></div>
    <div class="kv"><span class="muted">Eligible to release</span><b style="color:var(--success)">${K.drosReady}</b></div>
    <div class="kv"><span class="muted">DOJ delayed / hold</span><b>${W.dros.filter(d => d.status === 'delayed' || d.status === 'hold').length}</b></div>
    <div class="kv"><span class="muted">Roster compliance</span><b style="color:var(--success)">100%</b></div>
    <div class="mt-16"><div class="flex justify-between tiny mono muted mb-8"><span>BOUND BOOK INTEGRITY</span><span>99.4%</span></div>
      <div class="meter is-fde"><span style="width:99.4%"></span></div></div>`;

  // ---------- carts snapshot ----------
  const acative = W.carts.filter(c => !c.recovered).slice(0, 3);
  document.getElementById('carts').innerHTML = acative.map(c => `
    <div class="mini-stat">
      <div style="min-width:0"><div class="t-strong" style="font-size:12.5px">${c.customer}</div>
        <div class="tiny mono muted">${c.stage.label} · ${c.stage.discount ? c.stage.discount + '% off' : 'reminder'}</div></div>
      <b class="mono">${F.money(c.value)}</b>
    </div>`).join('') +
    `<button class="btn btn--amber btn--sm w-full mt-16" onclick="WBT.ui.toast('Recovery sequence advanced (demo)','zap')"><i data-lucide="zap"></i> Run recovery now</button>`;

  // ---------- clock ----------
  function tick() {
    const d = new Date();
    const el = document.getElementById('clock');
    if (el) el.textContent = d.toLocaleTimeString('en-US', { hour12: false }) + ' PST';
  }
  tick(); setInterval(tick, 1000);

  ui.icons();
})();
