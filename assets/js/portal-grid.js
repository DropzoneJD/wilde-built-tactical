/* ============================================================================
   WBT Command Center — portal-grid.js
   Makes the owner portal's panel grids DRAG-AND-DROP + RESIZABLE with smooth,
   auto-reflowing animations, on top of the existing markup. Built on GridStack.

   - Transforms each main `.grid.grid-12` panel grid into a GridStack grid at runtime
     (KPI rows / toolbars are left untouched).
   - Drag a panel by its header to rearrange; drag the right/corner handle to resize.
   - Heights auto-fit content (sizeToContent); widths snap to the 12-col system.
   - Layout persists per page in localStorage; a topbar control resets it.
   - Charts inside re-fit when their panel resizes.
   - Collapses to a single column and locks on mobile.
   Defensive: if GridStack is missing or a transform fails, the page is left as-is.
   ============================================================================ */
(function () {
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);

  function init() {
    if (!window.GridStack) return;
    const PAGE = document.body.dataset.page || 'page';
    const KEY  = 'wbt_layout_' + PAGE;
    const SKIP = new Set(['kpiRow', 'kpiStrip', 'settingsKpiRow']);
    const MOBILE = () => window.matchMedia('(max-width: 940px)').matches;

    // -------------------------------------------------- injected styles
    const css = `
      .wbt-gs.grid-stack { margin: 0 -8px; }

      /* item transition: 140ms, snappy cubic — overrides GridStack's 300ms */
      .wbt-gs.grid-stack > .grid-stack-item {
        transition-duration: 0.14s !important;
        transition-timing-function: cubic-bezier(0.25, 0, 0.1, 1) !important;
        will-change: left, top, width, height;
      }
      /* dragged + resizing: no transition — tracks cursor at native speed */
      .wbt-gs.grid-stack > .grid-stack-item.ui-draggable-dragging,
      .wbt-gs.grid-stack > .grid-stack-item.ui-resizable-resizing {
        transition: none !important;
        z-index: 60;
      }

      .wbt-gs .grid-stack-item-content {
        inset: 0; background: transparent; border: 0;
        overflow: visible; display: block;
      }
      .wbt-gs .grid-stack-item-content > .panel,
      .wbt-gs .grid-stack-item-content > .grid { height: 100%; margin: 0; }

      /* drag grip icon */
      .wbt-gs .panel__head { cursor: grab; user-select: none; }
      .wbt-gs .panel__head:active { cursor: grabbing; }
      .wbt-grip {
        display: inline-flex; align-items: center; margin-right: 4px;
        color: var(--faint); cursor: grab; opacity: .45;
        transition: opacity .12s, color .12s;
      }
      .wbt-gs .panel:hover .wbt-grip { opacity: .9; color: var(--fde); }
      .wbt-grip svg { width: 14px; height: 14px; }

      /* lifted card while dragging */
      .grid-stack-item.ui-draggable-dragging .panel {
        outline: 1px solid var(--fde);
        box-shadow: 0 28px 64px -14px rgba(0,0,0,.88);
        transform: scale(1.015);
        transition: transform .08s, box-shadow .08s !important;
      }

      /* drop-zone placeholder */
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

      /* resize handles */
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

      /* layout-reset: kill all transitions during reload */
      .wbt-resetting * { transition: none !important; }

      @media (max-width: 940px) { .wbt-grip { display: none; } }
    `;
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    // -------------------------------------------------- helpers
    const colSpan = el => {
      const m = (el.className || '').match(/\bcol-(\d+)\b/);
      return m ? Math.min(12, +m[1]) : 12;
    };

    function isPanelGrid(g) {
      if (SKIP.has(g.id)) return false;
      if (!g.classList.contains('grid')) return false;
      if (!g.offsetParent || g.offsetHeight === 0) return false;
      const kids = [...g.children].filter(k => k.nodeType === 1);
      if (kids.length < 2) return false;
      const ok = kids.every(k =>
        k.classList.contains('panel') ||
        /\bcol-\d+\b/.test(k.className) ||
        k.querySelector('.panel')
      );
      return ok && kids.some(k => k.classList.contains('panel') || k.querySelector('.panel'));
    }

    function transform(grid, gi) {
      const kids = [...grid.children].filter(k => k.nodeType === 1);
      grid.classList.add('wbt-gs', 'grid-stack');
      grid.classList.remove('grid-12', 'grid-2', 'grid-3', 'grid-4');
      grid.style.gridTemplateColumns = '';
      kids.forEach((child, i) => {
        const w = colSpan(child);
        const item = document.createElement('div');
        item.className = 'grid-stack-item';
        item.setAttribute('gs-w', w);
        item.setAttribute('gs-min-w', Math.min(3, w));
        item.setAttribute('gs-id', PAGE + '-' + gi + '-' + i);
        const content = document.createElement('div');
        content.className = 'grid-stack-item-content';
        grid.insertBefore(item, child);
        content.appendChild(child);
        item.appendChild(content);
        const head = content.querySelector('.panel__head');
        if (head && !head.querySelector('.wbt-grip')) {
          const grip = document.createElement('span');
          grip.className = 'wbt-grip'; grip.title = 'Drag to rearrange';
          grip.innerHTML = '<i data-lucide="grip-vertical"></i>';
          head.insertBefore(grip, head.firstChild);
        } else if (!head) {
          item.classList.add('wbt-nohead');
        }
      });
      grid.classList.remove('grid');
      return grid;
    }

    // -------------------------------------------------- chart refit
    function refitCharts(el) {
      if (!window.Chart) return;
      el.querySelectorAll('canvas').forEach(c => {
        const ch = window.Chart.getChart(c);
        if (ch) ch.resize();
      });
    }

    // RAF-throttled refit (called during live resize — at most 1x per frame)
    let _rafId = null;
    function refitChartRAF(el) {
      if (_rafId) cancelAnimationFrame(_rafId);
      _rafId = requestAnimationFrame(() => { refitCharts(el); _rafId = null; });
    }

    // -------------------------------------------------- debounced save
    let _saveTimer = null;
    function saveLayout() {
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(() => {
        try {
          const data = grids.map(g => g.save(false));
          localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {}
      }, 250);
    }

    // -------------------------------------------------- build grids
    const grids = [];
    const allGrids = [...document.querySelectorAll('.content .grid')].filter(isPanelGrid);
    const targets  = allGrids.filter(g => !allGrids.some(o => o !== g && o.contains(g)));

    targets.forEach((gridEl, gi) => {
      let g;
      try { g = transform(gridEl, gi); } catch (e) { return; }

      const grid = GridStack.init({
        column:   12,
        margin:   '8px',
        cellHeight: 'auto',
        sizeToContent: true,
        float:    false,
        animate:  true,
        handle:   '.wbt-grip, .wbt-nohead > .grid-stack-item-content',
        draggable: { cancel: 'a, button, input, select, textarea, .btn, .seg, .switch, .tac-table' },
        resizable: { handles: 'e, se' },
        columnOpts: { breakpoints: [{ w: 940, c: 1 }], layout: 'list' },
        disableOneColumnMode: false,
      }, g);

      grids.push(grid);

      // restore saved layout
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (saved && saved[gi]) grid.load(saved[gi], false);
      } catch (e) {}

      // ── event wiring ────────────────────────────────────────────────────────
      // change fires on every positional recalculation during drag — save only,
      // no chart redraws here (that's what caused the chart-redraw lag).
      grid.on('change', saveLayout);

      // live resize: RAF-throttled chart refit (max 60fps, not every GridStack tick)
      grid.on('resize', (ev, el) => refitChartRAF(el));

      // after drop/resize: refit all charts in this grid (neighboring panels may
      // have also moved), save, and notify any other layout-aware components.
      // Fires once on interaction end — NOT during drag.
      grid.on('dragstop resizestop', () => {
        refitCharts(g);
        saveLayout();
        window.dispatchEvent(new Event('resize'));
      });
    });

    if (!grids.length) return;

    function reset() {
      localStorage.removeItem(KEY);
      document.documentElement.classList.add('wbt-resetting');
      setTimeout(() => location.reload(), 60);
    }

    // mobile: lock to 1-col
    function syncMode() { const m = MOBILE(); grids.forEach(g => g.setStatic(m)); }
    syncMode();
    window.addEventListener('resize', (() => {
      let t;
      return () => { clearTimeout(t); t = setTimeout(syncMode, 200); };
    })());

    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => grids.forEach(g => g.el && refitCharts(g.el)), 300);

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
              title="Drag panels by the grip in each header; drag the bottom-right corner to resize">
          <i data-lucide="move" style="width:13px"></i> Custom layout</span>
        <button class="btn btn--icon btn--ghost" id="wbtLayoutReset" title="Reset layout">
          <i data-lucide="rotate-ccw"></i></button>`;
      bar.appendChild(wrap);
      wrap.querySelector('#wbtLayoutReset').addEventListener('click', reset);
      if (window.lucide) window.lucide.createIcons();
    }
    injectControl();

    // one-time hint toast
    try {
      if (!localStorage.getItem('wbt_layout_hinted') && window.WBT && WBT.ui && !MOBILE()) {
        WBT.ui.toast('Tip: drag panels by the ⋮⋮ grip to rearrange — resize from the corner. Layout saves automatically.', 'move');
        localStorage.setItem('wbt_layout_hinted', '1');
      }
    } catch (e) {}

    window.PortalGrid = { grids, reset, save: saveLayout };
  }
})();
