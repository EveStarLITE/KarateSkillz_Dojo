const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7);
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const { rows } = await pool.query(
      'SELECT id, email, role, verified, profile FROM users WHERE id = $1 LIMIT 1',
      [payload.sub]
    );
    if (!rows.length) return res.status(401).json({ message: 'Invalid token user' });
    const row = rows[0];
    req.user = {
      id: row.id,
      email: row.email,
      role: row.role,
      verified: row.verified,
      profile: row.profile || { firstName: '', lastName: '', phone: '' },
    };
    return next();
  } catch (error) {
    if (error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    if (error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, getBearerToken };
