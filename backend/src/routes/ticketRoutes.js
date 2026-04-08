const express = require('express');
const { z } = require('zod');
const { tickets } = require('../data/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const statusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);

function enrichTicket(ticket) {
  const created = new Date(ticket.createdAt).getTime();
  const resolved = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : null;
  const resolutionTimeMs =
    resolved != null && !Number.isNaN(resolved) && !Number.isNaN(created) ? resolved - created : null;
  return {
    ...ticket,
    resolutionTimeMs: resolutionTimeMs != null && resolutionTimeMs >= 0 ? resolutionTimeMs : null,
  };
}

router.post('/', requireAuth, (req, res) => {
  const schema = z.object({
    subject: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    category: z.enum(['billing', 'account', 'order', 'general']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid ticket payload' });

  const now = new Date().toISOString();
  const ticket = {
    id: `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: req.user.id,
    subject: parsed.data.subject,
    description: parsed.data.description,
    category: parsed.data.category || 'general',
    status: 'open',
    adminNote: '',
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };
  tickets.push(ticket);
  return res.status(201).json(enrichTicket(ticket));
});

router.get('/', requireAuth, (req, res) => {
  let list;
  if (req.user.role === 'admin') {
    list = [...tickets];
  } else {
    list = tickets.filter((t) => t.userId === req.user.id);
  }
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list.map(enrichTicket));
});

router.get('/:id', requireAuth, (req, res) => {
  const ticket = tickets.find((t) => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(enrichTicket(ticket));
});

router.patch('/:id', requireAuth, requireAdmin, (req, res) => {
  const schema = z.object({
    status: statusEnum.optional(),
    adminNote: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid update payload' });

  const ticket = tickets.find((t) => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  const now = new Date().toISOString();
  if (parsed.data.adminNote !== undefined) ticket.adminNote = parsed.data.adminNote;

  if (parsed.data.status !== undefined) {
    const next = parsed.data.status;
    const terminal = next === 'resolved' || next === 'closed';

    ticket.status = next;
    if (terminal && !ticket.resolvedAt) {
      ticket.resolvedAt = now;
    }
    if (next === 'open') {
      ticket.resolvedAt = null;
    }
  }

  ticket.updatedAt = now;
  res.json(enrichTicket(ticket));
});

module.exports = router;
