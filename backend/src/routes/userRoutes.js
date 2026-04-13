const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().min(7).max(20),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid profile payload' });

    const profileJson = JSON.stringify(parsed.data);
    const { rows } = await pool.query(
      'UPDATE users SET profile = $1::jsonb WHERE id = $2 RETURNING profile',
      [profileJson, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    req.user.profile = rows[0].profile;
    return res.json({ message: 'Profile updated', profile: rows[0].profile });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
