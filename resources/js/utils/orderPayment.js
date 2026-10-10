const SETTLED = ['paid', 'authorized', 'refunded', 'partially_refunded'];

/** True when the customer still has to pay for this order online or by transfer. */
export function needsPayment(order) {
  if (!order) return false;
  return !SETTLED.includes(order.payment_status)
    && order.order_status !== 'cancelled'
    && order.payment_method !== 'cash_on_delivery';
}

export function payOrderUrl(order, contact) {
  const email = contact || order?.customer_email;
  return `/pay/${encodeURIComponent(order.order_number)}${email ? `?contact=${encodeURIComponent(email)}` : ''}`;
}
