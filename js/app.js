import { supabase, getUser } from "./supabase.js";

const CART_KEY = "aurelia_cart_v1";

export function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

export function toast(message, type = "info") {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.dataset.type = type;
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add("is-visible"));
  clearTimeout(window.__aureliaToast);
  window.__aureliaToast = setTimeout(() => el.classList.remove("is-visible"), 3200);
}

export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity += quantity;
  else cart.push({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    image_url: product.image_url,
    quantity
  });
  saveCart(cart);
  toast(`${product.name} added to your ritual.`, "success");
}

export function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

export function setCartQuantity(id, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity = Math.max(1, Number(quantity));
  saveCart(cart);
}

export function cartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > 1500 || subtotal === 0 ? 0 : 99;
  return { subtotal, shipping, total: subtotal + shipping };
}

export function updateCartCount() {
  const count = getCart().reduce((sum, i) => sum + i.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach(el => el.textContent = count);
}

export async function mountHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;
  header.innerHTML = `
    <div class="announcement">THE AURELIA RITUAL · FREE SHIPPING OVER ₹1,500</div>
    <nav class="nav container">
      <a class="brand" href="index.html" aria-label="Aurelia home">
        <span class="brand-mark">A</span><span>AURELIA</span>
      </a>
      <button class="menu-toggle" aria-label="Open menu" aria-expanded="false">☰</button>
      <div class="nav-links">
        <a href="shop.html">Shop</a>
        <a href="routine.html">Find Your Ritual</a>
        <a href="journal.html">Journal</a>
        <a href="profile.html" class="nav-profile">Account</a>
        <a class="cart-link" href="cart.html">Bag <span data-cart-count>0</span></a>
      </div>
    </nav>`;
  const toggle = header.querySelector(".menu-toggle");
  const links = header.querySelector(".nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  updateCartCount();

  const user = await getUser();
  if (user) {
    const profileLink = header.querySelector(".nav-profile");
    profileLink.textContent = "Profile";
  }
}

export function mountFooter() {
  const footer = document.querySelector("[data-footer]");
  if (!footer) return;
  footer.innerHTML = `
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <div class="brand footer-brand"><span class="brand-mark">A</span><span>AURELIA</span></div>
          <p class="muted">Modern hair rituals, framed in timeless beauty.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="shop.html">Shop all</a>
          <a href="routine.html">Routine finder</a>
          <a href="journal.html">Journal</a>
        </div>
        <div>
          <h4>Help</h4>
          <a href="profile.html">My account</a>
          <a href="cart.html">Bag</a>
          <a href="index.html#newsletter">Newsletter</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Shipping</a>
        </div>
      </div>
      <div class="footer-bottom container">© ${new Date().getFullYear()} AURELIA. Demo storefront.</div>
    </footer>`;
}

export async function fetchProducts({category, featured} = {}) {
  let query = supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
  if (category && category !== "all") query = query.eq("category", category);
  if (featured) query = query.eq("featured", true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function productCard(p) {
  return `
    <article class="product-card">
      <a class="product-image" href="product.html?id=${p.id}">
        <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${escapeHtml(p.badge)}</span>` : ""}
      </a>
      <div class="product-info">
        <div class="eyebrow">${escapeHtml(p.category)}</div>
        <h3><a href="product.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
        <p class="muted">${escapeHtml(p.short_description || "")}</p>
        <div class="product-row"><strong>${money(p.price)}</strong><button class="text-button" data-add="${p.id}">Add +</button></div>
      </div>
    </article>`;
}

export async function wireAddButtons(products) {
  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = products.find(p => p.id === btn.dataset.add);
      if (product) addToCart(product);
    });
  });
}

export function setYear() {
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
}
