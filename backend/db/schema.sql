-- PostgreSQL schema for Karate Skillz Dojo API (users + orders).
-- Run once on your server, or use as reference if tables already exist with compatible columns.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  verified BOOLEAN NOT NULL DEFAULT false,
  profile JSONB NOT NULL DEFAULT '{"firstName":"","lastName":"","phone":""}'::jsonb
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  payment_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  billing JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  payment_payload JSONB,
  subtotal NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
