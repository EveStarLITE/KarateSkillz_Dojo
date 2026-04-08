const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.patch('/me', requireAuth, (req, res) => {
  const schema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(7).max(20),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid profile payload' });
  req.user.profile = parsed.data;
  return res.json({ message: 'Profile updated', profile: req.user.profile });
});

module.exports = router;
