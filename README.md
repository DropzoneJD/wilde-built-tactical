<div align="center">

# ◎ WILDE BUILT TACTICAL — Command Center

**Owner & staff operations console for a California firearms retailer.**
Inventory control · DROS compliance · omnichannel sales · automated cart recovery · demand forecasting.

`California Legal Firepower — Under Control.`

![status](https://img.shields.io/badge/build-mock--up-c2a17b?style=flat-square)
![stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20vanilla%20JS-6b7d4a?style=flat-square)
![charts](https://img.shields.io/badge/charts-Chart.js-ffb43a?style=flat-square)
![theme](https://img.shields.io/badge/theme-tactical%20HUD-8694a1?style=flat-square)

</div>

---

## What this is

A **pseudo-functional, zero-build mock-up** of a back-office command center for **Wilde Built Tactical**
(WBT Guns) — a brick-and-mortar **and** online California gun store. It mirrors the architecture of a
production owner/staff analytics suite, re-shaped for firearms retail: serialized inventory, ATF/CA-DOJ
compliance, omnichannel orders, and revenue-driving marketing automation.

It runs entirely in the browser — **no backend, no database, no build step**. All data is realistic mock
data in [`assets/js/data.js`](assets/js/data.js), seeded so it's stable across reloads. Every screen is
interactive: filters filter, tabs switch, modals open, the recovery engine advances, the accent color
re-skins the whole UI.

> **Aesthetic:** military / tactical "armory terminal" HUD — gunmetal black, **coyote tan (FDE)**, olive
> drab, hi-vis amber. Built to feel like a Bloomberg terminal that went through SERE school.

## Modules

| # | Module | What it does |
|---|--------|--------------|
| ◎ | **Command Center** | Live KPI overview — revenue (in-store vs online), channel mix, category breakdown, AI daily briefing, restock alerts, live order feed, compliance + cart snapshots. |
| ▣ | **The Armory** | Serialized + non-serialized inventory control. Live search/category/status filtering, stock-health meters, reorder queue, per-product detail, CA-roster & featureless flags. |
| ▦ | **Sales & Orders** | Omnichannel order pipeline (online / in-store / phone), order detail with fulfillment timeline, DROS-hold routing, status funnel. |
| ⛨ | **CA Compliance Center** | The differentiator. **10-day DROS clock**, CA DOJ **roster check**, **featureless** rifle compliance, and an **A&D bound book** (ATF Acquisition & Disposition ledger). |
| ⊞ | **Cart Recovery** | Automated abandoned-cart win-back. A 4-stage discount ladder (reminder → 5% → 10% → 15%), per-cart recovery timelines, and editable automation settings. |
| ◷ | **Promotions** | Promo codes, BOGO/bundles, usage caps, scheduled doorbusters, performance by code. |
| ➤ | **Marketing Ops** | Campaigns + automations (cart recovery, win-back, back-in-stock, birthday), broadcast composer, channel performance, engagement funnel. |
| ⦿ | **Customer Intel** | CRM with segments (VIP / Regular / New / Lapsed), lifetime value, loyalty tiers (Recruit → Elite), customer profiles. |
| ⟁ | **Forecast Intelligence** | Demand signals + restock recommendations, days-of-cover risk, projected demand chart, and a LightGBM vs Prophet vs blend model bench. |
| ▤ | **Reports** | Analytics deep-dive — revenue trend, channel/category/location mix, margin analysis, P&L summary, configurable report builder. |
| ⛊ | **Staff & Range** | Team roster, on-shift status, sales leaderboard, weekly schedule, certifications tracker (DROS cert, FFL, armorer, range safety). |
| ⚙ | **Settings** | Store + FFL config, notifications, role matrix, integrations, and a **live accent-color theming** showcase. |

## 🛒 Customer Storefront (`/store/`)

A full **customer-facing e-commerce site** that sells the *same products* the Armory manages
(shared catalog — out-of-stock in the back office is out-of-stock in the shop). Premium tactical
retail: cinematic hero, category tiles, product grid, slide-out cart, and a refined checkout.

| Page | Highlights |
|---|---|
| **Home** (`store/index.html`) | Hero, category tiles, new arrivals, on-sale, and a back-in-stock showcase |
| **Shop** (`store/shop.html`) | Filterable catalog — category / brand / price / CA-compliance / availability / sale, live sort, URL-driven filters, filter chips, load-more |
| **Product** (`store/product.html`) | Gallery, specs, financing, FFL-ships notice, and **back-in-stock notifications** when out of stock |
| **Cart** (`store/cart.html`) | Qty steppers, **promo codes** (`RANGEDAY15`, `VETERAN`), live totals, FFL notice, cross-sell |
| **Checkout** (`store/checkout.html`) | Contact → **FFL finder** → shipping → payment, with a live order summary |

**Two headline features, both genuinely functional:**

- 🗺️ **FFL Finder at checkout** — firearms must ship to a licensed dealer, so the buyer finds one.
  Enter any US ZIP → **real geocoding** (Zippopotam.us, keyless, with a bundled California fallback
  for offline) → **haversine distance** to a 36-dealer dataset, sorted nearest-first → an interactive
  **Leaflet/OpenStreetMap** map with pins → select a dealer and its transfer fee flows into the order
  total and the confirmation. Try `92101` (San Diego) vs `95814` (Sacramento) — the results re-sort.
- 🔔 **Back-in-stock alerts** — every out-of-stock product (in-grid, on the product page, and via a
  modal) takes an email and persists the subscription, mirroring WBT's existing OOS pattern.

The cart (localStorage), favorites, and back-in-stock subscriptions all persist across pages.

## Run it

It's static. Any of these work:

```bash
# Python (no install)
python -m http.server 4173
#  → open http://localhost:4173

# or Node
npx serve .

# or just open index.html in a browser
```

- **Owner/staff command center:** start at **`index.html`** (the tactical login — any credentials enter) → **Command Center**.
- **Customer storefront:** open **`store/index.html`** → shop → cart → checkout (try the FFL finder).

## Project layout

```
Wilde/
├─ index.html              # tactical "secure access" splash / login
├─ dashboard.html          # Command Center (the reference page)
├─ inventory.html          # The Armory
├─ orders.html             # Sales & Orders
├─ compliance.html         # CA Compliance Center
├─ carts.html              # Cart Recovery
├─ promotions.html  marketing.html  customers.html
├─ forecast.html   reports.html   staff.html   settings.html
├─ assets/
│  ├─ css/tactical.css     # the entire design system (one file, no framework)
│  ├─ js/data.js           # shared seeded mock dataset (window.WBT)
│  ├─ js/app.js            # shell: sidebar/topbar, Chart.js theme, UI helpers (WBT.ui)
│  └─ js/pages/*.js        # per-page logic
├─ BUILD_SPEC.md           # the contract every page was built against
└─ README.md
```

## Design system

One hand-written CSS file ([`tactical.css`](assets/css/tactical.css)) — no Tailwind, no Bootstrap.
Tokens, layout, panels, KPI stats, tactical tables, tags, meters, timelines, toasts, modals, HUD corner
brackets, scanlines. `app.js` exposes `WBT.ui` (toasts, modals, themed Chart.js factories) so each page
stays small and consistent. Built by a coordinated set of subagents against a shared reference page and spec.

## From mock-up to production

This is a front-end mock. The intended production path keeps the exact same UI and wires it to a
**PHP + MySQL** backend (matching the WBT hosting stack): inventory/orders/compliance endpoints replacing
`data.js`, the recovery engine on a cron, and DROS/bound-book records in real tables. The design system
and page structure are backend-agnostic and port directly to PHP templates.

---

<div align="center">
<sub>Mock-up build · not affiliated with ATF/CA DOJ · all data is fictional · 🤖 built with Claude Code</sub>
</div>
