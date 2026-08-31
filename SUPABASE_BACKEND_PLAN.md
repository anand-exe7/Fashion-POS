# Supabase Backend — Implementation Plan

**Project:** Daddy's Home POS (`daddys-home-pos`)
**Stack:** Next.js 16.2.9 (App Router) · React 19.2.4 · TypeScript (strict) · Tailwind v4
**Backend:** Supabase (Postgres + PostgREST + Auth/Storage/Realtime available)
**Author:** Mirudull-D · **Date:** 2026-08-31
**Goal:** Replace the browser-only `localStorage` data layer with a persistent **Supabase Postgres** backend, without rewriting the UI.

> ⚠️ **Framework note.** This repo pins Next.js **16.2.9**, whose data/caching APIs differ from older releases (`AGENTS.md`). Patterns below were verified against the bundled docs in `node_modules/next/dist/docs/01-app/`:
> - Mutating data → `01-getting-started/07-mutating-data.md`
> - Fetching data → `01-getting-started/06-fetching-data.md`
> - `use server` / `use cache` → `03-api-reference/01-directives/`
>
> **Package versions (verified):** `@supabase/supabase-js@2.112.4`, `@supabase/ssr@0.12.5`.

---

## 1. Why this migration (the real motivation)

The app persists everything in `localStorage` via [lib/store.ts](lib/store.ts) — a **per-browser, per-origin** store. That causes one critical bug plus several limitations:

| Problem today | Consequence |
|---|---|
| Invoice records live only in the POS operator's browser | **A WhatsApp invoice link (`/invoice/INV-2026-XXXXX`) opened on the customer's phone shows "Invoice Not Found."** See [app/invoice/[id]/page.tsx:24](app/invoice/[id]/page.tsx). |
| Catalog & orders don't sync across devices | Two staff on two devices see different data. |
| Clearing browser data = total loss | No backups, no history continuity. |
| Analytics computed from local data only | Revenue/coupon/product reports incomplete. |

**Supabase fixes all of these** and adds a dashboard, automatic backups, a SQL editor, and a path to Auth/Realtime later — while keeping the existing React UI almost entirely intact.

---

## 2. Current-state analysis

### 2.1 Data model (from [lib/store.ts](lib/store.ts))

```ts
StoredProduct   = { id, name, description, default_price }
StoredOrderItem = { snapshot_name, snapshot_desc, snapshot_price, quantity }
StoredOrder     = {
  id, customer_name, customer_phone,
  source: "ONLINE"|"OFFLINE", status: "COMPLETED"|"PENDING",
  subtotal, discount_type: "PERCENT"|"FIXED", discount_value, discount_amount,
  delivery_fee, grand_total, cash_received, created_at, order_items[]
}
```

### 2.2 Store API surface (all **synchronous**, all `localStorage`)

| Function | Used by | Notes |
|---|---|---|
| `getProducts()` | control panel `fetchData` | |
| `addProduct(input)` | control panel `addToCatalog` | returns created row |
| `updateProduct(id, input)` | control panel `addToCatalog` | returns row or `null` |
| `deleteProduct(id)` | control panel `deleteFromCatalog` | |
| `getOrders()` | control panel `fetchData` | newest-first |
| `getOrder(id)` | **invoice page** | single order |
| `orderExists(id)` | control panel `handleSendWhatsApp` | uniqueness check |
| `saveOrder(order)` | control panel `handleSendWhatsApp` | upsert order + items |

### 2.3 Consumers

1. **[app/pos/admin/secure/control-panel/daddys-home/page.tsx](app/pos/admin/secure/control-panel/daddys-home/page.tsx)** — `"use client"`, ~3.7k lines. Imports 7 store functions ([L37–45](app/pos/admin/secure/control-panel/daddys-home/page.tsx:37)). Touch points:
   - `fetchData()` ([~L397](app/pos/admin/secure/control-panel/daddys-home/page.tsx:397)) → `getProducts()`, `getOrders()`
   - `addToCatalog()` ([~L567](app/pos/admin/secure/control-panel/daddys-home/page.tsx:567)) → `addProduct()` / `updateProduct()`
   - `deleteFromCatalog()` ([~L631](app/pos/admin/secure/control-panel/daddys-home/page.tsx:631)) → `deleteProduct()`
   - `handleSendWhatsApp()` ([~L648](app/pos/admin/secure/control-panel/daddys-home/page.tsx:648)) → `orderExists()`, `saveOrder()`
2. **[app/invoice/[id]/page.tsx](app/invoice/[id]/page.tsx)** — `"use client"`, reads `getOrder(id)` in a `useEffect`.
3. **[app/pos/actions.ts](app/pos/actions.ts)** — `"use server"` passcode verification (env-based). Proves the Server Action wiring already works.

### 2.4 Behaviors that MUST be preserved

- **Virtual default catalog.** `DEFAULT_CATALOG` ([L55](app/pos/admin/secure/control-panel/daddys-home/page.tsx:55)) items use ids like `default-shirt` and are **not persisted** until edited; code branches on `id.startsWith("default-")` ([L578](app/pos/admin/secure/control-panel/daddys-home/page.tsx:578), [L632](app/pos/admin/secure/control-panel/daddys-home/page.tsx:632)). DB-generated product ids must **not** start with `default-`.
- **Human-readable invoice ids** `INV-<year>-<5 random A–Z0–9>` with a uniqueness retry loop ([L662](app/pos/admin/secure/control-panel/daddys-home/page.tsx:662)).
- **GST pseudo-item** stored as a synthetic order item named `GST (5%)` ([L719](app/pos/admin/secure/control-panel/daddys-home/page.tsx:719)); the invoice filters items whose name `startsWith('GST (')`. Persist items verbatim.
- **Money used as `number`** everywhere. The DB layer must return JS `number` (see §5.4).

---

## 3. Supabase-specific design decisions (read this first)

Supabase is Postgres **plus PostgREST** — every table is reachable over an auto-generated HTTP API using API keys. Two of those keys matter:

| Key (new name / legacy) | Where it may live | RLS |
|---|---|---|
| **Publishable** (`sb_publishable_…`) / legacy **anon** | Safe in the browser | **Enforced** |
| **Secret** (`sb_secret_…`) / legacy **service_role** | **Server only — never ship to the client** | **Bypassed** |

**This app has no per-user accounts — it gates the admin panel with a passcode.** So the clean, low-churn design is:

> **All database access happens server-side using the secret (service-role) key, behind Server Actions and a Server Component.** The browser never talks to Supabase directly. **Row Level Security is enabled on every table with _no_ permissive policies**, so even if the publishable/anon key leaked it can read/write nothing. The existing passcode (upgraded to a signed cookie in Phase 7) remains the auth gate.

This mirrors a normal server-DB architecture and keeps the React UI intact.

- *Alternative (bigger rewrite, not recommended now):* adopt **Supabase Auth** for staff logins, use the browser client with the publishable key, and write RLS policies keyed on `auth.uid()`/roles. Only worth it if you want real per-staff accounts and offline-capable browser reads. This plan notes the swap points but defaults to server-side service-role.

- **Client library:** `@supabase/supabase-js` (query builder + `.rpc()`), used only in server code. `@supabase/ssr` is **not required** for this server-only design; add it only if you later adopt Supabase Auth.

---

## 4. Target architecture

```
┌─────────────────────────────────────────────────────────────┐
│  UI                                                           │
│  • control panel  (Client Component)  → calls Server Actions  │
│  • invoice page   (→ Server Component)→ calls db layer         │
└─────────────────────────────────────────────────────────────┘
              │ (network, POST)              │ (direct import, server-only)
              ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Server Actions — app/pos/actions.ts   ("use server")         │
│  auth boundary + thin wrappers over the db layer              │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Data-access layer — lib/db.ts  (import "server-only")        │
│  supabase-js query fns + row→type mappers                     │
│  uses  lib/supabase.ts (service-role client)                  │
└─────────────────────────────────────────────────────────────┘
              │  (secret key, RLS bypassed)
              ▼
        ☁  Supabase Postgres  (RLS on, no anon policies)
```

- **Reads for the invoice** move to a **Server Component** so the link works for anyone.
- **Mutations** go through **Server Actions** — keys/SQL never reach the browser bundle.
- **Types** (`StoredProduct`/`StoredOrder`/`StoredOrderItem`) are re-exported from `lib/db.ts`, so downstream UI code and the invoice's `type StoredOrder` import barely change.

---

## 5. Implementation steps

### Phase 0 — Decisions to lock
- [ ] Confirm **server-side service-role** access (this plan) vs Supabase Auth + RLS policies.
- [ ] Confirm money type: `numeric(12,2)` (this plan) vs integer paise.
- [ ] Confirm order write via **`create_order` RPC** (atomic, recommended) vs two-step insert.
- [ ] Confirm auth hardening (Phase 7) ships now — **strongly recommended**; Server Actions are publicly POST-able.

### Phase 1 — Create the Supabase project & environment
1. Create a Supabase project (region close to your Vercel deployment). Note the **Project URL** and, from **Project Settings → API keys**, the **publishable** and **secret** keys.
2. Env files:

   `.env` (local, git-ignored):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."          # secret key — server only
   # NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..." # only needed if you add a browser client later
   ```

   Update [.env.example](.env.example) (committed) with blank placeholders:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=   # secret/service_role key — NEVER expose to the browser
   ```
   `.gitignore` already ignores `.env*` except `.env.example` — no change needed.

   > 🔒 The secret key has **no `NEXT_PUBLIC_` prefix** on purpose — that keeps Next.js from inlining it into the client bundle.

### Phase 2 — Install dependencies
```bash
npm install @supabase/supabase-js
```
`server-only` ships with Next 16. *(Only add `@supabase/ssr` if you later adopt Supabase Auth.)*

### Phase 3 — Schema, RLS, and the order RPC
Run this in the **Supabase SQL Editor** (or via the Supabase CLI as a migration — see Phase 10). Save it in the repo as `supabase/migrations/0001_init.sql`.

```sql
-- ── Tables ─────────────────────────────────────────────────────────
create table if not exists products (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  description   text not null default '',
  default_price numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists orders (
  id             text primary key,                 -- INV-<year>-XXXXX
  customer_name  text not null default 'Guest',
  customer_phone text not null default '',
  source         text not null check (source in ('ONLINE','OFFLINE')),
  status         text not null check (status in ('COMPLETED','PENDING')),
  subtotal        numeric(12,2) not null default 0,
  discount_type   text not null default 'FIXED' check (discount_type in ('PERCENT','FIXED')),
  discount_value  numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  delivery_fee    numeric(12,2) not null default 0,
  grand_total     numeric(12,2) not null default 0,
  cash_received   numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists order_items (
  id             bigserial primary key,
  order_id       text not null references orders(id) on delete cascade,
  position       int  not null,
  snapshot_name  text not null,
  snapshot_desc  text not null default '',
  snapshot_price numeric(12,2) not null,
  quantity       int  not null
);

create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_orders_created_at    on orders(created_at desc);
create index if not exists idx_orders_phone         on orders(customer_phone);

-- ── Lock the tables down (CRITICAL for Supabase) ───────────────────
-- RLS ON + no policies ⇒ publishable/anon key can read/write NOTHING.
-- The server uses the secret key, which bypasses RLS.
alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

-- ── Atomic order write (order + items in one transaction) ──────────
create or replace function create_order(payload jsonb)
returns void
language plpgsql
as $$
declare
  item jsonb;
  idx  int := 0;
begin
  insert into orders (id, customer_name, customer_phone, source, status,
        subtotal, discount_type, discount_value, discount_amount,
        delivery_fee, grand_total, cash_received, created_at)
  values (
    payload->>'id',
    coalesce(payload->>'customer_name','Guest'),
    coalesce(payload->>'customer_phone',''),
    payload->>'source',
    payload->>'status',
    (payload->>'subtotal')::numeric,
    payload->>'discount_type',
    (payload->>'discount_value')::numeric,
    (payload->>'discount_amount')::numeric,
    (payload->>'delivery_fee')::numeric,
    (payload->>'grand_total')::numeric,
    (payload->>'cash_received')::numeric,
    coalesce((payload->>'created_at')::timestamptz, now())
  )
  on conflict (id) do update set
    customer_name=excluded.customer_name, customer_phone=excluded.customer_phone,
    source=excluded.source, status=excluded.status, subtotal=excluded.subtotal,
    discount_type=excluded.discount_type, discount_value=excluded.discount_value,
    discount_amount=excluded.discount_amount, delivery_fee=excluded.delivery_fee,
    grand_total=excluded.grand_total, cash_received=excluded.cash_received;

  delete from order_items where order_id = payload->>'id';

  for item in select * from jsonb_array_elements(payload->'order_items')
  loop
    insert into order_items (order_id, position, snapshot_name, snapshot_desc, snapshot_price, quantity)
    values (payload->>'id', idx, item->>'snapshot_name',
            coalesce(item->>'snapshot_desc',''),
            (item->>'snapshot_price')::numeric, (item->>'quantity')::int);
    idx := idx + 1;
  end loop;
end;
$$;
```

**Optional seed of the 8 defaults: don't.** Keeping them virtual preserves current de-dupe behavior in `fetchData` ([L401](app/pos/admin/secure/control-panel/daddys-home/page.tsx:401)) and avoids `default-*` id collisions.

### Phase 4 — Supabase client — `lib/supabase.ts`
Server-only admin client. **Never import this file from a Client Component.**

```ts
// lib/supabase.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) throw new Error("Supabase env vars are not set");

// Secret (service-role) key: bypasses RLS. Server-side use only.
export const supabaseAdmin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
```

### Phase 5 — Data-access layer — `lib/db.ts` (replaces `lib/store.ts`)
Types move here; queries use supabase-js. Note the **embedded select** `order_items(*)` that pulls items via the FK in one query.

```ts
// lib/db.ts
import "server-only";
import { supabaseAdmin as sb } from "@/lib/supabase";

// ── Types (moved from lib/store.ts) ───────────────────────────────
export type StoredProduct = { id: string; name: string; description: string; default_price: number };
export type StoredOrderItem = { snapshot_name: string; snapshot_desc: string; snapshot_price: number; quantity: number };
export type StoredOrder = {
  id: string; customer_name: string; customer_phone: string;
  source: "ONLINE" | "OFFLINE"; status: "COMPLETED" | "PENDING";
  subtotal: number; discount_type: "PERCENT" | "FIXED";
  discount_value: number; discount_amount: number; delivery_fee: number;
  grand_total: number; cash_received: number; created_at: string;
  order_items: StoredOrderItem[];
};

const num = (v: unknown) => Number(v ?? 0); // defensive: coerce numeric/int8 to JS number

// ── Products ──────────────────────────────────────────────────────
export async function getProducts(): Promise<StoredProduct[]> {
  const { data, error } = await sb
    .from("products").select("id, name, description, default_price")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, description: r.description, default_price: num(r.default_price),
  }));
}

export async function addProduct(input: Omit<StoredProduct, "id">): Promise<StoredProduct> {
  const { data, error } = await sb.from("products")
    .insert({ name: input.name, description: input.description, default_price: input.default_price })
    .select("id, name, description, default_price").single();
  if (error) throw error;
  return { id: data.id, name: data.name, description: data.description, default_price: num(data.default_price) };
}

export async function updateProduct(id: string, input: Omit<StoredProduct, "id">): Promise<StoredProduct | null> {
  const { data, error } = await sb.from("products")
    .update({ name: input.name, description: input.description, default_price: input.default_price, updated_at: new Date().toISOString() })
    .eq("id", id).select("id, name, description, default_price").maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, name: data.name, description: data.description, default_price: num(data.default_price) } : null;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ── Orders ────────────────────────────────────────────────────────
const ORDER_SELECT = `
  id, customer_name, customer_phone, source, status, subtotal,
  discount_type, discount_value, discount_amount, delivery_fee,
  grand_total, cash_received, created_at,
  order_items ( snapshot_name, snapshot_desc, snapshot_price, quantity, position )`;

const mapOrder = (o: any): StoredOrder => ({
  id: o.id, customer_name: o.customer_name, customer_phone: o.customer_phone,
  source: o.source, status: o.status,
  subtotal: num(o.subtotal), discount_type: o.discount_type,
  discount_value: num(o.discount_value), discount_amount: num(o.discount_amount),
  delivery_fee: num(o.delivery_fee), grand_total: num(o.grand_total),
  cash_received: num(o.cash_received),
  created_at: new Date(o.created_at).toISOString(),
  order_items: [...(o.order_items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((i: any) => ({
      snapshot_name: i.snapshot_name, snapshot_desc: i.snapshot_desc,
      snapshot_price: num(i.snapshot_price), quantity: Number(i.quantity),
    })),
});

export async function getOrders(): Promise<StoredOrder[]> {
  const { data, error } = await sb.from("orders").select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  const { data, error } = await sb.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data) : null;
}

export async function orderExists(id: string): Promise<boolean> {
  const { data, error } = await sb.from("orders").select("id").eq("id", id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function saveOrder(order: StoredOrder): Promise<void> {
  // Atomic via the SQL function (order + items in one transaction).
  const { error } = await sb.rpc("create_order", { payload: order });
  if (error) throw error;
}
```

> **Why the RPC:** supabase-js has no client-side transaction. `create_order` guarantees the order row and its items are written atomically and keeps `saveOrder` an idempotent upsert. *(Fallback without RPC: `insert` the order, then `insert` the items array — simpler but non-atomic.)*

### Phase 6 — Server Actions (auth boundary) — extend `app/pos/actions.ts`
Keep `verifyPasscode`; add wrappers the client calls. Each **re-checks auth** (Phase 7) because Server Actions are directly POST-able (per `07-mutating-data.md`).

```ts
// app/pos/actions.ts   ("use server" already at top of file)
import { requireStaff, requireAdmin } from "@/lib/auth"; // Phase 7
import * as db from "@/lib/db";
import type { StoredProduct, StoredOrder } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function listProductsAction()  { await requireStaff(); return db.getProducts(); }
export async function listOrdersAction()     { await requireStaff(); return db.getOrders(); }
export async function orderExistsAction(id: string) { await requireStaff(); return db.orderExists(id); }

export async function createProductAction(input: Omit<StoredProduct,"id">) { await requireAdmin(); return db.addProduct(input); }
export async function updateProductAction(id: string, input: Omit<StoredProduct,"id">) { await requireAdmin(); return db.updateProduct(id, input); }
export async function deleteProductAction(id: string) { await requireAdmin(); return db.deleteProduct(id); }

export async function createOrderAction(order: StoredOrder) {
  await requireStaff();
  await db.saveOrder(order);
  revalidatePath(`/invoice/${order.id}`);
}
```

### Phase 7 — Consumer refactor

**7a. Invoice page → Server Component** (the core fix — link works for customers).
Replace [app/invoice/[id]/page.tsx](app/invoice/[id]/page.tsx) with an async Server Component; move Print/Copy-Link buttons into a small `"use client"` child.

```tsx
// app/invoice/[id]/page.tsx   (NO "use client")
import { getOrder } from "@/lib/db";
import { notFound } from "next/navigation";
import InvoiceActions from "./invoice-actions"; // "use client": Print / Copy Link

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  // ...existing invoice JSX, now reading `order` (a real DB record)...
}
```
- Drop the `loading`/`error`/`useEffect` client logic; add `app/invoice/[id]/not-found.tsx` for the "Invoice Not Found" UI.
- Optional: wrap `getOrder` with `'use cache'` (invoices are immutable) — needs `cacheComponents: true` in `next.config.ts`; `createOrderAction` already `revalidatePath`s for safety.

**7b. Control panel** ([daddys-home/page.tsx](app/pos/admin/secure/control-panel/daddys-home/page.tsx)) — stays `"use client"`; swap imports and `await` the calls.

- Replace the `@/lib/store` import block ([L37–45](app/pos/admin/secure/control-panel/daddys-home/page.tsx:37)) with imports from `@/app/pos/actions`:
  ```ts
  import {
    createProductAction, updateProductAction, deleteProductAction,
    orderExistsAction, createOrderAction, listProductsAction, listOrdersAction,
    verifyPasscode,
  } from "@/app/pos/actions";
  ```
- `fetchData()` ([L397](app/pos/admin/secure/control-panel/daddys-home/page.tsx:397)): `const productsData = await listProductsAction();` and use `await listOrdersAction();` (already `async` + `try/catch`).
- `addToCatalog()` ([L567](app/pos/admin/secure/control-panel/daddys-home/page.tsx:567)): make `async`; `await createProductAction(details)` / `await updateProductAction(...)`.
- `deleteFromCatalog()` ([L631](app/pos/admin/secure/control-panel/daddys-home/page.tsx:631)): make `async`; `await deleteProductAction(id)` (still guarded by `!id.startsWith("default-")`).
- `handleSendWhatsApp()` ([L648](app/pos/admin/secure/control-panel/daddys-home/page.tsx:648), already `async`): uniqueness loop calls `await orderExistsAction(tempId)`; replace `saveOrder({...})` ([L698](app/pos/admin/secure/control-panel/daddys-home/page.tsx:698)) with `await createOrderAction({...})`.
  - **Refinement:** move id generation + uniqueness into `createOrderAction` (retry on `orders_pkey` conflict) so the client stops making `orderExistsAction` round-trips.
- Add pending/error UX (reuse `isRefreshing` or `useTransition`) so a failed Action surfaces instead of throwing silently.

**7c. Delete `lib/store.ts`** once `grep -r "@/lib/store"` is clean (the invoice's `type StoredOrder` import now resolves from `@/lib/db`).

### Phase 8 — Secure the Server Actions (recommended, don't skip)
Today "auth" is a passcode compared server-side, then a flag in `sessionStorage`/`localStorage` ([L344–384](app/pos/admin/secure/control-panel/daddys-home/page.tsx:344)) — that gates the **UI only**. The new mutating Actions are reachable by anyone via raw POST. Fix:

1. In `verifyPasscode`, on success set a signed **`httpOnly`** cookie via `cookies()` (see `07-mutating-data.md` §Cookies), e.g. `pos_session = sign({ role, exp })`.
2. Add `lib/auth.ts` with `getSession()`, `requireStaff()`, `requireAdmin()` that verify the cookie and `throw new Error("Unauthorized")` otherwise.
3. Call the right `requireX()` at the top of every Action (Phase 6).
4. Keep the client flags only for **UX** (which tabs render); the cookie is the real gate.

> This is the passcode-based equivalent of Supabase Auth. If you later want per-staff logins, switch this cookie for Supabase Auth + RLS policies and add a browser client with the publishable key.

### Phase 9 — Migrate existing localStorage data (optional, one-time)
1. Temporary "Export data" button dumping `localStorage["dh_products"]` / `["dh_orders"]` to JSON.
2. Admin-only `importLegacyAction(json)` Server Action inserting via the db layer (idempotent on `id`).
3. Run once, verify counts in the Supabase dashboard, remove the button/action.

---

## 6. Testing & verification
- [ ] `npm run build` passes (strict TS — mind the sync→async return-type changes).
- [ ] Local `.env` set → `npm run dev`.
- [ ] Create a product → row appears in Supabase → Table Editor → `products`.
- [ ] Edit a **default** catalog item → it persists with a uuid id (not `default-*`).
- [ ] Complete a sale → `orders` + `order_items` written atomically; GST pseudo-item present.
- [ ] **Open the invoice URL in a different browser / incognito / phone → it renders.** ✅ core fix.
- [ ] Analytics tabs compute from DB-loaded orders.
- [ ] **RLS check:** with the *publishable/anon* key, `select * from products` via the REST endpoint returns **0 rows / permission denied** (proves the anon key is inert).
- [ ] Direct POST to a mutating Action without the session cookie → rejected (Phase 8).
- [ ] Money renders with 2 decimals (mapper returns `number`).

---

## 7. Deploy (Vercel + Supabase)
1. Add env vars to Vercel → Settings → Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret — **not** `NEXT_PUBLIC_`)
2. Optionally use the **Vercel ↔ Supabase** integration to sync env vars automatically.
3. Apply the schema to the project before first deploy — SQL Editor, or Supabase CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push        # applies supabase/migrations/*.sql
   ```
4. Deploy; smoke-test the invoice link from a phone on cellular (a device that never touched the POS).

---

## 8. File-change summary

| File | Change |
|---|---|
| `.env` / [.env.example](.env.example) | Add `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `package.json` | Add `@supabase/supabase-js` |
| `supabase/migrations/0001_init.sql` | **New** — tables, RLS enable, `create_order` RPC |
| `lib/supabase.ts` | **New** — server-only service-role client |
| `lib/db.ts` | **New** — types + async query fns (replaces store) |
| [lib/store.ts](lib/store.ts) | **Delete** after migration |
| `lib/auth.ts` | **New** (Phase 8) — session-cookie helpers |
| [app/pos/actions.ts](app/pos/actions.ts) | Add product/order Server Actions + set session cookie |
| [app/invoice/[id]/page.tsx](app/invoice/[id]/page.tsx) | Convert to async **Server Component**; add `invoice-actions.tsx` + `not-found.tsx` |
| [app/.../daddys-home/page.tsx](app/pos/admin/secure/control-panel/daddys-home/page.tsx) | Swap store imports → actions; `await` 6 call sites |

---

## 9. Sequencing (suggested PRs)
1. **PR-1 (infra):** deps, `.env.example`, `supabase/migrations/0001_init.sql`, `lib/supabase.ts`, `lib/db.ts`. No behavior change.
2. **PR-2 (reads):** invoice → Server Component; `listProductsAction`/`listOrdersAction` in `fetchData`.
3. **PR-3 (writes):** product + order Actions; wire control-panel call sites; delete `lib/store.ts`.
4. **PR-4 (security):** `lib/auth.ts`, session cookie, `requireX()` guards.
5. **PR-5 (optional):** legacy localStorage import tool.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Tables exposed via PostgREST + anon key** | Enable RLS on all tables with **no** policies; access DB only with the secret key server-side. Verified by the RLS test in §6. |
| **Secret key leaking to the browser** | Server-only via `import "server-only"` in `lib/supabase.ts`; env var has **no** `NEXT_PUBLIC_` prefix; never imported by a Client Component. |
| **Sync→async ripple** in the 3.7k-line client file | Only 6 call sites; all already inside `async` handlers/effects. `npm run build` after each. |
| **`numeric`/`int8` value types** | `num()` mapper coerces every money field to `number`; covered by a §6 test. Alternative: integer paise. |
| **Unauthenticated Server Actions** | Phase 8 signed cookie + `requireX()` guards — treat as must-ship before public use. |
| **Default catalog id collision** | `gen_random_uuid()` never emits `default-*`; branch logic preserved. |
| **Invoice id uniqueness race** | `orders.id` PRIMARY KEY; move generation into `createOrderAction` with insert-retry on conflict. |
| **Non-atomic order write** | `create_order` RPC wraps order + items in one transaction; `on conflict` makes it an idempotent upsert. |

---

## 11. Rollback
- Additive until PR-3 deletes `lib/store.ts`. To roll back, revert the import swap in the two consumers — `lib/store.ts` (localStorage) still works standalone. Supabase tables are independent and can be left in place or dropped.

---

## 12. Definition of done
- [ ] All product/order reads and writes go through Supabase; `lib/store.ts` deleted.
- [ ] Invoice links open correctly on a device that never touched the POS.
- [ ] RLS enabled; anon/publishable key can read/write nothing.
- [ ] Mutating Server Actions reject unauthenticated requests.
- [ ] `npm run build` + `npm run lint` clean; §6 smoke tests pass.
- [ ] Env vars set in local, Preview, and Production.
