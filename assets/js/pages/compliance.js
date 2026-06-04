/* CA Compliance Center — compliance.js
   DROS 10-day clock · DOJ roster check · ATF A&D bound book.
   Mirrors dashboard.js conventions: IIFE, reads window.WBT, renders via WBT.ui,
   calls ui.icons() after every dynamic innerHTML. Pseudo-functional throughout. */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE;

  // -------------------------------------------------- derived compliance facts
  const holdCount = W.dros.filter(d => d.status === 'delayed' || d.status === 'hold').length;
  const readyList = W.dros.filter(d => d.status === 'ready');
  const flaggedList = W.dros.filter(d => d.status === 'delayed' || d.status === 'hold');
  // a believable aggregate compliance score (weighted, deterministic from data)
  const ROSTER_PCT = 100, BOOK_PCT = 99.4, DROS_PCT = 100, FFL_PCT = 100;
  const SCORE = +((ROSTER_PCT * 0.25 + BOOK_PCT * 0.30 + DROS_PCT * 0.25 + FFL_PCT * 0.20)).toFixed(1);

  // ============================================================ KPI ROW (6-up)
  const kpis = [
    { label: 'Active 10-Day Waits', icon: 'timer',        val: K.drosPending, foot: 'in statutory waiting period', warn: true },
    { label: 'Eligible to Release', icon: 'check-circle-2',val: K.drosReady, foot: 'cleared — ready for pickup', good: true },
    { label: 'DOJ Delayed / Hold',  icon: 'shield-alert', val: holdCount, foot: 'pending DOJ disposition', bad: true },
    { label: 'Roster Compliance',   icon: 'list-checks',  val: '100%', foot: 'all handguns CA-certified', good: true },
    { label: 'Bound Book Integrity',icon: 'book-lock',    val: '99.4%', foot: '1,420 lines reconciled', accent: true },
    { label: 'FFL Status',          icon: 'badge-check',  val: '01', valSmall: 'ACTIVE', foot: 'Ray Calhoun · DOJ COE', good: true },
  ];
  document.getElementById('kpiRow').innerHTML = kpis.map(k => {
    const color = k.bad ? 'var(--danger)' : k.warn ? 'var(--amber)' : k.good ? 'var(--success)' : '';
    return `<div style="grid-column:span 2"><div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value">${k.val}${k.valSmall ? ' <small>' + k.valSmall + '</small>' : ''}</div>
      <div class="stat__foot"><span style="${color ? 'color:' + color : ''}" class="${color ? '' : 'muted'}">${k.foot}</span></div>
    </div></div>`;
  }).join('');
  document.getElementById('kpiRow').style.gridTemplateColumns = 'repeat(6,1fr)';

  // ============================================================ HERO score board
  function bar(label, pct, cls, note) {
    return `<div style="margin-bottom:13px">
      <div class="flex justify-between items-center tiny mono mb-8"><span class="muted upper">${label}</span><span class="t-strong">${pct}%</span></div>
      <div class="meter ${cls}"><span style="width:${pct}%"></span></div>
      <div class="tiny muted mt-8">${note}</div></div>`;
  }
  document.getElementById('scoreBoard').innerHTML = `
    <div class="grid" style="grid-template-columns:200px 1fr;gap:22px;align-items:center">
      <div class="text-center" style="border-right:1px solid var(--line);padding-right:18px">
        <div class="stencil" style="justify-content:center">Compliance Score</div>
        <div class="gauge-num mt-8">${SCORE}</div>
        <div class="tiny mono muted">OUT OF 100.0</div>
        <div class="meter is-fde mt-16"><span style="width:${SCORE}%"></span></div>
        <div class="tag tag--success mt-16"><i data-lucide="shield-check" style="width:13px;height:13px"></i> GREEN</div>
      </div>
      <div>
        ${bar('DOJ Roster Adherence', ROSTER_PCT, 'is-fde', 'Every rostered handgun verified against the CA DOJ certified list.')}
        ${bar('A&D Bound Book Integrity', BOOK_PCT, 'is-mid', '1,420 of 1,428 lines auto-reconciled · 8 pending manual sign-off.')}
        ${bar('DROS Procedure', DROS_PCT, 'is-fde', 'All transfers logged with 10-day clock; zero early releases.')}
      </div>
    </div>`;

  // ============================================================ ACTION feed
  const actions = [];
  if (K.drosReady > 0) actions.push(['clock', 'amber', `<b>${K.drosReady} transactions</b> cleared the 10-day wait`, 'Release & log disposition to bound book']);
  if (holdCount > 0) actions.push(['shield-alert', 'danger', `<b>${holdCount} transaction(s)</b> in DOJ delay / hold`, 'Awaiting DOJ Bureau of Firearms disposition']);
  actions.push(['book-lock', 'od', `<b>8 bound-book lines</b> need manual sign-off`, 'Reconcile before next ATF inspection window']);
  actions.push(['calendar-clock', 'od', `<b>ATF inspection window</b> opens in 42 days`, 'Annual compliance packet 96% assembled']);
  document.getElementById('actionFeed').innerHTML = actions.map(([ic, c, t, s]) =>
    `<div class="alert alert--${c === 'danger' ? 'danger' : c === 'amber' ? 'amber' : 'od'}"><i data-lucide="${ic}"></i>
      <div><div class="t-strong" style="font-size:12.5px">${t}</div><div class="muted tiny">${s}</div></div></div>`).join('');

  // ============================================================ TAB 1 — DROS
  // sort by daysLeft ascending (closest to release first)
  const drosSorted = W.dros.slice().sort((a, b) => a.daysLeft - b.daysLeft || b.day - a.day);

  function meterCls(d) {
    if (d.status === 'ready') return 'is-fde';
    if (d.status === 'hold' || d.status === 'delayed') return 'is-low';
    return 'is-mid';
  }
  function renderDros(filter) {
    let rows = drosSorted;
    if (filter === 'ready') rows = drosSorted.filter(d => d.status === 'ready');
    else if (filter === 'waiting') rows = drosSorted.filter(d => d.status === 'waiting');
    else if (filter === 'flag') rows = drosSorted.filter(d => d.status === 'hold' || d.status === 'delayed');
    const board = document.getElementById('drosBoard');
    if (!rows.length) { board.innerHTML = `<div class="panel__body muted text-center">No transactions in this filter.</div>`; return; }
    board.innerHTML = rows.map(d => {
      const ready = d.status === 'ready';
      const hold = d.status === 'hold' || d.status === 'delayed';
      const pct = Math.min(100, Math.round(d.day / 10 * 100));
      const dayColor = ready ? 'var(--fde)' : hold ? 'var(--danger)' : 'var(--amber)';
      return `<div class="dros-card ${hold ? 'is-hold' : ''}">
        <div class="dros-day"><b style="color:${dayColor}">${d.day}</b><small>DAY / 10</small></div>
        <div class="dros-mid">
          <div class="flex items-center gap-8 wrap" style="margin-bottom:4px">
            <span class="t-strong" style="font-size:13.5px">${d.customer}</span>
            <span class="tag tag--${d.statusColor}"><span class="dot"></span>${d.statusLabel}</span>
            ${d.rosterOk ? '' : '<span class="tag tag--danger"><i data-lucide="x" style="width:11px;height:11px"></i>OFF-ROSTER</span>'}
          </div>
          <div class="tiny muted" style="margin-bottom:7px">${d.item} · <span class="sku">${d.serial}</span> · ${d.cat}</div>
          <div class="meter ${meterCls(d)}"><span style="width:${pct}%"></span></div>
          <div class="flex justify-between tiny mono faint mt-8">
            <span>${d.id}</span>
            <span>${ready ? 'WAIT SATISFIED' : hold ? 'DOJ REVIEW' : d.daysLeft + ' DAYS REMAINING'}</span>
          </div>
        </div>
        <div style="text-align:right">
          <button class="btn ${ready ? 'btn--primary' : ''} btn--sm" ${ready ? '' : 'disabled'}
            onclick="WBT.cmpl.release('${d.id}','${d.customer.replace(/'/g, '')}')">
            <i data-lucide="package-check"></i> Release Firearm</button>
        </div>
      </div>`;
    }).join('');
    ui.icons();
  }

  // DROS-delayed/hold alert strip
  if (flaggedList.length) {
    document.getElementById('drosAlerts').innerHTML =
      `<div class="alert alert--danger"><i data-lucide="shield-alert"></i>
        <div><div class="t-strong">${flaggedList.length} transaction(s) flagged for DOJ review — do NOT release.</div>
        <div class="muted tiny">${flaggedList.map(d => d.id + ' · ' + d.customer + ' (' + d.statusLabel + ')').join('  •  ')}</div></div>
        <div style="margin-left:auto"><button class="btn btn--danger btn--sm" onclick="WBT.ui.toast('Opened DOJ Bureau of Firearms portal (demo)','external-link')"><i data-lucide="external-link"></i> DOJ Portal</button></div></div>`;
  }

  // throughput chart: count of transactions per day-bucket
  const buckets = [0, 0, 0, 0, 0]; // 0-2,3-4,5-6,7-9,10+
  W.dros.forEach(d => {
    const i = d.day >= 10 ? 4 : d.day >= 7 ? 3 : d.day >= 5 ? 2 : d.day >= 3 ? 1 : 0;
    buckets[i]++;
  });
  ui.bars(document.getElementById('drosChart'),
    ['D0-2', 'D3-4', 'D5-6', 'D7-9', 'D10+'], buckets,
    { colors: [ui.hexA(P.amber, .5), ui.hexA(P.amber, .7), ui.hexA(P.amber, .9), ui.hexA(P.fde, .9), P.success], thickness: 26 });

  // statutory notes
  document.getElementById('drosNotes').innerHTML = `
    <div class="kv"><span class="muted">Waiting period</span><b>10 calendar days</b></div>
    <div class="kv"><span class="muted">DROS fee (DOJ)</span><b>$37.19</b></div>
    <div class="kv"><span class="muted">Firearm Safety Cert</span><b style="color:var(--success)">REQ · VERIFIED</b></div>
    <div class="kv"><span class="muted">30-day handgun limit</span><b>ENFORCED</b></div>
    <div class="kv"><span class="muted">Safe-handling demo</span><b style="color:var(--success)">ON RECORD</b></div>
    <div class="alert alert--od mt-16" style="padding:10px 12px"><i data-lucide="info"></i>
      <div class="tiny">Clock runs from DROS submission. Early release is a felony under <b>PC § 26815</b>. The system hard-blocks release before Day 10.</div></div>`;

  // ============================================================ TAB 2 — ROSTER
  const pistols = W.inventory.filter(p => p.cat === 'pistol');
  const sel = document.getElementById('rosterSelect');
  sel.innerHTML = pistols.map(p => `<option value="${p.id}">${p.brand} ${p.model} — ${F.money(p.price)}</option>`).join('');

  function renderVerdict(id) {
    const p = W.invById[id];
    if (!p) return;
    const ok = p.ca === 'roster';
    document.getElementById('rosterVerdict').innerHTML = `
      <div class="verdict ${ok ? 'is-ok' : 'is-no'}">
        <div class="verdict-icon"><i data-lucide="${ok ? 'shield-check' : 'shield-x'}"></i></div>
        <div style="min-width:0">
          <div class="flex items-center gap-8 wrap">
            <span style="font-family:var(--f-display);font-weight:800;font-size:20px;letter-spacing:.5px;color:${ok ? 'var(--success)' : 'var(--danger)'}">
              ${ok ? 'CA DOJ ROSTER — APPROVED' : 'NOT ON CA ROSTER'}</span>
          </div>
          <div class="muted tiny mt-8">${ok
            ? 'Certified for sale to the general public in California. Cleared for DROS.'
            : 'Cannot be sold to non-exempt buyers. LE / private-party-transfer exemptions may apply.'}</div>
        </div>
      </div>
      <div class="grid grid-2 mt-16" style="gap:10px">
        <div class="kv"><span class="muted">Manufacturer</span><b>${p.brand}</b></div>
        <div class="kv"><span class="muted">Model</span><b>${p.model.split(' (')[0]}</b></div>
        <div class="kv"><span class="muted">SKU</span><b class="sku">${p.sku}</b></div>
        <div class="kv"><span class="muted">Retail</span><b>${F.money(p.price)}</b></div>
        <div class="kv"><span class="muted">Roster status</span><b style="color:${ok ? 'var(--success)' : 'var(--danger)'}">${ok ? 'CERTIFIED' : 'OFF-LIST'}</b></div>
        <div class="kv"><span class="muted">In stock</span><b>${p.qty} unit${p.qty === 1 ? '' : 's'}</b></div>
      </div>
      <button class="btn btn--ghost btn--sm w-full mt-16" onclick="WBT.ui.toast('Roster certificate (PDF) generated for ${p.brand.replace(/'/g, '')} ${p.model.split(' (')[0].replace(/'/g, '')} (demo)','file-check-2')">
        <i data-lucide="file-check-2"></i> Generate roster certificate</button>`;
    ui.icons();
  }
  sel.addEventListener('change', () => renderVerdict(sel.value));

  // featureless rifle compliance checklist
  const featChecks = [
    ['go', 'Fixed / featureless magazine (no detach w/o tool)', 'COMPLIANT'],
    ['go', 'No flash hider — muzzle brake or comp only', 'COMPLIANT'],
    ['go', 'No vertical pistol grip / VFG', 'COMPLIANT'],
    ['go', 'No adjustable / collapsible stock', 'COMPLIANT'],
    ['go', 'No threaded barrel exposed (pistols)', 'COMPLIANT'],
    ['hold', 'No forward grip on featureless build', 'VERIFY AT BUILD'],
    ['go', 'No grenade / flare launcher', 'N/A — COMPLIANT'],
  ];
  document.getElementById('featureless').innerHTML =
    featChecks.map(([s, label, val]) => `
      <div class="kv">
        <span class="muted flex items-center gap-8"><span class="sdot sdot--${s}"></span>${label}</span>
        <b style="color:${s === 'go' ? 'var(--success)' : 'var(--amber)'};font-size:11px">${val}</b>
      </div>`).join('') +
    `<div class="flex justify-between items-center mt-16">
        <span class="tag tag--success"><i data-lucide="check-check" style="width:13px;height:13px"></i> 6 / 7 AUTO-VERIFIED</span>
        <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Featureless build certified — config locked (demo)','lock')"><i data-lucide="clipboard-check"></i> Certify build</button>
     </div>`;

  // ============================================================ TAB 3 — BOUND BOOK
  const book = W.boundBook.slice().sort((a, b) => b.line - a.line);
  let bookTypeFilter = 'all', bookQuery = '';

  function renderBook() {
    const q = bookQuery.trim().toLowerCase();
    const rows = book.filter(b =>
      (bookTypeFilter === 'all' || b.type === bookTypeFilter) &&
      (!q || (b.mfg + ' ' + b.model + ' ' + b.serial + ' ' + b.party).toLowerCase().includes(q)));
    const tbl = document.getElementById('bookTable');
    const head = `<thead><tr>
      <th>Line</th><th>Date</th><th>Type</th><th>Manufacturer</th><th>Model</th>
      <th>Serial</th><th>Cal / Cat</th><th>From / To Party</th><th class="num">A&amp;D</th>
    </tr></thead>`;
    if (!rows.length) { tbl.innerHTML = head + `<tbody><tr><td colspan="9" class="muted text-center">No ledger entries match.</td></tr></tbody>`; return; }
    tbl.innerHTML = head + `<tbody>` + rows.map(b => {
      const acq = b.type === 'Acquisition';
      const dt = new Date(Date.now() - b.daysAgo * 864e5).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' });
      return `<tr class="clickable" onclick="WBT.cmpl.viewLine(${b.line})">
        <td class="mono t-strong">${b.line}</td>
        <td class="ledger-line">${dt}</td>
        <td><span class="tag tag--${acq ? 'od' : 'fde'}">${acq ? 'ACQ' : 'DISP'}</span></td>
        <td class="t-strong">${b.mfg}</td>
        <td>${b.model}</td>
        <td class="sku">${b.serial}</td>
        <td class="muted">${b.cat}</td>
        <td>${acq ? '<i data-lucide="arrow-down-left" style="width:12px;height:12px;color:var(--od-bright);vertical-align:-1px"></i> ' : '<i data-lucide="arrow-up-right" style="width:12px;height:12px;color:var(--fde);vertical-align:-1px"></i> '}${b.party}</td>
        <td class="num">${acq ? '+1' : '−1'}</td>
      </tr>`;
    }).join('') + `</tbody>`;
    ui.icons();
    const acqN = book.filter(b => b.type === 'Acquisition').length;
    document.getElementById('bookMeta').innerHTML =
      `<span>${rows.length} SHOWN</span><span class="sep">/</span><span>${acqN} ACQ</span><span class="sep">/</span><span>${book.length - acqN} DISP</span><span class="sep">/</span><span>ON HAND: ${acqN - (book.length - acqN)}</span>`;
  }

  // ============================================================ window-scoped handlers
  W.cmpl = {
    release(id, who) { ui.toast('Disposition logged to bound book · ' + id + ' (' + who + ')', 'package-check'); },
    viewLine(line) {
      const b = book.find(x => x.line === line); if (!b) return;
      const acq = b.type === 'Acquisition';
      const dt = new Date(Date.now() - b.daysAgo * 864e5).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
      ui.modal(`
        <div class="panel__head"><span class="stencil"><i data-lucide="book-lock" style="width:14px;height:14px"></i> Bound Book — Line ${b.line}</span>
          <div class="right"><button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div></div>
        <div class="panel__body">
          <div class="flex items-center gap-12 mb-16">
            <span class="tag tag--${acq ? 'od' : 'fde'}" style="font-size:12px">${b.type.toUpperCase()}</span>
            <span class="ledger-line">${dt}</span>
          </div>
          <div class="kv"><span class="muted">Manufacturer / Importer</span><b>${b.mfg}</b></div>
          <div class="kv"><span class="muted">Model</span><b>${b.model}</b></div>
          <div class="kv"><span class="muted">Serial number</span><b class="sku">${b.serial}</b></div>
          <div class="kv"><span class="muted">Type / Caliber category</span><b>${b.cat}</b></div>
          <div class="kv"><span class="muted">${acq ? 'Received from' : 'Transferred to'}</span><b>${b.party}</b></div>
          <div class="kv"><span class="muted">4473 on file</span><b style="color:var(--success)">${acq ? 'N/A (acquisition)' : 'YES · VERIFIED'}</b></div>
          <div class="alert alert--od mt-16" style="padding:10px 12px"><i data-lucide="lock"></i>
            <div class="tiny">This is a permanent bound-record entry. Corrections require a lined-out edit with initials per ATF Ruling 2016-1 — no deletions.</div></div>
          <button class="btn btn--block mt-16" onclick="WBT.ui.toast('Line ${b.line} 4473 cross-reference opened (demo)','file-search');WBT.ui.closeModal()"><i data-lucide="file-search"></i> Open 4473 cross-reference</button>
        </div>`);
    },
  };

  // ============================================================ TAB switching
  const SECT = { dros: 'sec-dros', roster: 'sec-roster', book: 'sec-book' };
  const META = {
    dros: `<span>${W.dros.length} OPEN TRANSFERS</span><span class="sep">/</span><span>${K.drosReady} RELEASABLE</span><span class="sep">/</span><span>${holdCount} HELD</span>`,
    roster: `<span>${pistols.length} HANDGUN SKUS</span><span class="sep">/</span><span>CA DOJ LIST · ${new Date().getFullYear()}</span>`,
    book: `<span>1,428 LIFETIME LINES</span><span class="sep">/</span><span>BOUND · IMMUTABLE</span>`,
  };
  function setTab(tab) {
    Object.entries(SECT).forEach(([k, idv]) => document.getElementById(idv).classList.toggle('is-on', k === tab));
    document.getElementById('tabMeta').innerHTML = META[tab];
    if (tab === 'roster') { if (!sel.value) sel.value = pistols[0]?.id; renderVerdict(sel.value); }
    if (tab === 'book') renderBook();
    ui.icons();
  }
  document.getElementById('tabSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.getElementById('tabSeg').querySelectorAll('button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    setTab(b.dataset.tab);
  });

  // DROS filter seg
  document.getElementById('drosFilter').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.getElementById('drosFilter').querySelectorAll('button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    renderDros(b.dataset.f);
  });

  // book filters
  document.getElementById('bookFilter').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.getElementById('bookFilter').querySelectorAll('button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    bookTypeFilter = b.dataset.f; renderBook();
  });
  document.getElementById('bookSearch').addEventListener('input', e => { bookQuery = e.target.value; renderBook(); });

  // -------------------------------------------------- clock
  function tick() {
    const el = document.getElementById('clock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' PST';
  }
  tick(); setInterval(tick, 1000);

  // -------------------------------------------------- initial paint
  renderDros('all');
  document.getElementById('tabMeta').innerHTML = META.dros;
  ui.icons();
})();
