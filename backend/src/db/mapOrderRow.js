function mapOrderRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    paymentReference: row.payment_reference,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    userId: row.user_id,
    items: row.items,
    billing: row.billing,
    paymentMethod: row.payment_method,
    paymentPayload: row.payment_payload ?? undefined,
    subtotal: Number(row.subtotal),
  };
}

module.exports = { mapOrderRow };
