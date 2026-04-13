const { Pool } = require('pg');

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_PORT,
  DB_NAME,
  DB_SSL,
  DB_SSL_REJECT_UNAUTHORIZED,
} = process.env;

function buildPoolConfig() {
  const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_PORT', 'DB_NAME'].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }

  const port = Number(DB_PORT);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('DB_PORT must be a positive number');
  }

  const useSsl = String(DB_SSL || '').toLowerCase() === 'true' || DB_SSL === '1';
  const ssl = useSsl
    ? {
        rejectUnauthorized: String(DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false',
      }
    : undefined;

  return {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port,
    database: DB_NAME,
    ...(ssl ? { ssl } : {}),
  };
}

const pool = new Pool(buildPoolConfig());

module.exports = { pool };
