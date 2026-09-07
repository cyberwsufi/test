import { supabase, requireUser } from "./supabase.js";
import { mountHeader, mountFooter, getCart, cartTotals, money, toast, escapeHtml } from "./app.js";

await mountHeader();
mountFooter();

const user = await requireUser();
if (!user) throw new Error("No user");

const cart = getCart();
const root = document.querySelector("#checkout-root");

if (!cart.length) {
  root.innerHTML = `<div class="empty-state"><h2>Your bag is empty.</h2><a class="button button-dark" href="shop.html">Shop products</a></div>`;
} else {
  const totals = cartTotals();
  root.innerHTML = `
    <div class="checkout-grid">
      <form id="checkout-form" class="form-card">
        <div class="eyebrow">Delivery</div><h1>Where should we send it?</h1>
        <div class="field"><label>Full name</label><input required name="name" autocomplete="name"></div>
        <div class="field"><label>Address</label><textarea required name="address" rows="3"></textarea></div>
        <div class="two-col">
          <div class="field"><label>City</label><input required name="city"></div>
          <div class="field"><label>PIN code</label><input required name="postal_code" inputmode="numeric"></div>
        </div>
        <div class="field"><label>Phone</label><input required name="phone" inputmode="tel" autocomplete="tel"></div>
        <button class="button button-dark button-wide" type="submit">Place demo order · ${money(totals.total)}</button>
        <p class="tiny muted">Demo checkout: no real payment is collected in this starter. Add a trusted payment provider before launch.</p>
      </form>
      <aside class="summary-card"><div class="eyebrow">In your bag</div><h2>Ritual selection</h2>
        ${cart.map(i => `<div class="summary-line"><span>${escapeHtml(i.name)} × ${i.quantity}</span><strong>${money(i.price * i.quantity)}</strong></div>`).join("")}
        <div class="summary-total"><span>Total</span><strong>${money(totals.total)}</strong></div>
      </aside>
    </div>`;
  document.querySelector("#checkout-form").addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const items = cart.map(i => ({ product_id: i.id, quantity: i.quantity }));
    const { data, error } = await supabase.rpc("create_order", {
      p_items: items,
      p_full_name: fd.get("name"),
      p_address: fd.get("address"),
      p_city: fd.get("city"),
      p_postal_code: fd.get("postal_code"),
      p_phone: fd.get("phone")
    });
    if (error) return toast(error.message, "error");
    localStorage.removeItem("aurelia_cart_v1");
    location.href = `profile.html?order=${data}`;
  });
}
