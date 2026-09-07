import { mountHeader, mountFooter } from "./app.js";
await mountHeader(); mountFooter();
const articles = [
  ["The 3-minute scalp reset", "A small weekly ritual for a calmer, cleaner-feeling scalp.", "SCALP"],
  ["How to build a wash-day wardrobe", "Think of hair care like dressing: cleanse, treat, finish.", "RITUAL"],
  ["Shine without the weight", "The art of using oils and serums with a light hand.", "FINISH"],
  ["Repair is a routine, not a rescue", "Consistency beats the emergency hair mask every time.", "CARE"]
];
document.querySelector("#journal-grid").innerHTML = articles.map((a,i)=>`
  <article class="journal-card">
    <div class="journal-number">0${i+1}</div>
    <div class="eyebrow">${a[2]}</div><h2>${a[0]}</h2><p>${a[1]}</p>
    <a href="#" class="text-button">Read story →</a>
  </article>`).join("");
