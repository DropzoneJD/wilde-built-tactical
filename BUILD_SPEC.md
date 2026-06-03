# WBT Command Center — BUILD SPEC (read before building any page)

You are building one page of the **Wilde Built Tactical** owner/staff command center —
a pseudo-functional mock-up for a California gun store (firearms, ammo, optics, accessories).
Aesthetic: **military / tactical "armory terminal" HUD** — gunmetal black, coyote tan (FDE),
olive drab, hi-vis amber. Dense, professional, data-rich. Think Bloomberg terminal meets
an FFL back office.

**Hard rules**
1. **Reuse the design system.** Compose existing classes from `assets/css/tactical.css`.
   Do **not** invent new colors, fonts, or a new CSS file. If you need a one-off tweak, use a
   small `<style>` block in the page `<head>` scoped to that page — but prefer existing classes.
2. **Mirror the reference page exactly.** Read `dashboard.html` and `assets/js/pages/dashboard.js`
   first. Match their structure, density, and quality. Your page must feel like the same app.
3. **All data comes from `window.WBT`** (defined in `assets/js/data.js`). Do not hardcode
   numbers that duplicate data already there; read from WBT. You MAY add page-local derived/extra
   mock arrays inside your page JS if a page needs detail not in WBT (keep it consistent in tone).
4. **Pseudo-functional, not dead.** Buttons, filters, tabs, row clicks must *do* something:
   filter a table, open a `WBT.ui.modal(...)`, fire a `WBT.ui.toast(...)`, toggle a class,
   advance a step. No `href="#"` dead ends. No "coming soon".
5. **No external assets** beyond the CDNs already used (Lucide, Chart.js). No images required —
   use Lucide icons + CSS. Icons: `<i data-lucide="name"></i>` then it auto-renders (app.js calls
   `lucide.createIcons()`; after any dynamic innerHTML, call `WBT.ui.icons()`).
6. Must render with **zero console errors** and **no horizontal overflow** at 1280px.

---

## Page skeleton (copy this exactly; change only the marked spots)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PAGE TITLE — Wilde Built Tactical</title>
  <link rel="stylesheet" href="assets/css/tactical.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c2a17b' stroke-width='2'><circle cx='12' cy='12' r='10'/><line x1='22' y1='12' x2='18' y2='12'/><line x1='6' y1='12' x2='2' y2='12'/><line x1='12' y1='6' x2='12' y2='2'/><line x1='12' y1='22' x2='12' y2='18'/></svg>">
  <style>/* OPTIONAL page-scoped tweaks only */</style>
</head>
<body data-page="PAGEKEY">
  <div class="layout">
    <aside class="sidebar" id="sidebar"></aside>
    <div class="main">
      <header class="topbar" id="topbar"></header>
      <div class="content content--wide fade-in">
        <!-- PAGE HEAD -->
        <div class="page-head">
          <div>
            <div class="stencil">SECTION EYEBROW</div>
            <h1>PAGE H1</h1>
            <div class="meta-row mt-8"><span><span class="sdot sdot--go"></span> LIVE</span> ...</div>
          </div>
          <div class="flex gap-8 items-center wrap"><!-- actions: seg control, buttons --></div>
        </div>
        <!-- PAGE BODY: use .grid .grid-12 + .col-N panels -->
      </div>
    </div>
  </div>
  <div id="toast-stack"></div>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="assets/js/data.js"></script>
  <script src="assets/js/app.js"></script>
  <script src="assets/js/pages/PAGEKEY.js"></script>
</body>
</html>
```

- `PAGEKEY` is the nav key (e.g. `inventory`). The sidebar/topbar auto-render and the active
  nav item is chosen from `data-page`. Title in the topbar comes from app.js's TITLES map (already set).
- If your page has **no charts**, you may omit the Chart.js `<script>`.
- Put page logic in `assets/js/pages/PAGEKEY.js` as an IIFE, exactly like `dashboard.js`.

---

## CSS component cheat-sheet (all in tactical.css)

- **Layout:** `.grid .grid-12` with `.col-3/.col-4/.col-5/.col-6/.col-7/.col-8/.col-9/.col-12`.
  Also `.grid-2/.grid-3/.grid-4`.
- **Panel:** `.panel` (+ `.bracketed` for HUD corner brackets on featured ones).
  `.panel__head` (put a `<span class="stencil">Title</span>` + `.right` for actions),
  `.panel__body` (or `.panel__body--flush` for tables), `.panel--pad`.
- **Stencil micro-heading:** `<span class="stencil">Label</span>` (the recurring tactical eyebrow).
- **KPI stat:** `.stat` (`.stat--accent` for the hero one) > `.stat__label` (with a leading
  `<i data-lucide>`), `.stat__value` (use `<small>` for units), `.stat__foot`.
- **Delta chip:** `.delta.up/.down/.flat`.
- **Tags/badges:** `.tag` + `.tag--fde/od/amber/blue/danger/success/steel/solid/ghost`. Add a
  `<span class="dot"></span>` for a glowing status dot.
- **Status dot:** `.sdot.sdot--go/--hold/--stop`.
- **Buttons:** `.btn` + `.btn--primary/--amber/--danger/--ghost/--sm/--icon/--block`.
- **Segmented control:** `.seg > button` (one `.is-active`).
- **Table:** `<table class="tac-table">`, `<th>`, `.num` (right mono), `.sku` (mono), `.t-strong`,
  `.cell-prod` + `.prod-thumb` for an icon+name cell. Wrap in `.table-wrap` for scroll.
- **Meter/progress:** `.meter` (`.is-low/.is-mid/.is-fde`) > inner `<span style="width:NN%">`.
- **Forms:** `label.fld`, `.input` (also `select.input`, `textarea.input`), `.search` wrapper
  (with a lucide icon), `.switch` toggle.
- **Timeline:** `.timeline > .tl-item` (`.done/.active/.wait`) with `.tl-time`.
- **Alert strip:** `.alert` + `.alert--danger/--amber/--od` (leading lucide icon).
- **kv row:** `.kv` (`<span>label</span><b>value</b>`).
- **Utilities:** `.flex .items-center .justify-between .gap-8/12/16 .wrap`, `.mt-*/.mb-*`,
  `.text-right .text-center .w-full .muted .faint .tiny .mono .upper .nowrap .hide .clickable`.
- **Meta row:** `.meta-row` (mono micro-facts separated by `<span class="sep">/</span>`).

## JS helpers (window.WBT.ui — set up by app.js)

- `WBT.ui.line(canvasEl, labels, [{label,data,color,fill}], {yMoney, chart})`
- `WBT.ui.bars(canvasEl, labels, data, {horizontal, money, colors, thickness, chart})`
- `WBT.ui.donut(canvasEl, labels, data, colors, {money, chart})`
- `WBT.ui.spark(canvasEl, dataArray, color)` — tiny sparkline
- `WBT.ui.toast(msg, lucideIconName)` — bottom-right toast
- `WBT.ui.modal(innerHTML, {lg})` / `WBT.ui.closeModal()` — pattern: a `.panel__head` with a
  close button `onclick="WBT.ui.closeModal()"` + a `.panel__body`.
- `WBT.ui.icons()` — re-render lucide icons after injecting HTML (ALWAYS call after innerHTML).
- `WBT.ui.PALETTE` — `{fde,fdeDeep,od,odBright,amber,steel,blue,danger,success,grid,text}` hex.
- `WBT.ui.hexA(hex, alpha)` — rgba string.
- **Formatters:** `WBT.fmt.money(cents)` → `$1,234.00`; `WBT.fmt.moneyK(cents)` → `$1.2k`;
  `WBT.fmt.pct(n)` → `+3.4%`; `WBT.fmt.pad(n,w)`.
- `WBT.pick(arr)`, `WBT.between(a,b)` for any extra mock generation (keep deterministic-ish).

## window.WBT data shape (read; don't redefine)

- `WBT.kpi` — `{revMTD, revPrev, revDelta, ordersMTD, aov, invValueCost, invValueRetail, invUnits,
  skuCount, lowStock, outStock, drosPending, drosReady, activeCarts, cartValue, members,
  optInRate, conversion, foot}` (money fields are **cents**).
- `WBT.inventory[]` — `{id, cat, catLabel, icon, brand, model, sku, price, cost, serialized, ca,
  qty, reorder, supplier, bin, margin, velocity, daysCover, mtdSold}`. `cat` ∈
  rifle|pistol|shotgun|optic|ammo|acc|light|apparel. `price/cost` in cents. `ca` ∈
  roster|featureless|rifle|shotgun|none. `WBT.invById[id]`, `WBT.lowStockList`, `WBT.outStockList`.
- `WBT.CATS` — map cat→`{label, icon, serialized}`.
- `WBT.customers[]` — `{id, name, email, phone, city, orders, ltv(cents), seg, segLabel, segColor,
  tier, points, lastDays, fflOnFile, marketingOptIn}`. `WBT.custById[id]`.
- `WBT.orders[]` — `{id, custId, customer, city, daysAgo, items:[{id,name,qty,price,cat}], nItems,
  total(cents), channel, channelLabel, channelColor, status, statusLabel, statusColor, hasFirearm}`.
- `WBT.carts[]` — `{id, custId, customer, email, items:[{id,name,price,cat}], value(cents),
  hoursAgo, stageIdx, stage, recovered, optIn}`. `WBT.RECOVERY_STAGES[]` =
  `{key,label,wait,discount,channel}` (the 4-step ladder: reminder → 5% → 10% → 15%).
- `WBT.promos[]` — `{code,label,type,scope,value,uses,cap,revenue(cents),status,ends}`.
- `WBT.campaigns[]` — `{name,channel,kind,sent,open,click,rev(cents),status}`.
- `WBT.staff[]` — `{name,role,loc,sales(cents),isOwner?,on,certs[]}`.
- `WBT.dros[]` — `{id,customer,custId,item,serial,cat,day,daysLeft,status,statusLabel,statusColor,
  rosterOk}`. `WBT.boundBook[]` = `{line,type,mfg,model,serial,cat,daysAgo,party}`.
- `WBT.forecast[]` — `{id,name,cat,qty,velocity,daysCover,projected14,recommend,confidence}`.
- `WBT.series` — `{revenue90[{t,v}], traffic90, orders90, byChannel[{k,v,c}], byCategory[{k,v}]}`.
  (v in cents for revenue/byChannel/byCategory.)

## Quality bar
Each page should fill the screen with **4–8 substantial panels**: a KPI row (3–6 `.stat` cards),
at least one chart where it makes sense, at least one rich `.tac-table` or card grid, and
tactical flourishes (stencil eyebrows, status dots, tags, meters, `.bracketed` on a hero panel).
Aim for the density and finish of `dashboard.html`. Make it look expensive.
