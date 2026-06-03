/* Customer Intel — customers.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE;
  const custs = W.customers;

  // ---- segment helpers ----
  const segs = {
    vip:     { label: 'VIP / Collector',  color: 'fde',   hex: P.fde },
    regular: { label: 'Regular',          color: 'od',    hex: P.od },
    new:     { label: 'New Buyer',        color: 'blue',  hex: P.blue },
    lapsed:  { label: 'Lapsed',           color: 'steel', hex: P.steel },
  };
  function countSeg(seg) { return custs.filter(c => c.seg === seg).length; }
  const vipCount     = countSeg('vip');
  const newCount     = countSeg('new');
  const lapsedCount  = countSeg('lapsed');
  const regularCount = countSeg('regular');
  const avgLtv       = Math.round(custs.reduce((s, c) => s + c.ltv, 0) / custs.length);

  // ---- meta row ----
  document.getElementById('custCount').textContent = K.members + ' OPERATORS ON FILE';
  document.getElementById('optInCount').textContent = K.optInRate + '% OPT-IN';
  document.getElementById('totalCustTag').textContent = K.members + ' Total';

  // ---- KPI row ----
  const kpis = [
    { label: 'Total Customers', icon: 'users', val: K.members.toLocaleString(), foot: 'on file', accent: true },
    { label: 'VIP / Collector', icon: 'star', val: vipCount, foot: 'LTV ≥ $750', color: 'var(--fde)' },
    { label: 'New · 30d',       icon: 'user-plus', val: newCount, foot: '< 4 orders', color: 'var(--tac-blue)' },
    { label: 'Lapsed',          icon: 'user-minus', val: lapsedCount, foot: '> 120d no visit', warn: true },
    { label: 'Avg LTV',         icon: 'trending-up', val: F.money(avgLtv), foot: 'per customer' },
    { label: 'Opt-In Rate',     icon: 'mail', val: K.optInRate + '%', foot: 'marketing consent' },
  ];
  document.getElementById('kpiRow').innerHTML = kpis.map(k =>
    `<div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value" style="${k.color ? 'color:' + k.color : ''}">${k.val}</div>
      <div class="stat__foot"><span class="${k.warn ? '' : 'muted'}" style="${k.warn ? 'color:var(--amber)' : ''}">${k.foot}</span></div>
    </div>`
  ).join('');

  // ---- segment donut ----
  const segOrder = ['vip','regular','new','lapsed'];
  const segCounts = segOrder.map(s => countSeg(s));
  const segLabels = segOrder.map(s => segs[s].label);
  const segColors = segOrder.map(s => segs[s].hex);
  ui.donut(document.getElementById('segDonut'), segLabels, segCounts, segColors);

  // ---- segment cards ----
  const segCardData = [
    { key: 'vip', count: vipCount, icon: 'star', note: '≥ 10 orders or high LTV' },
    { key: 'regular', count: regularCount, icon: 'user-check', note: '4–9 orders' },
    { key: 'new', count: newCount, icon: 'user-plus', note: '1–3 orders · < 90d' },
    { key: 'lapsed', count: lapsedCount, icon: 'clock', note: '> 120d inactive' },
  ];
  document.getElementById('segCards').innerHTML = segCardData.map(s => {
    const pct = Math.round(s.count / custs.length * 100);
    return `<div class="seg-card">
      <div class="seg-card__label"><span class="tag tag--${segs[s.key].color}" style="font-size:9px;padding:2px 7px">${segs[s.key].label}</span></div>
      <div class="seg-card__count" style="color:var(--${segs[s.key].color === 'od' ? 'od-bright' : segs[s.key].color === 'blue' ? 'tac-blue' : segs[s.key].color})">${s.count}</div>
      <div class="seg-card__pct">${pct}% of base</div>
      <div class="tiny muted mt-8">${s.note}</div>
    </div>`;
  }).join('');

  // ---- engagement stats ----
  const fflCount = custs.filter(c => c.fflOnFile).length;
  const optInCount = custs.filter(c => c.marketingOptIn).length;
  const activeRecent = custs.filter(c => c.lastDays <= 30).length;
  const avgOrders = (custs.reduce((s, c) => s + c.orders, 0) / custs.length).toFixed(1);
  const engStats = [
    { label: 'Active (30d)', val: activeRecent, icon: 'activity', color: 'var(--success)' },
    { label: 'FFL on File',  val: fflCount,     icon: 'shield-check', color: 'var(--fde)' },
    { label: 'Opt-In SMS/Email', val: optInCount, icon: 'mail-check', color: 'var(--tac-blue)' },
    { label: 'Avg Orders',  val: avgOrders,    icon: 'receipt-text', color: 'var(--od-bright)' },
  ];
  document.getElementById('engagementStats').innerHTML = engStats.map(e =>
    `<div class="flex items-center gap-12">
      <div style="width:36px;height:36px;border-radius:var(--r);background:var(--panel-3);border:1px solid var(--line-2);display:grid;place-items:center;flex:0 0 auto;color:${e.color}">
        <i data-lucide="${e.icon}" style="width:16px;height:16px"></i></div>
      <div>
        <div style="font-family:var(--f-display);font-weight:800;font-size:22px;line-height:1;color:${e.color}">${e.val}</div>
        <div class="tiny muted mt-8">${e.label}</div>
      </div>
    </div>`
  ).join('');

  // ---- customer table ----
  let currentSeg = 'all';
  let currentSearch = '';

  function segColorClass(c) {
    const map = { fde: 'tag--fde', od: 'tag--od', blue: 'tag--blue', steel: 'tag--steel' };
    return map[c] || '';
  }

  function tierColor(tier) {
    const map = { Recruit: 'var(--muted)', Operator: 'var(--od-bright)', Vanguard: 'var(--fde)', Elite: 'var(--amber)' };
    return map[tier] || 'var(--muted)';
  }

  function lastSeenStr(days) {
    if (days === 0) return '<span style="color:var(--success)">Today</span>';
    if (days === 1) return '1d ago';
    if (days < 30) return days + 'd ago';
    const m = Math.floor(days / 30);
    return '<span style="color:var(--amber)">' + (m === 1 ? '1 mo ago' : m + ' mo ago') + '</span>';
  }

  function renderTable() {
    const q = currentSearch.toLowerCase();
    const rows = custs.filter(c => {
      const segOk = currentSeg === 'all' || c.seg === currentSeg;
      const srchOk = !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      return segOk && srchOk;
    });

    document.getElementById('rowCount').textContent = rows.length + ' results';

    const thead = `<thead><tr>
      <th>Customer</th><th>City</th><th>Segment</th><th>Tier</th>
      <th class="num">Orders</th><th class="num">LTV</th><th class="num">Points</th>
      <th>Last Seen</th><th class="text-center">FFL</th><th class="text-center">Opt-In</th>
    </tr></thead>`;

    const tbody = '<tbody>' + rows.map(c =>
      `<tr class="clickable" data-id="${c.id}" onclick="window._wbtOpenCustomer('${c.id}')">
        <td>
          <div class="t-strong">${c.name}</div>
          <div class="tiny muted mono">${c.email}</div>
        </td>
        <td class="muted">${c.city}</td>
        <td><span class="tag ${segColorClass(c.segColor)}">${c.segLabel}</span></td>
        <td style="color:${tierColor(c.tier)};font-family:var(--f-tac);font-size:11.5px;font-weight:700;letter-spacing:.05em">${c.tier.toUpperCase()}</td>
        <td class="num">${c.orders}</td>
        <td class="num t-strong">${F.money(c.ltv)}</td>
        <td class="num">${c.points.toLocaleString()}</td>
        <td>${lastSeenStr(c.lastDays)}</td>
        <td class="text-center">${c.fflOnFile ? '<span class="sdot sdot--go"></span>' : '<span class="faint tiny">—</span>'}</td>
        <td class="text-center">${c.marketingOptIn ? '<span class="sdot sdot--go"></span>' : '<span class="sdot sdot--stop"></span>'}</td>
      </tr>`
    ).join('') + '</tbody>';

    document.getElementById('custTable').innerHTML = thead + tbody;
    ui.icons();
  }

  // seg filter
  document.getElementById('segFilter').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    document.querySelectorAll('#segFilter button').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentSeg = btn.dataset.seg;
    renderTable();
  });

  // search
  document.getElementById('custSearch').addEventListener('input', e => {
    currentSearch = e.target.value;
    renderTable();
  });

  renderTable();

  // ---- customer profile modal ----
  window._wbtOpenCustomer = function (id) {
    const c = W.custById[id];
    if (!c) return;

    // find their orders
    const custOrders = W.orders.filter(o => o.custId === id).slice(0, 5);

    const tierPcts = { Recruit: 15, Operator: 40, Vanguard: 72, Elite: 100 };
    const pct = tierPcts[c.tier] || 20;
    const meterClass = pct >= 80 ? 'is-fde' : pct >= 50 ? 'is-mid' : '';

    const nextTierMap = { Recruit: 'Operator', Operator: 'Vanguard', Vanguard: 'Elite', Elite: null };
    const nextTier = nextTierMap[c.tier];
    const nextTierNote = nextTier ? 'Progress to ' + nextTier : 'MAX TIER — Elite Operator';

    const orderRows = custOrders.length > 0
      ? custOrders.map(o => `<div class="kv"><span class="mono muted" style="font-size:11px">${o.id}</span>
          <div class="flex items-center gap-8">
            <span class="tag tag--${o.statusColor}" style="font-size:9px;padding:2px 6px">${o.statusLabel}</span>
            <b class="mono" style="font-size:12px">${F.money(o.total)}</b>
          </div></div>`).join('')
      : '<div class="muted tiny" style="padding:8px 0">No orders on record</div>';

    const html = `
      <div class="panel modal--lg">
        <div class="panel__head">
          <span class="stencil"><i data-lucide="user" style="width:13px;height:13px"></i> Operator Profile</span>
          <div class="right">
            <span class="tag tag--${segColorClass(c.segColor)}">${c.segLabel}</span>
            <button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button>
          </div>
        </div>
        <div class="panel__body">
          <div class="grid grid-2" style="gap:20px">
            <!-- left col -->
            <div>
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
                <div style="width:50px;height:50px;border-radius:var(--r);background:linear-gradient(135deg,var(--od),var(--fde-deep));display:grid;place-items:center;font-family:var(--f-display);font-weight:800;font-size:22px;color:#0c0f0d;flex:0 0 auto">${c.name.charAt(0)}</div>
                <div>
                  <div style="font-family:var(--f-display);font-weight:800;font-size:20px">${c.name}</div>
                  <div class="tiny mono muted">${c.id}</div>
                </div>
              </div>
              <div class="kv"><span class="muted">Email</span><b class="mono" style="font-size:12px">${c.email}</b></div>
              <div class="kv"><span class="muted">Phone</span><b class="mono" style="font-size:12px">${c.phone}</b></div>
              <div class="kv"><span class="muted">City</span><b>${c.city}</b></div>
              <div class="kv"><span class="muted">FFL on File</span><b>${c.fflOnFile ? '<span style="color:var(--success)">Yes</span>' : '<span class="muted">No</span>'}</b></div>
              <div class="kv"><span class="muted">Marketing Opt-In</span><b>${c.marketingOptIn ? '<span style="color:var(--success)">Yes</span>' : '<span style="color:var(--danger)">No</span>'}</b></div>
              <div class="kv"><span class="muted">Last Seen</span><b>${c.lastDays === 0 ? 'Today' : c.lastDays + 'd ago'}</b></div>
              <div class="mt-16">
                <div class="flex justify-between tiny mono muted mb-8">
                  <span>LOYALTY TIER — ${c.tier.toUpperCase()}</span>
                  <span>${nextTierNote}</span>
                </div>
                <div class="meter ${meterClass}"><span style="width:${pct}%"></span></div>
              </div>
              <div class="grid grid-2 mt-16" style="gap:10px">
                <div style="background:var(--panel-3);border:1px solid var(--line-2);border-radius:var(--r);padding:10px 12px;text-align:center">
                  <div style="font-family:var(--f-display);font-weight:800;font-size:22px">${c.orders}</div>
                  <div class="tiny muted">Orders</div>
                </div>
                <div style="background:var(--panel-3);border:1px solid var(--line-2);border-radius:var(--r);padding:10px 12px;text-align:center">
                  <div style="font-family:var(--f-display);font-weight:800;font-size:22px;color:var(--fde)">${F.moneyK(c.ltv)}</div>
                  <div class="tiny muted">Lifetime Value</div>
                </div>
                <div style="background:var(--panel-3);border:1px solid var(--line-2);border-radius:var(--r);padding:10px 12px;text-align:center">
                  <div style="font-family:var(--f-display);font-weight:800;font-size:22px;color:var(--od-bright)">${c.points.toLocaleString()}</div>
                  <div class="tiny muted">Points</div>
                </div>
                <div style="background:var(--panel-3);border:1px solid var(--line-2);border-radius:var(--r);padding:10px 12px;text-align:center">
                  <div style="font-family:var(--f-display);font-weight:800;font-size:22px;color:${tierColor(c.tier)}">${c.tier.toUpperCase()}</div>
                  <div class="tiny muted">Tier</div>
                </div>
              </div>
            </div>
            <!-- right col -->
            <div>
              <div class="stencil mb-12" style="font-size:10px">Order History</div>
              ${orderRows}
              <div class="mt-16">
                <div class="stencil mb-12" style="font-size:10px">Actions</div>
                <div class="flex gap-8 wrap">
                  <button class="btn btn--primary btn--sm" onclick="WBT.ui.toast('${c.name} added to campaign (demo)','mail');WBT.ui.closeModal()"><i data-lucide="mail"></i> Add to Campaign</button>
                  <button class="btn btn--amber btn--sm" onclick="WBT.ui.toast('$25 range credit issued to ${c.name} (demo)','gift');WBT.ui.closeModal()"><i data-lucide="gift"></i> Issue $25 Range Credit</button>
                  <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Viewing ${c.name} DROS records (demo)','shield-check');WBT.ui.closeModal()"><i data-lucide="shield-check"></i> DROS Records</button>
                  <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Note added for ${c.name} (demo)','pencil');WBT.ui.closeModal()"><i data-lucide="pencil"></i> Add Note</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    ui.modal(html, { lg: true });
    ui.icons();
  };

  // ---- loyalty tiers ----
  const tierDefs = [
    {
      name: 'Recruit',
      range: '1–5 orders',
      color: 'var(--muted)',
      border: 'var(--line-2)',
      perks: ['5% birthday discount', 'Email newsletter', 'New arrival alerts', 'Member pricing on range ammo'],
    },
    {
      name: 'Operator',
      range: '6–11 orders',
      color: 'var(--od-bright)',
      border: 'rgba(138,161,92,.4)',
      perks: ['All Recruit perks', '10% annual upgrade credit', 'Priority DROS notifications', 'Free range day (1x/yr)'],
    },
    {
      name: 'Vanguard',
      range: '12–17 orders',
      color: 'var(--fde)',
      border: 'rgba(194,161,123,.4)',
      perks: ['All Operator perks', 'Early access new arrivals', '$50 transfer fee credit', 'VIP range events', 'Armorer consult (1x/yr)'],
    },
    {
      name: 'Elite',
      range: '18+ orders',
      color: 'var(--amber)',
      border: 'rgba(255,180,58,.4)',
      perks: ['All Vanguard perks', 'Free DROS on every transaction', 'Annual $100 store credit', 'Lifetime range membership', 'White-glove gunsmith priority'],
    },
  ];

  const tierCounts = W.TIERS.map(t => custs.filter(c => c.tier === t).length);

  document.getElementById('loyaltyTiers').innerHTML = tierDefs.map((t, i) => `
    <div class="tier-card" style="border-color:${t.border}">
      <div class="tier-card__head">
        <div class="tier-card__name" style="color:${t.color}">${t.name}</div>
        <div style="font-family:var(--f-mono);font-size:18px;font-weight:700;color:${t.color}">${tierCounts[i]}</div>
      </div>
      <div class="tier-card__threshold">${t.range}</div>
      <ul class="tier-card__perks">${t.perks.map(p => '<li>' + p + '</li>').join('')}</ul>
    </div>
  `).join('');

  // ---- top 5 leaderboard ----
  const top5 = custs.slice(0, 5);
  const maxLtv = top5[0].ltv;

  document.getElementById('leaderboard').innerHTML = top5.map((c, i) => {
    const pct = Math.round((c.ltv / maxLtv) * 100);
    const medals = ['🥇', '🥈', '🥉', '4', '5'];
    return `<div class="leaderboard-row">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-bar-wrap" style="min-width:0">
        <div class="flex items-center justify-between">
          <div>
            <span class="t-strong" style="font-size:13px">${c.name}</span>
            <span class="tag tag--${segColorClass(c.segColor)} ml-8" style="font-size:9px;padding:2px 6px">${c.tier}</span>
          </div>
          <span class="lb-val">${F.money(c.ltv)}</span>
        </div>
        <div class="lb-bar" style="width:${pct}%"></div>
      </div>
    </div>`;
  }).join('');

  ui.icons();
})();
