/* ============================================================================
   WBT Storefront — ffl.js  (window.WBTStore.ffl)
   FUNCTIONAL FFL finder for checkout. Firearms must ship to a licensed FFL;
   the buyer finds a local dealer here.

   Real behaviour:
   - ZIP → lat/long via Zippopotam.us (free, keyless, CORS-enabled) for ANY US ZIP,
     with a bundled California/metro fallback table so it still works offline.
   - Haversine distance to a realistic dataset of FFL dealers, sorted nearest-first.
   - Live Leaflet + OpenStreetMap map (keyless) with the buyer's ZIP + dealer pins.
   - Selecting a dealer stores it as the order's transfer destination.

   FFL dealer records below are realistic SAMPLE data for the mock-up.
   ============================================================================ */
(function () {
  const S = window.WBTStore;
  const $ = (s, r = document) => r.querySelector(s);

  // -------------------------------------------------- FFL dealer dataset (sample)
  // [name, type, street, city, ST, zip, lat, lng, feeCents, rating]
  const RAW = [
    ['Pacific Coast Arms', 'FFL Dealer', '2410 Morena Blvd', 'San Diego', 'CA', '92110', 32.7565, -117.2010, 3500, 4.8],
    ['Iron Sights Firearms', 'Gun Store', '7340 Clairemont Mesa Blvd', 'San Diego', 'CA', '92111', 32.8040, -117.1690, 4000, 4.7],
    ['Bullseye Tactical Supply', 'Gun Store + Range', '8030 Kearny Mesa Rd', 'San Diego', 'CA', '92123', 32.8330, -117.1400, 5000, 4.9],
    ['Frontier FFL Transfers', 'Transfer Specialist', '1280 Third Ave', 'Chula Vista', 'CA', '91911', 32.6100, -117.0550, 2500, 4.6],
    ['Escondido Gun Exchange', 'Gun Store', '545 N Quince St', 'Escondido', 'CA', '92025', 33.1190, -117.0860, 3500, 4.5],
    ['North County Armory', 'FFL Dealer', '3760 Mission Ave', 'Oceanside', 'CA', '92054', 33.1960, -117.3790, 4000, 4.7],
    ['Poway Weapon & Gear', 'Gun Store + Range', '13000 Gregg St', 'Poway', 'CA', '92064', 32.9620, -117.0350, 5000, 4.8],
    ['El Cajon Firearms', 'Gun Store', '425 Broadway', 'El Cajon', 'CA', '92020', 32.7940, -116.9620, 3000, 4.4],
    ['Vista Defense Co.', 'FFL Dealer', '1840 W Vista Way', 'Vista', 'CA', '92081', 33.1790, -117.2410, 3500, 4.6],
    ['Inland Empire Guns', 'Gun Store', '6700 Indiana Ave', 'Riverside', 'CA', '92506', 33.9100, -117.4050, 4000, 4.5],
    ['Temecula Tactical', 'Gun Store + Range', '27645 Jefferson Ave', 'Temecula', 'CA', '92590', 33.4930, -117.1480, 4500, 4.8],
    ['Murrieta Firearms', 'FFL Dealer', '25100 Hancock Ave', 'Murrieta', 'CA', '92562', 33.5690, -117.2140, 3500, 4.6],
    ['High Desert Armory', 'Gun Store', '15500 Bear Valley Rd', 'Victorville', 'CA', '92392', 34.5050, -117.4090, 3000, 4.3],
    ['LA Tactical Outfitters', 'Gun Store', '1230 S Flower St', 'Los Angeles', 'CA', '90015', 34.0400, -118.2670, 5500, 4.6],
    ['Harbor Arms', 'FFL Dealer', '420 W Ocean Blvd', 'Long Beach', 'CA', '90802', 33.7680, -118.1930, 4000, 4.5],
    ['Orange County Gun Works', 'Gun Store + Range', '3600 W McFadden Ave', 'Santa Ana', 'CA', '92704', 33.7260, -117.9050, 5000, 4.8],
    ['Anaheim Firearms', 'Gun Store', '1180 N Kraemer Blvd', 'Anaheim', 'CA', '92806', 33.8360, -117.8790, 4000, 4.6],
    ['Pasadena Precision', 'FFL Dealer', '88 E Colorado Blvd', 'Pasadena', 'CA', '91105', 34.1460, -118.1440, 4500, 4.7],
    ['South Bay Shooting Supply', 'Gun Store + Range', '2400 Sepulveda Blvd', 'Torrance', 'CA', '90501', 33.8350, -118.3140, 5000, 4.7],
    ['Irvine Defense', 'FFL Dealer', '17600 Gillette Ave', 'Irvine', 'CA', '92614', 33.6850, -117.8260, 4500, 4.8],
    ['Bakersfield Ballistics', 'Gun Store', '4200 Wible Rd', 'Bakersfield', 'CA', '93313', 35.3220, -119.0480, 3000, 4.4],
    ['Fresno Firearms Co.', 'Gun Store + Range', '7075 N Blackstone Ave', 'Fresno', 'CA', '93710', 36.8360, -119.7900, 3500, 4.6],
    ['Valley Tactical', 'FFL Dealer', '2540 S Mooney Blvd', 'Visalia', 'CA', '93277', 36.3000, -119.3120, 3000, 4.5],
    ['Capitol Arms', 'Gun Store', '1610 R St', 'Sacramento', 'CA', '95811', 38.5710, -121.4830, 4000, 4.6],
    ['Gold Country Guns', 'Gun Store + Range', '900 Pleasant Grove Blvd', 'Roseville', 'CA', '95678', 38.7700, -121.2720, 4500, 4.8],
    ['Sierra Tactical', 'FFL Dealer', '13405 Folsom Blvd', 'Folsom', 'CA', '95630', 38.6780, -121.1760, 3500, 4.7],
    ['Bay Area Firearms', 'Gun Store', '1745 Saratoga Ave', 'San Jose', 'CA', '95129', 37.2880, -121.9870, 5000, 4.5],
    ['Peninsula Defense', 'FFL Dealer', '60 E 3rd Ave', 'San Mateo', 'CA', '94401', 37.5660, -122.3240, 5500, 4.6],
    ['East Bay Arms', 'Gun Store + Range', '40900 Grimmer Blvd', 'Fremont', 'CA', '94538', 37.5180, -121.9610, 4500, 4.7],
    ['Tracy Gun Exchange', 'FFL Dealer', '2451 Tracy Blvd', 'Tracy', 'CA', '95376', 37.7390, -121.4250, 3000, 4.5],
    ['Desert Defense', 'Gun Store', '455 N 3rd St', 'Phoenix', 'AZ', '85004', 33.4510, -112.0730, 3500, 4.6],
    ['Silver State Firearms', 'Gun Store + Range', '4360 S Decatur Blvd', 'Las Vegas', 'NV', '89103', 36.1090, -115.2080, 4000, 4.7],
    ['Lone Star Tactical', 'FFL Dealer', '1900 Pacific Ave', 'Dallas', 'TX', '75201', 32.7870, -96.7990, 2500, 4.8],
    ['Peachtree Arms', 'Gun Store', '230 Peachtree St NW', 'Atlanta', 'GA', '30303', 33.7530, -84.3900, 3000, 4.5],
    ['Rocky Mountain FFL', 'FFL Dealer', '1601 Blake St', 'Denver', 'CO', '80202', 39.7490, -104.9990, 3000, 4.7],
    ['Cascade Firearms', 'Gun Store + Range', '2024 1st Ave', 'Seattle', 'WA', '98101', 47.6110, -122.3370, 4500, 4.6],
  ];
  const HOURS = ['Mon–Sat 9–6', 'Tue–Sun 10–7', 'Mon–Fri 10–6, Sat 9–5', 'Daily 9–8'];
  const DEALERS = RAW.map((r, i) => ({
    id: 'FFL' + (100 + i), name: r[0], type: r[1], street: r[2], city: r[3], state: r[4], zip: r[5],
    lat: r[6], lng: r[7], fee: r[8], rating: r[9], hours: HOURS[i % HOURS.length],
    preferred: i % 6 === 0,
  }));

  // -------------------------------------------------- bundled ZIP fallback (centroids)
  const ZIP_FALLBACK = {
    '92101': [32.7185, -117.1593, 'San Diego, CA'], '92110': [32.756, -117.201, 'San Diego, CA'],
    '92123': [32.833, -117.14, 'San Diego, CA'], '91911': [32.61, -117.055, 'Chula Vista, CA'],
    '92025': [33.119, -117.086, 'Escondido, CA'], '92054': [33.196, -117.379, 'Oceanside, CA'],
    '92064': [32.962, -117.035, 'Poway, CA'], '92020': [32.794, -116.962, 'El Cajon, CA'],
    '92081': [33.179, -117.241, 'Vista, CA'], '92501': [33.98, -117.375, 'Riverside, CA'],
    '92506': [33.91, -117.405, 'Riverside, CA'], '92590': [33.493, -117.148, 'Temecula, CA'],
    '92562': [33.569, -117.214, 'Murrieta, CA'], '90012': [34.061, -118.239, 'Los Angeles, CA'],
    '90015': [34.04, -118.267, 'Los Angeles, CA'], '90802': [33.768, -118.193, 'Long Beach, CA'],
    '92704': [33.726, -117.905, 'Santa Ana, CA'], '92805': [33.836, -117.911, 'Anaheim, CA'],
    '91101': [34.146, -118.144, 'Pasadena, CA'], '90501': [33.835, -118.314, 'Torrance, CA'],
    '92614': [33.685, -117.826, 'Irvine, CA'], '93301': [35.373, -119.018, 'Bakersfield, CA'],
    '93710': [36.808, -119.775, 'Fresno, CA'], '93277': [36.3, -119.312, 'Visalia, CA'],
    '95814': [38.581, -121.494, 'Sacramento, CA'], '95678': [38.77, -121.272, 'Roseville, CA'],
    '95630': [38.678, -121.176, 'Folsom, CA'], '95113': [37.335, -121.889, 'San Jose, CA'],
    '94401': [37.566, -122.324, 'San Mateo, CA'], '94538': [37.518, -121.961, 'Fremont, CA'],
    '94102': [37.779, -122.419, 'San Francisco, CA'], '94601': [37.776, -122.222, 'Oakland, CA'],
    '85004': [33.451, -112.073, 'Phoenix, AZ'], '89101': [36.171, -115.14, 'Las Vegas, NV'],
    '75201': [32.787, -96.799, 'Dallas, TX'], '30303': [33.753, -84.39, 'Atlanta, GA'],
    '80202': [39.749, -104.999, 'Denver, CO'], '98101': [47.611, -122.337, 'Seattle, WA'],
    '10001': [40.750, -73.997, 'New York, NY'], '60601': [41.885, -87.622, 'Chicago, IL'],
  };

  // -------------------------------------------------- geo helpers
  function haversine(a, b, c, d) {
    const R = 3958.8, toR = x => x * Math.PI / 180;
    const dLat = toR(c - a), dLng = toR(d - b);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
  }

  async function geocodeZip(zipRaw) {
    const zip = ('' + zipRaw).trim().slice(0, 5);
    if (!/^\d{5}$/.test(zip)) throw new Error('Enter a 5-digit ZIP code');
    // 1) live, keyless API — works for any US ZIP
    try {
      const r = await fetch('https://api.zippopotam.us/us/' + zip, { mode: 'cors' });
      if (r.ok) {
        const j = await r.json();
        const pl = j.places && j.places[0];
        if (pl) return { lat: +pl.latitude, lng: +pl.longitude, place: pl['place name'] + ', ' + pl['state abbreviation'], zip, source: 'live' };
      }
    } catch (e) { /* offline / CORS — fall through */ }
    // 2) bundled exact
    if (ZIP_FALLBACK[zip]) { const z = ZIP_FALLBACK[zip]; return { lat: z[0], lng: z[1], place: z[2], zip, source: 'local' }; }
    // 3) bundled 3-digit-prefix approximation
    const p3 = zip.slice(0, 3);
    const near = Object.entries(ZIP_FALLBACK).find(([z]) => z.slice(0, 3) === p3);
    if (near) return { lat: near[1][0], lng: near[1][1], place: near[1][2] + ' (approx.)', zip, source: 'approx' };
    throw new Error('Offline and ZIP not in the demo set — try a CA ZIP like 92101, 90012, 95814');
  }

  async function findNearest(zip, limit = 6) {
    const origin = await geocodeZip(zip);
    const results = DEALERS
      .map(d => ({ ...d, dist: haversine(origin.lat, origin.lng, d.lat, d.lng) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, limit);
    return { origin, results };
  }

  // -------------------------------------------------- selection persistence
  const SEL_KEY = 'wbt_ffl_v1';
  function getSelected() { try { return JSON.parse(localStorage.getItem(SEL_KEY)); } catch (e) { return null; } }
  function setSelected(d) { try { localStorage.setItem(SEL_KEY, JSON.stringify(d)); } catch (e) {} }

  // -------------------------------------------------- renderer
  // mount(container, { onSelect }) builds the full finder UI + map.
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
          <div class="ffl__hint" id="fflHint">Federal law requires firearms ship to a licensed FFL for pickup. Enter your ZIP to find dealers near you.</div>
          <div class="ffl__list" id="fflList"></div>
          <div id="fflSelected"></div>
        </div>
        <div id="fflMap"></div>
      </div>`;
    if (window.lucide) lucide.createIcons();

    const listEl = $('#fflList', el), hintEl = $('#fflHint', el), selEl = $('#fflSelected', el), zipEl = $('#fflZip', el);
    let map = null, markers = [], current = [];

    function initMap(lat, lng) {
      if (!window.L) { $('#fflMap', el).innerHTML = '<div style="display:grid;place-items:center;height:100%;color:var(--muted);font-size:13px;padding:20px;text-align:center">Map unavailable offline — dealer list is still live.</div>'; return; }
      if (!map) {
        map = L.map($('#fflMap', el), { zoomControl: true, attributionControl: false }).setView([lat, lng], 9);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
      } else { map.setView([lat, lng], 9); }
    }
    function clearMarkers() { markers.forEach(m => map && map.removeLayer(m)); markers = []; }
    function pin(color, label) { return L.divIcon({ className: '', html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #0a0c0b;box-shadow:0 4px 8px rgba(0,0,0,.5);display:grid;place-items:center"><span style="transform:rotate(45deg);color:#1a1208;font-family:monospace;font-weight:700;font-size:12px">${label}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 26] }); }

    function select(d) {
      setSelected(d);
      listEl.querySelectorAll('.ffl-item').forEach(n => n.classList.toggle('is-sel', n.dataset.id === d.id));
      selEl.innerHTML = `<div class="ffl__selected">
        <div class="eyebrow">Transfer Destination Selected</div>
        <b>${d.name}</b><div class="tiny muted">${d.street}, ${d.city}, ${d.state} ${d.zip}</div>
        <div class="flex items-center justify-between mt-8"><span class="tiny">Transfer fee <b style="color:var(--fde)">${S.fmt.money(d.fee)}</b></span>
        <span class="tiny mono" style="color:var(--fde)">${d.dist != null ? d.dist.toFixed(1) + ' mi' : ''}</span></div>
      </div>`;
      if (window.lucide) lucide.createIcons();
      if (map) { const mk = markers.find(m => m._fflId === d.id); if (mk) mk.openPopup(); map.setView([d.lat, d.lng], 11); }
      if (opts.onSelect) opts.onSelect(d);
    }

    function renderList(origin, results) {
      current = results;
      const sel = getSelected();
      listEl.innerHTML = results.map((d, i) => `
        <div class="ffl-item ${sel && sel.id === d.id ? 'is-sel' : ''}" data-id="${d.id}">
          <div class="ffl-item__pin">${i + 1}</div>
          <div class="ffl-item__top">
            <div><div class="ffl-item__name">${d.name}${d.preferred ? ' <span class="badge badge--feat" style="font-size:9px">WBT Partner</span>' : ''}</div>
              <div class="ffl-item__addr">${d.street}, ${d.city}, ${d.state} ${d.zip}</div></div>
            <div class="ffl-item__dist">${d.dist.toFixed(1)} mi</div>
          </div>
          <div class="ffl-item__meta">
            <span class="stars">${'★'.repeat(Math.round(d.rating))}</span><span>${d.rating}</span>
            <span>·</span><span>${d.type}</span><span>·</span><span class="ffl-item__fee">${S.fmt.money(d.fee)} transfer</span>
          </div>
        </div>`).join('');
      listEl.querySelectorAll('.ffl-item').forEach(n => n.addEventListener('click', () => {
        const d = current.find(x => x.id === n.dataset.id); if (d) select(d);
      }));

      // map
      initMap(origin.lat, origin.lng);
      if (map) {
        clearMarkers();
        const youIcon = L.divIcon({ className: '', html: `<div style="width:18px;height:18px;border-radius:50%;background:var(--od-bright,#8aa15c);border:3px solid #0a0c0b;box-shadow:0 0 0 4px rgba(138,161,92,.3)"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
        const you = L.marker([origin.lat, origin.lng], { icon: youIcon }).addTo(map).bindPopup('<b>You</b><br>' + origin.place);
        markers.push(you);
        const group = [[origin.lat, origin.lng]];
        results.forEach((d, i) => {
          const m = L.marker([d.lat, d.lng], { icon: pin('#c2a17b', i + 1) }).addTo(map)
            .bindPopup(`<b>${d.name}</b><br>${d.city}, ${d.state}<br>${d.dist.toFixed(1)} mi · ${S.fmt.money(d.fee)}`);
          m._fflId = d.id; m.on('click', () => select(d)); markers.push(m); group.push([d.lat, d.lng]);
        });
        try { map.fitBounds(group, { padding: [40, 40], maxZoom: 11 }); } catch (e) {}
        setTimeout(() => map.invalidateSize(), 80);
      }
    }

    async function run() {
      const zip = zipEl.value;
      hintEl.innerHTML = '<span class="mono" style="color:var(--fde)">⟳ Locating dealers…</span>';
      listEl.innerHTML = '';
      try {
        const { origin, results } = await findNearest(zip, 6);
        hintEl.innerHTML = `Showing <b>${results.length}</b> FFL dealers near <b>${origin.place}</b>` +
          (origin.source === 'live' ? ' · <span class="mono" style="color:var(--od-bright)">live ZIP lookup</span>' : ' · <span class="mono" style="color:var(--muted)">offline mode</span>');
        renderList(origin, results);
      } catch (e) {
        hintEl.innerHTML = `<span style="color:var(--danger)">${e.message}</span>`;
      }
      if (window.lucide) lucide.createIcons();
    }

    $('#fflGo', el).addEventListener('click', run);
    zipEl.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    zipEl.addEventListener('input', () => { zipEl.value = zipEl.value.replace(/\D/g, ''); });

    // preselect from a prior session
    const prior = getSelected();
    if (prior) { selEl.innerHTML = ''; }
    if (opts.zip) { zipEl.value = opts.zip; run(); }

    return { run };
  }

  S.ffl = { DEALERS, geocodeZip, findNearest, haversine, getSelected, setSelected, mount };
})();
