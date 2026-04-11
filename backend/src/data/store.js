const bcrypt = require('bcryptjs');
const inventory = require('../../inventory');

const products = inventory
  .filter((item) => item.kind === 'product')
  .map((item, idx) => ({
    ...item,
    price: [49.99, 89.99, 129.99][idx],
    imageUrl: ['/assets/gi.svg', '/assets/combat-gear.svg', '/assets/flaming-knucks.svg'][idx],
  }));

const services = inventory
  .filter((item) => item.kind === 'service')
  .map((item, idx) => ({
    ...item,
    price: [110, 60, 999][idx],
    imageUrl: ['/assets/private-lessons.svg', '/assets/group-sessions.svg', '/assets/lifetime-membership.svg'][idx],
  }));

const users = [];
const orders = [];
const tickets = [];

function createDefaultAdminIfMissing() {
  const existing = users.find((user) => user.email === 'admin@karateskillzdojo.com');
  if (existing) return;
  users.push({
    id: 'u-admin-1',
    email: 'admin@karateskillzdojo.com',
    passwordHash: bcrypt.hashSync('AdminPass123!', 10),
    role: 'admin',
    verified: true,
    profile: { firstName: 'Dojo', lastName: 'Admin', phone: '' },
  });
}

module.exports = {
  products,
  services,
  users,
  orders,
  tickets,
  createDefaultAdminIfMissing,
};
