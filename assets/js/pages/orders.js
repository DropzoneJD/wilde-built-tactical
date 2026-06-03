/* Sales & Orders — orders.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE;

  // ------------------------------------------------------------------ state
  let _channel = 'all';
  let _status = 'all';
  let _search = '';

  // ------------------------------------------------------------------ derived counts
  const allOrders = W.orders;
  const countByStatus = s => allOrders.filter(o => o.status === s).length;
  const processingCount = countByStatus('processing');
  const drosCount       = countByStatus('dros');
  const readyCount      = countByStatus('ready');
  const shippingCount   = countByStatus('ship');
  const fulfilledCount  = countByStatus('fulfilled');
  const awaitingCount   = processingCount + readyCount;

  // ------------------------------------------------------------------ meta row
  document.getElementById('ordersMetaCount').textContent = K.ordersMTD + ' ORDERS MTD';

  // ------------------------------------------------------------------ KPI row
  const todayRev = W.series.revenue90[W.series.revenue90.length - 1].v;
  const onlineOrders = allOrders.filter(o => o.channel === 'online').length;
  const pctOnline = Math.round((onlineOrders / allOrders.length) * 100);

  const kpis = [
    { label: 'Orders MTD',       icon: 'receipt-text',   val: K.ordersMTD.toLocaleString(),    foot: 'vs prior 30 days',    delta: 8.2,  accent: true },
    { label: 'Revenue Today',    icon: 'dollar-sign',     val: F.moneyK(todayRev),              foot: 'live · est. daily',   delta: null  },
    { label: 'Avg Order Value',  icon: 'trending-up',     val: F.money(K.aov),                  foot: 'blended AOV MTD',     delta: 3.1   },
    { label: 'Online Split',     icon: 'wifi',            val: pctOnline + '%',                 foot: (100 - pctOnline) + '% in-store', delta: null },
    { label: 'Awaiting Fulfill', icon: 'package-open',   val: awaitingCount,                   foot: processingCount + ' proc · ' + readyCount + ' ready', warn: true, delta: null },
    { label: 'DROS Holds',       icon: 'shield-alert',    val: drosCount,                       foot: 'CA 10-day waits active', warn: drosCount > 0, delta: null },
  ];

  document.getElementById('ordersKpiRow').innerHTML = kpis.map(k => {
    const d = k.delta == null ? '' :
      `<span class="delta ${k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat'}">
        <i data-lucide="${k.delta > 0 ? 'trending-up' : k.delta < 0 ? 'trending-down' : 'minus'}" style="width:13px;height:13px"></i>${F.pct(k.delta)}</span>`;
    return `<div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value">${k.val}</div>
      <div class="stat__foot">${d}<span class="${k.warn ? '' : 'muted'}" style="${k.warn && k.val > 0 ? 'color:var(--amber)' : ''}">${k.foot}</span></div>
    </div>`;
  }).join('');

  // ------------------------------------------------------------------ status filter buttons
  const STATUS_FILTERS = [
    { key: 'all',         label: 'All',         color: '' },
    { key: 'processing',  label: 'Processing',  color: 'amber' },
    { key: 'dros',        label: 'DROS Hold',   color: 'steel' },
    { key: 'ready',       label: 'Ready',        color: 'od' },
    { key: 'ship',        label: 'Shipping',     color: 'blue' },
    { key: 'fulfilled',   label: 'Fulfilled',    color: 'success' },
  ];

  document.getElementById('statusFilterBar').innerHTML = STATUS_FILTERS.map(s =>
    `<button data-sf="${s.key}" class="${s.key === 'all' ? 'is-active' : ''}" onclick="window.ordersPage.setStatus('${s.key}',this)">${s.label}</button>`
  ).join('');

  // ------------------------------------------------------------------ helpers
  function daysAgoLabel(n) {
    if (n === 0) return '<span style="color:var(--success)">Today</span>';
    if (n === 1) return '1d ago';
    return n + 'd ago';
  }

  function buildOrderRow(o) {
    return `<tr class="clickable" onclick="window.ordersPage.openDetail('${o.id}')">
      <td class="mono t-strong nowrap">${o.id}</td>
      <td>
        <div class="t-strong" style="font-size:13px">${o.customer}</div>
        <div class="tiny muted">${o.city}</div>
      </td>
      <td><span class="tag tag--${o.channelColor}">${o.channelLabel}</span></td>
      <td class="num">${o.nItems}</td>
      <td class="num t-strong">${F.money(o.total)}</td>
      <td><span class="tag tag--${o.statusColor}"><span class="dot"></span>${o.statusLabel}</span>
        ${o.hasFirearm ? '<span class="tag tag--steel tag--ghost" style="margin-left:4px;font-size:9px">FFL</span>' : ''}</td>
      <td class="mono muted" style="font-size:12px">${daysAgoLabel(o.daysAgo)}</td>
    </tr>`;
  }

  function getFiltered() {
    const q = _search.toLowerCase();
    return allOrders.filter(o => {
      if (_channel !== 'all' && o.channel !== _channel) return false;
      if (_status !== 'all' && o.status !== _status) return false;
      if (q && !o.id.toLowerCase().includes(q) && !o.customer.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderTable() {
    const rows = getFiltered();
    const tbody = document.getElementById('ordersBody');
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="no-results"><i data-lucide="search-x" style="width:22px;height:22px;margin:0 auto 8px;display:block;color:var(--faint)"></i>No orders match filter</div></td></tr>`;
    } else {
      tbody.innerHTML = rows.map(buildOrderRow).join('');
    }
    ui.icons();
  }

  // ------------------------------------------------------------------ status funnel
  const FUNNEL = [
    { label: 'Processing',      count: processingCount, color: P.amber,   cls: 'is-mid' },
    { label: 'DROS Hold',       count: drosCount,       color: P.steel,   cls: '' },
    { label: 'Ready Pickup',    count: readyCount,      color: P.od,      cls: '' },
    { label: 'Shipping',        count: shippingCount,   color: P.blue,    cls: 'is-fde' },
    { label: 'Fulfilled',       count: fulfilledCount,  color: P.success, cls: '' },
  ];
  const totalOrders = allOrders.length;

  document.getElementById('statusFunnel').innerHTML = `<div class="funnel-row">` +
    FUNNEL.map(f => {
      const pct = totalOrders > 0 ? Math.round((f.count / totalOrders) * 100) : 0;
      const meterStyle = f.cls ? f.cls : '';
      return `<div class="funnel-item">
        <div class="funnel-label">
          <span class="muted" style="font-size:12px">${f.label}</span>
          <span class="mono" style="font-size:12px;color:var(--text)">${f.count} <span class="faint" style="font-size:10px">${pct}%</span></span>
        </div>
        <div class="meter ${meterStyle}"><span style="width:${Math.max(pct, f.count > 0 ? 4 : 0)}%;background:${f.cls ? '' : f.color}"></span></div>
      </div>`;
    }).join('') +
    `</div>
    <div class="mt-16 flex justify-between" style="font-size:11px;color:var(--faint);font-family:var(--f-mono)">
      <span>TOTAL ORDERS</span><span style="color:var(--text)">${totalOrders}</span>
    </div>`;

  // ------------------------------------------------------------------ 14-day revenue chart
  const rev14 = W.series.revenue90.slice(-14);
  const rev14Total = rev14.reduce((s, d) => s + d.v, 0);
  document.getElementById('rev14Label').textContent = F.moneyK(rev14Total);

  const rev14Labels = rev14.map((_, i) => {
    const n = 13 - i;
    return n === 0 ? 'Today' : (n % 2 === 0 ? 'D-' + n : '');
  });

  ui.line(
    document.getElementById('rev14Chart'),
    rev14Labels,
    [{ label: 'Revenue', data: rev14.map(d => d.v), color: P.fde, fill: true }],
    { yMoney: true }
  );

  // ------------------------------------------------------------------ Needs Action
  const needsAction = allOrders.filter(o => o.status === 'dros' || o.status === 'ready');
  document.getElementById('needsActionCount').textContent = needsAction.length;

  function renderNeedsAction() {
    const el = document.getElementById('needsActionList');
    if (needsAction.length === 0) {
      el.innerHTML = `<div class="no-results" style="padding:20px 0"><i data-lucide="check-circle" style="width:18px;height:18px;margin:0 auto 6px;display:block;color:var(--success)"></i>All clear</div>`;
      ui.icons();
      return;
    }
    el.innerHTML = needsAction.map(o => {
      const isDros = o.status === 'dros';
      const btnLabel = isDros ? 'Check DROS' : 'Notify Pickup';
      const btnClass = isDros ? 'btn--ghost' : 'btn--amber';
      const icon = isDros ? 'shield-check' : 'bell-ring';
      return `<div class="needs-action-item">
        <div style="min-width:0">
          <div class="t-strong" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px">${o.customer}</div>
          <div class="tiny mono muted">${o.id}</div>
          <span class="tag tag--${o.statusColor}" style="margin-top:3px"><span class="dot"></span>${o.statusLabel}</span>
        </div>
        <button class="btn btn--sm ${btnClass}" onclick="WBT.ui.toast('${btnLabel}: ${o.id} (demo)','${icon}')"><i data-lucide="${icon}"></i></button>
      </div>`;
    }).join('');
    ui.icons();
  }
  renderNeedsAction();

  // ------------------------------------------------------------------ order detail modal
  function buildTimeline(o) {
    const steps = [
      { label: 'Order Placed', time: o.daysAgo === 0 ? 'Today' : o.daysAgo + 'd ago', done: true },
      { label: 'Payment Cleared', time: o.daysAgo === 0 ? 'Today' : (o.daysAgo) + 'd ago', done: true },
      { label: 'Processing / Verification', time: o.status === 'processing' ? 'In progress' : (o.daysAgo <= 1 ? 'Today' : (o.daysAgo - 1) + 'd ago'), done: ['dros','ready','ship','fulfilled'].includes(o.status), active: o.status === 'processing' },
      ...(o.hasFirearm ? [{ label: 'DROS Submitted — 10-Day Wait', time: o.status === 'dros' ? 'Hold active' : 'Cleared', done: o.status !== 'dros' && o.status !== 'processing', active: o.status === 'dros' }] : []),
      { label: o.channel === 'online' ? 'Shipped / En Route' : 'Ready for Pickup', time: o.status === 'ready' || o.status === 'ship' ? 'Pending' : (o.status === 'fulfilled' ? 'Complete' : '—'), done: o.status === 'fulfilled', active: o.status === 'ready' || o.status === 'ship', wait: ['processing','dros'].includes(o.status) },
      { label: 'Fulfilled / Transferred', time: o.status === 'fulfilled' ? 'Complete' : 'Pending', done: o.status === 'fulfilled', wait: o.status !== 'fulfilled' },
    ];
    return `<div class="timeline">` + steps.map(s => {
      const cls = s.done ? 'done' : s.active ? 'active' : 'wait';
      return `<div class="tl-item ${cls}">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${s.label}</div>
        <div class="tl-time">${s.time}</div>
      </div>`;
    }).join('') + `</div>`;
  }

  function openDetail(orderId) {
    const o = allOrders.find(x => x.id === orderId);
    if (!o) return;
    const cust = W.custById[o.custId] || {};

    const lineItems = o.items.map(it => `<tr>
      <td>${it.name}</td>
      <td class="num">${it.qty}</td>
      <td class="num">${F.money(it.price)}</td>
      <td class="num t-strong">${F.money(it.price * it.qty)}</td>
    </tr>`).join('');

    const drosNotice = o.hasFirearm ? `
      <div class="alert alert--amber mt-16">
        <i data-lucide="shield-alert"></i>
        <div><b>CA DROS / 10-Day Wait Required</b><br>
        <span class="muted" style="font-size:12.5px">This order contains a serialized firearm. CA DOJ DROS must be submitted and the 10-day wait period observed before transfer. FFL on file: <b>${cust.fflOnFile ? 'Yes' : 'No'}</b></span></div>
      </div>` : '';

    const html = `
      <div class="panel modal--lg">
        <div class="panel__head" style="gap:14px">
          <i data-lucide="receipt-text" style="color:var(--fde)"></i>
          <span class="stencil" style="font-size:13px">${o.id}</span>
          <span class="tag tag--${o.statusColor}"><span class="dot"></span>${o.statusLabel}</span>
          <span class="tag tag--${o.channelColor}">${o.channelLabel}</span>
          <div class="right">
            <button class="btn btn--sm btn--ghost" onclick="WBT.ui.toast('Printing order ${o.id} (demo)','printer')"><i data-lucide="printer"></i></button>
            <button class="btn btn--sm btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button>
          </div>
        </div>
        <div class="panel__body" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-height:72vh;overflow-y:auto">

          <!-- LEFT: items + customer -->
          <div>
            <div class="stencil mb-8">Line Items</div>
            <div class="table-wrap">
              <table class="tac-table">
                <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Total</th></tr></thead>
                <tbody>${lineItems}</tbody>
                <tfoot><tr style="border-top:1px solid var(--line-2)">
                  <td colspan="3" style="padding:10px 16px;font-family:var(--f-tac);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Order Total</td>
                  <td class="num t-strong" style="padding:10px 16px;font-size:15px">${F.money(o.total)}</td>
                </tr></tfoot>
              </table>
            </div>

            ${drosNotice}

            <div class="stencil mt-16 mb-8">Customer</div>
            <div class="kv"><span class="muted">Name</span><b>${o.customer}</b></div>
            <div class="kv"><span class="muted">City</span><b>${o.city}</b></div>
            ${cust.email ? `<div class="kv"><span class="muted">Email</span><b style="font-size:12px">${cust.email}</b></div>` : ''}
            ${cust.phone ? `<div class="kv"><span class="muted">Phone</span><b>${cust.phone}</b></div>` : ''}
            <div class="kv"><span class="muted">Segment</span><b><span class="tag tag--${cust.segColor || 'steel'}">${cust.segLabel || '—'}</span></b></div>
            <div class="kv"><span class="muted">Loyalty Tier</span><b>${cust.tier || '—'} · ${(cust.points || 0).toLocaleString()} pts</b></div>
            <div class="kv"><span class="muted">FFL on File</span><b style="color:${cust.fflOnFile ? 'var(--success)' : 'var(--muted)'}">${cust.fflOnFile ? 'Yes' : 'No'}</b></div>
          </div>

          <!-- RIGHT: fulfillment timeline -->
          <div>
            <div class="stencil mb-12">Fulfillment Timeline</div>
            ${buildTimeline(o)}

            <div class="mt-16">
              <div class="stencil mb-8">Actions</div>
              <div class="flex gap-8 wrap mt-8">
                ${o.status === 'dros' ? `<button class="btn btn--sm btn--amber" onclick="WBT.ui.toast('DROS status check queued (demo)','shield-check')"><i data-lucide="shield-check"></i> Check DROS</button>` : ''}
                ${o.status === 'ready' ? `<button class="btn btn--sm btn--primary" onclick="WBT.ui.toast('Pickup notification sent to ${o.customer} (demo)','bell-ring')"><i data-lucide="bell-ring"></i> Notify Customer</button>` : ''}
                ${o.status === 'processing' ? `<button class="btn btn--sm btn--primary" onclick="WBT.ui.toast('Order ${o.id} advanced to ready (demo)','package-check')"><i data-lucide="package-check"></i> Mark Ready</button>` : ''}
                ${o.status === 'ship' ? `<button class="btn btn--sm btn--amber" onclick="WBT.ui.toast('Tracking info sent (demo)','send')"><i data-lucide="send"></i> Send Tracking</button>` : ''}
                <button class="btn btn--sm btn--ghost" onclick="WBT.ui.toast('Email receipt sent (demo)','mail')"><i data-lucide="mail"></i> Resend Receipt</button>
                <button class="btn btn--sm btn--danger" onclick="WBT.ui.toast('Refund flow opened for ${o.id} (demo)','undo-2')"><i data-lucide="undo-2"></i> Refund</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    ui.modal(html, { lg: true });
  }

  // ------------------------------------------------------------------ public API
  window.ordersPage = {
    filter() {
      _search = document.getElementById('orderSearch').value;
      renderTable();
    },
    setChannel(ch, btn) {
      _channel = ch;
      document.querySelectorAll('#channelSeg button').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderTable();
    },
    setStatus(st, btn) {
      _status = st;
      document.querySelectorAll('#statusFilterBar button').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderTable();
    },
    openDetail,
  };

  // ------------------------------------------------------------------ initial render
  renderTable();

  // ------------------------------------------------------------------ clock
  function tick() {
    const el = document.getElementById('orderClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' PST';
  }
  tick(); setInterval(tick, 1000);

  ui.icons();
})();
