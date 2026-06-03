/* The Armory — inventory.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE, CATS = W.CATS;

  // ---------- derived: avg margin across the catalog ----------
  const avgMargin = Math.round(W.inventory.reduce((s, p) => s + p.margin, 0) / W.inventory.length);

  // ---------- KPI cards (6-up, mirrors dashboard pattern) ----------
  const kpis = [
    { label: 'Total SKUs', icon: 'boxes', val: K.skuCount.toLocaleString(), delta: 2.4, accent: true, foot: 'tracked across 2 stores' },
    { label: 'Inventory Value', icon: 'dollar-sign', val: F.moneyK(K.invValueRetail), delta: -2.1, foot: 'retail · ' + F.moneyK(K.invValueCost) + ' at cost' },
    { label: 'Units on Hand', icon: 'package', val: K.invUnits.toLocaleString(), delta: 1.6, foot: 'sellable units in stock' },
    { label: 'Low Stock', icon: 'alert-triangle', val: K.lowStock, delta: null, warn: true, foot: 'at / below reorder point' },
    { label: 'Out of Stock', icon: 'package-x', val: K.outStock, delta: null, danger: true, foot: 'zero on hand — restock' },
    { label: 'Avg Margin', icon: 'percent', val: avgMargin + '%', delta: 0.8, foot: 'blended retail margin' },
  ];
  document.getElementById('kpiRow').innerHTML = kpis.map(k => {
    const d = k.delta === null ? '' :
      `<span class="delta ${k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat'}">
        <i data-lucide="${k.delta > 0 ? 'trending-up' : k.delta < 0 ? 'trending-down' : 'minus'}" style="width:13px;height:13px"></i>${F.pct(k.delta)}</span>`;
    const footColor = k.danger ? 'color:var(--danger)' : k.warn ? 'color:var(--amber)' : '';
    return `<div style="grid-column:span 2"><div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value">${k.val}</div>
      <div class="stat__foot">${d}<span class="${(k.warn || k.danger) ? '' : 'muted'}" style="${footColor}">${k.foot}</span></div>
    </div></div>`;
  }).join('');
  document.getElementById('kpiRow').style.gridTemplateColumns = 'repeat(6,1fr)';

  // ---------- category filter buttons (All + each CAT) ----------
  const catKeys = Object.keys(CATS);
  document.getElementById('catSegs').innerHTML =
    `<button class="btn btn--sm is-on" data-cat="all"><i data-lucide="layout-grid"></i> All</button>` +
    catKeys.map(c => `<button class="btn btn--sm" data-cat="${c}"><i data-lucide="${CATS[c].icon}"></i> ${CATS[c].label}</button>`).join('');

  // ---------- filter state ----------
  const state = { cat: 'all', status: 'all', q: '' };

  function statusOf(p) { return p.qty === 0 ? 'out' : p.qty <= p.reorder ? 'low' : 'in'; }

  function caTag(p) {
    if (p.ca === 'roster') return `<span class="tag tag--fde">CA Roster</span>`;
    if (p.ca === 'featureless') return `<span class="tag tag--amber">Featureless</span>`;
    return `<span class="tag tag--steel">${p.serialized ? 'CA Legal' : 'OTC'}</span>`;
  }

  function statusTag(p) {
    const s = statusOf(p);
    if (s === 'out') return `<span class="tag tag--danger"><span class="dot"></span>Out</span>`;
    if (s === 'low') return `<span class="tag tag--amber"><span class="dot"></span>Low</span>`;
    return `<span class="tag tag--success"><span class="dot"></span>In Stock</span>`;
  }

  function stockMeter(p) {
    // fill is qty relative to 2x reorder (cap full); color by level vs reorder
    const cap = Math.max(p.reorder * 2, 1);
    const pct = Math.max(4, Math.min(100, Math.round((p.qty / cap) * 100)));
    const cls = p.qty <= p.reorder ? 'is-low' : p.qty <= p.reorder * 2 ? 'is-mid' : 'is-fde';
    return `<div class="meter ${cls}"><span style="width:${pct}%"></span></div>`;
  }

  function daysCoverCell(p) {
    if (p.qty === 0) return `<span class="num" style="color:var(--danger)">0d</span>`;
    const dc = p.daysCover;
    const color = dc < 7 ? 'var(--danger)' : dc < 21 ? 'var(--amber)' : 'var(--text)';
    const disp = dc >= 999 ? '∞' : dc + 'd';
    return `<span class="num" style="color:${color}">${disp}</span>`;
  }

  function rowHTML(p) {
    const sn = p.serialized ? `<div class="sn-flag"><i data-lucide="shield"></i> Serialized · A&D</div>` : '';
    return `<tr class="clickable" data-id="${p.id}">
      <td>
        <div class="cell-prod">
          <div class="prod-thumb"><i data-lucide="${p.icon}"></i></div>
          <div style="min-width:0">
            <div class="t-strong">${p.brand}</div>
            <div class="tiny muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px">${p.model}</div>
            ${sn}
          </div>
        </div>
      </td>
      <td class="sku">${p.sku}</td>
      <td><span class="tag tag--ghost">${p.catLabel}</span></td>
      <td>${caTag(p)}</td>
      <td class="stock-cell">
        <div class="stock-qty">${p.qty}<span class="muted" style="font-size:11px;font-weight:400"> u</span></div>
        ${stockMeter(p)}
      </td>
      <td class="num muted">${F.money(p.cost)}</td>
      <td class="num t-strong">${F.money(p.price)}</td>
      <td class="num" style="color:${p.margin >= 30 ? 'var(--success)' : p.margin >= 20 ? 'var(--text)' : 'var(--amber)'}">${p.margin}%</td>
      <td class="num">${p.velocity.toFixed(1)}<span class="faint">/d</span></td>
      <td>${daysCoverCell(p)}</td>
      <td>${statusTag(p)}</td>
    </tr>`;
  }

  const THEAD = `<thead><tr>
      <th>Product</th><th>SKU</th><th>Category</th><th>CA Flag</th><th>Stock</th>
      <th class="num">Cost</th><th class="num">Price</th><th class="num">Margin</th>
      <th class="num">Velocity</th><th class="num">Cover</th><th>Status</th>
    </tr></thead>`;

  const tableEl = document.getElementById('armTable');
  const resultTag = document.getElementById('resultTag');

  function applyFilters() {
    const q = state.q.trim().toLowerCase();
    const rows = W.inventory.filter(p => {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (state.status !== 'all' && statusOf(p) !== state.status) return false;
      if (q && !(p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))) return false;
      return true;
    });
    const body = rows.length
      ? rows.map(rowHTML).join('')
      : `<tr class="empty-row"><td colspan="11"><i data-lucide="search-x" style="width:20px;height:20px;vertical-align:-4px"></i> No products match the current filters.</td></tr>`;
    tableEl.innerHTML = THEAD + `<tbody>${body}</tbody>`;
    resultTag.textContent = rows.length + (rows.length === 1 ? ' ITEM' : ' ITEMS');
    ui.icons();
  }

  // ---------- toolbar wiring (all three filters compose) ----------
  document.getElementById('armSearch').addEventListener('input', e => { state.q = e.target.value; applyFilters(); });

  document.getElementById('statusSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    e.currentTarget.querySelectorAll('button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    state.status = b.dataset.st; applyFilters();
  });

  document.getElementById('catSegs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    e.currentTarget.querySelectorAll('button').forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on');
    state.cat = b.dataset.cat; applyFilters();
  });

  document.getElementById('btnClear').addEventListener('click', () => {
    state.cat = 'all'; state.status = 'all'; state.q = '';
    document.getElementById('armSearch').value = '';
    document.querySelectorAll('#statusSeg button').forEach(x => x.classList.toggle('is-active', x.dataset.st === 'all'));
    document.querySelectorAll('#catSegs button').forEach(x => x.classList.toggle('is-on', x.dataset.cat === 'all'));
    applyFilters();
    ui.toast('Filters reset', 'rotate-ccw');
  });

  // ---------- row click -> product detail modal ----------
  tableEl.addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    openProduct(tr.dataset.id);
  });

  function openProduct(id) {
    const p = W.invById[id]; if (!p) return;
    const s = statusOf(p);
    const stTag = s === 'out' ? `<span class="tag tag--danger"><span class="dot"></span>Out of Stock</span>`
      : s === 'low' ? `<span class="tag tag--amber"><span class="dot"></span>Low Stock</span>`
      : `<span class="tag tag--success"><span class="dot"></span>In Stock</span>`;
    // deterministic-ish 14-pt stock history sparkline trending into current qty
    const hist = [];
    let v = p.qty + Math.round(p.velocity * 12) + 4;
    for (let i = 0; i < 14; i++) { v = Math.max(0, v - p.velocity + (W.rnd() - 0.45) * Math.max(1, p.velocity)); hist.push(Math.round(v)); }
    hist[hist.length - 1] = p.qty;
    const sparkColor = s === 'out' ? P.danger : s === 'low' ? P.amber : P.fde;
    const dcDisp = p.daysCover >= 999 ? '∞' : p.daysCover + ' days';

    ui.modal(`
      <div class="panel__head">
        <span class="stencil"><i data-lucide="${p.icon}" style="width:14px;height:14px"></i> ${p.catLabel} · ${p.sku}</span>
        <div class="right"><button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
      </div>
      <div class="panel__body">
        <div class="flex items-center justify-between gap-12 wrap mb-16">
          <div style="min-width:0">
            <div style="font-family:var(--f-display);font-weight:800;font-size:22px;letter-spacing:.5px">${p.brand}</div>
            <div class="muted">${p.model}</div>
          </div>
          <div class="flex gap-8 items-center wrap">${caTag(p)} ${stTag}${p.serialized ? '<span class="tag tag--steel"><i data-lucide="lock" style="width:11px;height:11px"></i> A&D</span>' : ''}</div>
        </div>

        <div class="flex gap-12 wrap mb-16">
          <div style="flex:1 1 150px;min-width:140px">
            <div class="tiny mono muted mb-8">90-DAY STOCK TREND</div>
            <div class="chart-box" style="height:64px"><canvas id="pSpark"></canvas></div>
          </div>
          <div style="flex:1 1 150px;min-width:140px">
            <div class="tiny mono muted mb-8">ON HAND vs REORDER</div>
            <div class="stock-qty" style="font-size:26px">${p.qty}<span class="muted" style="font-size:13px;font-weight:400"> / ${p.reorder} pt</span></div>
            ${stockMeter(p)}
          </div>
        </div>

        <div class="modal-grid mb-16">
          <div class="kv"><span class="muted">Unit Cost</span><b>${F.money(p.cost)}</b></div>
          <div class="kv"><span class="muted">Retail Price</span><b>${F.money(p.price)}</b></div>
          <div class="kv"><span class="muted">Margin</span><b style="color:${p.margin >= 30 ? 'var(--success)' : 'var(--amber)'}">${p.margin}%</b></div>
          <div class="kv"><span class="muted">Ext. Value (retail)</span><b>${F.money(p.qty * p.price)}</b></div>
          <div class="kv"><span class="muted">Velocity</span><b>${p.velocity.toFixed(1)} / day</b></div>
          <div class="kv"><span class="muted">Days of Cover</span><b style="color:${p.daysCover < 7 ? 'var(--danger)' : p.daysCover < 21 ? 'var(--amber)' : 'var(--text)'}">${dcDisp}</b></div>
          <div class="kv"><span class="muted">MTD Sold</span><b>${p.mtdSold} units</b></div>
          <div class="kv"><span class="muted">Supplier</span><b>${p.supplier}</b></div>
          <div class="kv"><span class="muted">Bin / Location</span><b>${p.bin}</b></div>
          <div class="kv"><span class="muted">Serialized</span><b>${p.serialized ? 'Yes · vault' : 'No'}</b></div>
        </div>

        <div class="flex gap-8 wrap">
          <button class="btn btn--primary" onclick="WBT.ui.toast('Stock adjustment logged for ${p.sku} (demo)','sliders-horizontal');WBT.ui.closeModal()"><i data-lucide="sliders-horizontal"></i> Adjust Stock</button>
          <button class="btn btn--amber" onclick="WBT.ui.toast('Draft PO created · ${p.brand} ${p.sku} (demo)','clipboard-list');WBT.ui.closeModal()"><i data-lucide="clipboard-list"></i> Create PO</button>
          ${p.serialized ? `<button class="btn btn--ghost" onclick="WBT.ui.toast('Opened bound book entry for ${p.sku} (demo)','book-lock')"><i data-lucide="book-lock"></i> Bound Book</button>` : ''}
        </div>
      </div>`, { lg: true });

    const sc = document.getElementById('pSpark');
    if (sc) ui.spark(sc, hist, sparkColor);
  }

  // ---------- toolbar action buttons ----------
  document.getElementById('btnReceive').addEventListener('click', () => {
    const top = W.lowStockList.concat(W.outStockList).slice(0, 5);
    ui.modal(`
      <div class="panel__head"><span class="stencil"><i data-lucide="truck" style="width:14px;height:14px"></i> Receive Shipment</span>
        <div class="right"><button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div></div>
      <div class="panel__body">
        <label class="fld">Inbound PO / Invoice #</label>
        <input class="input mb-16" value="PO-${W.between(48200, 48990)}" id="rcvPo">
        <div class="tiny mono muted mb-8">SUGGESTED LINES (FROM REORDER QUEUE)</div>
        ${top.map(p => `<div class="reorder-row">
          <div style="min-width:0"><div class="t-strong" style="font-size:13px">${p.brand} ${p.model}</div>
            <div class="tiny mono muted">${p.sku} · ${p.catLabel}</div></div>
          <span class="tag ${p.qty === 0 ? 'tag--danger' : 'tag--amber'}">${p.qty === 0 ? 'OUT' : p.qty + ' left'}</span>
        </div>`).join('')}
        <button class="btn btn--amber btn--block mt-16" onclick="WBT.ui.toast('Shipment received · stock incremented (demo)','truck');WBT.ui.closeModal()"><i data-lucide="check-circle-2"></i> Receive &amp; Update Stock</button>
      </div>`);
  });

  document.getElementById('btnAdd').addEventListener('click', () => {
    ui.modal(`
      <div class="panel__head"><span class="stencil"><i data-lucide="plus" style="width:14px;height:14px"></i> Add Product</span>
        <div class="right"><button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div></div>
      <div class="panel__body">
        <div class="grid grid-2" style="gap:14px">
          <div><label class="fld">Brand</label><input class="input" placeholder="e.g. Glock"></div>
          <div><label class="fld">Model</label><input class="input" placeholder="e.g. 19 Gen5 (CA Roster)"></div>
          <div><label class="fld">Category</label><select class="input">${Object.keys(CATS).map(c => `<option value="${c}">${CATS[c].label}</option>`).join('')}</select></div>
          <div><label class="fld">CA Classification</label><select class="input"><option>CA Roster</option><option>Featureless</option><option>CA Legal Rifle</option><option>CA Legal Shotgun</option><option>None / OTC</option></select></div>
          <div><label class="fld">Cost ($)</label><input class="input" type="number" placeholder="0.00"></div>
          <div><label class="fld">Retail ($)</label><input class="input" type="number" placeholder="0.00"></div>
        </div>
        <button class="btn btn--primary btn--block mt-16" onclick="WBT.ui.toast('Product staged for catalog (demo)','plus');WBT.ui.closeModal()"><i data-lucide="save"></i> Save to Catalog</button>
      </div>`);
  });

  // ---------- side: stock health donut ----------
  const inCount = W.inventory.filter(p => statusOf(p) === 'in').length;
  const lowCount = K.lowStock, outCount = K.outStock;
  ui.donut(document.getElementById('healthChart'),
    ['In Stock', 'Low', 'Out'], [inCount, lowCount, outCount],
    [P.od, P.amber, P.danger], { chart: { plugins: { legend: { display: false } } } });

  const legend = [['In Stock', inCount, P.od], ['Low Stock', lowCount, P.amber], ['Out of Stock', outCount, P.danger]];
  document.getElementById('healthLegend').innerHTML = legend.map(([lab, n, c]) => `
    <div class="flex items-center justify-between" style="padding:6px 0;border-bottom:1px dashed var(--line)">
      <span class="flex items-center gap-8"><span class="sdot" style="color:${c};background:${c}"></span><span class="muted" style="font-size:12.5px">${lab}</span></span>
      <b class="mono">${n}</b>
    </div>`).join('');

  // ---------- side: reorder queue ----------
  const reorderList = W.outStockList.concat(W.lowStockList).slice(0, 7);
  document.getElementById('reorderTag').textContent = (K.lowStock + K.outStock) + ' FLAGGED';
  document.getElementById('reorderQueue').innerHTML = reorderList.map(p => {
    const out = p.qty === 0;
    return `<div class="reorder-row">
      <div style="min-width:0">
        <div class="t-strong" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">${p.brand} ${p.model}</div>
        <div class="tiny mono muted">${p.sku} · <span style="color:${out ? 'var(--danger)' : 'var(--amber)'}">${out ? 'OUT' : p.qty + '/' + p.reorder}</span></div>
      </div>
      <button class="btn btn--ghost btn--sm" data-po="${p.id}"><i data-lucide="clipboard-list"></i> PO</button>
    </div>`;
  }).join('') + `<button class="btn btn--amber btn--sm btn--block mt-16" id="poAll"><i data-lucide="send"></i> Generate All POs</button>`;

  document.getElementById('reorderQueue').addEventListener('click', e => {
    const b = e.target.closest('button[data-po]');
    if (b) { const p = W.invById[b.dataset.po]; ui.toast('PO drafted · ' + p.brand + ' ' + p.sku + ' (demo)', 'clipboard-list'); return; }
    if (e.target.closest('#poAll')) ui.toast(reorderList.length + ' purchase orders generated (demo)', 'send');
  });

  // ---------- side: serialized holdings (firearms in vault, by category) ----------
  const serialized = W.inventory.filter(p => p.serialized);
  const serUnits = serialized.reduce((s, p) => s + p.qty, 0);
  const byCat = {};
  serialized.forEach(p => { byCat[p.cat] = (byCat[p.cat] || 0) + p.qty; });
  const maxCat = Math.max(...Object.values(byCat), 1);
  document.getElementById('serializedBox').innerHTML = `
    <div class="flex items-center justify-between mb-16">
      <div><div class="stat__value" style="font-size:30px">${serUnits}</div>
        <div class="tiny mono muted">FIREARMS IN VAULT</div></div>
      <span class="tag tag--fde"><i data-lucide="shield-check" style="width:12px;height:12px"></i> A&amp;D BOOK</span>
    </div>
    ${Object.keys(byCat).map(c => `
      <div class="ser-row">
        <span class="flex items-center gap-8"><i data-lucide="${CATS[c].icon}" style="width:14px;height:14px;color:var(--fde)"></i>
          <span style="font-size:12.5px">${CATS[c].label}</span></span>
        <span class="flex items-center gap-8" style="width:120px">
          <span class="meter is-fde" style="flex:1"><span style="width:${Math.round(byCat[c] / maxCat * 100)}%"></span></span>
          <b class="mono" style="width:26px;text-align:right">${byCat[c]}</b>
        </span>
      </div>`).join('')}
    <button class="btn btn--ghost btn--sm btn--block mt-16" onclick="WBT.ui.toast('Opening A&D bound book (demo)','book-lock')"><i data-lucide="book-lock"></i> Open Bound Book</button>`;

  // ---------- meta strip count + clock ----------
  document.getElementById('armCount').textContent = K.skuCount + ' SKUS TRACKED';
  function tick() {
    const el = document.getElementById('armStamp');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' PST';
  }
  tick(); setInterval(tick, 1000);

  // ---------- initial render ----------
  applyFilters();
  ui.icons();
})();
