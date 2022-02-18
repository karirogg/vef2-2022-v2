import { readFile } from 'fs/promises';
import pg from 'pg';
import { createSlug } from './utils.js';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';

const { DATABASE_URL: connectionString, NODE_ENV: nodeEnv = 'development' } =
  process.env;

if (!connectionString) {
  console.error('vantar DATABASE_URL í .env');
  process.exit(-1);
}

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development
// mode, á heroku, ekki á local vél
const ssl = nodeEnv === 'production' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    console.error('unable to get client from pool', e);
    return null;
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    if (nodeEnv !== 'test') {
      console.error('unable to query', e);
    }
    return null;
  } finally {
    client.release();
  }
}

export async function createSchema(schemaFile = SCHEMA_FILE) {
  const data = await readFile(schemaFile);

  return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
  const data = await readFile(dropFile);

  return query(data.toString('utf-8'));
}

export async function end() {
  await pool.end();
}

/* TODO útfæra aðgeðir á móti gagnagrunni */

export async function createEvent({ name, description }) {
  const q = `
    INSERT INTO events
      (name, slug, description, created, updated)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING *`;

  const values = [name, createSlug(name), description, new Date(), new Date()];

  const result = await query(q, values);

  return result !== null;
}

export async function editEvent({ name, description, oldSlug }) {
  const q = `
    UPDATE events
      SET name = $1,
          slug = $2,
          description = $3,
          updated = $4
    WHERE slug = $5;
  `;

  const values = [name, createSlug(name), description, new Date(), oldSlug];

  const result = await query(q, values);

  return result !== null;
}

export async function listEvents() {
  const events = await query('SELECT * FROM public.events');

  return events.rows;
}

export async function getEvent(slug) {
  const events = await query('SELECT * FROM public.events WHERE slug=$1', [
    slug,
  ]);

  if (events.length === 0) return null;

  return events.rows[0];
}

export async function registerForEvent({ name, comment, eventID }) {
  const q = `
    INSERT INTO registrations
      (name, comment, event, created)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *`;

  const values = [name, comment, eventID, new Date()];

  const result = await query(q, values);

  return result !== null;
}

export async function getRegistrationsForEvent(eventID) {
  const q = `
    SELECT * FROM registrations
      WHERE event=$1
  `;

  const registrations = await query(q, [eventID]);

  return registrations.rows;
}
