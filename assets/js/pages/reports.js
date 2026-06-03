/* Reports — analytics deep-dive  (reports.js) */
(function () {
  'use strict';
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE;
  const ser = W.series;

  // ── helpers ──────────────────────────────────────────────────────────────
  function sumSer(arr, n) { return arr.slice(-n).reduce(function(s, d){ return s + d.v; }, 0); }
  function avgSer(arr, n) {
    var sl = arr.slice(-n);
    return sl.reduce(function(s, d){ return s + d.v; }, 0) / sl.length;
  }
  function marginColor(pct) {
    if (pct >= 35) return P.success;
    if (pct >= 20) return P.amber;
    return P.danger;
  }

  // ── Derived KPIs ─────────────────────────────────────────────────────────
  var revMTD   = K.revMTD;
  var revPrev  = K.revPrev;
  var grossPct = 38.2; // ~38% blended gross margin
  var cogsMTD  = Math.round(revMTD * (1 - grossPct / 100));
  var gpMTD    = revMTD - cogsMTD;
  var unitsSold = W.inventory.reduce(function(s, p){ return s + p.mtdSold; }, 0);
  // best category by revenue
  var bestCat  = ser.byCategory.slice().sort(function(a,b){ return b.v - a.v; })[0];
  var ordersMTD = K.ordersMTD;
  var aovMTD    = K.aov;

  // ── KPI strip ─────────────────────────────────────────────────────────────
  var kpis = [
    { label: 'Revenue · MTD',    icon: 'dollar-sign',   val: F.moneyK(revMTD),           delta: K.revDelta,  foot: 'vs prior 30 days', accent: true },
    { label: 'Gross Margin %',   icon: 'percent',       val: grossPct.toFixed(1) + '%',   delta: 1.4,         foot: F.moneyK(gpMTD) + ' gross profit' },
    { label: 'Orders · MTD',     icon: 'receipt-text',  val: ordersMTD.toLocaleString(),  delta: 8.2,         foot: 'all channels combined' },
    { label: 'Avg Order Value',  icon: 'tag',           val: F.money(aovMTD),             delta: 2.6,         foot: 'blended in-store + online' },
    { label: 'Units Sold · MTD', icon: 'package-check', val: unitsSold.toLocaleString(),  delta: null,        foot: W.inventory.length + ' active SKUs' },
    { label: 'Best Category',    icon: 'trophy',        val: bestCat.k.replace('Handguns','H-guns'),  delta: null, foot: F.moneyK(bestCat.v) + ' revenue MTD' },
  ];

  document.getElementById('kpiStrip').innerHTML = kpis.map(function(k){
    var d = k.delta === null ? '' :
      '<span class="delta ' + (k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat') + '">' +
      '<i data-lucide="' + (k.delta > 0 ? 'trending-up' : k.delta < 0 ? 'trending-down' : 'minus') + '" style="width:13px;height:13px"></i>' +
      F.pct(k.delta) + '</span>';
    return '<div style="grid-column:span 2"><div class="stat ' + (k.accent ? 'stat--accent' : '') + '">' +
      '<div class="stat__label"><i data-lucide="' + k.icon + '"></i>' + k.label + '</div>' +
      '<div class="stat__value">' + k.val + '</div>' +
      '<div class="stat__foot">' + d + '<span class="muted">' + k.foot + '</span></div>' +
      '</div></div>';
  }).join('');

  // ── State for interactive line chart ─────────────────────────────────────
  var _revChart = null;
  var _currentRange = 90;
  var _currentMetric = 'revenue';

  function buildRevChart(days) {
    var n = Math.min(days, ser.revenue90.length);
    var rev = ser.revenue90.slice(-n);
    var step = n <= 7 ? 1 : n <= 30 ? 3 : 7;
    var labels = rev.map(function(_, i){ return i % step === 0 ? 'D-' + (n - 1 - i) : ''; });

    var instore = rev.map(function(d){ return Math.round(d.v * 0.55); });
    var online  = rev.map(function(d){ return Math.round(d.v * 0.35); });
    var phone   = rev.map(function(d){ return Math.round(d.v * 0.10); });

    var canvas = document.getElementById('revTrendChart');
    if (_revChart) { _revChart.destroy(); _revChart = null; }
    _revChart = ui.line(canvas, labels,
      [
        { label: 'In-Store', data: instore, color: P.fde,     fill: true  },
        { label: 'Online',   data: online,  color: P.blue,    fill: true  },
        { label: 'Phone',    data: phone,   color: P.od,      fill: false },
      ],
      { yMoney: true }
    );
    document.getElementById('revRangeLabel').textContent = days + 'D';
  }

  function buildOrdersChart(days) {
    var n = Math.min(days, ser.orders90.length);
    var data = ser.orders90.slice(-n);
    var step = n <= 7 ? 1 : n <= 30 ? 3 : 7;
    var labels = data.map(function(_, i){ return i % step === 0 ? 'D-' + (n - 1 - i) : ''; });

    var canvas = document.getElementById('revTrendChart');
    if (_revChart) { _revChart.destroy(); _revChart = null; }
    _revChart = ui.line(canvas, labels,
      [{ label: 'Orders', data: data.map(function(d){ return d.v; }), color: P.amber, fill: true }],
      { yMoney: false }
    );
    document.getElementById('revRangeLabel').textContent = days + 'D · Orders';
  }

  function buildTrafficChart(days) {
    var n = Math.min(days, ser.traffic90.length);
    var data = ser.traffic90.slice(-n);
    var step = n <= 7 ? 1 : n <= 30 ? 3 : 7;
    var labels = data.map(function(_, i){ return i % step === 0 ? 'D-' + (n - 1 - i) : ''; });

    var canvas = document.getElementById('revTrendChart');
    if (_revChart) { _revChart.destroy(); _revChart = null; }
    _revChart = ui.line(canvas, labels,
      [{ label: 'Traffic', data: data.map(function(d){ return d.v; }), color: P.steel, fill: true }],
      { yMoney: false }
    );
    document.getElementById('revRangeLabel').textContent = days + 'D · Traffic';
  }

  function buildAovChart(days) {
    var n = Math.min(days, ser.revenue90.length);
    var rev = ser.revenue90.slice(-n);
    var ord = ser.orders90.slice(-n);
    var step = n <= 7 ? 1 : n <= 30 ? 3 : 7;
    var labels = rev.map(function(_, i){ return i % step === 0 ? 'D-' + (n - 1 - i) : ''; });
    var aov = rev.map(function(d, i){ return ord[i] && ord[i].v > 0 ? Math.round(d.v / ord[i].v) : 0; });

    var canvas = document.getElementById('revTrendChart');
    if (_revChart) { _revChart.destroy(); _revChart = null; }
    _revChart = ui.line(canvas, labels,
      [{ label: 'Avg Order Value', data: aov, color: P.fde, fill: false }],
      { yMoney: true }
    );
    document.getElementById('revRangeLabel').textContent = days + 'D · AOV';
  }

  function applyChart() {
    var rangeVal = parseInt(document.getElementById('toolRange').value, 10) || 30;
    var metric   = document.getElementById('toolMetric').value;
    var group    = document.getElementById('toolGroup').value;

    _currentRange  = rangeVal;
    _currentMetric = metric;

    var metricLabel = { revenue:'Revenue', orders:'Orders', traffic:'Traffic', aov:'Avg Order Value' }[metric] || metric;
    var groupLabel  = { day:'Day', week:'Week', month:'Month', channel:'Channel' }[group] || group;

    document.getElementById('rptStatus').textContent =
      'Showing: ' + metricLabel + ' · Last ' + rangeVal + ' Days · By ' + groupLabel;

    if (metric === 'revenue')  buildRevChart(rangeVal);
    else if (metric === 'orders') buildOrdersChart(rangeVal);
    else if (metric === 'traffic') buildTrafficChart(rangeVal);
    else if (metric === 'aov') buildAovChart(rangeVal);
  }

  // initial render
  buildRevChart(90);

  // toolbar Apply button
  document.getElementById('btnApply').addEventListener('click', function(){
    applyChart();
    WBT.ui.toast('Report refreshed', 'refresh-cw');
  });

  // Also re-render on the header seg control
  var segs = document.querySelectorAll('#rangeSeg button');
  segs.forEach(function(btn){
    btn.addEventListener('click', function(){
      segs.forEach(function(b){ b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var r = btn.getAttribute('data-r');
      var days = r === 'ytd' ? 90 : parseInt(r, 10);
      // sync toolbar dropdown
      var toolRange = document.getElementById('toolRange');
      if (toolRange) {
        var opts = toolRange.options;
        for (var i = 0; i < opts.length; i++) {
          if (parseInt(opts[i].value, 10) === days) { toolRange.selectedIndex = i; break; }
        }
      }
      applyChart();
    });
  });

  // Export buttons
  document.getElementById('btnExportCSV').addEventListener('click', function(){
    WBT.ui.toast('Exported reports-' + _currentRange + 'd.csv (demo)', 'download');
  });
  document.getElementById('btnExportPDF').addEventListener('click', function(){
    WBT.ui.toast('Exported reports-' + _currentRange + 'd.pdf (demo)', 'file-down');
  });

  // ── Channel donut ─────────────────────────────────────────────────────────
  ui.donut(
    document.getElementById('channelDonut'),
    ser.byChannel.map(function(c){ return c.k; }),
    ser.byChannel.map(function(c){ return c.v; }),
    ser.byChannel.map(function(c){ return c.c; }),
    { money: true }
  );

  // channel legend under donut
  var totalCh = ser.byChannel.reduce(function(s, c){ return s + c.v; }, 0);
  document.getElementById('channelLegend').innerHTML = ser.byChannel.map(function(c){
    var pct = ((c.v / totalCh) * 100).toFixed(1);
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line)">' +
      '<span style="display:flex;align-items:center;gap:8px">' +
        '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + c.c + '"></span>' +
        '<span class="tiny mono" style="color:var(--text-soft)">' + c.k + '</span>' +
      '</span>' +
      '<span class="tiny mono muted">' + F.moneyK(c.v) + ' <span style="color:var(--faint)">(' + pct + '%)</span></span>' +
    '</div>';
  }).join('');

  // ── Revenue by Category horizontal bars ──────────────────────────────────
  var cats = ser.byCategory.slice().sort(function(a, b){ return b.v - a.v; });
  ui.bars(
    document.getElementById('catBarsChart'),
    cats.map(function(c){ return c.k; }),
    cats.map(function(c){ return c.v; }),
    {
      horizontal: true, money: true,
      colors: cats.map(function(_, i){ return ui.hexA(P.fde, 1 - i * 0.11); }),
    }
  );

  // ── Sales by Location — donut ─────────────────────────────────────────────
  var totalRev = ser.byChannel.reduce(function(s, c){ return s + c.v; }, 0);
  var sdRev  = Math.round(totalRev * 0.55);
  var escRev = totalRev - sdRev;

  ui.donut(
    document.getElementById('locChart'),
    ['San Diego', 'Escondido'],
    [sdRev, escRev],
    [P.fde, P.od],
    { money: true }
  );

  // location bar breakdown by category
  var locCatData = [
    { cat: 'Rifles',      sd: Math.round(4310000 * 0.52), esc: Math.round(4310000 * 0.48) },
    { cat: 'Handguns',    sd: Math.round(3820000 * 0.58), esc: Math.round(3820000 * 0.42) },
    { cat: 'Ammunition',  sd: Math.round(1960000 * 0.60), esc: Math.round(1960000 * 0.40) },
    { cat: 'Optics',      sd: Math.round(1540000 * 0.50), esc: Math.round(1540000 * 0.50) },
    { cat: 'Accessories', sd: Math.round(980000  * 0.55), esc: Math.round(980000  * 0.45) },
  ];

  document.getElementById('locBars').innerHTML = locCatData.map(function(row){
    var total = row.sd + row.esc;
    var sdW   = ((row.sd  / total) * 100).toFixed(0);
    var escW  = ((row.esc / total) * 100).toFixed(0);
    return '<div class="loc-bar-row">' +
      '<span class="loc-bar-label">' + row.cat + '</span>' +
      '<div class="loc-bar-track">' +
        '<div class="loc-bar-fill" style="width:' + sdW + '%;background:' + P.fde + '"></div>' +
        '<div class="loc-bar-fill" style="width:' + escW + '%;background:' + P.od + ';border-radius:0 2px 2px 0"></div>' +
      '</div>' +
      '<span class="loc-bar-val">' + F.moneyK(total) + '</span>' +
    '</div>';
  }).join('');

  // ── Margin by Category bars ────────────────────────────────────────────────
  var marginData = [
    { cat: 'Apparel',     pct: 66 },
    { cat: 'Accessories', pct: 48 },
    { cat: 'Lighting',    pct: 40 },
    { cat: 'Optics',      pct: 34 },
    { cat: 'Handguns',    pct: 27 },
    { cat: 'Rifles',      pct: 24 },
    { cat: 'Shotguns',    pct: 23 },
    { cat: 'Ammunition',  pct: 18 },
  ];
  ui.bars(
    document.getElementById('marginChart'),
    marginData.map(function(m){ return m.cat; }),
    marginData.map(function(m){ return m.pct; }),
    {
      horizontal: false, money: false,
      colors: marginData.map(function(m){ return marginColor(m.pct); }),
    }
  );

  // ── Key Insights panel ────────────────────────────────────────────────────
  var insights = [
    ['trending-up',   'var(--success)',  '<b>Rifles</b> is the top revenue category at ' + F.moneyK(4310000) + ' MTD — CA featureless builds driving growth.'],
    ['percent',       'var(--fde)',      'Blended gross margin is <b>38.2%</b> — Apparel (' + 66 + '%) and Accessories (' + 48 + '%) far above category averages.'],
    ['map-pin',       'var(--od-bright)','San Diego accounts for <b>55%</b> of total revenue; Escondido +8% MoM — gap narrowing.'],
    ['alert-triangle','var(--amber)',    'Ammunition margin is only <b>18%</b> — below threshold. Bulk pricing review recommended.'],
    ['shopping-cart', 'var(--tac-blue)', '<b>Online channel</b> at 35% revenue share — up from 29% same period last quarter.'],
    ['award',         'var(--fde)',      '<b>' + bestCat.k + '</b> is top category. YoY category growth +' + (K.revDelta + 2.1).toFixed(1) + '%.'],
  ];

  document.getElementById('insightsBody').innerHTML = insights.map(function(ins){
    return '<div class="insight-chip">' +
      '<i data-lucide="' + ins[0] + '" style="color:' + ins[1] + '"></i>' +
      '<div style="font-size:13px">' + ins[2] + '</div>' +
    '</div>';
  }).join('') +
  '<button class="btn btn--ghost btn--sm w-full mt-16" onclick="WBT.ui.toast(\'Full analytics report generated (demo)\',\'sparkles\')">' +
  '<i data-lucide="sparkles"></i> Generate Full Insight Report</button>';

  // ── P&L Summary Table ─────────────────────────────────────────────────────
  // Build 3 trailing month buckets from revenue90
  var rev90 = ser.revenue90;
  var m1rev = sumSer(rev90, 30);                              // most recent 30d
  var m2rev = sumSer(rev90.slice(0, 60), 30);                 // prior 30d
  var m3rev = sumSer(rev90.slice(0, 30), 30);                 // prior 30d again
  var MARGIN_RATE = 0.382;

  function plRow(label, m3, m2, m1, isMoney, isTotal, isSection) {
    var cls = isTotal ? 'pl-row--total' : isSection ? 'pl-row--section' : 'pl-row';
    if (isSection) {
      return '<tr class="' + cls + '"><td colspan="5">' + label + '</td></tr>';
    }
    var fmt = isMoney ? function(v){ return '<span class="mono">' + F.money(v) + '</span>'; }
                      : function(v){ return '<span class="mono">' + v.toFixed(1) + '%</span>'; };
    var style = isTotal ? ' style="color:var(--fde)"' : '';
    return '<tr class="' + cls + '">' +
      '<td' + style + '>' + label + '</td>' +
      '<td class="num">' + fmt(m3) + '</td>' +
      '<td class="num">' + fmt(m2) + '</td>' +
      '<td class="num">' + fmt(m1) + '</td>' +
      '<td class="num">' + fmt(m1 + m2 + m3) + '</td>' +
    '</tr>';
  }

  // month label helpers — rough 30d bucket names
  var now = new Date();
  function monthLabel(offsetMonths) {
    var d = new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1);
    return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
  }
  var colM3 = monthLabel(2);
  var colM2 = monthLabel(1);
  var colM1 = monthLabel(0);

  var m3cogs = Math.round(m3rev * (1 - MARGIN_RATE));
  var m2cogs = Math.round(m2rev * (1 - MARGIN_RATE));
  var m1cogs = Math.round(m1rev * (1 - MARGIN_RATE));
  var m3gp   = m3rev - m3cogs;
  var m2gp   = m2rev - m2cogs;
  var m1gp   = m1rev - m1cogs;
  var m3gm   = (m3gp / m3rev) * 100;
  var m2gm   = (m2gp / m2rev) * 100;
  var m1gm   = (m1gp / m1rev) * 100;
  var totRev  = m3rev + m2rev + m1rev;
  var totCogs = m3cogs + m2cogs + m1cogs;
  var totGP   = m3gp + m2gp + m1gp;
  var totGM   = (totGP / totRev) * 100;

  var plHTML =
    '<thead><tr>' +
    '<th>Line Item</th>' +
    '<th class="num">' + colM3 + '</th>' +
    '<th class="num">' + colM2 + '</th>' +
    '<th class="num">' + colM1 + ' (MTD)</th>' +
    '<th class="num">3-Month Total</th>' +
    '</tr></thead><tbody>';

  plHTML += plRow('Income', null, null, null, true, false, true);
  plHTML += plRow('Gross Revenue', m3rev, m2rev, m1rev, true, false, false);
  plHTML += plRow('Returns / Adjustments',
    -Math.round(m3rev * 0.012), -Math.round(m2rev * 0.012), -Math.round(m1rev * 0.012),
    true, false, false);
  plHTML += plRow('Net Revenue',
    Math.round(m3rev * 0.988), Math.round(m2rev * 0.988), Math.round(m1rev * 0.988),
    true, true, false);

  plHTML += plRow('Cost of Goods', null, null, null, true, false, true);
  plHTML += plRow('Product Cost (COGS)', m3cogs, m2cogs, m1cogs, true, false, false);
  plHTML += plRow('Freight / Inbound', Math.round(m3cogs*0.04), Math.round(m2cogs*0.04), Math.round(m1cogs*0.04), true, false, false);
  plHTML += plRow('Total COGS',
    Math.round(m3cogs*1.04), Math.round(m2cogs*1.04), Math.round(m1cogs*1.04),
    true, true, false);

  plHTML += plRow('Gross Profit', null, null, null, true, false, true);
  plHTML += plRow('Gross Profit $', m3gp, m2gp, m1gp, true, false, false);
  plHTML += plRow('Gross Margin %', m3gm, m2gm, m1gm, false, true, false);

  plHTML += '</tbody>';

  document.getElementById('plTable').innerHTML = plHTML;

  // ── Clock ──────────────────────────────────────────────────────────────────
  function tick() {
    var el = document.getElementById('rptClock');
    if (el) {
      el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' PST';
    }
  }
  tick();
  setInterval(tick, 1000);

  // ── Final icon render ──────────────────────────────────────────────────────
  ui.icons();
})();
