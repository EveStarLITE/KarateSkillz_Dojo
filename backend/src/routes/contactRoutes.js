const express = require('express');
const { z } = require('zod');
const { sendEmail, escape } = require('../services/emailService');

const router = express.Router();

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    message: z.string().min(5).max(1000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid contact payload' });
  const { name, email, message } = parsed.data;
  const safeName = escape(name);
  const safeEmail = escape(email);
  const safeMessage = escape(message);
  await sendEmail({
    to: process.env.CONTACT_TO || 'admin@karateskillzdojo.com',
    subject: 'New contact message - Karate Skillz Dojo',
    text: `From ${safeName} (${safeEmail}): ${safeMessage}`,
    html: `<p><strong>From:</strong> ${safeName} (${safeEmail})</p><p>${safeMessage}</p>`,
  });
  res.json({ message: 'Message sent successfully' });
});

module.exports = router;
