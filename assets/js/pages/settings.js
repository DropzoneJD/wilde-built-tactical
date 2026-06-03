/* Settings — settings.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi;

  // ------------------------------------------------------------------ clock
  function tick() {
    const el = document.getElementById('settingsClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' PST';
  }
  tick(); setInterval(tick, 1000);

  // ------------------------------------------------------------------ KPI row
  const kpis = [
    { label: 'FFL Status', icon: 'shield-check', val: 'Active', foot: 'Exp 12/31/2025', color: 'var(--success)', accent: true },
    { label: 'Staff Accounts', icon: 'users', val: W.staff.length, foot: W.staff.filter(s => s.on).length + ' on duty now' },
    { label: 'Integrations', icon: 'plug', val: '4 / 6', foot: '2 pending connection' },
    { label: 'Low-Stock SKUs', icon: 'triangle-alert', val: K.lowStock, foot: K.outStock + ' out of stock', warn: true },
    { label: 'DROS Pending', icon: 'clock', val: K.drosPending, foot: K.drosReady + ' eligible to release', warn: true },
    { label: 'Bound Book', icon: 'book-open', val: '1,420', foot: 'entries · 99.4% integrity' },
  ];
  const kpiRow = document.getElementById('settingsKpiRow');
  kpiRow.style.gridTemplateColumns = 'repeat(6,1fr)';
  kpiRow.innerHTML = kpis.map(k => {
    return `<div style="grid-column:span 2"><div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value" style="${k.color ? 'color:' + k.color : ''}">${k.val}</div>
      <div class="stat__foot"><span class="${k.warn ? '' : 'muted'}" style="${k.warn ? 'color:var(--amber)' : ''}">${k.foot}</span></div>
    </div></div>`;
  }).join('');

  // ------------------------------------------------------------------ nav sections
  const SECTIONS = [
    { key: 'store',         label: 'Store Profile',     icon: 'store' },
    { key: 'ffl',           label: 'FFL & Compliance',  icon: 'shield-check' },
    { key: 'notifications', label: 'Notifications',     icon: 'bell' },
    { key: 'team',          label: 'Team & Roles',      icon: 'users' },
    { key: 'integrations',  label: 'Integrations',      icon: 'plug' },
    { key: 'appearance',    label: 'Appearance',        icon: 'palette' },
  ];

  let activeSection = 'store';

  function switchSection(key) {
    activeSection = key;
    document.querySelectorAll('.settings-section').forEach(el => el.classList.remove('is-active'));
    document.querySelectorAll('.settings-nav__item').forEach(el => el.classList.remove('is-active'));
    const sec = document.getElementById('sec-' + key);
    if (sec) sec.classList.add('is-active');
    const navItem = document.querySelector('[data-sec="' + key + '"]');
    if (navItem) navItem.classList.add('is-active');
  }

  document.getElementById('settingsNavItems').innerHTML = SECTIONS.map(s =>
    `<div class="settings-nav__item${s.key === activeSection ? ' is-active' : ''}" data-sec="${s.key}" onclick="switchSection('${s.key}')">
      <i data-lucide="${s.icon}"></i>${s.label}
    </div>`
  ).join('');

  // expose for inline onclick
  window.switchSection = switchSection;

  // init first section
  switchSection('store');

  // ------------------------------------------------------------------ location cards
  const LOCATIONS = [
    {
      name: 'San Diego — Flagship',
      abbr: 'SD',
      address: '4821 Convoy Street',
      city: 'San Diego', state: 'CA', zip: '92111',
      phone: '(619) 555-0188',
      hours: 'Mon–Sat 9am–7pm, Sun 10am–5pm',
      manager: 'Marcus Reyes',
      status: 'open',
      color: 'fde',
    },
    {
      name: 'Escondido — North County',
      abbr: 'ESC',
      address: '1100 West Valley Pkwy',
      city: 'Escondido', state: 'CA', zip: '92025',
      phone: '(760) 555-0244',
      hours: 'Mon–Fri 10am–6pm, Sat 9am–6pm, Sun Closed',
      manager: 'Beau Ashby',
      status: 'open',
      color: 'od',
    },
  ];

  document.getElementById('locationCards').innerHTML = LOCATIONS.map((loc, i) => `
    <div class="loc-card">
      <div class="loc-card__head">
        <div class="prod-thumb"><span style="font-family:var(--f-display);font-weight:800;font-size:12px;color:var(--${loc.color})">${loc.abbr}</span></div>
        <div style="flex:1">
          <div class="t-strong" style="font-size:13px">${loc.name}</div>
          <div class="tiny muted">Manager: ${loc.manager}</div>
        </div>
        <span class="tag tag--${loc.status === 'open' ? 'success' : 'danger'}"><span class="dot"></span>${loc.status === 'open' ? 'Open' : 'Closed'}</span>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
        <div>
          <label class="fld">Street Address</label>
          <input class="input" type="text" value="${loc.address}" id="loc-${i}-addr">
        </div>
        <div class="form-grid-3" style="gap:10px">
          <div>
            <label class="fld">City</label>
            <input class="input" type="text" value="${loc.city}" id="loc-${i}-city">
          </div>
          <div>
            <label class="fld">State</label>
            <input class="input" type="text" value="${loc.state}" id="loc-${i}-state" style="max-width:100%">
          </div>
          <div>
            <label class="fld">ZIP</label>
            <input class="input" type="text" value="${loc.zip}" id="loc-${i}-zip">
          </div>
        </div>
        <div>
          <label class="fld">Phone</label>
          <input class="input" type="text" value="${loc.phone}" id="loc-${i}-phone">
        </div>
        <div>
          <label class="fld">Hours of Operation</label>
          <input class="input" type="text" value="${loc.hours}" id="loc-${i}-hours">
        </div>
        <button class="btn btn--ghost btn--sm w-full" onclick="WBT.ui.toast('${loc.name} saved (demo)','check')">
          <i data-lucide="save"></i> Save ${loc.abbr} Location
        </button>
      </div>
    </div>
  `).join('');

  // ------------------------------------------------------------------ FFL toggles
  const FFL_TOGGLES = [
    { id: 'tt-10day',    label: '10-Day Wait Auto-Tracking', desc: 'Automatically calculate and flag DROS eligibility dates based on submission timestamp', on: true },
    { id: 'tt-bb',       label: 'Electronic Bound Book Mode', desc: 'Log all acquisitions & dispositions digitally with ATF eZ Check integration', on: true },
    { id: 'tt-doj',      label: 'DOJ Flag Auto-Hold', desc: 'Automatically freeze transactions when a DOJ delayed or denied response is received', on: true },
    { id: 'tt-roster',   label: 'CA Handgun Roster Enforcement', desc: 'Block POS sales of off-roster handguns unless PPT/LEEP exception is documented', on: true },
    { id: 'tt-coe',      label: 'CA COE Expiry Alerts', desc: 'Send compliance warnings 90/60/30 days before Certificate of Eligibility expiration', on: false },
    { id: 'tt-4473',     label: 'Form 4473 Digital Scan', desc: 'Prompt staff to scan and attach 4473 PDFs to bound book entries at point of sale', on: true },
  ];

  document.getElementById('fflToggles').innerHTML = FFL_TOGGLES.map(t => buildToggleRow(t)).join('');

  // ------------------------------------------------------------------ notifications
  const NOTIF_GROUPS = [
    {
      label: 'Inventory Alerts',
      items: [
        { id: 'n-low',    label: 'Low-Stock Alerts', desc: 'Notify when a SKU falls below its reorder threshold', on: true },
        { id: 'n-out',    label: 'Out-of-Stock Alerts', desc: 'Immediate alert when a product reaches zero quantity', on: true },
        { id: 'n-reorder',label: 'Reorder Suggestions', desc: 'Daily digest of forecast-driven restock recommendations', on: false },
      ],
    },
    {
      label: 'Compliance & DROS',
      items: [
        { id: 'n-dros-r', label: 'DROS-Ready Notifications', desc: 'Alert when a firearm clears 10-day wait and is eligible for pickup', on: true },
        { id: 'n-doj',    label: 'DOJ Delay/Denial Flags', desc: 'Immediate alert for any DOJ delayed or denied DROS submissions', on: true },
        { id: 'n-ffl-exp',label: 'FFL Expiry Warnings', desc: 'Reminders at 90/60/30 days before FFL renewal deadline', on: true },
      ],
    },
    {
      label: 'Sales & Customers',
      items: [
        { id: 'n-cart',   label: 'Abandoned Cart Alerts', desc: 'Notify when a cart enters the recovery ladder', on: true },
        { id: 'n-big',    label: 'High-Value Order Alerts', desc: 'Flag orders over $2,500 for manager review', on: false },
        { id: 'n-brief',  label: 'Daily Briefing Digest', desc: 'Morning summary of revenue, alerts, and top actions at 6:00 AM PST', on: true },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'n-api',    label: 'API Error Alerts', desc: 'Integration failures (Stripe, POS, QuickBooks) surface immediately', on: true },
        { id: 'n-backup', label: 'Backup Confirmation', desc: 'Confirm nightly data backup completion', on: false },
      ],
    },
  ];

  let notifHtml = '';
  NOTIF_GROUPS.forEach(group => {
    notifHtml += `<div class="stencil mb-12 mt-${notifHtml ? '24' : '0'}">${group.label}</div>`;
    notifHtml += group.items.map(t => buildToggleRow(t)).join('');
  });
  document.getElementById('notifPanel').innerHTML = notifHtml;

  // expose for inline onclick
  window.toggleAllNotif = function(on) {
    document.querySelectorAll('#notifPanel .switch input').forEach(cb => { cb.checked = on; });
    WBT.ui.toast('All notifications ' + (on ? 'enabled' : 'disabled') + ' (demo)', on ? 'bell' : 'bell-off');
  };

  // ------------------------------------------------------------------ team & roles
  const PERMISSIONS = [
    'Dashboard',
    'Inventory',
    'Orders',
    'DROS / Compliance',
    'Customers',
    'Marketing',
    'Reports',
    'Settings',
  ];

  const ROLES = ['Owner', 'Manager', 'Sales', 'Gunsmith', 'Shipping'];

  const ROLE_PERMS = {
    Owner:    [true,  true,  true,  true,  true,  true,  true,  true ],
    Manager:  [true,  true,  true,  true,  true,  true,  true,  false],
    Sales:    [true,  true,  true,  true,  true,  false, false, false],
    Gunsmith: [false, true,  false, true,  false, false, false, false],
    Shipping: [false, false, true,  true,  false, false, false, false],
  };

  document.getElementById('roleMatrixWrap').innerHTML = `
    <table class="tac-table">
      <thead><tr>
        <th style="min-width:130px">Permission</th>
        ${ROLES.map(r => `<th class="text-center">${r}</th>`).join('')}
      </tr></thead>
      <tbody>
        ${PERMISSIONS.map(perm => `
          <tr>
            <td class="t-strong">${perm}</td>
            ${ROLES.map(role => `
              <td class="perm-check">
                <input type="checkbox" ${ROLE_PERMS[role][PERMISSIONS.indexOf(perm)] ? 'checked' : ''}
                  onchange="perm_change(event, '${role}', '${perm}')">
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  window.perm_change = function(e, role, perm) {
    if (role === 'Owner') {
      e.target.checked = true;
      WBT.ui.toast('Owner permissions cannot be restricted', 'shield-alert');
    } else {
      WBT.ui.toast(`${role}: "${perm}" ${e.target.checked ? 'granted' : 'revoked'} (demo)`, 'user-check');
    }
  };

  document.getElementById('staffCountTag').innerHTML = `${W.staff.length} staff · ${W.staff.filter(s => s.on).length} on duty`;

  document.getElementById('staffTable').innerHTML = `
    <table class="tac-table">
      <thead><tr><th>Name</th><th>Role</th><th>Location</th><th>Certifications</th><th>Status</th><th>MTD Sales</th><th></th></tr></thead>
      <tbody>
        ${W.staff.map(s => `
          <tr class="clickable" onclick="openStaffModal('${s.name}')">
            <td>
              <div class="cell-prod">
                <div class="prod-thumb" style="background:${s.isOwner ? 'linear-gradient(135deg,var(--fde-deep),var(--fde))' : 'var(--panel-3)'}">
                  <i data-lucide="${s.isOwner ? 'crown' : 'user'}" style="width:16px;height:16px;color:${s.isOwner ? '#1a1208' : 'var(--fde)'}"></i>
                </div>
                <div>
                  <div class="t-strong">${s.name}</div>
                </div>
              </div>
            </td>
            <td><span class="tag ${s.isOwner ? 'tag--fde' : ''}">${s.role}</span></td>
            <td class="muted">${s.loc}</td>
            <td>${s.certs.map(c => `<span class="tag tag--od tag--ghost" style="font-size:10px;margin:2px">${c}</span>`).join('')}</td>
            <td><span class="tag tag--${s.on ? 'success' : 'steel'}"><span class="dot"></span>${s.on ? 'On Duty' : 'Off'}</span></td>
            <td class="num mono">${s.isOwner ? '—' : F.moneyK(s.sales)}</td>
            <td><button class="btn btn--icon btn--ghost btn--sm" onclick="event.stopPropagation();openStaffModal('${s.name}')"><i data-lucide="pencil"></i></button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

  window.openStaffModal = function(name) {
    const s = W.staff.find(x => x.name === name);
    if (!s) return;
    ui.modal(`
      <div class="panel">
        <div class="panel__head">
          <span class="stencil"><i data-lucide="user" style="width:14px;height:14px"></i> Edit Staff: ${s.name}</span>
          <div class="right"><button class="btn btn--icon btn--ghost btn--sm" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
        </div>
        <div class="panel__body">
          <div class="form-grid-2 mb-16">
            <div><label class="fld">Full Name</label><input class="input" type="text" value="${s.name}"></div>
            <div><label class="fld">Role</label><input class="input" type="text" value="${s.role}"></div>
            <div><label class="fld">Location</label>
              <select class="input"><option${s.loc === 'San Diego' ? ' selected' : ''}>San Diego</option><option${s.loc === 'Escondido' ? ' selected' : ''}>Escondido</option><option>Both</option></select>
            </div>
            <div><label class="fld">Status</label>
              <select class="input"><option value="1"${s.on ? ' selected' : ''}>On Duty</option><option value="0"${!s.on ? ' selected' : ''}>Off Duty</option></select>
            </div>
          </div>
          <div class="mb-16">
            <label class="fld">Certifications (comma separated)</label>
            <input class="input" type="text" value="${s.certs.join(', ')}">
          </div>
          <div class="flex gap-8">
            <button class="btn btn--primary" style="flex:1" onclick="WBT.ui.closeModal();WBT.ui.toast('${s.name} updated (demo)','check')"><i data-lucide="save"></i> Save Changes</button>
            <button class="btn btn--danger btn--sm" onclick="WBT.ui.closeModal();WBT.ui.toast('${s.name} account action triggered (demo)','user-x')"><i data-lucide="user-x"></i> Deactivate</button>
          </div>
        </div>
      </div>`, { lg: false });
    ui.icons();
  };

  // ------------------------------------------------------------------ integrations
  const INTEGRATIONS = [
    { key: 'pos',        name: 'POS System',         sub: 'Lightspeed Retail',      icon: 'monitor',         status: 'connected',     lastSync: '4 min ago' },
    { key: 'stripe',     name: 'Payments',            sub: 'Stripe Terminal',        icon: 'credit-card',     status: 'connected',     lastSync: '12 min ago' },
    { key: 'klaviyo',    name: 'Email / SMS',         sub: 'Klaviyo + Twilio',       icon: 'mail',            status: 'connected',     lastSync: '1 hr ago' },
    { key: 'qbo',        name: 'Accounting',          sub: 'QuickBooks Online',      icon: 'calculator',      status: 'connected',     lastSync: '11:30 PM PST' },
    { key: 'shopify',    name: 'E-Commerce',          sub: 'Shopify (WBT Store)',    icon: 'shopping-bag',    status: 'disconnected',  lastSync: null },
    { key: 'fastbound',  name: 'Bound Book',          sub: 'FastBound',              icon: 'book-open',       status: 'disconnected',  lastSync: null },
  ];

  const connCount = INTEGRATIONS.filter(i => i.status === 'connected').length;
  document.getElementById('intConnectedTag').innerHTML =
    `<span class="tag tag--success"><span class="dot"></span>${connCount} of ${INTEGRATIONS.length} Connected</span>`;

  document.getElementById('intCards').innerHTML = INTEGRATIONS.map(int => {
    const connected = int.status === 'connected';
    return `<div class="int-card">
      <div class="int-card__head">
        <div class="int-card__icon"><i data-lucide="${int.icon}" style="width:22px;height:22px"></i></div>
        <div style="flex:1;min-width:0">
          <div class="int-card__name">${int.name}</div>
          <div class="int-card__sub">${int.sub}</div>
        </div>
        <span class="tag tag--${connected ? 'success' : 'steel'}"><span class="dot"></span>${connected ? 'Connected' : 'Not Connected'}</span>
      </div>
      ${connected ? `<div class="kv"><span class="muted">Last sync</span><b>${int.lastSync}</b></div>` : `<div class="tiny muted">Not configured — click Connect to set up</div>`}
      <button class="btn ${connected ? 'btn--ghost' : 'btn--primary'} btn--sm w-full"
        onclick="handleIntegration('${int.key}','${int.name}','${connected}')">
        <i data-lucide="${connected ? 'settings-2' : 'plug'}"></i> ${connected ? 'Manage' : 'Connect'}
      </button>
    </div>`;
  }).join('');

  window.handleIntegration = function(key, name, connected) {
    if (connected === 'true') {
      ui.modal(`
        <div class="panel">
          <div class="panel__head">
            <span class="stencil">Manage: ${name}</span>
            <div class="right"><button class="btn btn--icon btn--ghost btn--sm" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
          </div>
          <div class="panel__body">
            <div class="kv"><span class="muted">Status</span><b style="color:var(--success)">Connected</b></div>
            <div class="kv"><span class="muted">API Health</span><b style="color:var(--success)">Healthy</b></div>
            <div class="kv"><span class="muted">Webhooks</span><b>Active · 3 endpoints</b></div>
            <div class="kv mb-16"><span class="muted">Auth Method</span><b>OAuth 2.0</b></div>
            <div class="flex gap-8 mt-16">
              <button class="btn btn--ghost" style="flex:1" onclick="WBT.ui.closeModal();WBT.ui.toast('Re-auth started for ${name} (demo)','refresh-cw')"><i data-lucide="refresh-cw"></i> Re-Authenticate</button>
              <button class="btn btn--danger btn--sm" onclick="WBT.ui.closeModal();WBT.ui.toast('${name} disconnected (demo)','unplug')"><i data-lucide="unplug"></i> Disconnect</button>
            </div>
          </div>
        </div>`, { lg: false });
    } else {
      WBT.ui.toast('Opening OAuth flow for ' + name + ' (demo)', 'plug');
    }
    ui.icons();
  };

  // API keys panel
  document.getElementById('apiPanel').innerHTML = `
    <div class="mb-16">
      <label class="fld">WBT Public API Key</label>
      <div class="flex gap-8">
        <input class="input mono" type="text" value="pk_live_wbt_sd_••••••••••••••••" readonly style="flex:1;color:var(--muted)">
        <button class="btn btn--sm btn--ghost" onclick="WBT.ui.toast('API key copied (demo)','copy')"><i data-lucide="copy"></i></button>
        <button class="btn btn--sm btn--ghost" onclick="WBT.ui.toast('New key generated (demo)','refresh-cw')"><i data-lucide="refresh-cw"></i> Rotate</button>
      </div>
    </div>
    <div class="mb-16">
      <label class="fld">Webhook Endpoint URL</label>
      <div class="flex gap-8">
        <input class="input" type="text" value="https://wildebuilttactical.com/api/webhook" style="flex:1" id="webhookUrl">
        <button class="btn btn--sm btn--ghost" onclick="WBT.ui.toast('Webhook saved (demo)','check')"><i data-lucide="save"></i></button>
      </div>
    </div>
    <div>
      <label class="fld">Webhook Events</label>
      <div class="flex gap-8 wrap mt-4">
        ${['order.created','dros.ready','dros.delayed','cart.recovered','inventory.low','payment.failed']
          .map(ev => `<span class="tag tag--od tag--ghost clickable" onclick="WBT.ui.toast('Webhook event: ${ev} (demo)','zap')">${ev}</span>`)
          .join('')}
      </div>
    </div>`;

  // ------------------------------------------------------------------ appearance
  const SWATCHES = [
    { name: 'Coyote FDE',   hex: '#c2a17b', key: 'fde',   label: 'Default' },
    { name: 'Olive Drab',   hex: '#6b7d4a', key: 'od',    label: '' },
    { name: 'Amber',        hex: '#ffb43a', key: 'amber',  label: '' },
    { name: 'Steel',        hex: '#8694a1', key: 'steel',  label: '' },
    { name: 'Blood Red',    hex: '#e0492f', key: 'danger', label: '' },
  ];

  let activeSwatch = 'fde';

  document.getElementById('appearancePanel').innerHTML = `
    <div class="stencil mb-16">Accent Color</div>
    <div class="alert alert--od mb-20">
      <i data-lucide="zap"></i>
      <div>Click a swatch to <b>live-recolor</b> the entire HUD instantly. The accent color propagates to nav highlights, FDE tags, stat cards, and bracketed panels.</div>
    </div>
    <div class="swatch-row mb-24" id="swatchRow"></div>
    <div class="kv mb-16">
      <span class="muted">Active Accent</span>
      <b id="swatchLabel" class="mono">#c2a17b — Coyote FDE (Default)</b>
    </div>

    <hr class="divider">
    <div class="stencil mb-16">Interface Density</div>
    <div class="flex gap-8 mb-16">
      <div class="seg" id="densitySeg">
        <button class="is-active" data-density="compact" onclick="setDensity('compact',this)">Compact</button>
        <button data-density="normal" onclick="setDensity('normal',this)">Normal</button>
        <button data-density="spacious" onclick="setDensity('spacious',this)">Spacious</button>
      </div>
    </div>

    <hr class="divider">
    <div class="stencil mb-16">Display Options</div>
    ${[
      { id: 'ap-scanlines', label: 'CRT Scanline Overlay', desc: 'Adds a subtle scanline texture to hero panels for maximum terminal aesthetic', on: false },
      { id: 'ap-animations', label: 'Panel Fade Animations', desc: 'Smooth fade-in transitions when navigating between pages', on: true },
      { id: 'ap-clock', label: 'Live System Clock in Header', desc: 'Display live PST clock in the topbar and page headers', on: true },
      { id: 'ap-grid', label: 'Background Grid Texture', desc: 'Show tactical crosshair grid on the page background', on: true },
    ].map(t => buildToggleRow(t)).join('')}`;

  // render swatches
  function renderSwatches() {
    document.getElementById('swatchRow').innerHTML = SWATCHES.map(sw =>
      `<div class="swatch ${sw.key === activeSwatch ? 'is-active' : ''}" data-key="${sw.key}"
        style="background:${sw.hex};box-shadow:0 4px 12px ${sw.hex}55"
        onclick="applyAccent('${sw.hex}','${sw.key}','${sw.name}')"
        title="${sw.name}${sw.label ? ' — ' + sw.label : ''}">
      </div>`
    ).join('');
  }
  renderSwatches();

  window.applyAccent = function(hex, key, name) {
    activeSwatch = key;
    document.documentElement.style.setProperty('--fde', hex);
    // update deep shade too
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    document.documentElement.style.setProperty('--fde-deep', `rgb(${Math.round(r*.78)},${Math.round(g*.78)},${Math.round(b*.78)})`);
    document.documentElement.style.setProperty('--fde-glow', `rgba(${r},${g},${b},.18)`);
    renderSwatches();
    const label = document.getElementById('swatchLabel');
    if (label) label.textContent = hex + ' — ' + name + (key === 'fde' ? ' (Default)' : '');
    ui.icons();
    WBT.ui.toast('Accent color changed to ' + name, 'palette');
  };

  window.setDensity = function(val, btn) {
    document.querySelectorAll('#densitySeg button').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    WBT.ui.toast('Density set to ' + val + ' (cosmetic demo)', 'layout-grid');
  };

  // ------------------------------------------------------------------ helpers
  function buildToggleRow(t) {
    return `<div class="toggle-row">
      <div class="toggle-row__info">
        <div class="toggle-row__label">${t.label}</div>
        ${t.desc ? `<div class="toggle-row__desc">${t.desc}</div>` : ''}
      </div>
      <label class="switch" title="${t.label}">
        <input type="checkbox" id="${t.id}" ${t.on ? 'checked' : ''}
          onchange="WBT.ui.toast('${t.label.replace(/'/g,"\\'")} ' + (this.checked ? 'enabled' : 'disabled') + ' (demo)', this.checked ? 'check-circle' : 'x-circle')">
        <span></span>
      </label>
    </div>`;
  }

  // ------------------------------------------------------------------ global save
  window.saveSection = function(section) {
    const LABELS = {
      store: 'Store profile', ffl: 'FFL & compliance', notifications: 'Notifications',
      team: 'Team & roles', integrations: 'Integrations', appearance: 'Appearance theme',
    };
    WBT.ui.toast((LABELS[section] || section) + ' settings saved (demo)', 'save');
  };

  window.handleGlobalSave = function() {
    WBT.ui.toast('All settings saved to config (demo)', 'check-circle');
  };

  // ------------------------------------------------------------------ done
  ui.icons();
})();
