import { mountHeader, mountFooter, getCart, setCartQuantity, removeFromCart, cartTotals, money, escapeHtml } from "./app.js";

await mountHeader();
mountFooter();

const root = document.querySelector("#cart-root");

function render() {
  const cart = getCart();
  if (!cart.length) {
    root.innerHTML = `<div class="empty-state large-empty"><span class="ornament">✦</span><h2>Your ritual bag is empty.</h2><p>Choose a few beautiful essentials to begin.</p><a class="button button-dark" href="shop.html">Shop the collection</a></div>`;
    return;
  }
  const totals = cartTotals();
  root.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${cart.map(i => `
          <div class="cart-item">
            <img src="${escapeHtml(i.image_url)}" alt="${escapeHtml(i.name)}">
            <div class="cart-item-copy">
              <div class="eyebrow">AURELIA</div><h3>${escapeHtml(i.name)}</h3>
              <strong>${money(i.price)}</strong>
              <div class="qty-control">
                <button data-minus="${i.id}">−</button><span>${i.quantity}</span><button data-plus="${i.id}">+</button>
              </div>
            </div>
            <button class="remove-button" data-remove="${i.id}" aria-label="Remove">×</button>
          </div>`).join("")}
      </div>
      <aside class="summary-card">
        <div class="eyebrow">Your ritual</div><h2>Order summary</h2>
        <div class="summary-line"><span>Subtotal</span><strong>${money(totals.subtotal)}</strong></div>
        <div class="summary-line"><span>Shipping</span><strong>${totals.shipping ? money(totals.shipping) : "Free"}</strong></div>
        <div class="summary-total"><span>Total</span><strong>${money(totals.total)}</strong></div>
        <a class="button button-dark button-wide" href="checkout.html">Continue to checkout</a>
      </aside>
    </div>`;
  root.querySelectorAll("[data-minus]").forEach(b => b.onclick = () => {
    const item = getCart().find(i => i.id === b.dataset.minus); if (item) setCartQuantity(item.id, item.quantity - 1); render();
  });
  root.querySelectorAll("[data-plus]").forEach(b => b.onclick = () => {
    const item = getCart().find(i => i.id === b.dataset.plus); if (item) setCartQuantity(item.id, item.quantity + 1); render();
  });
  root.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => { removeFromCart(b.dataset.remove); render(); });
}
render();
