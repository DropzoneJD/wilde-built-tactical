# ROADMAP — Wilde Built Tactical

Last updated: 2026-07-09.

## Done

- All 12 owner/staff command-center modules built (see README module table), each matching
  `BUILD_SPEC.md`'s page contract (design system reuse, `window.WBT` data, pseudo-functional
  interactions, zero console errors).
- Central mobile hardening across the design system, shell, and every page.
- Owner/FFL-holder identity set to Bryan Howes (was Ray Calhoun, before that Cole Wilde).
- Customer storefront (`/store/`) — home, shop, product, cart, checkout — sharing the same
  mock catalog as the Armory.
- Functional FFL finder at checkout: real ATF CA dealer dataset (2,317 dealers), ZIP or
  geolocation search, haversine distance sort, Leaflet/OSM map.
- Back-in-stock alert flow (grid, product page, modal), persisted in localStorage.
- Drag-and-drop / resizable / auto-reflowing dashboard grid (GridStack-based), per-page
  layout persistence, since tuned for perf (v2 in `933eb32`).

## Not started

- **Production backend port.** README describes the intended path: same UI, PHP + MySQL
  backend, `data.js` replaced by inventory/orders/compliance endpoints, cart-recovery engine
  on a cron, DROS/bound-book records in real tables. No work has started on this — it's a
  documented intention, not a scoped task.
- No other open feature requests or known bugs as of this session.

## Notes for whoever picks this up

- Treat `BUILD_SPEC.md` as the contract for any new page — reuse `tactical.css` classes,
  drive data from `window.WBT`, keep every interactive element genuinely functional.
- If adding a new owner/staff page, remember to register its panel grid correctly with
  `portal-grid.js` (see HANDOFF.md sharp edges) so drag/resize behaves.
