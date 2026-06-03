/* Cart Recovery — carts.js */
(function () {
  const W = window.WBT, ui = W.ui, F = W.fmt, K = W.kpi, P = ui.PALETTE;
  const STAGES = W.RECOVERY_STAGES;

  // ---------- per-stage cosmetic mapping (escalation: cool -> hot) ----------
  const STAGE_COLOR = ['steel', 'od', 'amber', 'danger'];   // tag suffix by stageIdx
  const STAGE_HEX = [P.steel, P.odBright, P.amber, P.danger];
  const stageTag = i => `<span class="tag tag--${STAGE_COLOR[i]}">${STAGES[i].label}</span>`;

  // relative-time formatter: hoursAgo -> "Nh" / "Nd"
  const rel = h => h < 24 ? h + 'h' : Math.round(h / 24) + 'd';

  // ---------- derive cart populations ----------
  const allActive = W.carts.filter(c => !c.recovered);
  const recovered = W.carts.filter(c => c.recovered);
  const total = W.carts.length;
  const recoRate = Math.round(recovered.length / total * 100);
  const recoRevenue = recovered.reduce((s, c) => s + c.value, 0);

  // bucket active carts by stageIdx for the ladder
  const buckets = [0, 1, 2, 3].map(i => allActive.filter(c => c.stageIdx === i));
  // busiest stage = the one to pulse
  let hotIdx = 0; buckets.forEach((b, i) => { if (b.length > buckets[hotIdx].length) hotIdx = i; });

  // ---------- KPI cards (6-up) ----------
  const kpis = [
    { label: 'Active Carts', icon: 'shopping-cart', val: K.activeCarts, delta: null, accent: true, foot: 'in recovery ladder', warn: true },
    { label: 'Value at Risk', icon: 'flame', val: F.moneyK(K.cartValue), delta: null, foot: 'across ' + allActive.length + ' carts', warn: true },
    { label: 'Recovered · 30d', icon: 'badge-check', val: recovered.length, delta: 12.4, foot: 'of ' + total + ' total carts' },
    { label: 'Recovery Rate', icon: 'percent', val: recoRate + '%', delta: 3.1, foot: 'win-back conversion' },
    { label: 'Revenue Recovered', icon: 'dollar-sign', val: F.moneyK(recoRevenue), delta: 9.6, foot: 'recaptured this cycle' },
    { label: 'Avg Disc · to Convert', icon: 'tag', val: '9%', delta: -1.2, foot: 'mostly at 10% stage' },
  ];
  document.getElementById('kpiRow').innerHTML = kpis.map(k => {
    const d = k.delta === null ? '' :
      `<span class="delta ${k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat'}">
        <i data-lucide="${k.delta > 0 ? 'trending-up' : k.delta < 0 ? 'trending-down' : 'minus'}" style="width:13px;height:13px"></i>${F.pct(k.delta)}</span>`;
    return `<div style="grid-column:span 2"><div class="stat ${k.accent ? 'stat--accent' : ''}">
      <div class="stat__label"><i data-lucide="${k.icon}"></i>${k.label}</div>
      <div class="stat__value">${k.val}</div>
      <div class="stat__foot">${d}<span class="${k.warn ? '' : 'muted'}" style="${k.warn ? 'color:var(--amber)' : ''}">${k.foot}</span></div>
    </div></div>`;
  }).join('');
  document.getElementById('kpiRow').style.gridTemplateColumns = 'repeat(6,1fr)';

  // ---------- HERO: recovery ladder stepper ----------
  const ladderHtml = STAGES.map((s, i) => {
    const cnt = buckets[i].length;
    const val = buckets[i].reduce((a, c) => a + c.value, 0);
    const conv = [42, 28, 19, 11][i]; // illustrative per-stage conversion lift
    const arrow = i === 0 ? '' :
      `<div class="ladder__arrow"><i data-lucide="chevron-right"></i><b>${conv}%</b></div>`;
    const discTxt = s.discount ? s.discount + '% OFF' : 'NUDGE';
    return `<div class="ladder__stage ${i === hotIdx ? 'is-hot' : ''}">
      ${arrow}
      <div class="flex justify-between items-center mb-8">
        <span class="ladder__idx">STAGE ${i + 1}</span>
        ${i === hotIdx ? '<span class="tag tag--amber"><span class="dot"></span>BUSIEST</span>' : `<span class="sdot sdot--${i < hotIdx ? 'go' : 'hold'}"></span>`}
      </div>
      <div class="stage-discount" style="color:${i === 3 ? 'var(--danger)' : i === 2 ? 'var(--amber)' : 'var(--fde)'}">${discTxt}</div>
      <div class="t-strong" style="font-size:13px;margin-top:2px">${s.label}</div>
      <div class="meta-row mt-8" style="gap:9px"><span><i data-lucide="clock" style="width:11px;height:11px;vertical-align:-1px"></i> ${s.wait}</span><span class="sep">/</span><span>${s.channel}</span></div>
      <div class="mt-16 flex items-baseline justify-between">
        <div class="ladder__count" style="color:${STAGE_HEX[i] === P.steel ? 'var(--text)' : 'var(--text)'}">${cnt}<small> carts</small></div>
        <div class="text-right"><div class="tiny mono muted">VALUE</div><b class="mono" style="font-size:13px">${F.moneyK(val)}</b></div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('ladder').innerHTML = ladderHtml;
  document.getElementById('ladderFoot').innerHTML =
    `<span><span class="sdot sdot--go"></span> ${allActive.length} IN LADDER</span><span class="sep">/</span>` +
    `<span>${F.moneyK(K.cartValue)} AT RISK</span><span class="sep">/</span>` +
    `<span>BUSIEST: STAGE ${hotIdx + 1} — ${STAGES[hotIdx].label.toUpperCase()}</span><span class="sep">/</span>` +
    `<span>NEXT SWEEP 06:00 PST</span>`;

  // ---------- active carts table (filterable) ----------
  let activeFilter = 'all';
  function visibleCarts() {
    let list = allActive.slice();
    if (activeFilter === 'optin') list = list.filter(c => c.optIn);
    else if (activeFilter === 'high') list = list.filter(c => c.value >= 80000);
    return list.sort((a, b) => b.value - a.value);
  }
  function renderTable() {
    const list = visibleCarts();
    document.getElementById('cartCount').textContent = list.length + ' CARTS';
    const head = `<thead><tr>
      <th>Customer</th><th>Items</th><th class="num">Cart Value</th><th>Abandoned</th>
      <th>Current Stage</th><th>Next Action</th><th class="text-center">Opt-In</th></tr></thead>`;
    const body = list.map((c, idx) => {
      const first = c.items[0];
      const next = c.stageIdx < 3 ? STAGES[c.stageIdx + 1] : null;
      const nextTxt = next
        ? `<span class="t-strong" style="color:var(--amber)">${next.discount ? next.discount + '% offer' : 'reminder'}</span><div class="tiny mono muted">in ${next.wait}</div>`
        : `<span class="t-strong" style="color:var(--danger)">Final — expiring</span><div class="tiny mono muted">last offer sent</div>`;
      return `<tr class="clickable" onclick="WBT.openCart(${idx})">
        <td><div class="t-strong">${c.customer}</div><div class="tiny mono muted">${c.email}</div></td>
        <td>${c.items.length} <span class="muted">·</span> <span class="t-strong">${first.name.length > 22 ? first.name.slice(0, 22) + '…' : first.name}</span></td>
        <td class="num t-strong">${F.money(c.value)}</td>
        <td class="num">${rel(c.hoursAgo)}<div class="tiny mono muted">ago</div></td>
        <td>${stageTag(c.stageIdx)}</td>
        <td>${nextTxt}</td>
        <td class="text-center"><span class="sdot sdot--${c.optIn ? 'go' : 'stop'}" title="${c.optIn ? 'Opted in' : 'No consent'}"></span></td>
      </tr>`;
    }).join('');
    document.getElementById('cartsTable').innerHTML = head + `<tbody>` + body + `</tbody>`;
    // keep the index map aligned with the current filtered view
    WBT._cartView = list;
    ui.icons();
  }

  // segmented filter
  document.getElementById('cartSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#cartSeg button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active'); activeFilter = b.dataset.f; renderTable();
  });

  // ---------- row click -> modal: timeline + line items + actions ----------
  WBT.openCart = function (idx) {
    const c = WBT._cartView[idx]; if (!c) return;
    const steps = STAGES.map((s, i) => {
      const state = i < c.stageIdx ? 'done' : i === c.stageIdx ? 'active' : 'wait';
      const stamp = i < c.stageIdx ? 'SENT' : i === c.stageIdx ? 'CURRENT' : 'QUEUED';
      return `<div class="tl-item ${state}">
        <div class="flex justify-between items-center">
          <div class="t-strong" style="font-size:13px">${s.label} ${s.discount ? '· ' + s.discount + '% off' : ''}</div>
          <span class="tag tag--${state === 'done' ? 'success' : state === 'active' ? 'amber' : 'steel'} tag--ghost">${stamp}</span>
        </div>
        <div class="tl-time">${s.channel} · T+${s.wait}</div>
      </div>`;
    }).join('');
    const lines = c.items.map(it => `<div class="li-row">
      <div class="flex items-center gap-8"><span class="prod-thumb" style="width:30px;height:30px"><i data-lucide="${(W.CATS[it.cat] || {}).icon || 'box'}" style="width:15px;height:15px"></i></span>
        <span class="t-strong">${it.name}</span></div>
      <b class="mono">${F.money(it.price)}</b></div>`).join('');

    ui.modal(`
      <div class="panel__head">
        <span class="stencil"><i data-lucide="shopping-cart" style="width:14px;height:14px"></i> ${c.id} · Recovery Sequence</span>
        <div class="right"><button class="btn btn--icon btn--ghost" onclick="WBT.ui.closeModal()"><i data-lucide="x"></i></button></div>
      </div>
      <div class="panel__body">
        <div class="flex justify-between items-start wrap gap-12 mb-16">
          <div>
            <div class="t-strong" style="font-size:16px">${c.customer}</div>
            <div class="tiny mono muted">${c.email}</div>
            <div class="mt-8 flex gap-8 wrap">
              ${stageTag(c.stageIdx)}
              <span class="tag tag--${c.optIn ? 'success' : 'danger'}"><span class="sdot sdot--${c.optIn ? 'go' : 'stop'}" style="box-shadow:none"></span>${c.optIn ? 'Marketing Opt-In' : 'No Consent'}</span>
              <span class="tag tag--steel mono">${rel(c.hoursAgo)} ago</span>
            </div>
          </div>
          <div class="text-right">
            <div class="tiny mono muted">CART VALUE</div>
            <div style="font-family:var(--f-display);font-weight:800;font-size:30px;line-height:1;color:var(--fde)">${F.money(c.value)}</div>
          </div>
        </div>

        <div class="grid grid-2" style="gap:18px">
          <div>
            <div class="stencil mb-8">4-Step Sequence</div>
            <div class="timeline">${steps}</div>
          </div>
          <div>
            <div class="stencil mb-8">Cart Contents · ${c.items.length} ${c.items.length === 1 ? 'item' : 'items'}</div>
            ${lines}
            <div class="kv mt-8" style="border-top:1px solid var(--line-2);padding-top:10px"><span class="muted">Cart total</span><b style="color:var(--fde)">${F.money(c.value)}</b></div>

            <div class="mt-16">
              <label class="fld">Override discount to convert · <span id="dLabel" style="color:var(--amber)">10%</span></label>
              <input id="dRange" type="range" min="0" max="20" value="10" step="5" style="width:100%;accent-color:var(--fde)"
                oninput="document.getElementById('dLabel').textContent=this.value+'%'">
              <div class="flex justify-between tiny mono faint mt-8"><span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span></div>
            </div>
          </div>
        </div>

        <div class="flex gap-8 wrap mt-24" style="border-top:1px dashed var(--line);padding-top:16px">
          <button class="btn btn--amber" onclick="WBT.ui.toast('Next offer sent to ${c.customer} (demo)','send'); WBT.ui.closeModal()"><i data-lucide="send"></i> Send Next Offer Now</button>
          <button class="btn btn--primary" onclick="WBT.markRecovered('${c.id}')"><i data-lucide="badge-check"></i> Mark Recovered</button>
          <button class="btn btn--ghost" onclick="WBT.ui.toast('Recovery sequence paused (demo)','pause-circle')"><i data-lucide="pause-circle"></i> Pause</button>
          <button class="btn btn--danger" style="margin-left:auto" onclick="WBT.ui.toast('Cart marked lost — removed from ladder (demo)','x-circle'); WBT.ui.closeModal()"><i data-lucide="x-circle"></i> Mark Lost</button>
        </div>
      </div>`, { lg: true });
    ui.icons();
  };

  WBT.markRecovered = function (id) {
    ui.closeModal();
    ui.toast(id + ' marked recovered — revenue recaptured', 'party-popper');
  };

  renderTable();

  // ---------- automation settings panel ----------
  const autoHtml = STAGES.map((s, i) => {
    return `<div class="auto-row">
      <div class="auto-step">${i + 1}</div>
      <div style="min-width:0;flex:1 1 auto">
        <div class="t-strong" style="font-size:13px">${s.label}</div>
        <div class="meta-row" style="gap:8px"><span>${s.channel}</span><span class="sep">/</span><span>T+${s.wait}</span><span class="sep">/</span>
          <span style="color:${s.discount ? 'var(--amber)' : 'var(--muted)'}">${s.discount ? s.discount + '% off' : 'no discount'}</span></div>
      </div>
      <label class="switch"><input type="checkbox" checked data-step="${i}"><span></span></label>
    </div>`;
  }).join('');
  document.getElementById('autoSettings').innerHTML = autoHtml +
    `<button class="btn btn--amber btn--block mt-16" onclick="WBT.ui.toast('Recovery engine triggered — sweeping ${allActive.length} carts (demo)','zap')"><i data-lucide="zap"></i> Run Recovery Engine Now</button>` +
    `<div class="kv mt-16"><span class="muted">Engine status</span><b style="color:var(--success)">ACTIVE · 06:00 daily</b></div>`;

  // toggling any step toasts
  document.getElementById('autoSettings').addEventListener('change', e => {
    const cb = e.target.closest('input[data-step]'); if (!cb) return;
    const s = STAGES[+cb.dataset.step];
    ui.toast(`${s.label} ${cb.checked ? 'enabled' : 'disabled'} (demo)`, cb.checked ? 'toggle-right' : 'toggle-left');
  });

  // ---------- channel performance: email vs SMS (two meters) ----------
  // page-local mock split, consistent with tone (SMS converts harder, email wider reach)
  const channelPerf = [
    { ch: 'Email', icon: 'mail', reach: 62, recovered: 41, color: 'is-fde' },
    { ch: 'SMS', icon: 'message-square', reach: 38, recovered: 58, color: 'is-mid' },
  ];
  document.getElementById('channelSplit').innerHTML = channelPerf.map(p => `
    <div class="mb-16">
      <div class="flex justify-between items-center mb-8">
        <span class="t-strong" style="font-size:13px"><i data-lucide="${p.icon}" style="width:14px;height:14px;vertical-align:-2px;color:var(--fde)"></i> ${p.ch}</span>
        <span class="mono tiny muted">${p.recovered}% recovery rate</span>
      </div>
      <div class="meter ${p.color}"><span style="width:${p.recovered}%"></span></div>
      <div class="flex justify-between tiny mono faint mt-8"><span>${p.reach}% of sends</span><span>${p.recovered}% convert</span></div>
    </div>`).join('') +
    `<div class="alert alert--od mt-16"><i data-lucide="lightbulb"></i><div><b>SMS converts 1.4×</b> harder but reaches fewer opted-in buyers. Engine prioritizes SMS at the 10% stage.</div></div>`;

  // ---------- recovery funnel chart (carts entering each stage) ----------
  // monotonic funnel: everyone enters stage 1; counts taper as carts recover/convert out.
  const funnel = [allActive.length,
    Math.round(allActive.length * 0.74),
    Math.round(allActive.length * 0.46),
    Math.round(allActive.length * 0.21)];
  const fLabels = STAGES.map((s, i) => 'S' + (i + 1) + ' · ' + (s.discount ? s.discount + '%' : 'Rmd'));
  ui.bars(document.getElementById('funnelChart'), fLabels, funnel, {
    horizontal: true,
    colors: [P.steel, P.odBright, P.amber, P.danger].map(h => ui.hexA(h, .85)),
  });

  // ---------- recently recovered feed ----------
  const recoSorted = recovered.slice().sort((a, b) => a.hoursAgo - b.hoursAgo).slice(0, 6);
  document.getElementById('recoTag').innerHTML = `<span class="dot"></span>${recovered.length} WON`;
  document.getElementById('recoveredFeed').innerHTML = (recoSorted.length ? recoSorted.map(c => {
    const disc = STAGES[c.stageIdx].discount;
    return `<div class="feed-row">
      <span class="sdot sdot--go" style="margin-top:1px"></span>
      <div style="min-width:0;flex:1 1 auto">
        <div class="t-strong" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.customer}</div>
        <div class="tiny mono muted">recovered at ${STAGES[c.stageIdx].label}${disc ? ' · ' + disc + '% off' : ''} · ${rel(c.hoursAgo)}</div>
      </div>
      <b class="mono" style="color:var(--success)">${F.money(c.value)}</b>
    </div>`;
  }).join('') : `<div class="muted tiny">No recovered carts in window.</div>`) +
    `<div class="kv mt-16" style="border-top:1px solid var(--line-2);padding-top:10px"><span class="muted">Total recaptured</span><b style="color:var(--success)">${F.money(recoRevenue)}</b></div>` +
    `<button class="btn btn--ghost btn--sm btn--block mt-16" onclick="WBT.ui.toast('Opening recovered-carts ledger (demo)','scroll-text')"><i data-lucide="scroll-text"></i> View full ledger</button>`;

  // ---------- "Run Recovery Now" header button ----------
  document.getElementById('runEngine').addEventListener('click', () => {
    ui.toast(`Recovery engine swept ${allActive.length} carts — ${buckets[hotIdx].length} advanced at Stage ${hotIdx + 1}`, 'zap');
  });

  // ---------- clock ----------
  function tick() {
    const el = document.getElementById('engClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' PST';
  }
  tick(); setInterval(tick, 1000);

  ui.icons();
})();
