// Shared Postgres helper for all serverless endpoints.
// Uses node-postgres (pg) with the connection string from DATABASE_URL (Neon).

const { Pool } = require('pg');
const seed = require('../src/utils/seed.json');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 8000
    });
  }
  return pool;
}

// One-time table creation + default seeding (idempotent, runs on first request
// of each cold start; cheap because of IF NOT EXISTS guards).
let schemaReady = null;

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS toppings (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL
        );
      `);

      // Seed defaults only when tables are empty (never overwrites admin edits)
      const seedTable = async (table, rows) => {
        const { rows: existing } = await db.query(`SELECT 1 FROM ${table} LIMIT 1`);
        if (existing.length === 0 && rows.length > 0) {
          for (const row of rows) {
            await db.query(
              `INSERT INTO ${table} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
              [row.id, JSON.stringify(row)]
            );
          }
        }
      };

      await seedTable('products', seed.products);
      await seedTable('toppings', seed.toppings);
      await seedTable('reviews', seed.reviews);

      const { rows: settingsRows } = await db.query('SELECT 1 FROM settings LIMIT 1');
      if (settingsRows.length === 0) {
        await db.query('INSERT INTO settings (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [
          'store',
          JSON.stringify(seed.settings)
        ]);
      }
    })().catch((err) => {
      schemaReady = null; // allow retry on next request
      throw err;
    });
  }
  return schemaReady;
}

// Mutating requests must carry the admin key (kept simple on purpose for
// this app; tighten later if the API needs to be locked down further).
function isAuthorized(req) {
  return req.headers['x-admin-key'] === 'zohar123';
}

module.exports = { getPool, ensureSchema, isAuthorized };
