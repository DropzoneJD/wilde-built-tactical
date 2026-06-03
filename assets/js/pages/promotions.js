/* Promotions — promotions.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, P = ui.PALETTE;

  // ---------------------------------------------------------------- local state
  let currentFilter = 'all';
  let promoData = W.promos.slice(); // mutable local copy for prepend

  // ---------------------------------------------------------------- helper: status tag
  function statusTag(status) {
    const map = { active: 'success', scheduled: 'amber', ended: 'steel' };
    const cls = map[status] || 'steel';
    const dot = status === 'active' ? '<span class="dot"></span>' : '';
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="tag tag--${cls}">${dot}${label}</span>`;
  }

  // ---------------------------------------------------------------- helper: type tag
  function typeTag(type) {
    const map = { Category: 'fde', BOGO: 'amber', Cart: 'blue', Identity: 'od', Storewide: 'danger' };
    const cls = map[type] || 'steel';
    return `<span class="tag tag--${cls} tag--ghost">${type}</span>`;
  }

  // ---------------------------------------------------------------- helper: ends display
  function endsDisplay(ends) {
    if (ends === 0) return '<span class="muted">Ongoing</span>';
    if (ends < 0) return `<span class="tag tag--steel">Ended ${Math.abs(ends)}d ago</span>`;
    return `<span class="mono" style="color:var(--fde)">in ${ends}d</span>`;
  }

  // ---------------------------------------------------------------- KPI ROW
  const active  = promoData.filter(p => p.status === 'active');
  const sched   = promoData.filter(p => p.status === 'scheduled');
  const ended   = promoData.filter(p => p.status === 'ended');
  const totalUses = promoData.reduce((s, p) => s + p.uses, 0);
  const totalRev  = promoData.reduce((s, p) => s + p.revenue, 0);
  const topPrm    = promoData.slice().sort((a, b) => b.revenue - a.revenue)[0];

  document.getElementById('promoMeta').textContent =
    `${active.length} ACTIVE · ${sched.length} SCHEDULED`;

  const kpis = [
    { label: 'Active Promos',    icon: 'tag',          val: active.length,           foot: active.map(p => p.code).slice(0,2).join(', '),         accent: true },
    { label: 'Codes Redeemed',   icon: 'scan-barcode', val: totalUses.toLocaleString(), foot: 'total uses across all promos' },
    { label: 'Promo Revenue',    icon: 'dollar-sign',  val: F.moneyK(totalRev),      foot: 'attributed to discount codes' },
    { label: 'Avg Discount',     icon: 'percent',      val: '12%',                   foot: 'blended rate (excl. BOGO)' },
    { label: 'Scheduled',        icon: 'calendar',     val: sched.length,             foot: sched.length ? sched[0].label : 'none queued',         warn: sched.length > 0 },
    { label: 'Top Performer',    icon: 'trophy',       val: topPrm.code,              foot: F.moneyK(topPrm.revenue) + ' attributed rev' },
  ];

  document.getElementById('kpiRow').innerHTML = kpis.map(k => {
    const d = '';
    return `<div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value" style="font-size:${typeof k.val === 'string' && k.val.length > 8 ? '18px' : '28px'};line-height:1.1">${k.val}</div>
      <div class="stat__foot"><span class="${k.warn ? '' : 'muted'}" style="${k.warn ? 'color:var(--amber)' : ''}">${k.foot}</span></div>
    </div>`;
  }).join('');

  // ---------------------------------------------------------------- PROMO TABLE
  function renderTable(filter, search) {
    let rows = promoData;
    if (filter && filter !== 'all') rows = rows.filter(p => p.status === filter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(p =>
        p.code.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.scope.toLowerCase().includes(q)
      );
    }

    const tbody = rows.map((p, idx) => {
      const capPct = p.cap > 0 ? Math.min(100, Math.round((p.uses / p.cap) * 100)) : 0;
      const meterClass = capPct >= 80 ? 'is-low' : capPct >= 50 ? 'is-mid' : 'is-fde';
      const usageCell = p.cap > 0
        ? `<div class="usage-cell">
            <div class="usage-text">${p.uses} / ${p.cap}</div>
            <div class="meter ${meterClass}" style="width:110px"><span style="width:${capPct}%"></span></div>
           </div>`
        : `<span class="mono muted">${p.uses} <span class="faint">/ ∞</span></span>`;

      const isActive = p.status === 'active';
      const switchId = `sw_${idx}`;
      return `<tr class="clickable" onclick="window._promoRowClick(${idx})">
        <td><span class="promo-code-cell">${p.code}</span></td>
        <td class="t-strong">${p.label}</td>
        <td>${typeTag(p.type)}</td>
        <td class="muted" style="font-size:12.5px">${p.scope}</td>
        <td><b class="mono" style="color:var(--fde)">${p.value}</b></td>
        <td>${usageCell}</td>
        <td class="num"><b class="mono">${p.revenue > 0 ? F.moneyK(p.revenue) : '<span class="faint">—</span>'}</b></td>
        <td>${statusTag(p.status)}</td>
        <td>${endsDisplay(p.ends)}</td>
        <td onclick="event.stopPropagation()" style="white-space:nowrap">
          <div class="flex items-center gap-8">
            <label class="switch" title="${isActive ? 'Pause' : 'Activate'}">
              <input type="checkbox" ${isActive ? 'checked' : ''} onchange="window._promoToggle(${idx}, this.checked)">
              <span></span>
            </label>
            <button class="btn btn--sm btn--ghost" onclick="window._promoCopy('${p.code}')">
              <i data-lucide="copy" style="width:13px;height:13px"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');

    document.getElementById('promoTable').innerHTML =
      `<thead><tr>
        <th>Code</th><th>Label</th><th>Type</th><th>Scope</th>
        <th>Value</th><th>Usage</th><th class="num">Revenue</th>
        <th>Status</th><th>Ends</th><th>Actions</th>
      </tr></thead><tbody>${tbody || '<tr><td colspan="10" class="text-center muted" style="padding:28px">No promotions match this filter</td></tr>'}</tbody>`;
    ui.icons();
  }

  // row click — show detail modal
  window._promoRowClick = function(idx) {
    const p = promoData[idx];
    if (!p) return;
    ui.modal(`
      <div class="panel">
        <div class="panel__head">
          <span class="stencil"><i data-lucide="tag" style="width:13px;height:13px"></i> Promo Detail — ${p.code}</span>
          <div class="right"><button class="btn btn--sm btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
        </div>
        <div class="panel__body">
          <div class="grid grid-2" style="gap:12px;margin-bottom:16px">
            <div>
              <div class="kv"><span>Code</span><b class="mono" style="color:var(--fde)">${p.code}</b></div>
              <div class="kv"><span>Label</span><b>${p.label}</b></div>
              <div class="kv"><span>Type</span><b>${p.type}</b></div>
              <div class="kv"><span>Scope</span><b>${p.scope}</b></div>
            </div>
            <div>
              <div class="kv"><span>Discount</span><b style="color:var(--amber)">${p.value}</b></div>
              <div class="kv"><span>Uses</span><b>${p.uses}${p.cap > 0 ? ' / ' + p.cap : ' / unlimited'}</b></div>
              <div class="kv"><span>Revenue</span><b style="color:var(--success)">${F.money(p.revenue)}</b></div>
              <div class="kv"><span>Status</span><b>${p.status}</b></div>
            </div>
          </div>
          <div class="flex gap-8 mt-16">
            <button class="btn btn--primary" onclick="window._promoCopy('${p.code}');WBT.ui.closeModal()"><i data-lucide="copy"></i> Copy Code</button>
            <button class="btn btn--danger" onclick="WBT.ui.closeModal();WBT.ui.toast('Promo ${p.code} archived (demo)','trash-2')"><i data-lucide="trash-2"></i> Archive</button>
            <button class="btn btn--ghost" onclick="WBT.ui.closeModal()">Close</button>
          </div>
        </div>
      </div>
    `, { lg: false });
    ui.icons();
  };

  window._promoToggle = function(idx, checked) {
    const p = promoData[idx];
    if (!p) return;
    p.status = checked ? 'active' : 'scheduled';
    renderTable(currentFilter, document.getElementById('promoSearch').value);
    ui.toast(`${p.code} ${checked ? 'activated' : 'paused'}`, checked ? 'play' : 'pause');
  };

  window._promoCopy = function(code) {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    ui.toast(`Copied "${code}" to clipboard`, 'copy-check');
  };

  // initial render
  renderTable('all', '');

  // ---------------------------------------------------------------- FILTER SEG
  document.getElementById('filterSeg').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    document.querySelectorAll('#filterSeg button').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentFilter = btn.dataset.f;
    renderTable(currentFilter, document.getElementById('promoSearch').value);
  });

  // ---------------------------------------------------------------- SEARCH
  document.getElementById('promoSearch').addEventListener('input', e => {
    renderTable(currentFilter, e.target.value);
  });

  // ---------------------------------------------------------------- CREATE PROMO MODAL
  document.getElementById('createPromoBtn').addEventListener('click', () => {
    ui.modal(`
      <div class="panel">
        <div class="panel__head">
          <span class="stencil"><i data-lucide="plus" style="width:13px;height:13px"></i> Create Promotion</span>
          <div class="right"><button class="btn btn--sm btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
        </div>
        <div class="panel__body">
          <div class="grid grid-2" style="gap:14px">
            <div>
              <label class="fld">Promo Code</label>
              <input class="input" id="newCode" placeholder="e.g. SUMMER20" style="text-transform:uppercase">
            </div>
            <div>
              <label class="fld">Label / Name</label>
              <input class="input" id="newLabel" placeholder="Promo description">
            </div>
            <div>
              <label class="fld">Type</label>
              <select class="input" id="newType">
                <option>Category</option>
                <option>Cart</option>
                <option>BOGO</option>
                <option>Identity</option>
                <option>Storewide</option>
              </select>
            </div>
            <div>
              <label class="fld">Scope</label>
              <input class="input" id="newScope" placeholder="e.g. Optics, All, First Order">
            </div>
            <div>
              <label class="fld">Discount Value</label>
              <input class="input" id="newValue" placeholder="e.g. 10%, $25, B2G1">
            </div>
            <div>
              <label class="fld">Redemption Cap (0 = unlimited)</label>
              <input class="input" id="newCap" type="number" value="0" min="0">
            </div>
            <div>
              <label class="fld">Start Date</label>
              <input class="input" id="newStart" type="date">
            </div>
            <div>
              <label class="fld">End Date (leave blank = ongoing)</label>
              <input class="input" id="newEnd" type="date">
            </div>
          </div>
          <div class="flex gap-8 mt-24">
            <button class="btn btn--primary w-full" id="submitPromoBtn"><i data-lucide="check"></i> Create Promotion</button>
            <button class="btn btn--ghost" onclick="WBT.ui.closeModal()">Cancel</button>
          </div>
        </div>
      </div>
    `, { lg: true });
    ui.icons();

    document.getElementById('submitPromoBtn').addEventListener('click', () => {
      const code  = (document.getElementById('newCode').value || '').trim().toUpperCase();
      const label = (document.getElementById('newLabel').value || '').trim();
      const type  = document.getElementById('newType').value;
      const scope = (document.getElementById('newScope').value || '').trim();
      const value = (document.getElementById('newValue').value || '').trim();
      const cap   = parseInt(document.getElementById('newCap').value, 10) || 0;
      const endVal = document.getElementById('newEnd').value;

      if (!code || !label) {
        ui.toast('Code and label are required', 'alert-triangle');
        return;
      }

      const endDays = endVal
        ? Math.round((new Date(endVal) - new Date()) / 86400000)
        : 0;

      const newPromo = {
        code, label, type, scope,
        value: value || '0%',
        uses: 0, cap, revenue: 0,
        status: 'active',
        ends: endDays > 0 ? endDays : 0,
      };
      promoData.unshift(newPromo);
      ui.closeModal();
      renderTable(currentFilter, document.getElementById('promoSearch').value);
      ui.toast(`Promo "${code}" created and activated`, 'check-circle');
    });
  });

  // ---------------------------------------------------------------- REVENUE CHART
  const chartPromos = promoData.filter(p => p.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  ui.bars(
    document.getElementById('promoRevenueChart'),
    chartPromos.map(p => p.code),
    chartPromos.map(p => p.revenue),
    {
      horizontal: true,
      money: true,
      colors: chartPromos.map((p, i) => {
        if (p.status === 'active')    return ui.hexA(P.fde, 1 - i * 0.08);
        if (p.status === 'scheduled') return ui.hexA(P.amber, 0.7);
        return ui.hexA(P.steel, 0.5);
      }),
    }
  );

  // ---------------------------------------------------------------- REDEMPTION TREND sparkline
  const redemptionData = [24, 31, 28, 42, 38, 55, 48, 62, 57, 70, 65, 80, 74, 88];
  ui.spark(document.getElementById('redemptionChart'), redemptionData, P.fde);

  // ---------------------------------------------------------------- BUNDLE SHOWCASE
  const bundles = [
    {
      name: 'Optic + Mount + Sight Tool',
      desc: 'Complete red-dot setup for any CA-compliant rifle build',
      items: [
        { name: 'Holosun 507C X2 Green Dot',       price: 33900 },
        { name: 'American Defense RECON Mount',     price: 13900 },
        { name: 'Holosun Sight Adjustment Tool',    price: 1900 },
      ],
      savings: 4800,
      icon: 'scan-eye',
      tag: 'Category Deal',
      tagCls: 'fde',
      doorbuster: false,
    },
    {
      name: 'Range Day Pack',
      desc: 'Everything you need for a day at the range — stocked and ready',
      items: [
        { name: 'Federal 9mm 115gr FMJ ×4',        price: 7596 },
        { name: 'Magpul PMAG 10/30 AR ×3 (CA)',    price: 4797 },
        { name: 'Streamlight TLR-7A Weapon Light',  price: 16900 },
        { name: 'Ferro Concepts Slingster Sling',   price: 4900 },
      ],
      savings: 6300,
      icon: 'package',
      tag: 'Bundle Deal',
      tagCls: 'od',
      doorbuster: false,
    },
    {
      name: 'Black Friday Doorbusters',
      desc: '20% off sitewide — limited to 500 redemptions · Drops Nov 29',
      items: [
        { name: 'All Firearms (CA-compliant)',      price: null },
        { name: 'All Optics + Lighting',            price: null },
        { name: 'All Accessories + Apparel',        price: null },
      ],
      savings: null,
      icon: 'zap',
      tag: 'Scheduled · Nov 29',
      tagCls: 'amber',
      doorbuster: true,
      code: 'BLACKFRI',
      countdown: 'In 175 days',
    },
  ];

  const bContainer = document.getElementById('bundleShowcase');
  bContainer.innerHTML = `<div class="bundle-grid">${
    bundles.map(b => {
      const sum = b.items.reduce((s, it) => it.price ? s + it.price : s, 0);
      const bundlePrice = sum && b.savings ? sum - b.savings : null;

      return `<div class="bundle-card ${b.doorbuster ? 'is-doorbuster' : ''}">
        <div class="flex items-center gap-8 mb-8">
          <div class="prod-thumb" style="width:34px;height:34px"><i data-lucide="${b.icon}"></i></div>
          <div style="min-width:0">
            <div class="bundle-name">${b.name}</div>
            <div class="tiny muted">${b.desc}</div>
          </div>
        </div>

        ${b.doorbuster ? `
          <div style="margin:10px 0 12px">
            <span class="tag tag--amber"><span class="dot"></span>Scheduled Doorbuster</span>
            <span class="tag tag--steel tag--ghost" style="margin-left:6px">${b.countdown}</span>
          </div>
        ` : ''}

        <ul class="bundle-items" style="padding:0;margin:10px 0;list-style:none">
          ${b.items.map(it => `<li>${it.name}${it.price ? '<span class="mono faint" style="float:right">'+F.money(it.price)+'</span>' : ''}</li>`).join('')}
        </ul>

        ${bundlePrice ? `
          <div class="bundle-price-row">
            <div class="bundle-price">${F.money(bundlePrice)}</div>
            <div class="bundle-was">${F.money(sum)}</div>
            <span class="tag tag--success">Save ${F.money(b.savings)}</span>
          </div>
        ` : b.doorbuster ? `
          <div class="flex items-center gap-8 mt-12">
            <div class="bundle-price" style="color:var(--amber)">20% OFF</div>
            <span class="tag tag--amber tag--ghost">Code: ${b.code}</span>
          </div>
        ` : ''}

        <div class="flex gap-8 mt-14">
          ${b.doorbuster
            ? `<button class="btn btn--amber btn--sm" onclick="window._promoCopy('${b.code}')"><i data-lucide="copy"></i> Copy Code</button>
               <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Black Friday doorbuster preview opened (demo)','eye')"><i data-lucide="eye"></i> Preview</button>`
            : `<button class="btn btn--primary btn--sm" onclick="WBT.ui.toast('Bundle added to active promos (demo)','check')"><i data-lucide="tag"></i> Apply Bundle Deal</button>
               <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Bundle builder opened (demo)','edit')"><i data-lucide="edit-2"></i> Edit</button>`
          }
        </div>
      </div>`;
    }).join('')
  }</div>`;

  // ---------------------------------------------------------------- PROMO INTEL
  const conversionRate = 18.4;
  const avgRedemptionsPerDay = (totalUses / 30).toFixed(1);
  const highestROI = promoData.slice().sort((a, b) => {
    const aROI = a.uses > 0 ? a.revenue / a.uses : 0;
    const bROI = b.uses > 0 ? b.revenue / b.uses : 0;
    return bROI - aROI;
  })[0];

  document.getElementById('promoIntel').innerHTML = `
    <div class="kv"><span class="muted">Redemptions / day</span><b class="mono">${avgRedemptionsPerDay}</b></div>
    <div class="kv"><span class="muted">Conversion lift</span><b style="color:var(--success)">+${conversionRate}%</b></div>
    <div class="kv"><span class="muted">Best revenue/use</span><b class="mono" style="font-size:11px;color:var(--fde)">${highestROI.code}</b></div>
    <div class="kv"><span class="muted">Capped codes at risk</span><b style="color:var(--amber)">${promoData.filter(p => p.cap > 0 && p.uses / p.cap >= 0.8 && p.status === 'active').length}</b></div>
    <div class="kv"><span class="muted">Promo attach rate</span><b>31.2%</b></div>
    <div class="mt-16">
      <div class="flex justify-between tiny mono muted mb-8"><span>BUDGET UTILIZATION</span><span>63%</span></div>
      <div class="meter is-fde"><span style="width:63%"></span></div>
    </div>
    <div class="mt-12">
      <div class="flex justify-between tiny mono muted mb-8"><span>CAP FILL (RANGEDAY15)</span><span>47%</span></div>
      <div class="meter is-mid"><span style="width:47%"></span></div>
    </div>
    <button class="btn btn--ghost btn--sm w-full mt-16" onclick="WBT.ui.toast('Full promo analytics report generated (demo)','bar-chart-2')"><i data-lucide="bar-chart-2"></i> Full Analytics</button>
  `;

  ui.icons();
})();
