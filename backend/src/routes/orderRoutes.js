const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { mapOrderRow } = require('../db/mapOrderRow');
const { requireAuth, getBearerToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

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

router.post('/', async (req, res, next) => {
  try {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid order payload' });

    const orderNumber = `KSD-${Date.now()}`;
    const paymentReference = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const subtotal = parsed.data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    let userId = null;
    const bearer = getBearerToken(req);
    if (bearer) {
      try {
        const payload = jwt.verify(bearer, JWT_SECRET);
        const candidate = payload.sub || null;
        if (candidate) {
          const exists = await pool.query('SELECT 1 FROM users WHERE id = $1 LIMIT 1', [candidate]);
          if (exists.rows.length) userId = candidate;
        }
      } catch {
        userId = null;
      }
    }

    const id = `o-${Date.now()}`;
    const itemsJson = JSON.stringify(parsed.data.items);
    const billingJson = JSON.stringify(parsed.data.billing);
    const paymentPayloadJson =
      parsed.data.paymentPayload != null ? JSON.stringify(parsed.data.paymentPayload) : null;

    const { rows } = await pool.query(
      `INSERT INTO orders (
        id, order_number, payment_reference, status, user_id,
        items, billing, payment_method, payment_payload, subtotal
      ) VALUES ($1, $2, $3, 'pending', $4, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9)
      RETURNING *`,
      [
        id,
        orderNumber,
        paymentReference,
        userId,
        itemsJson,
        billingJson,
        parsed.data.paymentMethod,
        paymentPayloadJson,
        subtotal,
      ]
    );

    const order = mapOrderRow(rows[0]);

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

    return res.status(201).json(order);
  } catch (err) {
    return next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    } else {
      result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    }
    return res.json(result.rows.map(mapOrderRow));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 OR order_number = $1 LIMIT 1',
      [req.params.id]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Order not found' });
    const order = mapOrderRow(row);
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.json(order);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
