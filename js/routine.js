import { mountHeader, mountFooter, supabase, escapeHtml } from "./app.js";
await mountHeader(); mountFooter();

const form = document.querySelector("#routine-form");
const result = document.querySelector("#routine-result");

form.addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(form);
  const type = fd.get("type");
  const goal = fd.get("goal");
  const { data: products } = await supabase.from("products").select("*").eq("active", true).limit(20);
  const picks = (products || []).filter(p => {
    const text = `${p.category} ${p.name} ${p.short_description}`.toLowerCase();
    return goal === "growth" ? text.includes("growth") || text.includes("scalp") :
           goal === "repair" ? text.includes("repair") || text.includes("mask") :
           goal === "shine" ? text.includes("shine") || text.includes("oil") : true;
  }).slice(0, 3);
  result.hidden = false;
  result.innerHTML = `
    <div class="eyebrow">Your Aurelia ritual</div>
    <h2>${type === "dry" ? "Restore + replenish" : type === "oily" ? "Balance + clarify" : "Strengthen + illuminate"}</h2>
    <p>For ${escapeHtml(type)} hair with a focus on ${escapeHtml(goal)}, start with this simple rhythm.</p>
    <ol class="ritual-steps"><li>Cleanse gently 2–3× weekly.</li><li>Treat once weekly with a targeted mask or scalp ritual.</li><li>Finish with a lightweight leave-in or oil on lengths.</li></ol>
    ${picks.length ? `<div class="mini-products">${picks.map(p => `<a href="product.html?id=${p.id}"><img src="${escapeHtml(p.image_url)}"><span>${escapeHtml(p.name)}</span></a>`).join("")}</div>` : ""}
  `;
  result.scrollIntoView({ behavior: "smooth", block: "center" });
});
