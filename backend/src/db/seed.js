const bcrypt = require('bcryptjs');
const { pool } = require('./pool');

const DEFAULT_ADMIN_ID = 'u-admin-1';
const DEFAULT_ADMIN_EMAIL = 'admin@karateskillzdojo.com';

async function ensureDefaultAdmin() {
  const passwordHash = bcrypt.hashSync('AdminPass123!', 10);
  const profile = JSON.stringify({ firstName: 'Dojo', lastName: 'Admin', phone: '' });

  await pool.query(
    `INSERT INTO users (id, email, password_hash, role, verified, profile)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ON CONFLICT (email) DO NOTHING`,
    [DEFAULT_ADMIN_ID, DEFAULT_ADMIN_EMAIL, passwordHash, 'admin', true, profile]
  );
}

module.exports = { ensureDefaultAdmin };
