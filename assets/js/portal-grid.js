/* ============================================================================
   WBT Command Center — portal-grid.js  (v3)
   Turns the ENTIRE owner portal into a drag-and-drop, resizable dashboard.

   How it works:
   - Walks every direct child of .content on each page
   - Groups consecutive "draggable" children (panels + grid containers) into
     one GridStack zone, separated by static elements (KPI rows, tab sections,
     toolbars, page-head)
   - Grid containers are exploded — each panel inside becomes its own moveable
     item. col-N.grid stacked-column wrappers become one opaque draggable block.
   - Standalone panels that were never inside any grid are now included.
   - Layout persists per page in localStorage; topbar reset button.
   - Charts refit on drop/resize. Mobile locks to 1-col (no accidental drag).
   Defensive: if GridStack fails to load or a transform errors, page is left as-is.
   ============================================================================ */
(function () {
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);

  function init() {
    if (!window.GridStack) return;
    const PAGE = document.body.dataset.page || 'page';
    const KEY  = 'wbt_layout_' + PAGE;
    const MOBILE = () => window.matchMedia('(max-width: 940px)').matches;

    // IDs that are KPI metric strips — never draggable
    const SKIP_IDS = new Set([
      'kpiRow', 'kpiStrip', 'settingsKpiRow',
      'mktKpiRow', 'staffKpiRow', 'ordersKpiRow',
    ]);

    // -------------------------------------------------- injected styles
    const css = `
      /* ── grid wrapper ─────────────────────────────────────────────────── */
      .wbt-gs.grid-stack { margin: 0 -8px; }

      /* ── item transitions: 140ms snappy — overrides GridStack's 300ms ── */
      .wbt-gs.grid-stack > .grid-stack-item {
        transition-duration: 0.14s !important;
        transition-timing-function: cubic-bezier(0.25, 0, 0.1, 1) !important;
        will-change: left, top, width, height;
      }
      /* Dragged / resizing: no interpolation — tracks cursor at native speed */
      .wbt-gs.grid-stack > .grid-stack-item.ui-draggable-dragging,
      .wbt-gs.grid-stack > .grid-stack-item.ui-resizable-resizing {
        transition: none !important;
        z-index: 60;
      }

      /* ── content div: use relative flow so sizeToContent measures ─────── */
      /* correctly (overrides GridStack's position:absolute; inset:0) */
      .wbt-gs .grid-stack-item-content {
        position: relative !important;
        height: auto !important;
        inset: auto !important;
        overflow: visible;
        background: transparent;
        border: 0;
        display: block;
      }
      .wbt-gs .grid-stack-item-content > .panel,
      .wbt-gs .grid-stack-item-content > [class*="col-"] {
        margin: 0;
      }

      /* ── drag grip icon ───────────────────────────────────────────────── */
      .wbt-gs .panel__head { cursor: grab; user-select: none; }
      .wbt-gs .panel__head:active { cursor: grabbing; }
      .wbt-grip {
        display: inline-flex; align-items: center; margin-right: 4px;
        color: var(--faint); cursor: grab; opacity: .45;
        transition: opacity .12s, color .12s; flex-shrink: 0;
      }
      .wbt-gs .panel:hover .wbt-grip { opacity: .9; color: var(--fde); }
      .wbt-grip svg { width: 14px; height: 14px; }
      /* drag bar for col-N wrapper items that have no panel header */
      .wbt-drag-bar {
        display: flex; align-items: center; justify-content: center; gap: 4px;
        height: 22px; cursor: grab; user-select: none;
        background: var(--panel-solid); border: 1px solid var(--line);
        border-radius: var(--r-lg) var(--r-lg) 0 0;
        color: var(--faint); opacity: .55; transition: opacity .12s;
        margin-bottom: 0;
      }
      .wbt-drag-bar:hover { opacity: 1; color: var(--fde); }
      .wbt-drag-bar svg { width: 13px; height: 13px; }

      /* ── lifted card while dragging ───────────────────────────────────── */
      .grid-stack-item.ui-draggable-dragging .panel {
        outline: 1px solid var(--fde);
        box-shadow: 0 28px 64px -14px rgba(0,0,0,.88);
        transform: scale(1.015);
        transition: transform .08s, box-shadow .08s !important;
      }

      /* ── drop-zone placeholder ────────────────────────────────────────── */
      .wbt-gs > .grid-stack-placeholder > .placeholder-content {
        background: rgba(194,161,123,.06);
        border: 1px dashed rgba(194,161,123,.5);
        border-radius: var(--r-lg);
        margin: 0 8px;
        animation: wbt-ph-in .1s ease-out both;
      }
      @keyframes wbt-ph-in {
        from { opacity: 0; transform: scaleY(0.92); }
        to   { opacity: 1; transform: scaleY(1); }
      }

      /* ── resize handles ───────────────────────────────────────────────── */
      .wbt-gs .ui-resizable-handle { z-index: 40; }
      .wbt-gs .ui-resizable-e  { width: 8px; right: 6px; cursor: ew-resize; }
      .wbt-gs .ui-resizable-se {
        width: 20px; height: 20px; right: 6px; bottom: 4px;
        cursor: nwse-resize; background: none;
      }
      .wbt-gs .ui-resizable-se::after {
        content: ""; position: absolute; right: 3px; bottom: 3px;
        width: 10px; height: 10px;
        border-right: 2px solid var(--fde); border-bottom: 2px solid var(--fde);
        opacity: 0; transition: opacity .12s; border-radius: 0 0 2px 0;
      }
      .wbt-gs .grid-stack-item:hover .ui-resizable-se::after { opacity: .85; }

      /* layout-reset: kill transitions during reload */
      .wbt-resetting * { transition: none !important; }

      @media (max-width: 940px) { .wbt-grip { display: none; } }
    `;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    // -------------------------------------------------- helpers
    const colSpan = el => {
      const m = (el && el.className || '').match(/\bcol-(\d+)\b/);
      return m ? Math.min(12, +m[1]) : 0;
    };

    function isStatic(el) {
      if (!el || el.nodeType !== 1) return true;
      if (['STYLE','SCRIPT','LINK'].includes(el.tagName)) return true;
      if (SKIP_IDS.has(el.id)) return true;
      // Page structure
      if (el.classList.contains('page-head')) return true;
      if (el.classList.contains('settings-layout')) return true;
      // Tab sections — keep as opaque blocks
      if (el.tagName === 'SECTION') return true;
      // Flex toolbars / tab navs (no panel children)
      if ((el.classList.contains('flex') || el.classList.contains('meta-row')) &&
          !el.querySelector('.panel')) return true;
      // Explicit skip classes
      const skipCls = ['tab-nav','tab-bar','toolbar','filter-bar','tac-toolbar','breadcrumb'];
      if (skipCls.some(c => el.classList.contains(c))) return true;
      return false;
    }

    function isDraggableCandidate(el) {
      if (isStatic(el)) return false;
      if (el.classList.contains('panel')) return true;
      if (el.classList.contains('grid') && el.querySelector('.panel')) return true;
      if (colSpan(el) > 0 && el.querySelector('.panel')) return true;
      return false;
    }

    // Returns GridStack item descriptors for a source element.
    // Pure .grid containers (no col-N class, e.g. grid-12) are exploded — each
    // direct child becomes its own GridStack item.
    // col-N wrappers (with or without .grid class) are kept as opaque items so
    // their internal stacking / layout is preserved.
    function getItems(source) {
      if (source.classList.contains('panel')) {
        return [{ el: source, w: colSpan(source) || 12 }];
      }
      const w = colSpan(source);
      if (source.classList.contains('grid') && !w) {
        // Pure grid container — explode direct children
        return [...source.children]
          .filter(k => k.nodeType === 1)
          .map(k => ({ el: k, w: colSpan(k) || 12 }));
      }
      // col-N wrapper (e.g. col-4.grid, col-8): keep as one opaque item
      if (w > 0) return [{ el: source, w }];
      return [];
    }

    function addGrip(el) {
      const head = el.querySelector('.panel__head');
      if (head) {
        if (!head.querySelector('.wbt-grip')) {
          const grip = document.createElement('span');
          grip.className = 'wbt-grip'; grip.title = 'Drag to rearrange';
          grip.innerHTML = '<i data-lucide="grip-vertical"></i>';
          head.insertBefore(grip, head.firstChild);
        }
      } else if (!el.querySelector('.wbt-drag-bar')) {
        // col-N wrapper with no panel__head — inject a thin drag handle bar
        const bar = document.createElement('div');
        bar.className = 'wbt-drag-bar wbt-grip';
        bar.title = 'Drag to rearrange';
        bar.innerHTML = '<i data-lucide="grip-vertical"></i>';
        el.insertBefore(bar, el.firstChild);
      }
    }

    // -------------------------------------------------- chart refit
    function refitCharts(container) {
      if (!window.Chart) return;
      (container || document).querySelectorAll('canvas').forEach(c => {
        const ch = window.Chart.getChart(c);
        if (ch) ch.resize();
      });
    }
    let _rafId;
    function refitChartRAF(el) {
      cancelAnimationFrame(_rafId);
      _rafId = requestAnimationFrame(() => { refitCharts(el); _rafId = null; });
    }

    // -------------------------------------------------- debounced save
    let _saveTimer;
    function saveLayout() {
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(() => {
        try {
          const data = grids.map(({ grid }) => grid.save(false));
          localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {}
      }, 250);
    }

    // -------------------------------------------------- build grids
    const grids = [];
    let gi = 0;

    const content = document.querySelector('.content');
    if (!content) return;

    let runSources = [];  // direct .content children that form this run
    let runItems   = [];  // { el, w } to place in the GridStack

    function flushRun() {
      if (!runItems.length) { runSources = []; return; }

      const thisGi = gi++;

      // Insert GridStack wrapper before the first source element
      const wrapper = document.createElement('div');
      wrapper.className = 'wbt-gs grid-stack';
      content.insertBefore(wrapper, runSources[0]);

      // Wrap each item in a gs-item
      runItems.forEach(({ el, w }, i) => {
        // Strip margin-bottom/top utilities — GridStack controls inter-item spacing
        el.className = el.className.replace(/\bm[bt]-\d+\b/g, '').replace(/\s+/g, ' ').trim();
        const item = document.createElement('div');
        item.className = 'grid-stack-item';
        item.setAttribute('gs-w', w);
        item.setAttribute('gs-min-w', Math.min(3, w));
        item.setAttribute('gs-id', `${PAGE}-${thisGi}-${i}`);
        const inner = document.createElement('div');
        inner.className = 'grid-stack-item-content';
        inner.appendChild(el);   // moves el from DOM into inner div
        item.appendChild(inner);
        wrapper.appendChild(item);
        addGrip(el);
      });

      // Remove grid wrapper sources (now empty after child extraction).
      // Standalone panels were already moved out of content via appendChild above.
      runSources.forEach(s => {
        if (s.classList.contains('grid') && s.parentNode === content) {
          content.removeChild(s);
        }
      });

      let grid;
      try {
        grid = GridStack.init({
          column:   12,
          margin:   '8px',
          cellHeight: 'auto',
          sizeToContent: true,
          float:    false,
          animate:  true,
          handle:   '.wbt-grip',
          draggable: { cancel: 'a, button, input, select, textarea, .btn, .seg, .switch, .tac-table' },
          resizable: { handles: 'e, se' },
          columnOpts: { breakpoints: [{ w: 940, c: 1 }], layout: 'list' },
        }, wrapper);
      } catch (e) {
        runSources = []; runItems = [];
        return;
      }

      grids.push({ grid, el: wrapper, gi: thisGi });

      // Restore saved layout
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (saved && saved[thisGi]) grid.load(saved[thisGi], false);
      } catch (e) {}

      // Event handlers
      grid.on('change', saveLayout);
      grid.on('resize', (ev, el) => refitChartRAF(el));
      grid.on('dragstop resizestop', () => {
        refitCharts(wrapper);
        saveLayout();
        window.dispatchEvent(new Event('resize'));
      });

      runSources = [];
      runItems   = [];
    }

    // Walk .content direct children
    const contentKids = [...content.children].filter(k => k.nodeType === 1);
    for (const el of contentKids) {
      if (isDraggableCandidate(el)) {
        runItems.push(...getItems(el));
        runSources.push(el);
      } else {
        flushRun();
      }
    }
    flushRun();

    if (!grids.length) return;

    // -------------------------------------------------- mobile lock
    function syncMode() {
      const m = MOBILE();
      grids.forEach(({ grid }) => grid.setStatic(m));
    }
    syncMode();
    window.addEventListener('resize', (() => {
      let t;
      return () => { clearTimeout(t); t = setTimeout(syncMode, 200); };
    })());

    // Re-render lucide icons (grip icons just added) + refit charts
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => grids.forEach(({ el }) => refitCharts(el)), 300);

    // -------------------------------------------------- reset
    function reset() {
      localStorage.removeItem(KEY);
      document.documentElement.classList.add('wbt-resetting');
      setTimeout(() => location.reload(), 60);
    }

    // -------------------------------------------------- topbar control
    function injectControl() {
      const bar = document.querySelector('.topbar');
      if (!bar || document.getElementById('wbtLayoutCtl')) return;
      const wrap = document.createElement('div');
      wrap.id = 'wbtLayoutCtl';
      wrap.className = 'flex items-center gap-8';
      wrap.style.cssText = 'order:5';
      wrap.innerHTML = `
        <span class="tag tag--fde tag--ghost hide-sm"
              title="Drag panels by the ⋮⋮ grip · resize from corner · auto-saves">
          <i data-lucide="move" style="width:13px"></i> Custom layout</span>
        <button class="btn btn--icon btn--ghost" id="wbtLayoutReset" title="Reset layout">
          <i data-lucide="rotate-ccw"></i></button>`;
      bar.appendChild(wrap);
      wrap.querySelector('#wbtLayoutReset').addEventListener('click', reset);
      if (window.lucide) window.lucide.createIcons();
    }
    injectControl();

    // One-time hint
    try {
      if (!localStorage.getItem('wbt_layout_hinted') && window.WBT && WBT.ui && !MOBILE()) {
        WBT.ui.toast('Drag any panel by the ⋮⋮ grip to rearrange — resize from the corner. Layout saves automatically.', 'move');
        localStorage.setItem('wbt_layout_hinted', '1');
      }
    } catch (e) {}

    window.PortalGrid = { grids, reset, save: saveLayout };
  }
})();
