/* ============================================================================
   WILDE BUILT TACTICAL — app shell  (window.WBT.ui)
   Renders sidebar + topbar on every page, themes Chart.js, and exposes UI
   helpers (icons, toasts, modals, chart factories) so pages stay short.
   Requires: data.js, Lucide (CDN), Chart.js (CDN, optional per page).
   ============================================================================ */
(function () {
  const W = window.WBT;
  const K = W.kpi;

  // -------------------------------------------------- navigation registry
  const NAV = [
    { sec: 'Operations' },
    { key: 'dashboard',  label: 'Command Center', icon: 'layout-dashboard', href: 'dashboard.html' },
    { key: 'inventory',  label: 'Armory',         icon: 'boxes',            href: 'inventory.html', badge: K.lowStock + K.outStock, badgeAmber: true },
    { key: 'orders',     label: 'Sales & Orders', icon: 'receipt-text',     href: 'orders.html' },
    { key: 'compliance', label: 'CA Compliance',  icon: 'shield-check',     href: 'compliance.html', badge: K.drosPending, badgeAmber: true },
    { sec: 'Growth' },
    { key: 'carts',      label: 'Cart Recovery',  icon: 'shopping-cart',    href: 'carts.html', badge: K.activeCarts },
    { key: 'promotions', label: 'Promotions',     icon: 'ticket-percent',   href: 'promotions.html' },
    { key: 'marketing',  label: 'Marketing',      icon: 'send',             href: 'marketing.html' },
    { key: 'customers',  label: 'Customers',      icon: 'users',            href: 'customers.html' },
    { sec: 'Intelligence' },
    { key: 'forecast',   label: 'Forecast',       icon: 'radar',            href: 'forecast.html' },
    { key: 'reports',    label: 'Reports',        icon: 'chart-no-axes-combined', href: 'reports.html' },
    { sec: 'Unit' },
    { key: 'staff',      label: 'Staff & Range',  icon: 'shield-half',      href: 'staff.html' },
    { key: 'settings',   label: 'Settings',       icon: 'settings',         href: 'settings.html' },
  ];

  const TITLES = {
    dashboard: ['Command Center', 'Real-time operational overview'],
    inventory: ['The Armory', 'Serialized + non-serialized inventory control'],
    orders: ['Sales & Orders', 'Omnichannel order pipeline'],
    compliance: ['CA Compliance Center', 'DROS · 10-day clock · DOJ roster · bound book'],
    carts: ['Cart Recovery', 'Automated abandoned-cart win-back'],
    promotions: ['Promotions', 'Codes, bundles & doorbusters'],
    marketing: ['Marketing Ops', 'Campaigns, automations & broadcasts'],
    customers: ['Customer Intel', 'CRM, segments & lifetime value'],
    forecast: ['Forecast Intelligence', 'Demand + restock recommendations'],
    reports: ['Reports', 'Deep-dive analytics'],
    staff: ['Staff & Range', 'Team, certifications & performance'],
    settings: ['Settings', 'Store, FFL & system configuration'],
  };

  // -------------------------------------------------- render: sidebar
  function renderSidebar(active) {
    const items = NAV.map(n => {
      if (n.sec) return `<div class="nav__section">${n.sec}</div>`;
      const badge = n.badge ? `<span class="nav__badge ${n.badgeAmber ? 'is-amber' : ''}">${n.badge}</span>` : '';
      return `<a class="nav__item ${n.key === active ? 'is-active' : ''}" href="${n.href}">
        <i data-lucide="${n.icon}"></i><span>${n.label}</span>${badge}</a>`;
    }).join('');
    return `
      <div class="sidebar__brand">
        <div class="brand-mark"><i data-lucide="crosshair" style="width:20px;height:20px"></i></div>
        <div class="brand-text"><b>WILDE BUILT</b><span>TACTICAL // OPS</span></div>
      </div>
      <nav class="nav">${items}</nav>
      <div class="sidebar__foot">
        <div class="avatar">RC</div>
        <div style="line-height:1.2;min-width:0">
          <div style="font-weight:600;font-size:13px">Ray Calhoun</div>
          <div class="mono" style="font-size:10px;color:var(--fde)">FFL 01 · OWNER</div>
        </div>
        <a href="index.html" class="btn btn--icon btn--ghost" title="Sign out" style="margin-left:auto"><i data-lucide="log-out"></i></a>
      </div>`;
  }

  // -------------------------------------------------- render: topbar
  function renderTopbar(active) {
    const [title] = TITLES[active] || ['Command Center', ''];
    return `
      <button class="btn btn--icon btn--ghost menu-toggle" id="menuToggle"><i data-lucide="menu"></i></button>
      <div>
        <div class="topbar__title">${title}</div>
        <div class="topbar__crumbs">WBT // ${(active || '').toUpperCase()}</div>
      </div>
      <div class="topbar__spacer"></div>
      <div class="search hide-sm" style="width:240px">
        <i data-lucide="search"></i>
        <input class="input" placeholder="Search SKU, order, customer…" onkeydown="if(event.key==='Enter')WBT.ui.toast('Search is mocked in this demo')">
      </div>
      <div class="seg" id="locSwitch" title="Location">
        <button class="is-active" data-loc="all">ALL</button>
        <button data-loc="sd">SD</button>
        <button data-loc="esc">ESC</button>
      </div>
      <button class="btn btn--icon btn--ghost" title="Live status" style="position:relative">
        <span class="sdot sdot--go" style="margin:0"></span>
      </button>
      <button class="btn btn--icon btn--ghost" onclick="WBT.ui.notifications()" title="Alerts" style="position:relative">
        <i data-lucide="bell"></i>
        <span style="position:absolute;top:3px;right:3px;width:7px;height:7px;border-radius:50%;background:var(--danger);box-shadow:0 0 6px var(--danger)"></span>
      </button>`;
  }

  // -------------------------------------------------- mount
  function mount() {
    const active = document.body.dataset.page;
    const sb = document.getElementById('sidebar');
    const tb = document.getElementById('topbar');
    if (sb) sb.innerHTML = renderSidebar(active);
    if (tb) tb.innerHTML = renderTopbar(active);

    // mobile sidebar
    const mt = document.getElementById('menuToggle');
    if (mt) mt.addEventListener('click', () => sb.classList.toggle('is-open'));

    // location switch (cosmetic)
    const ls = document.getElementById('locSwitch');
    if (ls) ls.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      ls.querySelectorAll('button').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      ui.toast('Location filter: ' + b.textContent + ' (demo)');
    });

    icons();
  }

  // -------------------------------------------------- UI helpers
  function icons() { if (window.lucide) window.lucide.createIcons(); }

  function toast(msg, icon) {
    const stack = document.getElementById('toast-stack') || (() => { const d = document.createElement('div'); d.id = 'toast-stack'; document.body.appendChild(d); return d; })();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i data-lucide="${icon || 'check-circle-2'}"></i><span>${msg}</span>`;
    stack.appendChild(el); icons();
    setTimeout(() => { el.style.transition = 'opacity .3s,transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; setTimeout(() => el.remove(), 320); }, 3200);
  }

  function modal(html, opts) {
    closeModal();
    const veil = document.createElement('div');
    veil.className = 'modal-veil'; veil.id = 'wbt-modal';
    veil.innerHTML = `<div class="panel bracketed ${opts && opts.lg ? 'modal modal--lg' : 'modal'}">${html}</div>`;
    veil.addEventListener('click', e => { if (e.target === veil) closeModal(); });
    document.body.appendChild(veil); icons();
    return veil;
  }
  function closeModal() { const m = document.getElementById('wbt-modal'); if (m) m.remove(); }

  function notifications() {
    const items = [
      ['alert-triangle', 'danger', `${W.kpi.outStock} SKUs out of stock`, 'Armory needs restock'],
      ['clock', 'amber', `${W.kpi.drosReady} DROS eligible for release`, 'CA Compliance'],
      ['shopping-cart', 'fde', `${W.kpi.activeCarts} active carts — ${W.fmt.moneyK(W.kpi.cartValue)} at risk`, 'Recovery engine running'],
      ['trending-up', 'success', `Revenue ${W.fmt.pct(W.kpi.revDelta)} vs prior 30d`, 'Command Center'],
    ];
    modal(`
      <div class="panel__head"><span class="stencil">Alerts Feed</span>
        <div class="right"><button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div></div>
      <div class="panel__body" style="display:flex;flex-direction:column;gap:10px">
        ${items.map(([ic, c, t, s]) => `<div class="alert alert--${c}"><i data-lucide="${ic}"></i>
          <div><div class="t-strong">${t}</div><div class="muted tiny">${s}</div></div></div>`).join('')}
      </div>`);
  }

  // -------------------------------------------------- Chart.js tactical theme
  const PALETTE = { fde: '#c2a17b', fdeDeep: '#9c7f5d', od: '#6b7d4a', odBright: '#8aa15c', amber: '#ffb43a', steel: '#8694a1', blue: '#4d7ea3', danger: '#e0492f', success: '#5fb55f', grid: 'rgba(255,255,255,.05)', text: '#8b938b' };

  function chartDefaults() {
    if (!window.Chart) return;
    const C = window.Chart;
    C.defaults.font.family = "'Barlow', sans-serif";
    C.defaults.font.size = 12;
    C.defaults.color = PALETTE.text;
    C.defaults.plugins.legend.labels.usePointStyle = true;
    C.defaults.plugins.legend.labels.boxWidth = 8;
    C.defaults.plugins.legend.labels.padding = 14;
    C.defaults.plugins.tooltip.backgroundColor = '#0d100e';
    C.defaults.plugins.tooltip.borderColor = '#2b332e';
    C.defaults.plugins.tooltip.borderWidth = 1;
    C.defaults.plugins.tooltip.titleColor = '#e9e6df';
    C.defaults.plugins.tooltip.bodyColor = '#c3c1b8';
    C.defaults.plugins.tooltip.padding = 11;
    C.defaults.plugins.tooltip.titleFont = { family: "'Share Tech Mono', monospace", size: 11 };
    C.defaults.plugins.tooltip.cornerRadius = 3;
    C.defaults.plugins.tooltip.displayColors = false;
  }

  function gradient(ctx, hex, a1, a2) {
    const g = ctx.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, hexA(hex, a1)); g.addColorStop(1, hexA(hex, a2)); return g;
  }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

  // chart factories ---------------------------------------------------------
  function line(canvas, labels, datasets, opts) {
    if (!window.Chart) return;
    const ctx = canvas.getContext('2d');
    const ds = datasets.map(d => ({
      label: d.label, data: d.data, borderColor: d.color || PALETTE.fde,
      backgroundColor: d.fill ? gradient(ctx, d.color || PALETTE.fde, .28, 0) : 'transparent',
      fill: !!d.fill, tension: .35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4,
      pointHoverBackgroundColor: d.color || PALETTE.fde,
    }));
    return new window.Chart(ctx, {
      type: 'line', data: { labels, datasets: ds },
      options: Object.assign({
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: datasets.length > 1, position: 'top', align: 'end' } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
          y: { grid: { color: PALETTE.grid }, ticks: { callback: opts && opts.yMoney ? v => '$' + (v / 100 / 1000).toFixed(0) + 'k' : undefined }, beginAtZero: true },
        },
      }, opts && opts.chart || {}),
    });
  }

  function bars(canvas, labels, data, opts) {
    if (!window.Chart) return;
    const ctx = canvas.getContext('2d');
    const colors = (opts && opts.colors) || labels.map(() => PALETTE.fde);
    return new window.Chart(ctx, {
      type: (opts && opts.horizontal) ? 'bar' : 'bar',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 3, borderSkipped: false, barThickness: opts && opts.thickness || undefined, maxBarThickness: 30 }] },
      options: Object.assign({
        indexAxis: (opts && opts.horizontal) ? 'y' : 'x',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: !(opts && opts.horizontal), color: PALETTE.grid }, ticks: { callback: opts && opts.money && opts.horizontal ? v => '$' + (v / 100 / 1000).toFixed(0) + 'k' : undefined } },
          y: { grid: { display: !!(opts && opts.horizontal) ? false : true, color: PALETTE.grid }, ticks: { callback: opts && opts.money && !(opts && opts.horizontal) ? v => '$' + (v / 100 / 1000).toFixed(0) + 'k' : undefined } },
        },
      }, opts && opts.chart || {}),
    });
  }

  function donut(canvas, labels, data, colors, opts) {
    if (!window.Chart) return;
    return new window.Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#141816', borderWidth: 2, hoverOffset: 6 }] },
      options: Object.assign({
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { position: 'right', labels: { padding: 12 } }, tooltip: { callbacks: opts && opts.money ? { label: c => ' ' + c.label + ': ' + W.fmt.money(c.raw) } : {} } },
      }, opts && opts.chart || {}),
    });
  }

  function spark(canvas, data, color) {
    if (!window.Chart) return;
    const ctx = canvas.getContext('2d');
    return new window.Chart(ctx, {
      type: 'line',
      data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color || PALETTE.fde, backgroundColor: gradient(ctx, color || PALETTE.fde, .3, 0), fill: true, tension: .4, borderWidth: 1.5, pointRadius: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } },
    });
  }

  // -------------------------------------------------- expose
  W.ui = { mount, icons, toast, modal, closeModal, notifications, chartDefaults, line, bars, donut, spark, PALETTE, hexA };

  // auto-init
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { chartDefaults(); mount(); });
  else { chartDefaults(); mount(); }
})();
