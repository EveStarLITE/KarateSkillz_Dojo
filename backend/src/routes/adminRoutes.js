const express = require('express');
const { z } = require('zod');
const { orders, users, products, services } = require('../data/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/summary', (req, res) => {
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const revenue = orders.reduce((sum, order) => sum + order.subtotal, 0);
  res.json({
    users: users.length,
    orders: orders.length,
    pendingOrders,
    mockRevenue: revenue.toFixed(2),
  });
});

router.get('/users', (req, res) => {
  res.json(
    users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      verified: user.verified,
      profile: user.profile,
    }))
  );
});

router.get('/orders', (req, res) => res.json(orders));

router.patch('/orders/:id', (req, res) => {
  const schema = z.object({ status: z.enum(['pending', 'paid', 'processing', 'completed', 'cancelled']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid status payload' });
  const order = orders.find((item) => item.id === req.params.id || item.orderNumber === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.status = parsed.data.status;
  return res.json(order);
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
