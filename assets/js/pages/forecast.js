/* Forecast Intelligence — forecast.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, P = ui.PALETTE;
  const FC = W.forecast;                 // already sorted by daysCover asc
  const INV = W.invById;

  // ----- shared cover-risk classifier (danger <7, amber <21, od else) -----
  function coverClass(dc) { return dc < 7 ? 'is-low' : dc < 21 ? 'is-mid' : ''; }
  function coverTone(dc) { return dc < 7 ? 'var(--danger)' : dc < 21 ? 'var(--amber)' : 'var(--success)'; }
  function coverPct(dc) { return Math.max(4, Math.min(100, Math.round((dc / 30) * 100))); }

  // ----- derived KPI inputs --------------------------------------------------
  const atRisk = FC.filter(f => f.daysCover <= 14);
  const reorderUnits = FC.reduce((s, f) => s + f.recommend, 0);
  const stockoutValue = atRisk.reduce((s, f) => s + f.qty * (INV[f.id] ? INV[f.id].price : 0), 0);
  const fastest = FC.slice().sort((a, b) => b.velocity - a.velocity)[0];
  const meanConf = Math.round(FC.reduce((s, f) => s + f.confidence, 0) / FC.length);
  const fcAccuracy = 91.4;

  document.getElementById('fcCohort').textContent = 'SCORING ' + FC.length + ' SKUs';

  // ----- KPI cards -----------------------------------------------------------
  const kpis = [
    { label: 'SKUs at Risk', icon: 'alert-triangle', val: atRisk.length, delta: null, foot: '≤ 14d cover remaining', warn: true },
    { label: 'Reorder Units', icon: 'package-plus', val: reorderUnits.toLocaleString(), accent: true, delta: 12.6, foot: 'recommended across queue' },
    { label: 'Forecast Accuracy', icon: 'target', val: fcAccuracy + '%', delta: 1.8, foot: 'trailing 30d · MAPE 8.6%' },
    { label: 'Stockout Risk', icon: 'shield-alert', val: F.moneyK(stockoutValue), delta: null, foot: 'at-risk retail exposure', warn: true },
    { label: 'Fastest Mover', icon: 'flame', val: fastest.velocity.toFixed(1), unit: '/day', delta: null, foot: shortName(fastest.name) },
    { label: 'Model Confidence', icon: 'gauge', val: meanConf + '%', delta: 0.9, foot: 'mean across cohort' },
  ];
  document.getElementById('kpiRow').innerHTML = kpis.map(k => {
    const d = k.delta === null ? '' :
      `<span class="delta ${k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat'}">
        <i data-lucide="${k.delta > 0 ? 'trending-up' : k.delta < 0 ? 'trending-down' : 'minus'}" style="width:13px;height:13px"></i>${F.pct(k.delta)}</span>`;
    return `<div style="grid-column:span 2"><div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value">${k.val}${k.unit ? `<small>${k.unit}</small>` : ''}</div>
      <div class="stat__foot">${d}<span class="${k.warn ? '' : 'muted'}" style="${k.warn ? 'color:var(--amber)' : ''};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px">${k.foot}</span></div>
    </div></div>`;
  }).join('');
  document.getElementById('kpiRow').style.gridTemplateColumns = 'repeat(6,1fr)';

  function shortName(n) { return n.length > 22 ? n.slice(0, 21) + '…' : n; }

  // ========================================================================
  // DEMAND CHART — historical (solid) + projected tail (dashed) + selector
  // ========================================================================
  let demandChart = null;
  const HIST = 56;     // history points shown
  const TAIL = 14;     // projected points

  // per-category scaling factors (proxy splits of the orders series → unit demand)
  const SERIES_CFG = {
    orders: { base: W.series.orders90, mult: 1.0, color: P.fde, hint: '90d order history → 14d projection', noise: 0.10 },
    rifle:  { base: W.series.orders90, mult: 0.22, color: P.od, hint: 'Rifle units · seasonal CA-build demand', noise: 0.18 },
    ammo:   { base: W.series.orders90, mult: 1.85, color: P.amber, hint: 'Ammunition cases · high-velocity SKU class', noise: 0.14 },
    optic:  { base: W.series.orders90, mult: 0.46, color: P.blue, hint: 'Optics units · attach-rate driven', noise: 0.16 },
    pistol: { base: W.series.orders90, mult: 0.58, color: P.steel, hint: 'Handgun units · roster-gated demand', noise: 0.15 },
  };

  function buildDemand(key) {
    const cfg = SERIES_CFG[key];
    const raw = cfg.base.slice(-HIST);
    // scale history into a category-shaped unit series (deterministic via WBT.rnd seed)
    const hist = raw.map((d, i) => {
      const wobble = 1 + (W.rnd() - 0.5) * cfg.noise;
      return Math.max(0, Math.round(d.v * cfg.mult * wobble));
    });
    // projection: drift from trailing mean with slight upward bias + widening band
    const tailMean = hist.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const slope = (hist[hist.length - 1] - hist[hist.length - 12]) / 12;
    const proj = [];
    for (let i = 1; i <= TAIL; i++) {
      const trend = tailMean + slope * i * 0.6;
      const seasonal = 1 + Math.sin(i / 3) * 0.05;
      proj.push(Math.max(0, Math.round(trend * seasonal)));
    }
    return { hist, proj, cfg };
  }

  function renderDemand(key) {
    const { hist, proj, cfg } = buildDemand(key);
    document.getElementById('demandHint').textContent = cfg.hint;

    // labels: D-56 .. D-1 (history), then F+1 .. F+14 (forecast)
    const labels = [];
    for (let i = hist.length; i >= 1; i--) labels.push('D-' + i);
    for (let i = 1; i <= proj.length; i++) labels.push('F+' + i);

    // actual dataset: real over history, null over the tail
    const actualData = hist.concat(new Array(proj.length).fill(null));
    // forecast dataset: null over history (except join point) then projection
    const fcData = new Array(hist.length - 1).fill(null)
      .concat([hist[hist.length - 1]])   // bridge so the dashed line connects
      .concat(proj);

    if (demandChart) { demandChart.destroy(); demandChart = null; }
    demandChart = ui.line(document.getElementById('demandChart'), labels,
      [
        { label: 'Actual', data: actualData, color: cfg.color, fill: true },
        { label: 'Forecast', data: fcData, color: P.amber, fill: false },
      ],
      {
        chart: {
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 9 } },
            y: { grid: { color: P.grid }, beginAtZero: true, ticks: { precision: 0 } },
          },
        },
      });
    // make the forecast dataset dashed + lightly banded after creation
    if (demandChart) {
      const fd = demandChart.data.datasets[1];
      fd.borderDash = [5, 4];
      fd.borderWidth = 2;
      fd.pointRadius = 0;
      const ctx = document.getElementById('demandChart').getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 270);
      g.addColorStop(0, ui.hexA(P.amber, .16)); g.addColorStop(1, ui.hexA(P.amber, 0));
      fd.backgroundColor = g; fd.fill = true;
      demandChart.update('none');
    }
  }

  document.getElementById('demandSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#demandSeg button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    renderDemand(b.dataset.s);
  });
  renderDemand('orders');

  // ========================================================================
  // RESTOCK RECOMMENDATIONS TABLE (+ filter)
  // ========================================================================
  const CAT_ICON = { Rifles: 'crosshair', Handguns: 'target', Shotguns: 'crosshair', Optics: 'scan-eye', Ammunition: 'box', Accessories: 'wrench', Lighting: 'flashlight', Apparel: 'shirt' };
  const CAT_TONE = { Rifles: 'od', Handguns: 'fde', Shotguns: 'steel', Optics: 'blue', Ammunition: 'amber', Accessories: 'steel', Lighting: 'fde', Apparel: 'success' };

  let curFilter = 'all';
  function passFilter(f) {
    if (curFilter === 'crit') return f.daysCover < 7;
    if (curFilter === 'warn') return f.daysCover >= 7 && f.daysCover < 21;
    if (curFilter === 'rec') return f.recommend > 0;
    return true;
  }

  function renderTable() {
    const rows = FC.filter(passFilter);
    const head = `<thead><tr>
      <th>Product</th><th>Category</th><th class="num">On Hand</th><th class="num">Velocity /d</th>
      <th style="min-width:140px">Days Cover</th><th class="num">Proj 14d</th><th class="num">Recommend</th>
      <th style="min-width:130px">Confidence</th><th></th></tr></thead>`;
    const body = '<tbody>' + rows.map(f => {
      const tone = CAT_TONE[f.cat] || 'steel';
      const ic = CAT_ICON[f.cat] || 'box';
      const cls = coverClass(f.daysCover);
      const confCls = f.confidence >= 88 ? 'is-fde' : f.confidence >= 80 ? 'is-mid' : 'is-low';
      return `<tr class="clickable" onclick="WBT.fc.detail('${f.id}')">
        <td><div class="t-strong" style="max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
            <div class="tiny mono muted">${f.id} · on-hand ${f.qty}</div></td>
        <td><span class="tag tag--${tone}"><i data-lucide="${ic}" style="width:12px;height:12px"></i>${f.cat}</span></td>
        <td class="num">${f.qty}</td>
        <td class="num">${f.velocity.toFixed(1)}</td>
        <td>
          <div class="flex items-center gap-8">
            <div class="meter ${cls}" style="flex:1 1 auto"><span style="width:${coverPct(f.daysCover)}%"></span></div>
            <b class="mono" style="color:${coverTone(f.daysCover)};font-size:12px;min-width:34px;text-align:right">${f.daysCover}d</b>
          </div>
        </td>
        <td class="num">${f.projected14}</td>
        <td class="num ${f.recommend > 0 ? 'rec-hot' : 'muted'}">${f.recommend > 0 ? '+' + f.recommend : '—'}</td>
        <td>
          <div class="conf-cell"><div class="meter ${confCls}"><span style="width:${f.confidence}%"></span></div>
            <b class="mono tiny" style="min-width:30px">${f.confidence}%</b></div>
        </td>
        <td class="text-right nowrap">
          <button class="btn btn--ghost btn--sm" onclick="event.stopPropagation();WBT.fc.createPO('${f.id}')"><i data-lucide="file-plus-2"></i> PO</button>
        </td>
      </tr>`;
    }).join('');
    document.getElementById('restockTable').innerHTML = head + body + '</tbody>';

    const sumRec = rows.reduce((s, f) => s + f.recommend, 0);
    document.getElementById('restockFoot').textContent =
      rows.length + ' SKUs in view · ' + sumRec.toLocaleString() + ' units recommended · sorted by days-cover ↑';
    ui.icons();
  }

  document.getElementById('riskSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#riskSeg button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    curFilter = b.dataset.f;
    renderTable();
  });
  renderTable();

  // ----- per-row actions / detail modal -------------------------------------
  W.fc = {
    createPO(id) {
      const f = FC.find(x => x.id === id); if (!f) return;
      const inv = INV[id] || {};
      const qty = f.recommend > 0 ? f.recommend : Math.max(5, Math.ceil(f.velocity * 14 / 5) * 5);
      const cost = (inv.cost || 0) * qty;
      ui.modal(`
        <div class="panel__head"><span class="stencil"><i data-lucide="file-plus-2" style="width:14px;height:14px"></i> Draft Purchase Order</span>
          <div class="right"><button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div></div>
        <div class="panel__body">
          <div class="t-strong" style="font-size:15px">${f.name}</div>
          <div class="tiny mono muted mb-16">${f.id} · ${f.cat} · supplier ${inv.supplier || '—'}</div>
          <div class="grid grid-2" style="gap:10px">
            <div class="kv"><span class="muted">On hand</span><b>${f.qty}</b></div>
            <div class="kv"><span class="muted">Days cover</span><b style="color:${coverTone(f.daysCover)}">${f.daysCover}d</b></div>
            <div class="kv"><span class="muted">Velocity</span><b>${f.velocity.toFixed(1)}/day</b></div>
            <div class="kv"><span class="muted">Proj. 14d demand</span><b>${f.projected14}</b></div>
            <div class="kv"><span class="muted">Order qty</span><b style="color:var(--amber)">${qty}</b></div>
            <div class="kv"><span class="muted">Est. unit cost</span><b>${F.money(inv.cost || 0)}</b></div>
          </div>
          <div class="alert alert--od mt-16"><i data-lucide="info"></i>
            <div>Estimated PO value <b style="color:var(--od-bright)">${F.money(cost)}</b> at ${f.confidence}% model confidence. Lead time ~7–10 days from ${inv.supplier || 'distributor'}.</div></div>
          <div class="flex gap-8 mt-16">
            <button class="btn btn--block" onclick="WBT.ui.closeModal()">Cancel</button>
            <button class="btn btn--amber btn--block" onclick="WBT.ui.closeModal();WBT.ui.toast('PO drafted for ${f.id} · ${qty} units','check-check')"><i data-lucide="send"></i> Submit PO</button>
          </div>
        </div>`);
    },
    detail(id) {
      const f = FC.find(x => x.id === id); if (!f) return;
      const inv = INV[id] || {};
      const cls = coverClass(f.daysCover);
      ui.modal(`
        <div class="panel__head"><span class="stencil"><i data-lucide="radar" style="width:14px;height:14px"></i> Demand Profile</span>
          <div class="right"><span class="tag tag--${CAT_TONE[f.cat] || 'steel'}">${f.cat}</span>
            <button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div></div>
        <div class="panel__body">
          <div class="t-strong" style="font-size:16px">${f.name}</div>
          <div class="tiny mono muted mb-16">${f.id} · SKU ${inv.sku || '—'} · bin ${inv.bin || '—'}</div>
          <div class="mb-16">
            <div class="flex justify-between tiny mono muted mb-8"><span>DAYS OF COVER</span><span style="color:${coverTone(f.daysCover)}">${f.daysCover} DAYS</span></div>
            <div class="meter ${cls} meter--tall"><span style="width:${coverPct(f.daysCover)}%"></span></div>
          </div>
          <div class="grid grid-2" style="gap:10px">
            <div class="kv"><span class="muted">On hand</span><b>${f.qty}</b></div>
            <div class="kv"><span class="muted">Velocity</span><b>${f.velocity.toFixed(1)}/day</b></div>
            <div class="kv"><span class="muted">Proj. 14d demand</span><b>${f.projected14}</b></div>
            <div class="kv"><span class="muted">Recommend</span><b style="color:${f.recommend > 0 ? 'var(--amber)' : 'var(--muted)'}">${f.recommend > 0 ? '+' + f.recommend + ' units' : 'hold'}</b></div>
            <div class="kv"><span class="muted">Confidence</span><b>${f.confidence}%</b></div>
            <div class="kv"><span class="muted">Retail / unit</span><b>${F.money(inv.price || 0)}</b></div>
          </div>
          <div class="flex gap-8 mt-16">
            <button class="btn btn--block" onclick="WBT.ui.closeModal();WBT.ui.toast('Snoozed ${f.id} for 7 days','clock')"><i data-lucide="clock"></i> Snooze</button>
            <button class="btn btn--amber btn--block" onclick="WBT.ui.closeModal();WBT.fc.createPO('${f.id}')"><i data-lucide="file-plus-2"></i> Create PO</button>
          </div>
        </div>`, { lg: false });
    },
  };

  // ----- "Approve all reorders" header action --------------------------------
  document.getElementById('approveAll').addEventListener('click', () => {
    const n = FC.filter(f => f.recommend > 0).length;
    ui.toast(n + ' reorders approved · ' + reorderUnits.toLocaleString() + ' units → PO queue', 'check-check');
  });

  // ========================================================================
  // MODEL BENCH — LightGBM vs Prophet vs 3-Signal Blend
  // ========================================================================
  const MODELS = [
    { key: 'lgbm', name: 'LightGBM', sub: 'gradient boosted', mape: 8.6, acc: 91.4, winner: true, tone: 'is-fde' },
    { key: 'prophet', name: 'Prophet', sub: 'additive seasonal', mape: 10.9, acc: 89.1, winner: false, tone: 'is-mid' },
    { key: 'blend', name: '3-Signal Blend', sub: 'curve · dow · yoy', mape: 12.4, acc: 87.6, winner: false, tone: '' },
  ];
  document.getElementById('modelBench').innerHTML =
    MODELS.map(m => `
      <div class="bench-row">
        <div class="bench-top">
          <div class="flex items-center gap-8">
            <span class="t-strong" style="font-size:13.5px">${m.name}</span>
            ${m.winner ? '<span class="tag tag--solid" style="padding:1px 7px"><i data-lucide="trophy" style="width:11px;height:11px"></i> WINNER</span>' : ''}
          </div>
          <b class="mono" style="font-size:12.5px;color:${m.winner ? 'var(--fde)' : 'var(--text)'}">${m.acc}%</b>
        </div>
        <div class="meter ${m.tone}"><span style="width:${m.acc}%"></span></div>
        <div class="flex justify-between mt-8 tiny mono muted"><span>${m.sub}</span><span>MAPE ${m.mape}%</span></div>
      </div>`).join('') +
    `<div class="flex justify-between items-center mt-16">
       <div class="wfor"><i data-lucide="history" style="width:13px;height:13px"></i> trained 06:00 PST · 412d data</div>
       <span class="tag tag--od tag--ghost">Δ +2.4pt</span>
     </div>
     <button class="btn btn--ghost btn--sm w-full mt-16" onclick="WBT.ui.toast('Shadow grade running — paired vs blend (demo)','flask-conical')"><i data-lucide="flask-conical"></i> Run shadow grade</button>`;

  // ========================================================================
  // CATEGORY DEMAND BARS — byCategory as 14d projected-demand proxy
  // ========================================================================
  const cats = W.series.byCategory.slice().sort((a, b) => b.v - a.v);
  ui.bars(document.getElementById('catDemandChart'), cats.map(c => c.k), cats.map(c => c.v),
    { horizontal: true, money: true, colors: cats.map((_, i) => ui.hexA(P.fde, 1 - i * 0.1)) });

  // ========================================================================
  // SIGNAL BLEND — driver weights
  // ========================================================================
  const SIGNALS = [
    ['curve', 'Lead-Time Curve', 34, 'is-fde'],
    ['dow', 'Day-of-Week', 21, 'is-mid'],
    ['yoy', 'Year-over-Year', 18, ''],
    ['model', 'ML Model (LGBM)', 27, 'is-fde'],
  ];
  document.getElementById('signalBlend').innerHTML =
    SIGNALS.map(([k, label, w, tone]) => `
      <div class="mb-16">
        <div class="flex justify-between tiny mono mb-8"><span class="upper" style="color:var(--text-soft)">${label}</span><span class="muted">${w}%</span></div>
        <div class="meter ${tone}"><span style="width:${w}%"></span></div>
      </div>`).join('') +
    `<div class="kv mt-8"><span class="muted">Blend bias correction</span><b style="color:var(--success)">−1.2%</b></div>
     <div class="kv"><span class="muted">Calibration factor</span><b>0.98×</b></div>
     <div class="kv"><span class="muted">Last drift check</span><b style="color:var(--success)">PASS</b></div>`;

  // ========================================================================
  // FORECAST ALERTS — derived from at-risk + velocity outliers
  // ========================================================================
  const crit = FC.filter(f => f.daysCover < 7).slice(0, 1)[0];
  const surge = FC.slice().sort((a, b) => (b.projected14 - b.qty) - (a.projected14 - a.qty))[0];
  const alerts = [
    ['siren', 'danger', crit ? `<b>${shortName(crit.name)}</b> at <b>${crit.daysCover}d</b> of cover — projected ${crit.projected14}u vs ${crit.qty}u on hand. Reorder <b>+${crit.recommend || 'now'}</b> before stockout.`
      : `No SKUs under the 7-day critical threshold. ${atRisk.length} on the 14-day watchlist.`],
    ['trending-up', 'amber', surge ? `Demand surge on <b>${shortName(surge.name)}</b> — 14d projection exceeds on-hand by <b>${Math.max(0, surge.projected14 - surge.qty)} units</b>. Velocity ${surge.velocity.toFixed(1)}/day.` : 'Demand within expected band across cohort.'],
    ['shield-check', 'od', `Model confidence holding at <b>${meanConf}%</b> mean across ${FC.length} SKUs. LightGBM leads the bench by <b>+2.4pt</b> accuracy over the 3-signal blend.`],
  ];
  document.getElementById('fcAlerts').innerHTML = alerts.map(([ic, c, t]) =>
    `<div class="alert alert--${c}"><i data-lucide="${ic}"></i><div>${t}</div></div>`).join('') +
    `<div class="flex gap-8">
       <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Watchlist synced to Armory (demo)','radar')"><i data-lucide="radar"></i> Sync watchlist</button>
       <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Reorder digest emailed to Ray Calhoun (demo)','mail')"><i data-lucide="mail"></i> Email digest</button>
     </div>`;

  // ----- clock --------------------------------------------------------------
  function tick() {
    const el = document.getElementById('fcClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' PST';
  }
  tick(); setInterval(tick, 1000);

  // ----- horizon seg (rescales KPI accuracy framing — light real effect) ----
  document.getElementById('hzSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#hzSeg button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    ui.toast('Forecast horizon set to ' + b.textContent + ' (demo)', 'calendar-range');
  });

  ui.icons();
})();
