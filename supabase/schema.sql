-- AURELIA Supabase schema
-- Run this whole file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  hair_type text default 'normal',
  goals text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null,
  short_description text,
  description text,
  how_to_use text,
  ingredients text,
  price numeric(10,2) not null check (price >= 0),
  image_url text not null,
  size text,
  badge text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  phone text not null,
  subtotal numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'placed',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Profiles: users can manage their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Products are public catalog data.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated
using (active = true);

-- Orders: users see their own orders.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select to authenticated
using ((select auth.uid()) = user_id);

-- Order items: users see items belonging to their own orders.
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items for select to authenticated
using (exists (
  select 1 from public.orders o
  where o.id = order_items.order_id and o.user_id = (select auth.uid())
));

-- Newsletter: signed-out visitors may subscribe. Only allow inserting their email.
drop policy if exists "newsletter_public_insert" on public.newsletter_subscribers;
create policy "newsletter_public_insert" on public.newsletter_subscribers for insert to anon, authenticated
with check (length(email) between 5 and 254);

-- Avatar storage bucket.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder" on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder" on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder" on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Keep profile rows automatically created after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Trusted server-side order creation.
-- Client sends only product IDs and quantities.
-- Prices are read from products inside the database.
create or replace function public.create_order(
  p_items jsonb,
  p_full_name text,
  p_address text,
  p_city text,
  p_postal_code text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_subtotal numeric(10,2) := 0;
  v_shipping numeric(10,2) := 0;
  item jsonb;
  v_product products%rowtype;
  v_qty integer;
begin
  if v_user is null then
    raise exception 'You must be signed in.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty.';
  end if;

  insert into public.orders(user_id, full_name, address, city, postal_code, phone)
  values (v_user, p_full_name, p_address, p_city, p_postal_code, p_phone)
  returning id into v_order;

  for item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, least(20, (item->>'quantity')::integer));
    select * into v_product from public.products
    where id = (item->>'product_id')::uuid and active = true;

    if not found then
      raise exception 'One of the products is unavailable.';
    end if;

    insert into public.order_items(order_id, product_id, quantity, unit_price)
    values (v_order, v_product.id, v_qty, v_product.price);

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  if v_subtotal > 1500 then
    v_shipping := 0;
  else
    v_shipping := 99;
  end if;

  update public.orders
  set subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping
  where id = v_order;

  return v_order;
end;
$$;

revoke all on function public.create_order(jsonb,text,text,text,text,text) from public;
grant execute on function public.create_order(jsonb,text,text,text,text,text) to authenticated;

-- Demo catalogue
insert into public.products
(name, slug, category, short_description, description, how_to_use, ingredients, price, image_url, size, badge, featured)
values
('Velvet Cleanse','velvet-cleanse','cleanse','A deep-but-gentle shampoo ritual.','A refined everyday cleanser that leaves the scalp fresh and lengths soft — never stripped.','Massage into wet scalp, work through lengths and rinse. Repeat if desired.','Amino acid surfactants, aloe, panthenol.',890,'assets/velvet-cleanse.svg','250 ml','BESTSELLER',true),
('Gilded Repair Mask','gilded-repair-mask','treatment','A rich weekly mask for fragile lengths.','A cushiony treatment for dry, stressed and heat-exposed lengths.','Apply after cleansing from mid-length to ends. Leave 5–10 minutes and rinse.','Plant proteins, shea, ceramides.',1190,'assets/gilded-repair-mask.svg','200 ml','WEEKLY RITUAL',true),
('Silk Veil Oil','silk-veil-oil','finish','A weightless finishing oil for luminous ends.','A polished finishing oil designed to add softness and shine without a heavy feel.','Warm 1–3 drops between palms and smooth over lengths and ends.','Squalane, camellia, argan.',990,'assets/silk-veil-oil.svg','50 ml',null,true),
('Crown Tonic','crown-tonic','scalp','A refreshing scalp tonic for ritual resets.','A cool, lightweight scalp tonic for days when your roots need a little attention.','Part hair and apply to scalp. Massage gently for 60 seconds.','Niacinamide, rosemary, green tea.',1050,'assets/crown-tonic.svg','100 ml','NEW',true),
('Midnight Serum','midnight-serum','treatment','An overnight strand serum for softness.','A silky leave-in treatment for dry, brittle-feeling lengths and ends.','Apply 1–2 pumps to lengths before bed. Do not rinse.','Peptides, jojoba, vitamin E.',1290,'assets/midnight-serum.svg','60 ml',null,false),
('Lustre Mist','lustre-mist','finish','A fine mist for touchable, polished shine.','A featherlight veil that refreshes the finish and gives hair a soft luminous sheen.','Mist lightly over finished hair from arm''s length.','Rice extract, glycerin, silk amino acids.',790,'assets/lustre-mist.svg','120 ml',null,false)
on conflict (slug) do nothing;
