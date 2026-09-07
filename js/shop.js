import { mountHeader, mountFooter, fetchProducts, productCard, wireAddButtons } from "./app.js";

await mountHeader();
mountFooter();

const grid = document.querySelector("#shop-grid");
const search = document.querySelector("#product-search");
const category = document.querySelector("#category-filter");
let products = [];

async function load() {
  grid.innerHTML = `<div class="loading">Curating your shelf…</div>`;
  products = await fetchProducts();
  render();
}
function render() {
  const q = search.value.toLowerCase().trim();
  const cat = category.value;
  const filtered = products.filter(p =>
    (!q || `${p.name} ${p.short_description} ${p.category}`.toLowerCase().includes(q)) &&
    (cat === "all" || p.category === cat)
  );
  grid.innerHTML = filtered.length ? filtered.map(productCard).join("") : `<div class="empty-state">No products match that search.</div>`;
  wireAddButtons(filtered);
}
search.addEventListener("input", render);
category.addEventListener("change", render);
load().catch(() => grid.innerHTML = `<div class="empty-state">Could not load products. Check Supabase configuration.</div>`);
