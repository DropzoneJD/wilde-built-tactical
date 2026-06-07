/* ============================================================================
   WBT Command Center — portal-grid.js  v2
   Drag-and-drop, resizable, smooth-animated dashboard panels.

   Architecture choices (why this feels fast):
   ─ cellHeight: 10 (10px raster, fine snap) + explicit gs-h computed from real
     panel height measured BEFORE transformation → panels fill their content,
     no 83px-collapsed-cells / sizeToContent circular-loop bug.
   ─ Reflow animation overridden to 160ms cubic-bezier(0.4,0,0.2,1) — fast and
     material-eased vs GridStack's default sluggish 300ms.
   ─ Dragging/resizing item gets transition:none → follows cursor at 1:1,
     zero lag. GPU elevation via will-change + box-shadow.
   ─ Charts ONLY refit on dragstop/resizestop, never on every drag step.
     window.resize dispatch removed entirely.
   ─ canvas pointer-events disabled during active drag → no Chart.js hover
     callbacks firing while dragging, killing a major jank source.
   ─ Save debounced 600ms after interaction ends, not on every event step.
   ─ Hidden-tab and nested grids excluded automatically.
   ─ Mobile (<940px): grid locks (static), grips hidden, no accidental drags.
   ============================================================================ */
(function () {
  if (document.readyState === 'complete') _init();
  else window.addEventListener('load', _init);

  function _init() {
    if (!window.GridStack) return;
    const PAGE = document.body.dataset.page || 'unknown';
    const KEY  = 'wbt_layout_' + PAGE;
    const CELL = 10;  // 10px raster — fine enough for smooth resize snapping
    const SKIP = new Set(['kpiRow','kpiStrip','settingsKpiRow']);
    const MOBILE = () => window.matchMedia('(max-width:940px)').matches;

    // ---- styles (injected once) ----------------------------------------
    document.head.insertAdjacentHTML('beforeend', `<style id="wbt-gs-styles">
      /* ── reflow animation: fast + material eased ── */
      .wbt-gs.grid-stack .grid-stack-item {
        transition: left 160ms cubic-bezier(.4,0,.2,1),
                    top  160ms cubic-bezier(.4,0,.2,1),
                    width 160ms cubic-bezier(.4,0,.2,1),
                    height 160ms cubic-bezier(.4,0,.2,1) !important;
        will-change: left, top;
      }
      /* dragged/resized item: NO transition → 1:1 cursor tracking, zero lag */
      .wbt-gs .grid-stack-item.ui-draggable-dragging,
      .wbt-gs .grid-stack-item.ui-resizable-resizing {
        transition: none !important;
        will-change: transform, box-shadow;
        z-index: 60;
      }
      /* elevated + scaled while being dragged */
      .wbt-gs .grid-stack-item.ui-draggable-dragging > .grid-stack-item-content > .panel,
      .wbt-gs .grid-stack-item.ui-draggable-dragging > .grid-stack-item-content > .grid {
        box-shadow: 0 32px 80px -16px rgba(0,0,0,.9), 0 0 0 1px rgba(194,161,123,.5) !important;
        transform: scale(1.012);
        transition: transform 120ms ease, box-shadow 120ms ease;
      }
      /* placeholder drop target */
      .wbt-gs .grid-stack-placeholder > .placeholder-content {
        background: rgba(194,161,123,.07) !important;
        border: 2px dashed rgba(194,161,123,.55) !important;
        border-radius: var(--r-lg) !important;
        margin: 4px !important;
        transition: none;
      }
      /* kill canvas hover callbacks during any active drag → stops Chart.js
         tooltip & hover processing from firing 60×/s while dragging */
      .wbt-gs.drag-active canvas { pointer-events: none; }

      /* content wrapper fills the grid cell */
      .wbt-gs .grid-stack-item-content { position:absolute; inset:0; overflow:hidden; border-radius:var(--r-lg); }
      .wbt-gs .grid-stack-item-content > .panel,
      .wbt-gs .grid-stack-item-content > .grid { height:100%; margin:0; overflow:hidden; border-radius:var(--r-lg); }

      /* drag grip */
      .wbt-grip { display:inline-flex;align-items:center;margin-right:4px;color:var(--faint);cursor:grab;opacity:.45;transition:opacity .12s,color .12s;flex:0 0 auto; }
      .wbt-gs .panel:hover .wbt-grip,
      .wbt-gs .panel__head:hover .wbt-grip { opacity:1;color:var(--fde); }
      .wbt-grip svg { width:14px;height:14px; }
      .panel__head { cursor:default; }

      /* SE resize handle — larger hit target, visible on hover */
      .wbt-gs .ui-resizable-e  { width:6px; right:2px; cursor:ew-resize; z-index:40; }
      .wbt-gs .ui-resizable-se { width:20px; height:20px; right:2px; bottom:2px; cursor:nwse-resize; z-index:40; background:none; }
      .wbt-gs .ui-resizable-se::after { content:"";position:absolute;right:4px;bottom:4px;width:10px;height:10px;border-right:2px solid var(--fde);border-bottom:2px solid var(--fde);border-radius:0 0 3px 0;opacity:0;transition:opacity .15s; }
      .wbt-gs .grid-stack-item:hover .ui-resizable-se::after { opacity:.9; }

      /* layout-reset button flash */
      .wbt-resetting * { transition:none!important; animation:none!important; }

      @media(max-width:940px){
        .wbt-grip { display:none; }
        .wbt-gs .ui-resizable-e, .wbt-gs .ui-resizable-se { display:none; }
      }
    </style>`);

    // ---- helpers ----------------------------------------------------------
    const colSpan = el => { const m = (el.className||'').match(/\bcol-(\d+)\b/); return m ? Math.min(12,+m[1]) : 12; };

    function isPanelGrid(g) {
      if (SKIP.has(g.id)) return false;
      if (!g.classList.contains('grid')) return false;
      if (!g.offsetParent || g.offsetHeight < 2) return false; // skip hidden / inactive tabs
      const kids = [...g.children].filter(k=>k.nodeType===1);
      if (kids.length < 2) return false;
      return kids.some(k => k.classList.contains('panel') || k.querySelector('.panel'));
    }

    function measureHeight(el) {
      // measure natural height before GridStack wraps it
      const r = el.getBoundingClientRect();
      return r.height > 10 ? r.height : el.scrollHeight || 200;
    }

    function transform(grid, gi) {
      const kids = [...grid.children].filter(k=>k.nodeType===1);
      // measure BEFORE any DOM change (getBoundingClientRect needs layout to be stable)
      const heights = kids.map(measureHeight);

      // swap in grid-stack classes
      grid.classList.add('wbt-gs','grid-stack');
      grid.style.gridTemplateColumns = '';
      grid.classList.remove('grid','grid-2','grid-3','grid-4','grid-12');

      kids.forEach((child, i) => {
        const w  = colSpan(child);
        const h  = Math.max(5, Math.ceil(heights[i] / CELL));
        const minH = Math.max(4, Math.ceil(80 / CELL));  // min 80px
        const item = document.createElement('div');
        item.className = 'grid-stack-item';
        item.setAttribute('gs-w', w);
        item.setAttribute('gs-h', h);
        item.setAttribute('gs-min-w', Math.min(3,w));
        item.setAttribute('gs-min-h', minH);
        item.setAttribute('gs-id', PAGE+'-'+gi+'-'+i);
        const content = document.createElement('div');
        content.className = 'grid-stack-item-content';
        grid.insertBefore(item, child);
        content.appendChild(child);
        item.appendChild(content);
        // drag grip (only if header present)
        const head = content.querySelector('.panel__head');
        if (head && !head.querySelector('.wbt-grip')) {
          const grip = document.createElement('span');
          grip.className = 'wbt-grip'; grip.title = 'Drag to move';
          grip.innerHTML = '<i data-lucide="grip-vertical"></i>';
          head.insertBefore(grip, head.firstChild);
        }
      });
      return grid;
    }

    function refitCharts(el) {
      if (!window.Chart) return;
      (el||document).querySelectorAll('canvas').forEach(c => {
        const ch = window.Chart.getChart(c);
        if (ch) { ch.resize(); }
      });
    }

    // debounced save
    let saveTimer = null;
    function schedSave() { clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 600); }
    function doSave() {
      try { localStorage.setItem(KEY, JSON.stringify(grids.map(g=>g.save(false)))); } catch(e){}
    }

    // ---- find & transform grids ------------------------------------------
    const grids = [];
    const allGrids = [...document.querySelectorAll('.content .grid, .content--wide .grid')].filter(isPanelGrid);
    const targets  = allGrids.filter(g => !allGrids.some(o => o!==g && o.contains(g)));

    targets.forEach((gridEl, gi) => {
      let g;
      try { g = transform(gridEl, gi); } catch(e) { console.warn('portal-grid transform failed', e); return; }

      const grid = GridStack.init({
        column: 12,
        cellHeight: CELL,
        cellHeightUnit: 'px',
        margin: '8px',
        sizeToContent: false,         // heights set explicitly — no circular loop
        float: false,
        animate: true,
        handle: '.wbt-grip',
        handleClass: 'wbt-grip',
        draggable: {
          cancel: 'a,button,input,select,textarea,.btn,.seg,.switch,.tac-table,canvas',
        },
        resizable: { handles: 'e,se' },
        columnOpts: {
          breakpoints: [{ w: 940, c: 1 }],
          layout: 'list',
        },
      }, g);
      grids.push(grid);

      // restore saved layout
      try {
        const all = JSON.parse(localStorage.getItem(KEY)||'null');
        if (all && all[gi] && all[gi].length) grid.load(all[gi], false);
      } catch(e){}

      // ---- events -----------------------------------------------------------
      grid.on('dragstart', () => {
        grid.el.classList.add('drag-active');
        // tell browser to composite grid items for zero-reflow drag
        grid.el.querySelectorAll('.grid-stack-item').forEach(it => {
          it.style.willChange = 'left, top';
        });
      });
      grid.on('dragstop', (_ev, el) => {
        grid.el.classList.remove('drag-active');
        grid.el.querySelectorAll('.grid-stack-item').forEach(it => { it.style.willChange = ''; });
        refitCharts(el);
        schedSave();
      });
      grid.on('resizestart', () => { grid.el.classList.add('drag-active'); });
      grid.on('resizestop', (_ev, el) => {
        grid.el.classList.remove('drag-active');
        refitCharts(el);
        schedSave();
      });
      // no window.resize dispatch — only refit the specific resized/dropped panel
    });

    if (!grids.length) return;

    // ---- lock / unlock on viewport resize --------------------------------
    let mobileWas = MOBILE();
    function syncMode() {
      const m = MOBILE();
      if (m === mobileWas) return;
      mobileWas = m;
      grids.forEach(g => g.setStatic(m));
    }
    let mqTimer = null;
    window.addEventListener('resize', () => { clearTimeout(mqTimer); mqTimer = setTimeout(syncMode, 200); });
    grids.forEach(g => g.setStatic(MOBILE()));

    // initial chart refit after layout settles
    setTimeout(() => grids.forEach(g => g.el && refitCharts(g.el)), 400);

    // ---- topbar control --------------------------------------------------
    function injectControl() {
      const bar = document.querySelector('.topbar');
      if (!bar || document.getElementById('wbtLayoutCtl')) return;
      const div = document.createElement('div');
      div.id = 'wbtLayoutCtl';
      div.style.cssText = 'display:flex;align-items:center;gap:8px;flex:0 0 auto';
      div.innerHTML =
        `<span class="tag tag--fde tag--ghost" style="font-size:11px" title="Drag the ⋮⋮ grip in any panel header to rearrange; drag bottom-right corner to resize">` +
        `<i data-lucide="move" style="width:12px;height:12px"></i><span class="hide-sm">Custom layout</span></span>` +
        `<button class="btn btn--icon btn--ghost" id="wbtLayoutReset" title="Reset layout"><i data-lucide="rotate-ccw"></i></button>`;
      bar.appendChild(div);
      div.querySelector('#wbtLayoutReset').addEventListener('click', () => {
        localStorage.removeItem(KEY);
        document.documentElement.classList.add('wbt-resetting');
        setTimeout(() => location.reload(), 50);
      });
      if (window.lucide) window.lucide.createIcons(div);
    }
    injectControl();

    // render grip icons
    if (window.lucide) window.lucide.createIcons(document.querySelector('.content, .content--wide'));

    // one-time hint toast
    try {
      if (!localStorage.getItem('wbt_hint2') && !MOBILE() && window.WBT && WBT.ui) {
        setTimeout(() => {
          WBT.ui.toast('Drag the ⋮⋮ grip to rearrange panels. Resize from the corner.', 'move');
          localStorage.setItem('wbt_hint2','1');
        }, 1200);
      }
    } catch(e){}

    window.PortalGrid = { grids, reset: () => { localStorage.removeItem(KEY); location.reload(); }, save: doSave };
  }
})();
