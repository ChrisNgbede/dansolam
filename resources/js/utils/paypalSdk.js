/**
 * Loads PayPal's JS SDK once with both on-page buttons and card fields, so the
 * card form, the PayPal popup and (when the account allows it) inline card fields
 * all share one script.
 */
let sdkPromise = null;

export function loadPayPalSdk({ clientId, currency, intent }) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.paypal?.Buttons && window.paypal?.CardFields) return Promise.resolve(window.paypal);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      'client-id': clientId,
      components: 'buttons,card-fields',
      currency,
      intent: (intent || 'CAPTURE').toLowerCase(),
      'enable-funding': 'card',
    });
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.namespace = 'paypal';
    script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error('PayPal did not load')));
    script.onerror = () => { sdkPromise = null; reject(new Error('Could not load PayPal. Check your connection and try again.')); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export async function fetchPayPalConfig() {
  const res = await fetch('/api/paypal/client-config');
  return (await res.json())?.data;
}

/** Capture an approved PayPal order on our server. */
export async function capturePayPalOrder(paypalOrderId, orderNumber) {
  const res = await fetch('/api/paypal/capture-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ paypal_order_id: paypalOrderId, order_number: orderNumber }),
  });
  return res.json().catch(() => ({ success: false, message: 'We could not confirm the payment. Please contact us before trying again.' }));
}
