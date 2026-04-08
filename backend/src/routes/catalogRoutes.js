const express = require('express');
const { products, services } = require('../data/store');

const router = express.Router();

router.get('/products', (req, res) => res.json(products));
router.get('/products/:id', (req, res) => {
  const item = products.find((product) => String(product.id) === req.params.id);
  if (!item) return res.status(404).json({ message: 'Product not found' });
  return res.json(item);
});

router.get('/services', (req, res) => res.json(services));
router.get('/services/:id', (req, res) => {
  const item = services.find((service) => String(service.id) === req.params.id);
  if (!item) return res.status(404).json({ message: 'Service not found' });
  return res.json(item);
});

module.exports = router;
