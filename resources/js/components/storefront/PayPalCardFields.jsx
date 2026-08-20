import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Lock, AlertCircle } from 'lucide-react';

/**
 * Inline PayPal Advanced (Debit/Credit) card form.
 *
 * Renders PayPal's hosted CardFields directly in the checkout modal so the buyer
 * never leaves the site. Card data is entered into PayPal-owned iframes, so no
 * PAN ever touches this app. Only the "pay with a PayPal account" path redirects.
 */

let sdkPromise = null;

function loadPayPalSdk({ clientId, currency, intent }) {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.paypal?.CardFields) return Promise.resolve(window.paypal);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      'client-id': clientId,
      components: 'card-fields',
      currency,
      intent: (intent || 'CAPTURE').toLowerCase(),
    });
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error('PayPal SDK did not initialise')));
    script.onerror = () => { sdkPromise = null; reject(new Error('Could not load the PayPal SDK')); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export default function PayPalCardFields({
  paypalOrderId,
  orderNumber,
  amountLabel,
  onSuccess,
  onFallbackRequired,
}) {
  const numberRef = useRef(null);
  const expiryRef = useRef(null);
  const cvvRef = useRef(null);
  const nameRef = useRef(null);
  const cardFieldsRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | submitting | unsupported | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cfgRes = await fetch('/api/paypal/client-config');
        const cfg = (await cfgRes.json())?.data;

        if (!cfg?.client_id) {
          if (!cancelled) { setStatus('unsupported'); setMessage('Card payments are not configured for this store yet.'); }
          return;
        }

        const paypal = await loadPayPalSdk({
          clientId: cfg.client_id,
          currency: cfg.currency || 'USD',
          intent: cfg.intent || 'CAPTURE',
        });
        if (cancelled) return;

        // PayPal paints the field surface itself (white, with its own border) and
        // ignores background/border in its style allowlist — verified directly. So we
        // only control type and spacing, and keep the text dark in both themes or it
        // would be invisible on that white surface.
        const fieldStyle = {
          input: {
            'font-size': '13px',
            'font-family': 'Manrope, system-ui, sans-serif',
            'font-weight': '500',
            color: '#221B2B',
            padding: '11px 14px',
          },
          '.invalid': { color: '#e11d48' },
          ':focus': { color: '#17101F' },
        };

        const cardFields = paypal.CardFields({
          style: fieldStyle,
          // The order already exists (created before this modal opened), so just hand
          // PayPal its id rather than creating a second order.
          createOrder: async () => paypalOrderId,
          onApprove: async (data) => {
            setStatus('submitting');
            try {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paypal_order_id: data?.orderID || paypalOrderId,
                  order_number: orderNumber,
                }),
              });
              const json = await res.json();
              if (json.success) {
                onSuccess?.(json);
              } else {
                setStatus('ready');
                setMessage(json.message || 'The card could not be charged. Please try another card.');
              }
            } catch (e) {
              setStatus('ready');
              setMessage('Network error while confirming your payment. Please try again.');
            }
          },
          onError: (err) => {
            setStatus('ready');
            setMessage(typeof err === 'string' ? err : 'Your card was declined or could not be verified. Please check the details and try again.');
          },
        });

        if (!cardFields.isEligible()) {
          if (!cancelled) {
            setStatus('unsupported');
            setMessage('This PayPal account is not enabled for inline card payments (Advanced Card Payments). You can still pay through PayPal.');
            onFallbackRequired?.();
          }
          return;
        }

        cardFieldsRef.current = cardFields;
        await Promise.all([
          cardFields.NameField().render(nameRef.current),
          cardFields.NumberField().render(numberRef.current),
          cardFields.ExpiryField().render(expiryRef.current),
          cardFields.CVVField().render(cvvRef.current),
        ]);
        if (!cancelled) setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setStatus('unsupported');
          setMessage(e.message || 'Inline card payment is unavailable right now.');
          onFallbackRequired?.();
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalOrderId, orderNumber]);

  const handlePay = async () => {
    if (!cardFieldsRef.current || status === 'submitting') return;
    setMessage('');
    setStatus('submitting');
    try {
      // Runs validation + 3-D Secure, then fires onApprove above.
      await cardFieldsRef.current.submit();
    } catch (e) {
      setStatus('ready');
      setMessage('Please check the card details and try again.');
    }
  };

  // Bare wrapper on purpose: PayPal already draws the field's border and surface,
  // so adding our own produced a visible box-inside-a-box. We only size it.
  const boxCls = 'pp-field';
  const labelCls = 'text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-[#9B8EA9] mb-1.5 block';

  if (status === 'unsupported') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/40 p-3.5 text-left">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-left">
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-500 dark:text-[#9B8EA9]">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading secure card form…
        </div>
      )}

      <div className={status === 'loading' ? 'hidden' : 'flex flex-col gap-3'}>
        <div>
          <label className={labelCls}>Name on card</label>
          <div ref={nameRef} className={boxCls} />
        </div>
        <div>
          <label className={labelCls}>Card number</label>
          <div ref={numberRef} className={boxCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Expiry</label>
            <div ref={expiryRef} className={boxCls} />
          </div>
          <div>
            <label className={labelCls}>CVV</label>
            <div ref={cvvRef} className={boxCls} />
          </div>
        </div>

        {message && (
          <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {message}
          </p>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={status === 'submitting'}
          className="w-full py-4 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] disabled:opacity-70 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all btn-spring"
        >
          {status === 'submitting' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment…</>
          ) : (
            <><Lock className="w-3.5 h-3.5" /> Pay {amountLabel} now</>
          )}
        </button>

        <p className="text-[10px] text-center text-gray-400 dark:text-[#9B8EA9] flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Card details are entered directly into PayPal's secure fields.
        </p>
      </div>
    </div>
  );
}
