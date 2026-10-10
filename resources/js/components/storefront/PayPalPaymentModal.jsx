import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CreditCard, Loader2, Lock, RotateCcw, ShieldCheck, X } from 'lucide-react';
import PayPalCardFields from './PayPalCardFields';
import { PayPalLogo } from './PaymentGatewayLogos';
import { capturePayPalOrder, fetchPayPalConfig, loadPayPalSdk } from '../../utils/paypalSdk';

/**
 * Pays an order without leaving the site.
 *
 *  - method "card":   PayPal's card fields when the account has Advanced Card
 *                     Payments, otherwise PayPal's on-page debit/credit card form.
 *                     No PayPal login either way.
 *  - method "paypal": PayPal login in a popup window over this page.
 *
 * Card details go into PayPal's own secure frames; this site never sees them.
 */
export default function PayPalPaymentModal({ open, onClose, orderNumber, method, amountLabel, onSuccess, onMethodChange }) {
  const buttonsRef = useRef(null);
  const buttonsInstance = useRef(null);
  const [stage, setStage] = useState('loading'); // loading | fields | buttons | capturing | error
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  // Set when inline card fields fail, so the card option uses PayPal's card form instead.
  const [forceCardButton, setForceCardButton] = useState(false);

  // Lock the page behind, close on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && stage !== 'capturing') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, stage, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    let buttons = null;
    setStage('loading');
    setMessage('');
    setNotice('');

    const finish = async (orderId) => {
      setStage('capturing');
      const result = await capturePayPalOrder(orderId, orderNumber);
      if (cancelled) return;
      if (result.success) {
        onSuccess?.(result);
      } else {
        setStage('error');
        setMessage(result.message || 'The payment could not be completed. You have not been charged; please try again.');
      }
    };

    (async () => {
      try {
        const cfg = await fetchPayPalConfig();
        if (!cfg?.enabled || !cfg?.client_id) throw new Error('Card and PayPal payments are not available right now.');

        // A PayPal order made for on-page payment (not tied to the PayPal wallet).
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ order_number: orderNumber, flow: 'sdk' }),
        });
        const created = await res.json().catch(() => ({}));
        if (!created.success) throw new Error(created.message || 'We could not start the payment. Please try again.');
        const orderId = created.data.paypal_order_id;

        const paypal = await loadPayPalSdk({ clientId: cfg.client_id, currency: cfg.currency, intent: cfg.intent });
        if (cancelled) return;
        setPaypalOrderId(orderId);

        // Card: inline card fields when this PayPal account supports them.
        if (method === 'card' && !forceCardButton && paypal.CardFields?.({ createOrder: async () => orderId }).isEligible()) {
          setStage('fields');
          return;
        }

        const fundingSource = method === 'card' ? paypal.FUNDING.CARD : paypal.FUNDING.PAYPAL;
        buttons = paypal.Buttons({
          fundingSource,
          style: { layout: 'vertical', shape: 'pill', height: 48, color: method === 'card' ? 'black' : 'gold', label: method === 'card' ? 'pay' : 'paypal' },
          createOrder: async () => orderId,
          onApprove: async (data) => finish(data?.orderID || orderId),
          onCancel: () => setNotice('Payment window closed. You have not been charged; you can try again.'),
          onError: () => {
            setStage('error');
            setMessage(method === 'card'
              ? 'Your card could not be charged. Please check the details or try another card.'
              : 'PayPal could not complete the payment. You have not been charged; please try again.');
          },
        });
        if (!buttons.isEligible()) throw new Error(method === 'card'
          ? 'Card payment is not available for this order. Please choose PayPal instead.'
          : 'PayPal is not available for this order right now.');

        buttonsInstance.current = buttons;
        setStage('buttons'); // the effect below draws it once its container exists
      } catch (e) {
        if (!cancelled) {
          setStage('error');
          setMessage(e.message || 'Payment is unavailable right now. Please try again.');
        }
      }
    })();

    return () => {
      cancelled = true;
      try { buttons?.close?.(); } catch { /* already gone */ }
    };
  }, [open, method, orderNumber, attempt, forceCardButton]);

  // Draw PayPal's button into its container after React has put it on screen.
  useEffect(() => {
    if (stage !== 'buttons' || !buttonsRef.current || !buttonsInstance.current) return;
    const container = buttonsRef.current;
    container.innerHTML = '';
    buttonsInstance.current.render(container).catch((e) => {
      setStage('error');
      setMessage(e?.message ? `PayPal could not load: ${e.message}` : 'PayPal could not load. Please try again.');
    });
  }, [stage]);

  if (!open) return null;

  const title = method === 'card' ? 'Pay by debit or credit card' : 'Pay with PayPal';

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0" onClick={() => stage !== 'capturing' && onClose?.()} />
      <div className="relative z-10 w-full max-w-md max-h-[92dvh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-white/10 px-6 py-5">
          <div className="text-left">
            <h2 className="flex items-center gap-2 font-extrabold text-base text-[#221B2B] dark:text-[#F3EFF6]">
              {method === 'card' ? <CreditCard className="w-4.5 h-4.5 text-[#5D3E85] dark:text-[#EC268F]" /> : <PayPalLogo className="h-4 w-auto" />}
              {title}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#9B8EA9]">Order #{orderNumber} · <strong className="text-[#5D3E85] dark:text-[#EC268F]">{amountLabel}</strong></p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={stage === 'capturing'}
            aria-label="Close"
            className="w-8 h-8 shrink-0 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4">
          {onMethodChange && stage !== 'capturing' && (
            <div role="radiogroup" aria-label="How would you like to pay?" className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-1">
              {[['card', 'Debit or credit card'], ['paypal', 'PayPal account']].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={method === id}
                  onClick={() => method !== id && onMethodChange(id)}
                  className={`rounded-xl px-3 py-2.5 text-[11px] font-extrabold transition-colors cursor-pointer ${method === id ? 'bg-white dark:bg-[#2A1F37] text-[#5D3E85] dark:text-[#EC268F] shadow-sm' : 'text-gray-500 dark:text-[#9B8EA9] hover:text-[#221B2B] dark:hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {stage === 'loading' && (
            <div className="flex flex-col items-center gap-2 py-8 text-xs text-gray-500 dark:text-[#9B8EA9]" role="status">
              <Loader2 className="w-6 h-6 animate-spin text-[#EC268F]" />
              {method === 'card' ? 'Preparing the secure card form…' : 'Connecting to PayPal…'}
            </div>
          )}

          {stage === 'capturing' && (
            <div className="flex flex-col items-center gap-2 py-8 text-center" role="status">
              <Loader2 className="w-6 h-6 animate-spin text-[#EC268F]" />
              <p className="text-sm font-bold text-[#221B2B] dark:text-[#F3EFF6]">Confirming your payment…</p>
              <p className="text-xs text-gray-500 dark:text-[#9B8EA9]">Please keep this window open.</p>
            </div>
          )}

          {stage === 'fields' && paypalOrderId && (
            <PayPalCardFields
              paypalOrderId={paypalOrderId}
              orderNumber={orderNumber}
              amountLabel={amountLabel}
              onSuccess={(json) => onSuccess?.(json)}
              onFallbackRequired={() => setForceCardButton(true)}
            />
          )}

          {stage === 'buttons' && (
            <>
              {method === 'card' && (
                <p className="text-xs text-gray-600 dark:text-[#C9BED4] text-left leading-relaxed">
                  Press <strong>Debit or Credit Card</strong> below and enter your card and billing details. No PayPal account is needed.
                </p>
              )}
              {method === 'paypal' && (
                <p className="text-xs text-gray-600 dark:text-[#C9BED4] text-left leading-relaxed">
                  Press the PayPal button to log in and approve the payment in a secure PayPal window. You will come straight back here.
                </p>
              )}
              {/* PayPal draws its own white surface; keep it on white in dark mode too. */}
              <div className="rounded-2xl bg-white p-3">
                <div ref={buttonsRef} className="min-h-[52px]" />
              </div>
            </>
          )}

          {notice && stage === 'buttons' && (
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 text-left" role="status">{notice}</p>
          )}

          {stage === 'error' && (
            <div className="flex flex-col gap-3">
              <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-300 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> <span>{message}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="w-full py-3.5 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Try again
              </button>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-[#9B8EA9]">
            {method === 'card' ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Processed securely by PayPal. We never see your card number.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
