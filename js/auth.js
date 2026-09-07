import { supabase } from "./supabase.js";
import { toast } from "./app.js";

const form = document.querySelector("#auth-form");
const title = document.querySelector("#auth-title");
const subtitle = document.querySelector("#auth-subtitle");
const nameWrap = document.querySelector("#name-wrap");
const submit = document.querySelector("#auth-submit");
const switcher = document.querySelector("#auth-switch");
let mode = "login";

function renderMode() {
  const register = mode === "register";
  title.textContent = register ? "Create your ritual" : "Welcome back";
  subtitle.textContent = register ? "Begin your Aurelia hair-care journey." : "Enter your details to continue.";
  nameWrap.hidden = !register;
  submit.textContent = register ? "Create account" : "Sign in";
  switcher.innerHTML = register
    ? `Already a member? <button type="button" class="link-button">Sign in</button>`
    : `New here? <button type="button" class="link-button">Create an account</button>`;
  switcher.querySelector("button").onclick = () => { mode = register ? "login" : "register"; renderMode(); };
}
renderMode();

form.addEventListener("submit", async e => {
  e.preventDefault();
  const email = form.email.value.trim();
  const password = form.password.value;
  submit.disabled = true;
  try {
    if (mode === "register") {
      const full_name = form.full_name.value.trim();
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name } }
      });
      if (error) throw error;
      if (!data.session) {
        toast("Check your email to confirm your account.", "success");
        mode = "login"; renderMode();
      } else location.href = "profile.html";
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const redirect = new URLSearchParams(location.search).get("redirect");
      location.href = redirect || "profile.html";
    }
  } catch (err) {
    toast(err.message || "Something went wrong.", "error");
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#forgot").addEventListener("click", async () => {
  const email = form.email.value.trim();
  if (!email) return toast("Enter your email first.", "error");
  const redirectTo = location.origin + "/auth.html";
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) toast(error.message, "error");
  else toast("Password reset email sent.", "success");
});
