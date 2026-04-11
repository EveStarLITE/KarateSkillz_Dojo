const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const { orders } = require('../data/store');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const {
  collectPrivateLessonBookings,
  normalizePreferredTime,
  PRIVATE_LESSON_SLOT_TIMES,
} = require('../utils/privateLessonSlots');

const router = express.Router();

const orderSchema = z.object({
  items: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
      type: z.enum(['product', 'service']),
      options: z.any().optional(),
    })
  ).min(1),
  billing: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
  }),
  paymentMethod: z.enum(['paypal', 'card']),
  paymentPayload: z.record(z.string(), z.any()).optional(),
});

router.post('/', async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid order payload' });

  const bookedKeys = new Set(
    collectPrivateLessonBookings(orders).map((b) => `${b.date}|${b.time}`)
  );
  for (const item of parsed.data.items) {
    if (item.type !== 'service' || String(item.id) !== '4') continue;
    const d = item.options?.preferredDate;
    const t = normalizePreferredTime(item.options?.preferredTime);
    if (!d || !t) {
      return res.status(400).json({ message: 'Private lessons require a preferred date and time.' });
    }
    if (!PRIVATE_LESSON_SLOT_TIMES.includes(t)) {
      return res.status(400).json({ message: 'Invalid private lesson time slot.' });
    }
    const key = `${d}|${t}`;
    if (bookedKeys.has(key)) {
      return res.status(409).json({
        message: `That private lesson slot (${d} at ${t}) is already booked. Please choose another time.`,
      });
    }
    bookedKeys.add(key);
  }

  const orderNumber = `KSD-${Date.now()}`;
  const paymentReference = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const subtotal = parsed.data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const authHeader = req.headers.authorization || '';
  let userId = null;
  if (authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      userId = payload.sub || null;
    } catch (error) {
      userId = null;
    }
  }

  const order = {
    id: `o-${Date.now()}`,
    orderNumber,
    paymentReference,
    status: 'pending',
    createdAt: new Date().toISOString(),
    userId,
    ...parsed.data,
    subtotal,
  };
  orders.push(order);

  await sendEmail({
    to: parsed.data.billing.email,
    subject: `Order confirmation ${orderNumber}`,
    text: `Thank you for your order. Ref: ${paymentReference}`,
    html: `<p>Order <strong>${orderNumber}</strong> confirmed.</p><p>Payment reference: ${paymentReference}</p>`,
  });
  if (process.env.ADMIN_ORDER_NOTIFY_TO) {
    await sendEmail({
      to: process.env.ADMIN_ORDER_NOTIFY_TO,
      subject: `New order ${orderNumber}`,
      text: `New order placed. Ref: ${paymentReference}`,
      html: `<p>New order ${orderNumber}.</p>`,
    });
  }

  res.status(201).json(order);
});

router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'admin') return res.json(orders);
  return res.json(orders.filter((order) => order.userId === req.user.id));
});

router.get('/:id', requireAuth, (req, res) => {
  const order = orders.find((item) => item.id === req.params.id || item.orderNumber === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (req.user.role !== 'admin' && order.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(order);
});

module.exports = router;
