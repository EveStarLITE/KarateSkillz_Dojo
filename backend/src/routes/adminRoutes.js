const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { mapOrderRow } = require('../db/mapOrderRow');
const { products, services } = require('../data/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/summary', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM orders) AS orders,
        (SELECT COUNT(*)::int FROM orders WHERE status = $1) AS pending_orders,
        (SELECT COALESCE(SUM(subtotal), 0) FROM orders) AS revenue`,
      ['pending']
    );
    const row = rows[0];
    res.json({
      users: row.users,
      orders: row.orders,
      pendingOrders: row.pending_orders,
      mockRevenue: Number(row.revenue).toFixed(2),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, role, verified, profile FROM users ORDER BY email ASC'
    );
    res.json(
      rows.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        verified: user.verified,
        profile: user.profile || { firstName: '', lastName: '', phone: '' },
      }))
    );
  } catch (err) {
    return next(err);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows.map(mapOrderRow));
  } catch (err) {
    return next(err);
  }
});

router.patch('/orders/:id', async (req, res, next) => {
  try {
    const schema = z.object({ status: z.enum(['pending', 'paid', 'processing', 'completed', 'cancelled']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid status payload' });

    const { rows } = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 OR order_number = $2 RETURNING *`,
      [parsed.data.status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    return res.json(mapOrderRow(rows[0]));
  } catch (err) {
    return next(err);
  }
});

router.get('/products', (req, res) => res.json(products));
router.get('/services', (req, res) => res.json(services));

router.post('/products', (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().min(5),
    price: z.number().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid product payload' });
  const product = { id: Date.now(), kind: 'product', imageUrl: '/vite.svg', ...parsed.data };
  products.push(product);
  return res.status(201).json(product);
});

router.put('/products/:id', (req, res) => {
  const product = products.find((item) => String(item.id) === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  Object.assign(product, req.body);
  return res.json(product);
});

router.post('/services', (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().min(5),
    price: z.number().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid service payload' });
  const service = { id: Date.now(), kind: 'service', imageUrl: '/vite.svg', ...parsed.data };
  services.push(service);
  return res.status(201).json(service);
});

router.put('/services/:id', (req, res) => {
  const service = services.find((item) => String(item.id) === req.params.id);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  Object.assign(service, req.body);
  return res.json(service);
});

module.exports = router;
