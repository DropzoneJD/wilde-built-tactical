/* ============================================================================
   WBT Storefront — shop.js
   Catalog / browse page. Client-side filtering, sorting, pagination.
   URL params: ?cat=<key>  ?sale=1  ?q=<text>  ?sort=<key>  ?fav=1
   ============================================================================ */
(function () {
  const S = window.WBTStore, ui = S.ui, F = S.fmt;

  // ------------------------------------------------------------------ state
  const state = {
    cat: '',
    brands: new Set(),
    price: '',          // bucket key
    ca: '',
    inStock: false,
    onSale: false,
    fav: false,
    sort: 'featured',
    q: '',
    shown: 12,
  };

  const PRICE_BUCKETS = [
    { key: '', label: 'Any price' },
    { key: 'u200', label: 'Under $200', min: 0, max: 20000 },
    { key: 'u500', label: '$200 – $500', min: 20000, max: 50000 },
    { key: 'u1k', label: '$500 – $1,000', min: 50000, max: 100000 },
    { key: 'u2k', label: '$1,000 – $2,000', min: 100000, max: 200000 },
    { key: 'o2k', label: 'Over $2,000', min: 200000, max: Infinity },
  ];

  const PAGE = 12;

  // ------------------------------------------------------------------ URL init
  function initFromURL() {
    const p = new URLSearchParams(location.search);
    if (p.get('cat')) state.cat = p.get('cat');
    if (p.get('sale') === '1') state.onSale = true;
    if (p.get('fav') === '1') state.fav = true;
    if (p.get('q')) state.q = p.get('q');
    const sortMap = { new: 'new', 'price-asc': 'price-asc', 'price-desc': 'price-desc', rating: 'rating' };
    if (sortMap[p.get('sort')]) state.sort = sortMap[p.get('sort')];
  }

  // ------------------------------------------------------------------ filtering
  function applyFilters() {
    let pool = S.catalog;

    if (state.q) {
      const q = state.q.toLowerCase();
      pool = pool.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.catLabel.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    if (state.cat) pool = pool.filter(p => p.cat === state.cat);
    if (state.brands.size) pool = pool.filter(p => state.brands.has(p.brand));
    if (state.price) {
      const b = PRICE_BUCKETS.find(b => b.key === state.price);
      if (b && b.key) pool = pool.filter(p => p.price >= b.min && p.price < b.max);
    }
    if (state.ca) pool = pool.filter(p => p.ca === state.ca);
    if (state.inStock) pool = pool.filter(p => p.status !== 'out');
    if (state.onSale) pool = pool.filter(p => p.onSale);
    if (state.fav) pool = pool.filter(p => S.fav.has(p.id));

    return sort(pool);
  }

  function sort(pool) {
    const s = state.sort;
    if (s === 'new') return [...pool].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    if (s === 'price-asc') return [...pool].sort((a, b) => a.price - b.price);
    if (s === 'price-desc') return [...pool].sort((a, b) => b.price - a.price);
    if (s === 'rating') return [...pool].sort((a, b) => b.rating - a.rating);
    // featured: new → on sale → rest, then by catalog order
    return [...pool].sort((a, b) => {
      const scoreA = (a.isNew ? 2 : 0) + (a.onSale ? 1 : 0);
      const scoreB = (b.isNew ? 2 : 0) + (b.onSale ? 1 : 0);
      return scoreB - scoreA;
    });
  }

  // ------------------------------------------------------------------ render
  function render() {
    const results = applyFilters();
    const total = results.length;
    const slice = results.slice(0, state.shown);

    // count label
    const cEl = document.getElementById('resultCount');
    if (cEl) {
      const catName = state.cat ? S.CATEGORIES.find(c => c.key === state.cat)?.label || 'Products' : 'Products';
      cEl.innerHTML = `<b>${total.toLocaleString()}</b> ${catName}${state.q ? ` for "<em>${state.q}</em>"` : ''}`;
    }

    // grid
    const grid = document.getElementById('shopGrid');
    const empty = document.getElementById('emptyState');
    const lmWrap = document.getElementById('loadMoreWrap');

    if (total === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hide');
      if (lmWrap) lmWrap.classList.add('hide');
      ui.icons();
      return;
    }
    empty.classList.add('hide');
    grid.innerHTML = slice.map(p => ui.productCard(p)).join('');

    // load more
    if (lmWrap) {
      const hasMore = total > state.shown;
      lmWrap.classList.toggle('hide', !hasMore);
      const lmBtn = document.getElementById('loadMoreBtn');
      if (lmBtn) lmBtn.textContent = `Load More (${total - state.shown} remaining)`;
    }

    ui.icons();
    updateActiveChips(results);
  }

  // ------------------------------------------------------------------ page head
  function updateHead() {
    const ey = document.getElementById('shopEyebrow');
    const h1 = document.getElementById('shopTitle');
    const crumb = document.getElementById('shopCrumb');

    if (state.fav) {
      if (ey) ey.textContent = 'Your Saved Items';
      if (h1) h1.textContent = 'Favorites';
      if (crumb) crumb.innerHTML = `<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / Favorites`;
      return;
    }
    if (state.q) {
      if (ey) ey.textContent = 'Search Results';
      if (h1) h1.textContent = `"${state.q}"`;
      if (crumb) crumb.innerHTML = `<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / Search`;
      return;
    }
    if (state.onSale && !state.cat) {
      if (ey) ey.textContent = 'Limited Time Deals';
      if (h1) h1.textContent = 'On Sale Now';
      if (crumb) crumb.innerHTML = `<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / Sale`;
      return;
    }
    if (state.cat) {
      const cat = S.CATEGORIES.find(c => c.key === state.cat);
      if (cat) {
        if (ey) ey.textContent = 'Browse';
        if (h1) h1.textContent = cat.label;
        if (crumb) crumb.innerHTML = `<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / ${cat.label}`;
        return;
      }
    }
    if (ey) ey.textContent = 'Full Catalog';
    if (h1) h1.textContent = 'All Products';
    if (crumb) crumb.innerHTML = `<a href="index.html">Home</a> / Shop`;
  }

  // ------------------------------------------------------------------ active filter chips
  function updateActiveChips() {
    const el = document.getElementById('activeFilters');
    if (!el) return;
    const chips = [];

    if (state.cat) {
      const cat = S.CATEGORIES.find(c => c.key === state.cat);
      chips.push({ label: cat ? cat.label : state.cat, clear: () => { state.cat = ''; } });
    }
    state.brands.forEach(b => {
      chips.push({ label: b, clear: () => { state.brands.delete(b); } });
    });
    if (state.price) {
      const b = PRICE_BUCKETS.find(b => b.key === state.price);
      chips.push({ label: b ? b.label : state.price, clear: () => { state.price = ''; } });
    }
    if (state.ca === 'roster') chips.push({ label: 'CA Roster', clear: () => { state.ca = ''; } });
    if (state.ca === 'featureless') chips.push({ label: 'Featureless', clear: () => { state.ca = ''; } });
    if (state.inStock) chips.push({ label: 'In Stock', clear: () => { state.inStock = false; } });
    if (state.onSale) chips.push({ label: 'On Sale', clear: () => { state.onSale = false; } });
    if (state.fav) chips.push({ label: 'Saved', clear: () => { state.fav = false; } });
    if (state.q) chips.push({ label: `"${state.q}"`, clear: () => { state.q = ''; } });

    el.innerHTML = chips.map((c, i) =>
      `<button class="filter-chip" data-chip="${i}"><span>${c.label}</span><i data-lucide="x"></i></button>`
    ).join('');

    // wire chip clicks
    el.querySelectorAll('[data-chip]').forEach(btn => {
      btn.addEventListener('click', () => {
        chips[+btn.dataset.chip].clear();
        state.shown = PAGE;
        syncControls();
        updateHead();
        render();
      });
    });
    ui.icons();
  }

  // ------------------------------------------------------------------ sidebar build
  function buildSidebar() {
    // Category list
    const catList = document.getElementById('catFilterList');
    if (catList) {
      catList.innerHTML = S.CATEGORIES.map(c => {
        const cnt = S.catalog.filter(p => p.cat === c.key).length;
        return `<div class="cat-filter-item" data-cat="${c.key}">
          <span class="cat-label"><i data-lucide="${c.icon}"></i>${c.label}</span>
          <span class="cat-count">${cnt}</span>
        </div>`;
      }).join('');
    }
    const allCount = document.getElementById('catCount-all');
    if (allCount) allCount.textContent = S.catalog.length;

    // Brand checkboxes
    const brands = [...new Set(S.catalog.map(p => p.brand))].sort();
    const brandList = document.getElementById('brandList');
    if (brandList) {
      brandList.innerHTML = brands.map(b => {
        const cnt = S.catalog.filter(p => p.brand === b).length;
        return `<label class="brand-check">
          <input type="checkbox" data-brand="${b}" ${state.brands.has(b) ? 'checked' : ''}>
          <span>${b} <span class="cat-count">(${cnt})</span></span>
        </label>`;
      }).join('');
    }

    // Price buckets
    const priceBuckets = document.getElementById('priceBuckets');
    if (priceBuckets) {
      priceBuckets.innerHTML = PRICE_BUCKETS.map(b =>
        `<div class="price-bucket ${state.price === b.key ? 'is-active' : ''}" data-price="${b.key}">
          <span>${b.label}</span>
        </div>`
      ).join('');
    }

    ui.icons();
  }

  // ------------------------------------------------------------------ sync controls to state
  function syncControls() {
    // categories
    document.querySelectorAll('[data-cat]').forEach(el => {
      el.classList.toggle('is-active', el.dataset.cat === state.cat);
    });
    // brands
    document.querySelectorAll('[data-brand]').forEach(cb => {
      cb.checked = state.brands.has(cb.dataset.brand);
    });
    // price
    document.querySelectorAll('[data-price]').forEach(el => {
      el.classList.toggle('is-active', el.dataset.price === state.price);
    });
    // ca
    document.querySelectorAll('[data-ca]').forEach(el => {
      el.classList.toggle('is-active', el.dataset.ca === state.ca);
    });
    // toggles
    const ts = document.getElementById('toggleSale');
    const ti = document.getElementById('toggleInStock');
    const tf = document.getElementById('toggleFav');
    if (ts) ts.checked = state.onSale;
    if (ti) ti.checked = state.inStock;
    if (tf) tf.checked = state.fav;
    // sort
    const ss = document.getElementById('sortSelect');
    if (ss) ss.value = state.sort;
  }

  // ------------------------------------------------------------------ wire sidebar events
  function wireSidebar() {
    // collapse sections
    document.querySelectorAll('.filter-section__hd').forEach(hd => {
      hd.addEventListener('click', () => {
        const sec = document.getElementById(hd.dataset.sec);
        if (sec) sec.classList.toggle('is-collapsed');
        ui.icons();
      });
    });

    // category items
    document.addEventListener('click', e => {
      const ci = e.target.closest('[data-cat]');
      if (ci && ci.closest('#shopGrid') === null && !ci.closest('.cat-tile')) {
        state.cat = ci.dataset.cat;
        state.shown = PAGE;
        syncControls();
        updateHead();
        render();
      }
    });

    // brand checkboxes
    const brandList = document.getElementById('brandList');
    if (brandList) {
      brandList.addEventListener('change', e => {
        const cb = e.target.closest('[data-brand]');
        if (!cb) return;
        if (cb.checked) state.brands.add(cb.dataset.brand);
        else state.brands.delete(cb.dataset.brand);
        state.shown = PAGE;
        render();
      });
    }

    // price buckets
    const priceBuckets = document.getElementById('priceBuckets');
    if (priceBuckets) {
      priceBuckets.addEventListener('click', e => {
        const b = e.target.closest('[data-price]');
        if (!b) return;
        state.price = state.price === b.dataset.price ? '' : b.dataset.price;
        state.shown = PAGE;
        syncControls();
        render();
      });
    }

    // CA filters
    const caFilters = document.getElementById('caFilters');
    if (caFilters) {
      caFilters.addEventListener('click', e => {
        const b = e.target.closest('[data-ca]');
        if (!b) return;
        state.ca = state.ca === b.dataset.ca ? '' : b.dataset.ca;
        state.shown = PAGE;
        syncControls();
        render();
      });
    }

    // toggles
    document.getElementById('toggleInStock')?.addEventListener('change', e => { state.inStock = e.target.checked; state.shown = PAGE; render(); });
    document.getElementById('toggleSale')?.addEventListener('change', e => { state.onSale = e.target.checked; state.shown = PAGE; updateHead(); render(); });
    document.getElementById('toggleFav')?.addEventListener('change', e => { state.fav = e.target.checked; state.shown = PAGE; updateHead(); render(); });

    // sort
    document.getElementById('sortSelect')?.addEventListener('change', e => { state.sort = e.target.value; render(); });

    // load more
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => { state.shown += PAGE; render(); });

    // clear all
    document.getElementById('clearFilters')?.addEventListener('click', clearAll);
    document.getElementById('emptyReset')?.addEventListener('click', clearAll);

    // mobile sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      const inner = document.getElementById('sidebarInner');
      if (!inner) return;
      const isOpen = inner.classList.toggle('is-open');
      const btn = document.getElementById('sidebarToggle');
      if (btn) btn.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'sliders-horizontal'}"></i> ${isOpen ? 'Hide Filters' : 'Show Filters'}`;
      ui.icons();
    });
  }

  function clearAll() {
    state.cat = '';
    state.brands.clear();
    state.price = '';
    state.ca = '';
    state.inStock = false;
    state.onSale = false;
    state.fav = false;
    state.q = '';
    state.shown = PAGE;
    syncControls();
    updateHead();
    render();
  }

  // ------------------------------------------------------------------ init
  function init() {
    initFromURL();
    buildSidebar();
    syncControls();
    updateHead();
    wireSidebar();
    render();

    // populate header search with existing query
    const hs = document.getElementById('hSearch');
    if (hs && state.q) hs.value = state.q;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
