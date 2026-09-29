import pg from 'pg';
import { initialCatalog } from '../src/utils/defaults.js';
let pool;
let ready;
export async function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  pool ||= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000, allowExitOnIdle: true });
  ready ||= initialize(pool).catch(error => { ready = undefined; throw error; });
  await ready;
  return pool;
}
export async function initialize(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS zohar_catalog (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL, revision bigint NOT NULL DEFAULT 0, imported boolean NOT NULL DEFAULT false)`);
  await db.query(`INSERT INTO zohar_catalog (id, data) VALUES (1, $1::jsonb) ON CONFLICT DO NOTHING`, [JSON.stringify(initialCatalog)]);
  await db.query(`CREATE TABLE IF NOT EXISTS zohar_orders (id text PRIMARY KEY, owner text NOT NULL, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);
}
