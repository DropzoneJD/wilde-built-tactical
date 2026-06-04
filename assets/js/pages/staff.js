/* Staff & Range — staff.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE;

  // -------------------------------------------------- page-local mock data
  // Weekly schedule: each staff member x Mon-Sun
  // Patterns: 0=OFF, 1=Open (9-5), 2=Close (12-8), 3=Double (9-8 event)
  const SCHEDULE_PATTERNS = [
    // Bryan Howes (owner - admin days)
    [1, 0, 1, 0, 1, 0, 0],
    // Marcus Reyes (manager, covers both shops)
    [1, 1, 0, 1, 1, 2, 0],
    // Dani Cortez (DROS specialist)
    [1, 1, 1, 0, 1, 2, 0],
    // Trevor Maddox (gunsmith, M-Th + Sat)
    [1, 1, 1, 1, 0, 1, 0],
    // Sergio Limon (Escondido)
    [0, 1, 1, 1, 1, 2, 3],
    // Beau Ashby (range, Tu-Sat + Sun half)
    [0, 1, 2, 1, 2, 1, 1],
    // Owen Beckett (shipping M-F)
    [1, 1, 1, 1, 1, 0, 0],
  ];
  const SHIFT_LABELS = ['OFF', '9-5', '12-8', '9-8'];
  const SHIFT_CLASSES = ['shift-off', 'shift-open', 'shift-close', 'shift-double'];

  // Cert metadata
  const CERT_TYPES = [
    { key: 'DROS Cert',     icon: 'file-check',    label: 'DROS Cert',         required: true },
    { key: 'FFL 01',        icon: 'shield',         label: 'FFL 01 (Owner)',    required: false },
    { key: 'CA COE',        icon: 'badge-check',    label: 'CA COE',            required: false },
    { key: 'Armorer: AR',   icon: 'wrench',         label: 'Armorer — AR',      required: false },
    { key: 'Armorer: Glock',icon: 'wrench',         label: 'Armorer — Glock',   required: false },
    { key: 'Range Safety',  icon: 'triangle-alert', label: 'Range Safety',      required: true  },
    { key: 'First Aid',     icon: 'heart-pulse',    label: 'First Aid / CPR',   required: true  },
    { key: 'Shipping Cert', icon: 'package',        label: 'Shipping / FFL Xfr',required: false },
    { key: 'ATF Compliant', icon: 'scale',          label: 'ATF Compliance',    required: false },
  ];

  // Sales sparkline seed data — 4-week mini trend per staff member (in cents, relative)
  const salesSparks = W.staff.map(s => {
    if (s.isOwner) return [];
    const base = s.sales / 4;
    return [0.7, 0.85, 1.0, 1.15].map(f => Math.round(base * f * (0.88 + W.rnd() * 0.24)));
  });

  // -------------------------------------------------- active location filter
  let activeLoc = 'all';

  function visibleStaff() {
    return activeLoc === 'all' ? W.staff : W.staff.filter(s => s.loc === activeLoc);
  }

  // -------------------------------------------------- KPI row
  function buildKpis() {
    const all = W.staff;
    const onShift = all.filter(s => s.on).length;
    const teamSalesMTD = all.filter(s => !s.isOwner).reduce((t, s) => t + s.sales, 0);
    const topPerformer = all.filter(s => !s.isOwner).sort((a, b) => b.sales - a.sales)[0];
    const certsCurrent = all.reduce((t, s) => t + s.certs.length, 0);
    const avgTicket = K.aov;

    const kpis = [
      {
        label: 'Team Size', icon: 'users',
        val: all.length,
        foot: all.filter(s => s.loc === 'San Diego').length + ' SD · ' + all.filter(s => s.loc === 'Escondido').length + ' ESC',
        accent: false,
      },
      {
        label: 'On Shift Now', icon: 'circle-dot',
        val: onShift,
        foot: (all.length - onShift) + ' off shift today',
        warn: onShift < 3,
        accent: false,
      },
      {
        label: 'Team Sales · MTD', icon: 'trending-up',
        val: F.moneyK(teamSalesMTD),
        foot: F.money(Math.round(teamSalesMTD / all.filter(s => !s.isOwner).length)) + ' avg / rep',
        accent: true,
      },
      {
        label: 'Top Performer', icon: 'star',
        val: topPerformer ? topPerformer.name.split(' ')[0] : '—',
        foot: topPerformer ? F.moneyK(topPerformer.sales) + ' MTD' : '',
        accent: false,
      },
      {
        label: 'Certs · Current', icon: 'award',
        val: certsCurrent,
        foot: CERT_TYPES.filter(c => c.required).length + ' required types · all current',
        accent: false,
      },
      {
        label: 'Avg Ticket', icon: 'receipt-text',
        val: F.money(avgTicket),
        foot: 'Store-wide AOV · MTD',
        accent: false,
      },
    ];

    document.getElementById('staffKpiRow').innerHTML = kpis.map(k => {
      const d = k.delta !== undefined
        ? `<span class="delta ${k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat'}">
            <i data-lucide="${k.delta > 0 ? 'trending-up' : k.delta < 0 ? 'trending-down' : 'minus'}" style="width:13px;height:13px"></i>${F.pct(k.delta)}</span>`
        : '';
      return `<div class="stat ${k.accent ? 'stat--accent' : ''}">
        <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
        <div class="stat__value">${k.val}</div>
        <div class="stat__foot">${d}<span class="${k.warn ? '' : 'muted'}" style="${k.warn ? 'color:var(--amber)' : ''}">${k.foot}</span></div>
      </div>`;
    }).join('');
    ui.icons();
  }

  // -------------------------------------------------- roster table
  let rosterFilter = '';

  function buildRoster() {
    const list = visibleStaff().filter(s =>
      !rosterFilter || s.name.toLowerCase().includes(rosterFilter) || s.role.toLowerCase().includes(rosterFilter)
    );

    const thead = `<thead><tr>
      <th>Name</th>
      <th>Role</th>
      <th>Location</th>
      <th>Status</th>
      <th class="num">Sales · MTD</th>
      <th class="num">Commission</th>
      <th>Certifications</th>
    </tr></thead>`;

    const tbody = list.map((s, rawIdx) => {
      const globalIdx = W.staff.indexOf(s);
      const locTag = s.loc === 'San Diego'
        ? `<span class="tag tag--fde">${s.loc}</span>`
        : `<span class="tag tag--od">${s.loc}</span>`;
      const onTag = s.on
        ? `<span class="sdot sdot--go" style="margin-right:5px"></span><span class="t-strong" style="color:var(--success);font-size:12px">On</span>`
        : `<span class="sdot sdot--stop" style="margin-right:5px"></span><span class="muted" style="font-size:12px">Off</span>`;
      const salesCell = s.isOwner
        ? `<span class="muted">—</span>`
        : `<span class="mono t-strong">${F.moneyK(s.sales)}</span>`;
      const commCell = s.isOwner
        ? `<span class="muted">—</span>`
        : `<span class="mono">${F.money(Math.round(s.sales * 0.03))}</span>`;
      const ownerTag = s.isOwner ? `<span class="tag tag--fde tag--solid" style="margin-left:6px;font-size:9.5px">OWNER</span>` : '';
      const certTags = s.certs.map(c => `<span class="tag tag--ghost tag--steel" style="font-size:9.5px">${c}</span>`).join('');
      const sparkId = 'spark-' + globalIdx;

      return `<tr class="clickable" onclick="openStaffModal(${globalIdx})">
        <td>
          <div class="flex items-center gap-8">
            <div class="prod-thumb" style="width:32px;height:32px;font-family:var(--f-display);font-weight:800;font-size:13px;color:var(--fde)">
              ${s.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span class="t-strong">${s.name}</span>${ownerTag}
            </div>
          </div>
        </td>
        <td class="muted" style="font-size:12.5px">${s.role}</td>
        <td>${locTag}</td>
        <td>${onTag}</td>
        <td class="num">${salesCell}</td>
        <td class="num">${commCell}</td>
        <td>
          <div class="flex items-center gap-6 wrap">${certTags}</div>
        </td>
      </tr>`;
    }).join('');

    document.getElementById('rosterTable').innerHTML = thead + '<tbody>' + tbody + '</tbody>';
    ui.icons();
  }

  window.filterRoster = function (val) {
    rosterFilter = val.toLowerCase();
    buildRoster();
  };

  // -------------------------------------------------- sales leaderboard chart
  let leaderChartInst = null;
  function buildLeaderboard() {
    const reps = W.staff.filter(s => !s.isOwner).sort((a, b) => b.sales - a.sales);
    const labels = reps.map(s => s.name.split(' ')[0] + ' ' + s.name.split(' ')[1][0] + '.');
    const data = reps.map(s => s.sales);
    const colors = reps.map((_, i) => ui.hexA(P.fde, 1 - i * 0.1));
    if (leaderChartInst) { leaderChartInst.destroy(); leaderChartInst = null; }
    leaderChartInst = ui.bars(document.getElementById('leaderChart'), labels, data, {
      horizontal: true, money: true, colors,
    });
  }

  // -------------------------------------------------- certifications panel
  function buildCerts() {
    const html = CERT_TYPES.map(ct => {
      const holders = W.staff.filter(s => s.certs.includes(ct.key));
      if (holders.length === 0) return '';
      const holderTags = holders.map(s =>
        `<span class="tag tag--ghost tag--fde" style="font-size:9.5px">${s.name.split(' ')[0]}</span>`
      ).join('');
      return `<div class="cert-row">
        <span class="sdot sdot--go"></span>
        <div class="cert-name"><i data-lucide="${ct.icon}" style="width:13px;height:13px;display:inline;vertical-align:middle;margin-right:5px"></i>${ct.label}</div>
        <div class="cert-holders">${holderTags}</div>
        ${ct.required ? '<span class="tag tag--amber tag--ghost" style="font-size:9px;margin-left:auto">REQ</span>' : ''}
      </div>`;
    }).filter(Boolean).join('');
    document.getElementById('certsPanel').innerHTML = html;
    ui.icons();
  }

  // -------------------------------------------------- performance panel
  function buildPerf() {
    const reps = W.staff.filter(s => !s.isOwner);
    const total = reps.reduce((t, s) => t + s.sales, 0);
    const maxSales = Math.max(...reps.map(s => s.sales));

    const html = reps.map(s => {
      const pct = maxSales > 0 ? Math.round((s.sales / maxSales) * 100) : 0;
      const meterClass = pct >= 75 ? 'is-fde' : pct >= 50 ? '' : 'is-mid';
      return `<div style="margin-bottom:14px">
        <div class="flex justify-between mb-8" style="font-size:12.5px">
          <span class="t-strong">${s.name.split(' ')[0]}</span>
          <span class="mono muted">${F.moneyK(s.sales)}</span>
        </div>
        <div class="meter ${meterClass}"><span style="width:${pct}%"></span></div>
      </div>`;
    }).join('');

    const avgSales = Math.round(total / reps.length);
    document.getElementById('perfPanel').innerHTML = html + `
      <hr class="divider mt-16">
      <div class="kv"><span class="muted">Team Total</span><b>${F.moneyK(total)}</b></div>
      <div class="kv"><span class="muted">Avg per Rep</span><b>${F.moneyK(avgSales)}</b></div>
      <div class="kv"><span class="muted">Comm. Paid MTD</span><b>${F.money(Math.round(total * 0.03))}</b></div>
    `;
    ui.icons();
  }

  // -------------------------------------------------- weekly schedule
  function buildSchedule() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // compute week label
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    document.getElementById('weekLabel').textContent =
      mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' +
      sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const thead = `<thead><tr>
      <th style="min-width:140px">Staff</th>
      ${days.map(d => `<th class="text-center" style="min-width:70px">${d}</th>`).join('')}
    </tr></thead>`;

    const tbody = W.staff.map((s, i) => {
      const pattern = SCHEDULE_PATTERNS[i] || [0,0,0,0,0,0,0];
      const cells = pattern.map((p, di) => {
        const cls = SHIFT_CLASSES[p];
        const lbl = SHIFT_LABELS[p];
        return `<td class="text-center"><span class="shift-block ${cls}">${lbl}</span></td>`;
      }).join('');
      const isToday = (new Date().getDay() + 6) % 7; // 0=Mon
      const ownerBadge = s.isOwner ? ' <span class="tag tag--fde tag--solid" style="font-size:9px;padding:1px 5px">OWN</span>' : '';
      const onDot = s.on ? '<span class="sdot sdot--go" style="margin-right:4px"></span>' : '';
      return `<tr>
        <td class="t-strong" style="font-size:12.5px">${onDot}${s.name.split(' ')[0]} ${s.name.split(' ')[1]}${ownerBadge}
          <div class="tiny muted">${s.loc}</div>
        </td>
        ${cells}
      </tr>`;
    }).join('');

    document.getElementById('schedTable').innerHTML = thead + '<tbody>' + tbody + '</tbody>';
    ui.icons();
  }

  // -------------------------------------------------- staff profile modal
  window.openStaffModal = function (idx) {
    const s = W.staff[idx];
    if (!s) return;
    const spark = salesSparks[idx] || [];
    const sparkId = 'modal-spark-' + idx;
    const commEst = s.isOwner ? '—' : F.money(Math.round(s.sales * 0.03));
    const salesDisplay = s.isOwner ? '<span class="muted">Owner — not tracked</span>' : F.money(s.sales);
    const locTag = s.loc === 'San Diego'
      ? `<span class="tag tag--fde">${s.loc}</span>`
      : `<span class="tag tag--od">${s.loc}</span>`;
    const onStatus = s.on
      ? '<span class="sdot sdot--go"></span> <b style="color:var(--success)">On Shift</b>'
      : '<span class="sdot sdot--stop"></span> <span class="muted">Off Shift</span>';
    const certList = s.certs.map(c =>
      `<span class="tag tag--ghost tag--fde mt-8" style="font-size:10px">${c}</span>`
    ).join(' ');

    const schPatternIdx = idx;
    const pattern = SCHEDULE_PATTERNS[schPatternIdx] || [];
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const weekRow = pattern.map((p, di) =>
      `<span class="tag tag--ghost ${p === 0 ? 'tag--steel' : p === 3 ? 'tag--amber' : 'tag--od'}" style="font-size:9.5px">${days[di]}: ${SHIFT_LABELS[p]}</span>`
    ).join(' ');

    const html = `
      <div class="panel">
        <div class="panel__head">
          <span class="stencil"><i data-lucide="user" style="width:14px;height:14px"></i> ${s.name}</span>
          <div class="right">
            ${locTag}
            <button class="btn btn--icon btn--ghost btn--sm" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button>
          </div>
        </div>
        <div class="panel__body">
          <div class="grid-2 grid" style="gap:18px;margin-bottom:18px">
            <div>
              <div class="kv"><span class="muted">Role</span><b>${s.role}</b></div>
              <div class="kv"><span class="muted">Location</span><b>${s.loc}</b></div>
              <div class="kv"><span class="muted">Status</span><b>${onStatus}</b></div>
              <div class="kv"><span class="muted">Sales MTD</span><b class="mono">${salesDisplay}</b></div>
              <div class="kv"><span class="muted">Commission Est.</span><b class="mono">${commEst}</b></div>
            </div>
            <div>
              <div class="stencil mb-8" style="font-size:10px;margin-bottom:10px">Sales Trend (4-wk)</div>
              ${spark.length > 0
                ? `<div class="chart-box" style="height:80px"><canvas id="${sparkId}"></canvas></div>`
                : `<div class="muted tiny mt-16" style="padding-top:8px">No sales data</div>`
              }
            </div>
          </div>
          <div class="stencil mb-8" style="font-size:10px;margin-bottom:8px">Certifications</div>
          <div class="flex gap-6 wrap mb-16">${certList}</div>
          <div class="stencil mb-8" style="font-size:10px;margin-bottom:8px">This Week</div>
          <div class="flex gap-6 wrap">${weekRow}</div>
          <div class="mt-16 flex gap-8">
            <button class="btn btn--sm btn--ghost" onclick="WBT.ui.toast('Schedule updated for ${s.name.split(' ')[0]} (demo)','calendar')"><i data-lucide="calendar"></i> Edit Schedule</button>
            <button class="btn btn--sm btn--ghost" onclick="WBT.ui.toast('Cert record opened (demo)','award')"><i data-lucide="award"></i> Manage Certs</button>
            ${!s.isOwner ? `<button class="btn btn--sm btn--ghost" onclick="WBT.ui.toast('Commission report for ${s.name.split(' ')[0]} exported (demo)','file-text')"><i data-lucide="file-text"></i> Commission Report</button>` : ''}
          </div>
        </div>
      </div>`;

    ui.modal(html, { lg: false });
    ui.icons();

    if (spark.length > 0) {
      const canvas = document.getElementById(sparkId);
      if (canvas) {
        ui.spark(canvas, spark, P.fde);
      }
    }
  };

  // -------------------------------------------------- add staff modal
  window.openAddStaff = function () {
    const html = `
      <div class="panel">
        <div class="panel__head">
          <span class="stencil"><i data-lucide="user-plus" style="width:14px;height:14px"></i> Add Staff Member</span>
          <div class="right"><button class="btn btn--icon btn--ghost btn--sm" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
        </div>
        <div class="panel__body">
          <div class="grid-2 grid" style="gap:16px">
            <div><label class="fld">Full Name</label><input class="input" placeholder="First Last"></div>
            <div><label class="fld">Role</label><input class="input" placeholder="e.g. Sales Associate"></div>
            <div><label class="fld">Location</label>
              <select class="input">
                <option>San Diego</option>
                <option>Escondido</option>
              </select>
            </div>
            <div><label class="fld">Start Date</label><input class="input" type="date"></div>
          </div>
          <div class="mt-16"><label class="fld">Certifications (check all that apply)</label>
            <div class="flex gap-8 wrap mt-8">
              ${CERT_TYPES.map(c => `<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer">
                <input type="checkbox" style="accent-color:var(--fde)"> ${c.label}
              </label>`).join('')}
            </div>
          </div>
          <div class="flex gap-8 mt-24">
            <button class="btn btn--primary" onclick="WBT.ui.toast('Staff member added (demo)','user-check');WBT.ui.closeModal()"><i data-lucide="user-check"></i> Add Member</button>
            <button class="btn btn--ghost" onclick="WBT.ui.closeModal()">Cancel</button>
          </div>
        </div>
      </div>`;
    ui.modal(html, { lg: false });
    ui.icons();
  };

  // -------------------------------------------------- location filter seg
  document.getElementById('locSeg').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    activeLoc = btn.dataset.loc;
    this.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b === btn));
    buildRoster();
    ui.icons();
  });

  // -------------------------------------------------- clock
  function tick() {
    const el = document.getElementById('staffClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' PST';
  }
  tick(); setInterval(tick, 10000);

  // -------------------------------------------------- on-shift count
  function updateOnCount() {
    const on = W.staff.filter(s => s.on).length;
    const el = document.getElementById('onCount');
    if (el) el.textContent = on + ' ON SHIFT';
  }
  updateOnCount();

  // -------------------------------------------------- build all
  buildKpis();
  buildRoster();
  buildLeaderboard();
  buildCerts();
  buildPerf();
  buildSchedule();
  ui.icons();
})();
