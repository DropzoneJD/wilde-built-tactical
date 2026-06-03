/* Marketing Ops — marketing.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE;

  // ------------------------------------------------------------------ helpers
  function pctMeter(val, cls) {
    cls = cls || '';
    return `<div class="meter ${cls}" style="min-width:80px"><span style="width:${Math.min(val,100)}%"></span></div>`;
  }

  // ------------------------------------------------------------------ derived KPIs from WBT.campaigns
  const liveCampaigns = W.campaigns.filter(c => c.status === 'live');
  const totalSent    = W.campaigns.reduce((s, c) => s + c.sent, 0);
  const avgOpen      = +(W.campaigns.filter(c => c.sent > 0).reduce((s, c) => s + c.open, 0) / W.campaigns.filter(c => c.sent > 0).length).toFixed(1);
  const avgClick     = +(W.campaigns.filter(c => c.sent > 0).reduce((s, c) => s + c.click, 0) / W.campaigns.filter(c => c.sent > 0).length).toFixed(1);
  const attrRev      = W.campaigns.reduce((s, c) => s + c.rev, 0);

  // ------------------------------------------------------------------ KPI row
  const kpis = [
    { label: 'Active Campaigns',    icon: 'radio',        val: liveCampaigns.length,               foot: W.campaigns.length + ' total campaigns',           accent: true },
    { label: 'Messages Sent · 30d', icon: 'send',         val: totalSent.toLocaleString(),          foot: 'email + sms combined' },
    { label: 'Avg Open Rate',       icon: 'mail-open',    val: avgOpen + '%',                       foot: 'all active campaigns', delta: +2.1 },
    { label: 'Avg Click Rate',      icon: 'mouse-pointer-click', val: avgClick + '%',               foot: 'all active campaigns', delta: +0.8 },
    { label: 'Attributed Revenue',  icon: 'dollar-sign',  val: F.moneyK(attrRev),                   foot: 'campaign-tracked · 30d', delta: +11.4 },
    { label: 'List Size',           icon: 'users',        val: K.members.toLocaleString(),          foot: K.optInRate + '% opted-in · ' + Math.round(K.members * K.optInRate / 100) + ' reachable' },
  ];

  document.getElementById('mktKpiRow').innerHTML = kpis.map(k => {
    const d = (k.delta != null)
      ? `<span class="delta ${k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat'}">
          <i data-lucide="${k.delta > 0 ? 'trending-up' : 'trending-down'}" style="width:13px;height:13px"></i>${F.pct(k.delta)}</span>`
      : '';
    return `<div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value">${k.val}</div>
      <div class="stat__foot">${d}<span class="muted">${k.foot}</span></div>
    </div>`;
  }).join('');

  // ------------------------------------------------------------------ live meta row
  document.getElementById('mktListMeta').textContent =
    K.members + ' MEMBERS · ' + K.optInRate + '% OPT-IN';

  // ------------------------------------------------------------------ campaigns table
  let activeFilter = 'all';

  function renderTable() {
    const rows = W.campaigns.filter(c => activeFilter === 'all' || c.status === activeFilter);
    const thead = `<thead><tr>
      <th>Campaign</th><th>Channel</th><th>Type</th>
      <th class="num">Sent</th><th>Open %</th><th>Click %</th>
      <th class="num">Revenue</th><th>Status</th>
    </tr></thead>`;
    const tbody = rows.map(c => {
      const openMeter  = c.sent > 0 ? pctMeter(c.open, c.open >= 50 ? 'is-fde' : c.open >= 30 ? '' : 'is-mid') : '—';
      const clickMeter = c.sent > 0 ? pctMeter(c.click, c.click >= 25 ? 'is-fde' : '') : '—';
      const chanColor  = c.channel.includes('SMS') ? 'blue' : c.channel === 'SMS' ? 'blue' : 'fde';
      const kindColor  = c.kind === 'Automation' ? 'od' : c.kind === 'Triggered' ? 'amber' : 'steel';
      const stColor    = c.status === 'live' ? 'success' : 'steel';
      return `<tr class="clickable" onclick="mktOpenCampaign(${W.campaigns.indexOf(c)})">
        <td class="t-strong">${c.name}</td>
        <td><span class="tag tag--${chanColor}">${c.channel}</span></td>
        <td><span class="tag tag--${kindColor}">${c.kind}</span></td>
        <td class="num">${c.sent.toLocaleString()}</td>
        <td>
          <div class="flex items-center gap-8">
            <span class="mono" style="font-size:12px;min-width:30px">${c.sent > 0 ? c.open + '%' : '—'}</span>
            ${c.sent > 0 ? openMeter : ''}
          </div>
        </td>
        <td>
          <div class="flex items-center gap-8">
            <span class="mono" style="font-size:12px;min-width:30px">${c.sent > 0 ? c.click + '%' : '—'}</span>
            ${c.sent > 0 ? clickMeter : ''}
          </div>
        </td>
        <td class="num t-strong">${c.rev > 0 ? F.moneyK(c.rev) : '<span class="muted">—</span>'}</td>
        <td><span class="tag tag--${stColor}"><span class="dot"></span>${c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span></td>
      </tr>`;
    }).join('');
    document.getElementById('campaignTable').innerHTML = thead + '<tbody>' + tbody + '</tbody>';
  }
  renderTable();

  // view seg filter
  document.getElementById('viewSeg').addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    this.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeFilter = btn.dataset.v;
    renderTable();
    ui.icons();
  });

  // ------------------------------------------------------------------ campaign modal
  window.mktOpenCampaign = function(idx) {
    const c = W.campaigns[idx];
    if (!c) return;
    const stColor   = c.status === 'live' ? 'success' : 'steel';
    const chanColor = c.channel.includes('SMS') ? 'blue' : 'fde';
    const kindColor = c.kind === 'Automation' ? 'od' : c.kind === 'Triggered' ? 'amber' : 'steel';
    const rateHtml  = c.sent > 0
      ? `<div class="kv"><span class="muted">Open rate</span><b>${c.open}%</b></div>
         <div class="kv"><span class="muted">Click rate</span><b>${c.click}%</b></div>
         <div class="kv"><span class="muted">Attributed revenue</span><b>${F.money(c.rev)}</b></div>
         <div class="kv"><span class="muted">Click-to-open</span><b>${(c.open > 0 ? (c.click / c.open * 100).toFixed(1) : 0)}%</b></div>`
      : `<div class="alert alert--amber mt-8"><i data-lucide="clock"></i><div>No sends yet — campaign is in draft state.</div></div>`;

    ui.modal(`
      <div class="panel panel--pad" style="border:1px solid var(--line-2)">
        <div class="panel__head" style="padding:0 0 14px;border-bottom:1px solid var(--line);margin-bottom:14px">
          <div>
            <div class="flex gap-8 items-center mb-8">
              <span class="tag tag--${chanColor}">${c.channel}</span>
              <span class="tag tag--${kindColor}">${c.kind}</span>
              <span class="tag tag--${stColor}"><span class="dot"></span>${c.status}</span>
            </div>
            <h3 style="font-size:18px">${c.name}</h3>
          </div>
          <div class="right"><button class="btn btn--ghost btn--icon" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
        </div>
        <div class="grid grid-2" style="gap:14px">
          <div>
            <div class="stencil mb-8">Performance</div>
            <div class="kv"><span class="muted">Messages sent</span><b>${c.sent.toLocaleString()}</b></div>
            ${rateHtml}
          </div>
          <div>
            <div class="stencil mb-8">Config</div>
            <div class="kv"><span class="muted">Channel</span><b>${c.channel}</b></div>
            <div class="kv"><span class="muted">Type</span><b>${c.kind}</b></div>
            <div class="kv"><span class="muted">Status</span><b>${c.status}</b></div>
            <div class="kv"><span class="muted">Revenue / send</span><b>${c.sent > 0 ? F.money(Math.round(c.rev / c.sent)) : '—'}</b></div>
          </div>
        </div>
        <div class="flex gap-8 mt-16" style="border-top:1px solid var(--line);padding-top:14px">
          <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Campaign editor opened (demo)','settings-2');WBT.ui.closeModal()"><i data-lucide="settings-2"></i> Edit</button>
          <button class="btn btn--ghost btn--sm" onclick="WBT.ui.toast('Analytics report generated (demo)','bar-chart-2');WBT.ui.closeModal()"><i data-lucide="bar-chart-2"></i> Analytics</button>
          ${c.status === 'live'
            ? `<button class="btn btn--danger btn--sm" onclick="WBT.ui.toast('Campaign paused (demo)','pause');WBT.ui.closeModal()"><i data-lucide="pause"></i> Pause</button>`
            : `<button class="btn btn--primary btn--sm" onclick="WBT.ui.toast('Campaign activated (demo)','play');WBT.ui.closeModal()"><i data-lucide="play"></i> Activate</button>`}
          <button class="btn btn--ghost btn--sm" style="margin-left:auto" onclick="WBT.ui.closeModal()">Close</button>
        </div>
      </div>`, { lg: false });
    ui.icons();
  };

  // ------------------------------------------------------------------ automations
  const AUTOMATIONS = [
    {
      key: 'cart',
      name: 'Cart Recovery',
      desc: 'Multi-step ladder: reminder → 5% → 10% → 15% offer over 7 days. Email + SMS.',
      icon: 'shopping-cart',
      stats: [
        { val: '1,284', label: 'Sent 30d' },
        { val: '27%',   label: 'Recovery' },
        { val: F.moneyK(W.campaigns[0].rev), label: 'Revenue' },
      ],
      on: true,
    },
    {
      key: 'winback',
      name: 'Lapsed Win-Back',
      desc: 'Targets customers 120+ days inactive. 3-email sequence over 21 days.',
      icon: 'user-check',
      stats: [
        { val: '642',  label: 'Sent 30d' },
        { val: '48%',  label: 'Open rate' },
        { val: F.moneyK(W.campaigns[1].rev), label: 'Revenue' },
      ],
      on: true,
    },
    {
      key: 'bistock',
      name: 'Back-in-Stock',
      desc: 'Sends SMS alert the moment a watched item is restocked in inventory.',
      icon: 'package-check',
      stats: [
        { val: '388',  label: 'Sent 30d' },
        { val: '88%',  label: 'Open rate' },
        { val: F.moneyK(W.campaigns[3].rev), label: 'Revenue' },
      ],
      on: true,
    },
    {
      key: 'bday',
      name: 'Birthday Range Credit',
      desc: 'Sends a $25 range-day credit via email 5 days before the customer\'s birthday.',
      icon: 'gift',
      stats: [
        { val: '96',   label: 'Sent 30d' },
        { val: '67%',  label: 'Open rate' },
        { val: F.moneyK(W.campaigns[4].rev), label: 'Revenue' },
      ],
      on: true,
    },
  ];

  // persist toggle state in localStorage
  const autoState = {};
  AUTOMATIONS.forEach(a => {
    const stored = localStorage.getItem('wbt_auto_' + a.key);
    autoState[a.key] = stored !== null ? stored === '1' : a.on;
  });

  function renderAutoCards() {
    const liveCount = Object.values(autoState).filter(Boolean).length;
    document.getElementById('autoLiveCount').textContent = liveCount + ' ACTIVE';

    document.getElementById('autoCards').innerHTML = AUTOMATIONS.map(a => {
      const on = autoState[a.key];
      return `<div class="auto-card">
        <div class="auto-card__head">
          <div class="flex items-center gap-8">
            <div class="prod-thumb" style="width:32px;height:32px"><i data-lucide="${a.icon}"></i></div>
            <div>
              <div class="t-strong" style="font-size:13.5px">${a.name}</div>
              <span class="tag ${on ? 'tag--success' : 'tag--steel'}" style="margin-top:4px"><span class="dot"></span>${on ? 'Active' : 'Paused'}</span>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" ${on ? 'checked' : ''} onchange="mktToggleAuto('${a.key}', this.checked)">
            <span></span>
          </label>
        </div>
        <div class="tiny muted" style="line-height:1.5">${a.desc}</div>
        <div class="auto-card__stats">
          ${a.stats.map(s => `<div class="auto-mini"><span>${s.val}</span><label>${s.label}</label></div>`).join('')}
        </div>
      </div>`;
    }).join('');
    ui.icons();
  }
  renderAutoCards();

  window.mktToggleAuto = function(key, val) {
    autoState[key] = val;
    localStorage.setItem('wbt_auto_' + key, val ? '1' : '0');
    const a = AUTOMATIONS.find(x => x.key === key);
    ui.toast((val ? 'Automation activated: ' : 'Automation paused: ') + (a ? a.name : key), val ? 'zap' : 'pause');
    renderAutoCards();
  };

  // ------------------------------------------------------------------ engagement funnel
  const funnelData = [
    { label: 'Sent',      val: totalSent, pct: 100 },
    { label: 'Delivered', val: Math.round(totalSent * 0.971), pct: 97.1 },
    { label: 'Opened',    val: Math.round(totalSent * avgOpen / 100), pct: avgOpen },
    { label: 'Clicked',   val: Math.round(totalSent * avgClick / 100), pct: avgClick },
    { label: 'Purchased', val: Math.round(totalSent * 0.034), pct: 3.4 },
  ];
  document.getElementById('funnelPanel').innerHTML = funnelData.map(f => {
    const mClass = f.pct >= 80 ? 'is-fde' : f.pct >= 30 ? '' : f.pct >= 10 ? 'is-mid' : 'is-low';
    return `<div class="funnel-row">
      <div class="funnel-label">${f.label}</div>
      <div style="flex:1">${pctMeter(f.pct, mClass)}</div>
      <div class="funnel-val">${f.val.toLocaleString()}</div>
      <div class="mono muted" style="font-size:11px;min-width:38px;text-align:right">${f.pct}%</div>
    </div>`;
  }).join('');

  // ------------------------------------------------------------------ channel performance chart (14pt)
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return (d.getMonth() + 1) + '/' + d.getDate();
  });
  // email open rate trend — seeded variation
  const emailTrend = days14.map((_, i) => {
    const base = 54;
    return +(base + Math.sin(i * 0.6) * 8 + (W.between(0, 10) - 5)).toFixed(1);
  });
  const smsTrend = days14.map((_, i) => {
    const base = 78;
    return +(base + Math.sin(i * 0.4 + 1) * 6 + (W.between(0, 8) - 4)).toFixed(1);
  });

  ui.line(document.getElementById('channelChart'), days14,
    [
      { label: 'Email Open %', data: emailTrend, color: P.fde,  fill: false },
      { label: 'SMS Open %',   data: smsTrend,  color: P.blue, fill: false },
    ],
    { yMoney: false });

  // ------------------------------------------------------------------ compose broadcast
  const SEGMENTS_MAP = {
    vip:     { label: 'VIP / Collector',   size: W.customers.filter(c => c.seg === 'vip').length },
    regular: { label: 'Regular',           size: W.customers.filter(c => c.seg === 'regular').length },
    new:     { label: 'New Buyers',        size: W.customers.filter(c => c.seg === 'new').length },
    lapsed:  { label: 'Lapsed (Win-Back)', size: W.customers.filter(c => c.seg === 'lapsed').length },
  };

  function updateAudienceBadge() {
    const seg = document.getElementById('audienceSeg').value;
    const info = SEGMENTS_MAP[seg];
    if (!info) return;
    const reachable = Math.round(info.size * K.optInRate / 100);
    document.getElementById('audienceSize').textContent = reachable.toLocaleString() + ' REACHABLE';
  }
  window.mktUpdateAudience = updateAudienceBadge;
  updateAudienceBadge();

  let broadcastChan = 'email';
  window.mktSelectChan = function(btn) {
    document.getElementById('broadcastChan').querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    broadcastChan = btn.dataset.c;
    const lbl = document.getElementById('subjectLabel');
    lbl.textContent = broadcastChan === 'sms' ? 'SMS Body (160 chars)' : 'Subject Line';
    const inp = document.getElementById('broadcastSubject');
    inp.placeholder = broadcastChan === 'sms'
      ? 'e.g. WBT: New .308 ammo in stock — shop now'
      : 'e.g. New CA Roster Drops — this week only';
  };

  window.mktReviewBroadcast = function() {
    const seg   = document.getElementById('audienceSeg').value;
    const subj  = document.getElementById('broadcastSubject').value.trim();
    const prev  = document.getElementById('broadcastPreview').value.trim();
    const info  = SEGMENTS_MAP[seg];
    const reachable = info ? Math.round(info.size * K.optInRate / 100) : 0;
    const chanLabel = broadcastChan === 'sms' ? 'SMS' : 'Email';

    if (!subj) {
      ui.toast('Enter a subject / body before sending', 'alert-circle');
      document.getElementById('broadcastSubject').focus();
      return;
    }

    ui.modal(`
      <div class="panel" style="border:1px solid rgba(255,180,58,.4)">
        <div class="panel__head">
          <span class="stencil" style="color:var(--amber)"><i data-lucide="send" style="width:14px;height:14px"></i> Review Broadcast</span>
          <div class="right"><button class="btn btn--ghost btn--icon" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
        </div>
        <div class="panel__body" style="display:flex;flex-direction:column;gap:12px">
          <div class="alert alert--amber"><i data-lucide="alert-triangle"></i>
            <div><b>Mock send only.</b> Confirming queues the broadcast in demo mode — no real messages will be delivered.</div>
          </div>
          <div class="kv"><span class="muted">Segment</span><b>${info ? info.label : seg}</b></div>
          <div class="kv"><span class="muted">Channel</span><b>${chanLabel}</b></div>
          <div class="kv"><span class="muted">Reachable recipients</span><b style="color:var(--amber)">${reachable.toLocaleString()}</b></div>
          <div class="kv"><span class="muted">${chanLabel === 'SMS' ? 'SMS body' : 'Subject'}</span><b>${subj}</b></div>
          ${prev ? `<div class="kv"><span class="muted">Preview</span><b style="color:var(--text-soft)">${prev.substring(0, 80)}${prev.length > 80 ? '…' : ''}</b></div>` : ''}
          <div class="kv"><span class="muted">Estimated send time</span><b>~2 min (demo)</b></div>
          <div class="flex gap-8 mt-8" style="border-top:1px solid var(--line);padding-top:14px">
            <button class="btn btn--amber" onclick="mktConfirmSend()"><i data-lucide="send"></i> Confirm &amp; Queue</button>
            <button class="btn btn--ghost" onclick="WBT.ui.closeModal()">Cancel</button>
          </div>
        </div>
      </div>`, { lg: false });
    ui.icons();
  };

  window.mktConfirmSend = function() {
    WBT.ui.closeModal();
    const seg = document.getElementById('audienceSeg').value;
    const info = SEGMENTS_MAP[seg];
    const reachable = info ? Math.round(info.size * K.optInRate / 100) : 0;
    ui.toast('Broadcast queued to ' + reachable.toLocaleString() + ' recipients (demo only — no messages sent)', 'check-circle');
    // reset form
    document.getElementById('broadcastSubject').value = '';
    document.getElementById('broadcastPreview').value = '';
  };

  // ------------------------------------------------------------------ clock
  function tick() {
    const el = document.getElementById('mktClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' PST';
  }
  tick();
  setInterval(tick, 1000);

  // final icon pass
  ui.icons();
})();
