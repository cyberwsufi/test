import { supabase, requireUser } from "./supabase.js";
import { mountHeader, mountFooter, money, toast, escapeHtml } from "./app.js";

await mountHeader();
mountFooter();

const user = await requireUser();
if (!user) throw new Error("No user");

const form = document.querySelector("#profile-form");
const avatar = document.querySelector("#avatar");
const avatarInput = document.querySelector("#avatar-input");
const ordersRoot = document.querySelector("#orders");

async function loadProfile() {
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  form.full_name.value = profile?.full_name || user.user_metadata?.full_name || "";
  form.hair_type.value = profile?.hair_type || "normal";
  form.goals.value = profile?.goals || "";
  if (profile?.avatar_url) avatar.src = profile.avatar_url;
}
async function loadOrders() {
  const { data: orders } = await supabase.from("orders").select("id, total, status, created_at").order("created_at", { ascending: false }).limit(10);
  ordersRoot.innerHTML = orders?.length ? orders.map(o => `
    <div class="order-row">
      <div><strong>#${o.id.slice(0,8)}</strong><span class="muted">${new Date(o.created_at).toLocaleDateString("en-IN")}</span></div>
      <span class="pill">${escapeHtml(o.status)}</span><strong>${money(o.total)}</strong>
    </div>`).join("") : `<p class="muted">No orders yet.</p>`;
}
await loadProfile();
await loadOrders();

form.addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    id: user.id,
    full_name: form.full_name.value.trim(),
    hair_type: form.hair_type.value,
    goals: form.goals.value.trim(),
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("profiles").upsert(payload);
  if (error) toast(error.message, "error");
  else toast("Profile saved.", "success");
});

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return toast("Please choose an image.", "error");
  if (file.size > 3 * 1024 * 1024) return toast("Please keep the image under 3MB.", "error");
  const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return toast(uploadError.message, "error");
  const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = publicData.publicUrl + `?v=${Date.now()}`;
  const { error } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
  if (error) toast(error.message, "error");
  else { avatar.src = avatarUrl; toast("Portrait updated.", "success"); }
});

document.querySelector("#logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.href = "index.html";
});
