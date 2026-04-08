const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { users } = require('../data/store');
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

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid registration payload' });
  const { email, password, firstName, lastName } = parsed.data;
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email already in use' });
  }
  const user = {
    id: `u-${Date.now()}`,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'customer',
    verified: false,
    profile: { firstName, lastName, phone: '' },
  };
  users.push(user);
  const token = jwt.sign({ sub: user.id, type: 'verify' }, JWT_SECRET, { expiresIn: '1d' });
  await sendEmail({
    to: user.email,
    subject: 'Verify your Karate Skillz Dojo account',
    text: `Verify your account: http://localhost:5173/verify-email?token=${token}`,
    html: `<p>Verify your account:</p><p><a href="http://localhost:5173/verify-email?token=${token}">Verify Email</a></p>`,
  });
  return res.status(201).json({ message: 'Registered. Please verify your email.' });
});

router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'verify') return res.status(400).json({ message: 'Invalid token type' });
    const user = users.find((item) => item.id === payload.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.verified = true;
    return res.json({ message: 'Email verified' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
});

router.post('/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid login payload' });
  const user = users.find((item) => item.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, verified: user.verified, profile: user.profile },
  });
});

router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

router.get('/me', requireAuth, (req, res) => {
  const user = req.user;
  res.json({ id: user.id, email: user.email, role: user.role, verified: user.verified, profile: user.profile });
});

router.post('/forgot-password', async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });
  const user = users.find((item) => item.email.toLowerCase() === parsed.data.email.toLowerCase());
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
});

router.post('/reset-password', async (req, res) => {
  const schema = z.object({ token: z.string().min(1), password: z.string().min(8) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });
  try {
    const payload = jwt.verify(parsed.data.token, JWT_SECRET);
    if (payload.type !== 'reset') return res.status(400).json({ message: 'Invalid reset token' });
    const user = users.find((item) => item.id === payload.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});

module.exports = router;
