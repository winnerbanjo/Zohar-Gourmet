# Zohar Gourmet

React/Vite storefront with a Vercel Function and shared PostgreSQL storage. Admin edits are saved on the server and appear on other devices on the next refresh (normally within 10 seconds). Tabs also refresh when brought back into focus or reconnected. Failed requests never fall back to saving changes only on a phone.

## Vercel setup — required before deploying this change

1. In the existing Vercel project, open **Storage** and connect a **Neon Postgres** database from the marketplace. Make sure the production environment has `DATABASE_URL`. Use a separate database for Preview/Development so test edits cannot change the live store.
2. Add server environment variables in **Settings → Environment Variables**:
   - `ADMIN_PASSCODE`: a long, private staff passcode. The previous client-side passcode is no longer used.
   - `SESSION_SECRET`: a random secret of at least 32 bytes (generate with `openssl rand -hex 32`).
3. Deploy this code after those variables exist. Keep the Vite framework preset, `npm run build` command, and `dist` output directory. Vercel serves `api/store.js` as a Node function. Do not add a catch-all rewrite that sends `/api/*` to `index.html`.
4. The API creates its tables on first access. The database user must be allowed to create tables. Later deployments preserve all saved data.

Never prefix these variables with `VITE_`, commit actual secrets, or paste database credentials into chat. Missing storage configuration shows a connection error, not an apparently working device-only store.

References: [Vercel Postgres integrations](https://vercel.com/docs/postgres), [Node functions](https://vercel.com/docs/functions/runtimes/node-js).

## Keep the changes already on the main phone

Before making any new shared edits, open the **same website address in the same browser on the main phone** used for the old admin. Browser storage for `zohar-gourmet.vercel.app` is separate from storage for `www.houseofzohargourmet.com`.

Log in to Admin using the newly configured passcode. Open **Shop Settings → Import this phone’s store**. This publishes the phone’s products, images, toppings, reviews, and store settings to the shared database. It is available only before the first shared edit and can run once. It does not clear any existing browser storage. Old device-only orders stay on that phone and are not imported; new orders are saved centrally.

Do not clear browser storage before import. Other phones do not automatically upload their old copies.

## Local development and verification

```sh
npm install
npm test
npm run build
```

For a complete local app, use Vercel CLI `vercel dev` with a development PostgreSQL database and the environment variables from `.env.example`. Plain `npm run dev` serves only the frontend, so the API will not be available.

Tests use an isolated embedded PostgreSQL engine. They verify shared edits across separate simulated clients, one-time migration, rejected stale writes, login/logout, private order access, order status updates, validation rollback, and persistence across initialization. They do not replace a production smoke test.

## Operational details

- Products, toppings, reviews, and settings live in `zohar_catalog`; each checkout has its own `zohar_orders` row. Catalog updates use a database transaction and revision check to prevent stale writes.
- Admin authentication is checked on the server using a signed, HTTP-only, 12-hour cookie. Customers can read only their browser’s orders; receipt images require admin access. Order lists show the newest 200 orders.
- API responses bypass browser and CDN caching. Receipt images are fetched separately rather than embedded in every polling response.
- Catalog data is limited to 2.5 MB, and each order/receipt to 2.5 MB, to stay below Vercel’s function payload limits. Use small compressed images or HTTPS image URLs. Larger catalogs should move uploads to dedicated object storage.
- Store setup/import and editing require a working connection. Admin edits return an explicit error on a conflict instead of silently overwriting another edit; reload and review before retrying.
- Existing checkout pricing remains client-calculated; this change does not add a payment gateway or server-side menu pricing verification. Confirm payment and totals before fulfilling orders.

After deployment, save a small menu change on the main phone and verify it appears on a second device; then place a test order and confirm it appears in admin. Keep both devices online.
