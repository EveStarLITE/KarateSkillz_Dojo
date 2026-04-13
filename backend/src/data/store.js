const inventory = require('../../inventory');

const products = inventory
  .filter((item) => item.kind === 'product')
  .map((item, idx) => ({ ...item, price: [49.99, 89.99, 129.99][idx], imageUrl: ['/assets/gi.svg', '/assets/combat-gear.svg', '/assets/flaming-knucks.svg'][idx] }));

const services = inventory
  .filter((item) => item.kind === 'service')
  .map((item, idx) => ({ ...item, price: [110, 60, 999][idx], imageUrl: ['/assets/private-lessons.svg', '/assets/group-sessions.svg', '/assets/lifetime-membership.svg'][idx] }));

const tickets = [];

module.exports = {
  products,
  services,
  tickets,
};
