import { supabase } from "./supabase.js";
import { mountHeader, mountFooter, money, escapeHtml, addToCart, fetchProducts } from "./app.js";

await mountHeader();
mountFooter();

const id = new URLSearchParams(location.search).get("id");
const root = document.querySelector("#product-detail");

if (!id) {
  root.innerHTML = `<div class="empty-state">Product not found.</div>`;
} else {
  const { data: p, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error || !p) {
    root.innerHTML = `<div class="empty-state">Product not found.</div>`;
  } else {
    root.innerHTML = `
      <div class="product-detail-grid">
        <div class="detail-image"><img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}"></div>
        <div class="detail-copy">
          <div class="eyebrow">${escapeHtml(p.category)} · ${escapeHtml(p.size || "")}</div>
          <h1>${escapeHtml(p.name)}</h1>
          <p class="price-large">${money(p.price)}</p>
          <p class="lead">${escapeHtml(p.description || p.short_description || "")}</p>
          <div class="detail-meta"><span>✦ Clean formula</span><span>✦ Ritual-ready</span><span>✦ Cruelty-free</span></div>
          <label class="quantity-label">Quantity <input id="qty" type="number" min="1" value="1"></label>
          <button class="button button-dark button-wide" id="add">Add to bag · ${money(p.price)}</button>
          <div class="accordion">
            <details open><summary>How to use</summary><p>${escapeHtml(p.how_to_use || "Massage into hair and scalp as directed. Make it part of your weekly ritual.")}</p></details>
            <details><summary>Ingredients</summary><p>${escapeHtml(p.ingredients || "Ingredient information coming soon.")}</p></details>
          </div>
        </div>
      </div>`;
    document.querySelector("#add").addEventListener("click", () => {
      addToCart(p, Number(document.querySelector("#qty").value || 1));
    });
  }
}
