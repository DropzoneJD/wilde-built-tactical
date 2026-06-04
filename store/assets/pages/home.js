/* Storefront home — home.js */
(function () {
  const S = window.WBTStore, ui = S.ui;

  // hero silhouette (a rifle)
  document.getElementById('heroSilo').innerHTML = S.silo('rifle');

  // categories
  document.getElementById('catGrid').innerHTML = S.CATEGORIES.map(c => {
    const n = S.catalog.filter(p => p.cat === c.key).length;
    return `<a class="cat-tile" href="shop.html?cat=${c.key}">
      <div class="silo">${S.silo(c.key)}</div>
      <h3>${c.label}</h3><span>${n} product${n === 1 ? '' : 's'}</span>
    </a>`;
  }).join('');

  // new arrivals (in-stock first), on sale, back-in-stock
  const inStock = S.catalog.filter(p => p.status !== 'out');
  const newArrivals = S.catalog.filter(p => p.isNew).slice(0, 8);
  const onSale = S.catalog.filter(p => p.onSale && p.status !== 'out').slice(0, 8);
  const restock = S.catalog.filter(p => p.status === 'out').slice(0, 4);

  document.getElementById('newGrid').innerHTML = (newArrivals.length ? newArrivals : inStock.slice(0, 8)).map(ui.productCard).join('');
  document.getElementById('saleGrid').innerHTML = onSale.map(ui.productCard).join('');
  const bis = document.getElementById('bisGrid');
  if (restock.length) bis.innerHTML = restock.map(ui.productCard).join('');
  else bis.closest('section').style.display = 'none';

  ui.icons();
})();
