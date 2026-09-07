import { mountHeader, mountFooter, fetchProducts, productCard, wireAddButtons, supabase, toast } from "./app.js";

await mountHeader();
mountFooter();

const grid = document.querySelector("#featured-products");
try {
  const products = await fetchProducts({ featured: true });
  grid.innerHTML = products.length ? products.map(productCard).join("") : `<div class="empty-state">Your collection is ready to be curated.</div>`;
  await wireAddButtons(products);
} catch (e) {
  grid.innerHTML = `<div class="empty-state">Connect Supabase to load the collection.</div>`;
}

document.querySelector("#newsletter-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = new FormData(e.currentTarget).get("email")?.trim();
  if (!email) return;
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });
  if (error && error.code !== "23505") toast(error.message, "error");
  else {
    e.currentTarget.reset();
    toast("Welcome to the Aurelia circle.", "success");
  }
});
