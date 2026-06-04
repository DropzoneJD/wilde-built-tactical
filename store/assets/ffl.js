/* ============================================================================
   WBT Storefront — ffl.js  (window.WBTStore.ffl)
   FUNCTIONAL FFL finder for checkout. Firearms must ship to a licensed FFL.

   Real data:
   - Dealers: REAL ATF "Listing of Federal Firearms Licensees" (2,300+ California
     dealers), geocoded by premises ZIP, fetched at runtime from ffl-data.json
     (self-hosted because atf.gov blocks cross-origin requests). Falls back to a
     built-in sample list if the file can't be loaded (offline).
   - Buyer location: ZIP -> lat/long via Zippopotam.us (keyless, CORS) with a
     bundled fallback, OR the browser Geolocation API ("Use my location").
   - Haversine distance, sorted nearest-first, on a live Leaflet/OpenStreetMap map.
   Transfer fees aren't in ATF data, so they're shown as a per-dealer ESTIMATE.
   ============================================================================ */
(function () {
  const S = window.WBTStore;
  const $ = (s, r = document) => r.querySelector(s);

  // data file lives next to this script
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const DATA_URL = SRC ? SRC.replace(/ffl\.js(\?.*)?$/, 'ffl-data.json') : 'assets/ffl-data.json';

  // -------------------------------------------------- offline fallback dealers
  const FALLBACK = [
    ['Pacific Coast Arms', 'Dealer', '2410 Morena Blvd', 'San Diego', 'CA', '92110', 32.7565, -117.2010],
    ['Iron Sights Firearms', 'Dealer', '7340 Clairemont Mesa Blvd', 'San Diego', 'CA', '92111', 32.8040, -117.1690],
    ['Bullseye Tactical Supply', 'Dealer', '8030 Kearny Mesa Rd', 'San Diego', 'CA', '92123', 32.8330, -117.1400],
    ['Escondido Gun Exchange', 'Dealer', '545 N Quince St', 'Escondido', 'CA', '92025', 33.1190, -117.0860],
    ['North County Armory', 'Dealer', '3760 Mission Ave', 'Oceanside', 'CA', '92054', 33.1960, -117.3790],
    ['LA Tactical Outfitters', 'Dealer', '1230 S Flower St', 'Los Angeles', 'CA', '90015', 34.0400, -118.2670],
    ['Orange County Gun Works', 'Dealer', '3600 W McFadden Ave', 'Santa Ana', 'CA', '92704', 33.7260, -117.9050],
    ['Capitol Arms', 'Dealer', '1610 R St', 'Sacramento', 'CA', '95811', 38.5710, -121.4830],
    ['Bay Area Firearms', 'Dealer', '1745 Saratoga Ave', 'San Jose', 'CA', '95129', 37.3160, -121.9180],
  ].map((r, i) => ({ lic: 'SMPL-' + i, name: r[0], type: r[1], street: r[2], city: r[3], state: r[4], zip: r[5], lat: r[6], lng: r[7] }));

  // -------------------------------------------------- bundled ZIP fallback (centroids)
  const ZIP_FALLBACK = {
    '92101': [32.7185, -117.1593, 'San Diego, CA'], '92110': [32.756, -117.201, 'San Diego, CA'],
    '91911': [32.61, -117.055, 'Chula Vista, CA'], '92025': [33.119, -117.086, 'Escondido, CA'],
    '92054': [33.196, -117.379, 'Oceanside, CA'], '92501': [33.98, -117.375, 'Riverside, CA'],
    '92590': [33.493, -117.148, 'Temecula, CA'], '90012': [34.061, -118.239, 'Los Angeles, CA'],
    '90802': [33.768, -118.193, 'Long Beach, CA'], '92704': [33.726, -117.905, 'Santa Ana, CA'],
    '92805': [33.836, -117.911, 'Anaheim, CA'], '92614': [33.685, -117.826, 'Irvine, CA'],
    '93301': [35.373, -119.018, 'Bakersfield, CA'], '93710': [36.808, -119.775, 'Fresno, CA'],
    '95814': [38.581, -121.494, 'Sacramento, CA'], '95113': [37.335, -121.889, 'San Jose, CA'],
    '94102': [37.779, -122.419, 'San Francisco, CA'], '94601': [37.776, -122.222, 'Oakland, CA'],
    '85004': [33.451, -112.073, 'Phoenix, AZ'], '89101': [36.171, -115.14, 'Las Vegas, NV'],
  };

  // -------------------------------------------------- helpers
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }
  function estFee(d) { return 2500 + (hash(d.lic || d.name) % 6) * 500; }   // est $25–$50 transfer
  function enrich(d) { return Object.assign({}, d, { fee: d.fee != null ? d.fee : estFee(d), hours: d.hours || 'Call to confirm hours' }); }

  function haversine(a, b, c, d) {
    const R = 3958.8, toR = x => x * Math.PI / 180;
    const dLat = toR(c - a), dLng = toR(d - b);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
  }

  // -------------------------------------------------- dataset (lazy, cached)
  let DATA = null, SOURCE = '', loadP = null;
  function ensureData() {
    if (DATA) return Promise.resolve(DATA);
    if (loadP) return loadP;
    loadP = fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error('no data'); return r.json(); })
      .then(j => { DATA = (j.dealers || []).map(enrich); SOURCE = j.source || 'ATF FFL listing'; return DATA; })
      .catch(() => { DATA = FALLBACK.map(enrich); SOURCE = 'built-in sample list (live ATF file unavailable)'; return DATA; });
    return loadP;
  }
  function dataReady() { return !!DATA; }

  // -------------------------------------------------- geocode (ZIP)
  async function geocodeZip(zipRaw) {
    const zip = ('' + zipRaw).trim().slice(0, 5);
    if (!/^\d{5}$/.test(zip)) throw new Error('Enter a 5-digit ZIP code');
    try {
      const r = await fetch('https://api.zippopotam.us/us/' + zip, { mode: 'cors' });
      if (r.ok) { const j = await r.json(); const pl = j.places && j.places[0];
        if (pl) return { lat: +pl.latitude, lng: +pl.longitude, place: pl['place name'] + ', ' + pl['state abbreviation'], zip, source: 'live' }; }
    } catch (e) { /* offline */ }
    if (ZIP_FALLBACK[zip]) { const z = ZIP_FALLBACK[zip]; return { lat: z[0], lng: z[1], place: z[2], zip, source: 'local' }; }
    const p3 = zip.slice(0, 3), near = Object.entries(ZIP_FALLBACK).find(([z]) => z.slice(0, 3) === p3);
    if (near) return { lat: near[1][0], lng: near[1][1], place: near[1][2] + ' (approx.)', zip, source: 'approx' };
    throw new Error('ZIP not recognized offline — try a CA ZIP like 92101, 90012, 95814');
  }

  function rank(origin, data, limit) {
    const results = data.map(d => Object.assign({}, d, { dist: haversine(origin.lat, origin.lng, d.lat, d.lng) }))
      .sort((a, b) => a.dist - b.dist).slice(0, limit);
    return { origin, results };
  }
  async function findNearest(zip, limit = 8) { const origin = await geocodeZip(zip); return rank(origin, await ensureData(), limit); }
  async function findNearestByCoords(lat, lng, limit = 8) { return rank({ lat, lng, place: 'your location', source: 'geo' }, await ensureData(), limit); }

  // -------------------------------------------------- selection persistence
  const SEL_KEY = 'wbt_ffl_v1';
  function getSelected() { try { return JSON.parse(localStorage.getItem(SEL_KEY)); } catch (e) { return null; } }
  function setSelected(d) { try { localStorage.setItem(SEL_KEY, d ? JSON.stringify(d) : ''); } catch (e) {} }

  // -------------------------------------------------- renderer
  function mount(container, opts = {}) {
    const el = typeof container === 'string' ? $(container) : container;
    if (!el) return;
    el.innerHTML = `
      <div class="ffl">
        <div class="ffl__panel">
          <div class="eyebrow mb-8">Find Your FFL</div>
          <div class="ffl__searchrow">
            <input class="input" id="fflZip" inputmode="numeric" maxlength="5" placeholder="Enter ZIP code (e.g. 92101)">
            <button class="btn btn--primary" id="fflGo"><i data-lucide="search"></i> Search</button>
          </div>
          <button class="btn btn--ghost btn--sm" id="fflGeo" style="margin-bottom:10px"><i data-lucide="locate-fixed"></i> Use my location</button>
          <div class="ffl__hint" id="fflHint">Federal law requires firearms ship to a licensed FFL for pickup. Search real ATF-licensed dealers near you.</div>
          <div class="ffl__list" id="fflList"></div>
          <div id="fflSelected"></div>
          <div class="ffl__src" id="fflSrc"></div>
        </div>
        <div id="fflMap"></div>
      </div>`;
    if (window.lucide) lucide.createIcons();

    const listEl = $('#fflList', el), hintEl = $('#fflHint', el), selEl = $('#fflSelected', el),
      zipEl = $('#fflZip', el), srcEl = $('#fflSrc', el);
    let map = null, markers = [], current = [];

    function initMap(lat, lng) {
      if (!window.L) { $('#fflMap', el).innerHTML = '<div style="display:grid;place-items:center;height:100%;color:var(--muted);font-size:13px;padding:20px;text-align:center">Map unavailable offline — dealer list is still live.</div>'; return; }
      if (!map) {
        map = L.map($('#fflMap', el), { zoomControl: true, attributionControl: false }).setView([lat, lng], 10);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
      } else map.setView([lat, lng], 10);
    }
    function clearMarkers() { markers.forEach(m => map && map.removeLayer(m)); markers = []; }
    function pin(c, label) { return L.divIcon({ className: '', html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${c};border:2px solid #0a0c0b;box-shadow:0 4px 8px rgba(0,0,0,.5);display:grid;place-items:center"><span style="transform:rotate(45deg);color:#1a1208;font-family:monospace;font-weight:700;font-size:12px">${label}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 26] }); }

    function select(d) {
      setSelected(d);
      listEl.querySelectorAll('.ffl-item').forEach(n => n.classList.toggle('is-sel', n.dataset.id === (d.lic || d.id)));
      selEl.innerHTML = `<div class="ffl__selected">
        <div class="eyebrow">Transfer Destination Selected</div>
        <b>${d.name}</b><div class="tiny muted">${d.street}, ${d.city}, ${d.state} ${d.zip}</div>
        <div class="flex items-center justify-between mt-8"><span class="tiny">Est. transfer fee <b style="color:var(--fde)">${S.fmt.money(d.fee)}</b></span>
        <span class="tiny mono" style="color:var(--fde)">${d.dist != null ? d.dist.toFixed(1) + ' mi' : ''}</span></div>
        ${d.phone ? `<div class="tiny muted mt-8"><i data-lucide="phone" style="width:12px;vertical-align:-2px"></i> ${fmtPhone(d.phone)}</div>` : ''}
      </div>`;
      if (window.lucide) lucide.createIcons();
      if (map) { const mk = markers.find(m => m._fflId === (d.lic || d.id)); if (mk) mk.openPopup(); map.setView([d.lat, d.lng], 12); }
      if (opts.onSelect) opts.onSelect(d);
    }

    function renderList(origin, results) {
      current = results;
      const sel = getSelected();
      listEl.innerHTML = results.map((d, i) => `
        <div class="ffl-item ${sel && (sel.lic || sel.id) === (d.lic || d.id) ? 'is-sel' : ''}" data-id="${d.lic || d.id}">
          <div class="ffl-item__pin">${i + 1}</div>
          <div class="ffl-item__top">
            <div><div class="ffl-item__name">${d.name}</div>
              <div class="ffl-item__addr">${d.street}, ${d.city}, ${d.state} ${d.zip}</div></div>
            <div class="ffl-item__dist">${d.dist.toFixed(1)} mi</div>
          </div>
          <div class="ffl-item__meta">
            <span class="badge" style="font-size:9px;padding:2px 6px">${d.type}</span>
            <span class="ffl-item__fee">~${S.fmt.money(d.fee)} transfer</span>
            ${d.lic && !/^SMPL/.test(d.lic) ? `<span class="mono faint" style="font-size:10px">FFL ${d.lic}</span>` : ''}
          </div>
        </div>`).join('');
      listEl.querySelectorAll('.ffl-item').forEach(n => n.addEventListener('click', () => { const d = current.find(x => (x.lic || x.id) === n.dataset.id); if (d) select(d); }));
      srcEl.innerHTML = `<i data-lucide="database" style="width:11px;vertical-align:-1px"></i> Source: ${SOURCE}`;

      initMap(origin.lat, origin.lng);
      if (map) {
        clearMarkers();
        const youIcon = L.divIcon({ className: '', html: `<div style="width:18px;height:18px;border-radius:50%;background:#8aa15c;border:3px solid #0a0c0b;box-shadow:0 0 0 4px rgba(138,161,92,.3)"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
        markers.push(L.marker([origin.lat, origin.lng], { icon: youIcon }).addTo(map).bindPopup('<b>You</b><br>' + origin.place));
        const group = [[origin.lat, origin.lng]];
        results.forEach((d, i) => {
          const m = L.marker([d.lat, d.lng], { icon: pin('#c2a17b', i + 1) }).addTo(map)
            .bindPopup(`<b>${d.name}</b><br>${d.street}<br>${d.city}, ${d.state} · ${d.dist.toFixed(1)} mi`);
          m._fflId = d.lic || d.id; m.on('click', () => select(d)); markers.push(m); group.push([d.lat, d.lng]);
        });
        try { map.fitBounds(group, { padding: [40, 40], maxZoom: 12 }); } catch (e) {}
        setTimeout(() => map.invalidateSize(), 80);
      }
      if (window.lucide) lucide.createIcons();
    }

    async function runOrigin(originPromise, locating) {
      hintEl.innerHTML = '<span class="mono" style="color:var(--fde)">⟳ ' + (locating || 'Locating dealers…') + '</span>';
      listEl.innerHTML = '';
      try {
        const origin = await originPromise;
        const data = await ensureData();
        const { results } = rank(origin, data, 8);
        hintEl.innerHTML = `Showing <b>${results.length}</b> ATF-licensed FFL dealers near <b>${origin.place}</b>` +
          (origin.source === 'live' ? ' · <span class="mono" style="color:var(--od-bright)">live ZIP lookup</span>'
            : origin.source === 'geo' ? ' · <span class="mono" style="color:var(--od-bright)">your GPS location</span>' : '');
        renderList(origin, results);
      } catch (e) { hintEl.innerHTML = `<span style="color:var(--danger)">${e.message || e}</span>`; }
      if (window.lucide) lucide.createIcons();
    }

    function runZip() { const zip = zipEl.value; runOrigin(geocodeZip(zip)); }
    function geolocate() {
      if (!navigator.geolocation) { hintEl.innerHTML = '<span style="color:var(--amber)">Geolocation isn\'t supported — enter a ZIP.</span>'; return; }
      runOrigin(new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(
          p => res({ lat: p.coords.latitude, lng: p.coords.longitude, place: 'your location', source: 'geo' }),
          err => rej(new Error(err.code === 1 ? 'Location permission denied — enter a ZIP instead.' : 'Couldn\'t get your location — enter a ZIP instead.')),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
      }), 'Locating you…');
    }

    $('#fflGo', el).addEventListener('click', runZip);
    $('#fflGeo', el).addEventListener('click', geolocate);
    zipEl.addEventListener('keydown', e => { if (e.key === 'Enter') runZip(); });
    zipEl.addEventListener('input', () => { zipEl.value = zipEl.value.replace(/\D/g, ''); });
    if (opts.zip) { zipEl.value = opts.zip; runZip(); }
    return { runZip, geolocate };
  }

  function fmtPhone(p) { p = ('' + p).replace(/\D/g, ''); return p.length === 10 ? `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}` : p; }

  S.ffl = { ensureData, dataReady, geocodeZip, findNearest, findNearestByCoords, haversine, getSelected, setSelected, mount, fmtPhone, DATA_URL };
})();
