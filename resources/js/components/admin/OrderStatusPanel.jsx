import React, { useState, useEffect } from 'react';
import { Check, Loader2, Lock, MessageCircle, XCircle, Mail, RotateCcw } from 'lucide-react';

const STEP_LABELS = {
  pending_payment: { label: 'Order placed', hint: 'Waiting for payment' },
  paid: { label: 'Paid', hint: 'Awaiting packing' },
  processing: { label: 'Processing', hint: 'Being prepared' },
  packed: { label: 'Packed', hint: 'Ready to hand over' },
  shipped: { label: 'Shipped', hint: 'On its way' },
  ready_for_pickup: { label: 'Ready for pickup', hint: 'Waiting at the store' },
  delivered: { label: 'Delivered', hint: 'Completed. Locks the order' },
};

const PAYMENT_LABELS = { pending: 'Pending', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', partially_refunded: 'Part refunded' };

const human = (s) => (s || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const when = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null);

/** The fulfilment path for this order: pickup orders wait at the store instead of shipping. */
function stepsFor(order) {
  const pickup = order.delivery_method === 'pickup' || order.order_status === 'ready_for_pickup';
  const handover = pickup && order.order_status !== 'shipped' ? 'ready_for_pickup' : 'shipped';
  return ['pending_payment', 'paid', 'processing', 'packed', handover, 'delivered'];
}

/**
 * One place to see and change an order's status. The timeline shows where the
 * order is; picking a later step marks every step before it done (including
 * payment), and nothing is sent until the change is reviewed and saved.
 */
export default function OrderStatusPanel({ order, saving, onSave, whatsappHref }) {
  const steps = stepsFor(order);
  const [target, setTarget] = useState(order.order_status);
  const [payment, setPayment] = useState(order.payment_status);

  // Start from the saved state whenever the order reloads.
  useEffect(() => {
    setTarget(order.order_status);
    setPayment(order.payment_status);
  }, [order.order_status, order.payment_status]);

  const locked = order.order_status === 'delivered';
  const cancelled = target === 'cancelled';
  const savedIndex = steps.indexOf(order.order_status);
  const targetIndex = steps.indexOf(target);
  const paidIndex = steps.indexOf('paid');
  const changed = target !== order.order_status || payment !== order.payment_status;

  const pick = (status) => {
    if (locked) return;
    setTarget(status);
    const i = steps.indexOf(status);
    // Moving past "Paid" means the money is in; moving back before it restores the saved payment state.
    if (i >= paidIndex && payment !== 'paid' && !['refunded', 'partially_refunded'].includes(payment)) setPayment('paid');
    if (i >= 0 && i < paidIndex) setPayment(order.payment_status === 'paid' ? 'pending' : order.payment_status);
  };

  const reset = () => { setTarget(order.order_status); setPayment(order.payment_status); };

  const paymentOptions = ['pending', 'paid', 'failed'];
  if (!paymentOptions.includes(order.payment_status)) paymentOptions.push(order.payment_status);

  const skipped = targetIndex > savedIndex + 1 && savedIndex >= 0 ? steps.slice(savedIndex + 1, targetIndex) : [];
  const stamp = { pending_payment: order.created_at, paid: order.paid_at, delivered: order.delivered_at };

  return (
    <div className="adm-card bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3>Order status</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {locked ? 'Delivered and locked.' : order.order_status === 'cancelled' ? 'This order was cancelled.' : 'Pick a step to move the order there.'}
          </p>
        </div>
        {locked && <Lock className="w-4 h-4 text-emerald-600 mt-1 shrink-0" aria-label="Locked" />}
      </div>

      {/* Timeline */}
      <div role="radiogroup" aria-label="Fulfilment status" className={`flex flex-col ${cancelled ? 'opacity-50' : ''}`}>
        {steps.map((status, i) => {
          const isSaved = status === order.order_status;
          const isTarget = status === target;
          const done = !cancelled && (targetIndex > i || (locked && i <= savedIndex));
          const current = !cancelled && isTarget && !locked;
          const last = i === steps.length - 1;
          const meta = STEP_LABELS[status];
          const sub = isSaved && !locked ? (isTarget ? 'Current status' : 'Current status (changing)')
            : isTarget && !locked ? 'New status'
            : when(stamp[status]) || meta.hint;

          return (
            <label
              key={status}
              className={`group relative flex gap-3 ${locked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <input
                type="radio"
                name="order-status"
                value={status}
                checked={isTarget}
                disabled={locked}
                onChange={() => pick(status)}
                className="sr-only peer"
              />
              {/* Dot and connector */}
              <span className="relative flex flex-col items-center shrink-0 w-7">
                <span
                  className={`relative z-10 grid place-items-center w-7 h-7 rounded-full border-2 transition-colors group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-[#5D3E85] ${
                    done ? 'bg-emerald-600 border-emerald-600 text-white'
                      : current ? 'bg-[#5D3E85] border-[#5D3E85] text-white ring-4 ring-[#5D3E85]/15'
                        : 'bg-white dark:bg-[#1E1528] border-gray-300 dark:border-white/20 text-gray-400 group-hover:border-[#5D3E85]'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" strokeWidth={3} /> : current ? <span className="w-2 h-2 rounded-full bg-white" /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                </span>
                {!last && (
                  <span className={`w-0.5 flex-1 min-h-[1.25rem] ${!cancelled && targetIndex > i ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-white/10'}`} />
                )}
              </span>
              <span className={`flex-1 min-w-0 ${last ? '' : 'pb-4'} pt-0.5`}>
                <span className="flex items-center gap-2">
                  <span className={`text-sm ${current || done ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
                    {meta.label}
                  </span>
                  {isSaved && !locked && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#5D3E85]/10 text-[#5D3E85] dark:bg-white/10 dark:text-[#C4A4F0]">Now</span>
                  )}
                </span>
                <span className={`block text-xs mt-0.5 ${isTarget && !isSaved ? 'text-[#5D3E85] dark:text-[#C4A4F0] font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                  {sub}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {order.order_status === 'cancelled' && target === 'cancelled' && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-sm">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Cancelled. Pick a step above to reopen the order.</span>
        </div>
      )}

      {/* Payment */}
      {!locked && (
        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-white/10">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Payment</span>
          <div role="radiogroup" aria-label="Payment status" className="grid grid-cols-3 gap-1 p-1 rounded-full bg-gray-100 dark:bg-white/5">
            {paymentOptions.map((p) => (
              <label key={p} className="cursor-pointer">
                <input type="radio" name="payment-status" value={p} checked={payment === p} onChange={() => setPayment(p)} className="sr-only peer" />
                <span className={`block text-center rounded-full py-1.5 text-xs font-semibold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#5D3E85] ${
                  payment === p
                    ? p === 'paid' ? 'bg-emerald-600 text-white' : p === 'failed' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-[#1E1528] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}>
                  {PAYMENT_LABELS[p] || human(p)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Review and save */}
      {changed && !locked && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#5D3E85]/5 dark:bg-white/5 border border-[#5D3E85]/15 dark:border-white/10">
          <ul className="text-sm text-gray-700 dark:text-gray-200 flex flex-col gap-1">
            {target !== order.order_status && (
              <li>
                Status: <span className="text-gray-500">{STEP_LABELS[order.order_status]?.label || human(order.order_status)}</span> → <strong>{STEP_LABELS[target]?.label || human(target)}</strong>
              </li>
            )}
            {skipped.length > 0 && (
              <li className="text-gray-500 dark:text-gray-400">
                Marks done: {skipped.map((s) => STEP_LABELS[s].label).join(', ')}
              </li>
            )}
            {payment !== order.payment_status && (
              <li>
                Payment: <span className="text-gray-500">{PAYMENT_LABELS[order.payment_status] || human(order.payment_status)}</span> → <strong>{PAYMENT_LABELS[payment] || human(payment)}</strong>
              </li>
            )}
            {target === 'delivered' && <li className="text-amber-700 dark:text-amber-400 font-semibold">Delivered orders can't be changed afterwards.</li>}
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {order.customer_email ? `The customer is emailed at ${order.customer_email}.` : 'No customer email on file, so no email is sent.'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => onSave({ order_status: target, payment_status: payment })} disabled={saving} className="admin-btn-primary flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Saving…' : 'Save & notify customer'}</span>
            </button>
            <button type="button" onClick={reset} disabled={saving} className="bg-white" title="Undo changes">
              <RotateCcw className="w-4 h-4" />
              <span>Undo</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="admin-btn-secondary w-full inline-flex items-center justify-center gap-2 h-10 rounded-full border text-sm font-semibold">
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span>Message customer on WhatsApp</span>
        </a>
        {!locked && target !== 'cancelled' && (
          <button type="button" onClick={() => setTarget('cancelled')} className="hover:underline self-center text-sm font-semibold text-rose-700 dark:text-rose-400 mt-1">
            Cancel order…
          </button>
        )}
      </div>
    </div>
  );
}
