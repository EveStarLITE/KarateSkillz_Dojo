require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { requestLogger, errorHandler, notFoundHandler } = require('./src/middleware/http');
const authRoutes = require('./src/routes/authRoutes');
const catalogRoutes = require('./src/routes/catalogRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');
const { ensureDefaultAdmin } = require('./src/db/seed');

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestLogger);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'Karate Skillz Dojo API' });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/contact', authLimiter, contactRoutes);
app.use('/api/v1', catalogRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await ensureDefaultAdmin();
  app.listen(PORT, () => {
    console.log(`Karate Skillz Dojo API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Server failed to start', err);
  process.exit(1);
});
