# AURELIA — Art Deco Hair Care

A mobile-first vanilla HTML/CSS/JS hair-care storefront powered by Supabase.

## Pages
- `index.html` — Home
- `shop.html` — Product catalogue + filters
- `product.html?id=...` — Product detail
- `routine.html` — Hair routine finder
- `cart.html` — Cart
- `checkout.html` — Authenticated checkout
- `auth.html` — Login / register
- `profile.html` — Profile, avatar, preferences, orders
- `journal.html` — Hair-care editorial/journal
- `404.html` — Not found

## Stack
- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- Supabase Auth + Postgres + Storage
- Vercel for static hosting

## 1. Create the Supabase project
Create a project at https://supabase.com.

Then open **SQL Editor** and run:
`supabase/schema.sql`

This creates:
- profiles
- products
- orders
- order_items
- newsletter_subscribers
- RLS policies
- avatar storage policies
- `create_order` RPC

## 2. Configure the frontend
Copy `.env.example` to `.env` if you use a local server/tool that supports environment variables.

For this no-build static version, edit:
`js/config.js`

Replace:
- `YOUR_SUPABASE_URL`
- `YOUR_SUPABASE_PUBLISHABLE_KEY`

Use the **publishable key** from Supabase. Never put a service-role/secret key in browser code.

## 3. Run locally
Because ES modules work best from a web server, use one of:

### Python
```bash
python -m http.server 5500
```
Open http://localhost:5500

### VS Code
Install Live Server and open `index.html` with Live Server.

## 4. Supabase Auth settings
In Supabase:
- Authentication → URL Configuration
- Add your local URL, e.g. `http://localhost:5500`
- Add your Vercel production URL, e.g. `https://your-project.vercel.app`

If email confirmation is enabled, registration will ask the user to verify email. This is normal Supabase Auth behavior.

## 5. Avatar uploads
The SQL creates an `avatars` bucket and policies. Profile images are uploaded into:
`{user_id}/avatar.ext`

## 6. Deploy to Vercel
### GitHub route
```bash
git init
git add .
git commit -m "Initial AURELIA storefront"
git branch -M main
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

Then Vercel → Add New Project → Import the GitHub repository → Deploy.

This project has no build step. Vercel serves the HTML/CSS/JS directly.

### Vercel Drop
You can also upload the project folder/zip using Vercel's current Drop flow:
https://vercel.com/drop

## 7. Important security notes
- The browser uses only the Supabase publishable key.
- Do NOT expose a Supabase service-role/secret key.
- RLS is enabled in `schema.sql`.
- Order totals are calculated inside the `create_order` database function from trusted product prices, rather than trusting a client-supplied total.
- This MVP does not process real payments. Add Razorpay/Stripe through a server-side/Edge Function before accepting real money.

## Brand
AURELIA is a fictional demo brand name. Replace it with your real brand name, products, copy, imagery, legal pages, shipping policy, and payment integration before launch.
