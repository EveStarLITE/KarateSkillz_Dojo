const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { sendEmail } = require('../services/emailService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid registration payload' });
    const { email, password, firstName, lastName } = parsed.data;
    const emailNorm = email.trim().toLowerCase();

    const existing = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [emailNorm]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const id = `u-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const profileJson = JSON.stringify({ firstName, lastName, phone: '' });

    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, verified, profile)
       VALUES ($1, $2, $3, 'customer', false, $4::jsonb)`,
      [id, emailNorm, passwordHash, profileJson]
    );

    const token = jwt.sign({ sub: id, type: 'verify' }, JWT_SECRET, { expiresIn: '1d' });
    await sendEmail({
      to: emailNorm,
      subject: 'Verify your Karate Skillz Dojo account',
      text: `Verify your account: http://localhost:5173/verify-email?token=${token}`,
      html: `<p>Verify your account:</p><p><a href="http://localhost:5173/verify-email?token=${token}">Verify Email</a></p>`,
    });
    return res.status(201).json({ message: 'Registered. Please verify your email.' });
  } catch (err) {
    return next(err);
  }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).json({ message: 'Missing token' });
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'verify') return res.status(400).json({ message: 'Invalid token type' });

    const updated = await pool.query('UPDATE users SET verified = true WHERE id = $1 RETURNING id', [payload.sub]);
    if (!updated.rowCount) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Email verified' });
  } catch (error) {
    if (error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid login payload' });

    const { rows } = await pool.query(
      'SELECT id, email, password_hash, role, verified, profile FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [parsed.data.email.trim()]
    );
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const row = rows[0];
    const valid = await bcrypt.compare(parsed.data.password, row.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const profile = row.profile || { firstName: '', lastName: '', phone: '' };
    const token = jwt.sign({ sub: row.id, role: row.role }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({
      token,
      user: { id: row.id, email: row.email, role: row.role, verified: row.verified, profile },
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

router.get('/me', requireAuth, (req, res) => {
  const user = req.user;
  res.json({ id: user.id, email: user.email, role: user.role, verified: user.verified, profile: user.profile });
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [parsed.data.email.trim()]
    );
    const user = rows[0];
    if (user) {
      const token = jwt.sign({ sub: user.id, type: 'reset' }, JWT_SECRET, { expiresIn: '30m' });
      await sendEmail({
        to: user.email,
        subject: 'Karate Skillz Dojo password reset',
        text: `Reset password: http://localhost:5173/reset-password?token=${token}`,
        html: `<p>Reset your password:</p><p><a href="http://localhost:5173/reset-password?token=${token}">Reset Password</a></p>`,
      });
    }
    res.json({ message: 'If the account exists, a reset email has been sent.' });
  } catch (err) {
    return next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const schema = z.object({ token: z.string().min(1), password: z.string().min(8) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

    const payload = jwt.verify(parsed.data.token, JWT_SECRET);
    if (payload.type !== 'reset') return res.status(400).json({ message: 'Invalid reset token' });

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const updated = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id', [
      passwordHash,
      payload.sub,
    ]);
    if (!updated.rowCount) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    return next(error);
  }
});

module.exports = router;
