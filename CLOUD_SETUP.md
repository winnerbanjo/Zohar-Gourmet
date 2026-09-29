# Zohar Gourmet — Cloud Sync Setup

Changes made in the admin panel (stock, prices, products, settings) now appear
on **every device** — phones, tablets, laptops — within seconds. This replaces
the old per-device `localStorage` storage that made each phone show different
data.

## How it works

```
Phone A (Admin) ──┐
Phone B (Store) ──┼──▶ Vercel Serverless API ──▶ Neon Postgres (single truth)
Phone C (Store) ──┘         ▲    │
        every 4s: poll /api/changes and refetch only what changed
```

- `src/utils/database.js` — cloud-backed data layer. localStorage is now only
  an instant-render cache/offline fallback, never the source of truth.
- `api/*.js` — Vercel serverless functions (Node, CommonJS) backed by Postgres.
- Reads are open. Writes require the `X-Admin-Key: zohar123` header
  (same value as the admin passcode). Customers may still create orders and
  track them.

## One-time setup (Vercel + Neon)

1. **Database (Neon):** Sign in at [neon.com](https://neon.com) with GitHub and
   create a project (free tier is enough). Copy the **pooled connection
   string** (looks like `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`).
2. **Vercel:** Import the repo at [vercel.com/new](https://vercel.com/new)
   (or it may already be imported). Then go to
   **Project → Settings → Environment Variables** and add:
   - Name: `DATABASE_URL`
   - Value: the Neon pooled connection string
   - Environments: Production, Preview, Development
3. **Deploy.** On the first request, the API creates its tables and seeds the
   default catalog automatically (`CREATE TABLE IF NOT EXISTS` + seed-if-empty).
4. **Migrate your current data (do this once from the admin phone):** after
   deploying, open the site and run this in the browser console
   (or ask me to add a button in admin settings):
   ```js
   window.__zoharMigrate = true;
   (async () => {
     const mod = await import('/src/utils/database.js');
     await mod.database.migrateLocalToCloud();
     alert('Uploaded! All devices now share this data.');
   })();
   ```
   > Note: `migrateLocalToCloud` overwrites cloud rows with this device's local
   > copy, so run it from the phone that has the correct/current data.

### Local development

With a real `DATABASE_URL` in `.env.local`, `npm run dev` hits Vercel-style
`/api/*` routes... but plain Vite does not serve them. For a fully working dev
setup either:
- use `vercel dev` (pulls the project + env: `npx vercel link`, `npx vercel env pull`), or
- point the client at a deployed Preview URL.

## What changed where

| File | Change |
| --- | --- |
| `src/utils/database.js` | Rewritten: cloud-first with localStorage cache, 4s polling sync, subscribe API |
| `src/utils/seed.json` | New shared seed data (used by client + API) |
| `api/db.js`, `api/{products,toppings,reviews,orders,settings,changes,reset}.js` | New serverless endpoints |
| `src/App.jsx` | Starts `database.startSync()` |
| `src/pages/Storefront.jsx` | Subscribes to live updates; checkout is async; tracker reads cloud |
| `src/pages/Admin.jsx` | All mutations async with error alerts; badge now says "Cloud Sync Active" |
| `src/components/Customizer.jsx` | Subscribes to topping updates |
| `eslint.config.js` | `api/` files lint as Node (CommonJS globals) |
| `package.json` | Added `pg` dependency |

## Known limits / next steps

- Polling every 4s is fine at this scale; switch to Neon+Vercel WebSockets or
  SSE later if you want instant push.
- Receipt images are stored inline in the orders JSON — fine for now, but move
  to object storage (Vercel Blob) if they grow.
- `migrateLocalToCloud` should be run once, then removed from the UI surface to
  avoid accidental overwrites.
