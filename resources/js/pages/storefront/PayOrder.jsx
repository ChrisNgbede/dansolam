import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Landmark, Loader2, Lock, MessageCircle, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import PayPalCardFields from '../../components/storefront/PayPalCardFields';
import { PayPalLogo } from '../../components/storefront/PaymentGatewayLogos';
import { useAuth } from '../../hooks/useAuth';
import { getCurrencySymbol } from '../../utils/currency';

const PAID = ['paid', 'authorized', 'refunded', 'partially_refunded'];

/**
 * Complete payment for an order that is still unpaid: reached from My Orders, the
 * order tracking page or the order emails. PayPal brings the customer back here.
 */
export default function PayOrder() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { customer } = useAuth();
  const contact = searchParams.get('contact') || customer?.email || '';
  const currency = getCurrencySymbol();

  const [method, setMethod] = useState('card');
  const [starting, setStarting] = useState(false);
  const [paypalOrder, setPaypalOrder] = useState(null); // { paypal_order_id, approve_url }
  const [cardFallback, setCardFallback] = useState(false);
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);

  const { data: orderRes, isLoading, refetch } = useQuery({
    queryKey: ['pay-order', orderNumber, contact],
    queryFn: async () => {
      const params = new URLSearchParams({ order_number: orderNumber });
      if (contact) params.append('contact', contact);
      const res = await fetch(`/api/orders/track?${params}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('not found');
      return res.json();
    },
    retry: false,
  });
  const order = orderRes?.data;
  // Exact match only: the tracking search also matches partial numbers.
  const orderMatches = order && order.order_number === orderNumber;

  const { data: settingsRes } = useQuery({ queryKey: ['settings'], queryFn: () => fetch('/api/settings').then((r) => r.json()) });
  const settings = settingsRes?.data?.settings || {};
  const hasBankDetails = Boolean(settings.bank_name && settings.bank_account_number && settings.bank_account_name);

  const { data: paypalConfigRes } = useQuery({
    queryKey: ['paypal-client-config'],
    queryFn: () => fetch('/api/paypal/client-config').then((r) => r.json()),
    staleTime: 60_000,
  });
  const paypalAvailable = paypalConfigRes?.data?.enabled === true;
  const isPayPalOrder = order?.payment_method === 'paypal';
  const isPaid = order && PAID.includes(order.payment_status);
  const trackingUrl = `/order-tracking?order_number=${encodeURIComponent(orderNumber)}${contact || order?.customer_email ? `&contact=${encodeURIComponent(contact || order.customer_email)}` : ''}`;

  // Back from PayPal: capture the approved payment, or report a cancellation.
  useEffect(() => {
    const token = searchParams.get('token');
    if (searchParams.get('paypal_cancel')) {
      setError('PayPal payment was cancelled. You have not been charged; you can try again below.');
      return;
    }
    if (!searchParams.get('paypal_return') || !token) return;

    setCapturing(true);
    (async () => {
      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ paypal_order_id: token, order_number: orderNumber }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          navigate(`${trackingUrl}&paypal_success=true`, { replace: true });
          return;
        }
        setError(data.message || 'PayPal could not complete the payment. You have not been charged; please try again.');
      } catch {
        setError('We could not confirm your payment with PayPal. Please check your connection and refresh this page.');
      }
      setCapturing(false);
      refetch();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start a PayPal payment for this order (needed for both PayPal and card).
  const startPayPal = async () => {
    setError('');
    setStarting(true);
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ order_number: orderNumber, return_to: 'pay' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        setError(data.message || 'We could not start the payment. Please try again.');
        return null;
      }
      const created = { paypal_order_id: data.data.paypal_order_id, approve_url: data.data.approve_url };
      setPaypalOrder(created);
      return created;
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      return null;
    } finally {
      setStarting(false);
    }
  };

  const payWithPayPal = async () => {
    const created = paypalOrder || (await startPayPal());
    if (created?.approve_url) window.location.href = created.approve_url;
  };

  // Card fields need a PayPal order before they can render.
  useEffect(() => {
    if (method === 'card' && isPayPalOrder && paypalAvailable && !isPaid && !paypalOrder && !starting && !capturing && orderMatches) {
      startPayPal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, isPayPalOrder, paypalAvailable, isPaid, orderMatches, capturing]);

  const whatsapp = String(settings.whatsapp_number || '').replace(/[^0-9]/g, '');
  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello, I would like to complete payment for order #${orderNumber}.`)}`
    : null;

  const card = 'bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xs';

  return (
    <div className="bg-[#FAF7FC] dark:bg-[#17101F] min-h-screen pt-28 sm:pt-36 pb-20 px-4 sm:px-6 font-sans">
      <SEO title={`Pay for order ${orderNumber} - Dansolam`} description="Complete payment for your Dansolam order." />
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <Link to={trackingUrl} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1E1528] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-[#C9BED4] hover:text-[#EC268F] self-start">
          <ArrowLeft className="w-4 h-4" /> Back to order
        </Link>

        {isLoading || capturing ? (
          <div className={`${card} flex flex-col items-center gap-3 py-16 text-center`} role="status">
            <Loader2 className="w-7 h-7 animate-spin text-[#EC268F]" />
            <p className="text-sm font-semibold text-gray-700 dark:text-[#C9BED4]">{capturing ? 'Confirming your payment with PayPal…' : 'Loading your order…'}</p>
          </div>
        ) : !orderMatches ? (
          <div className={`${card} text-center flex flex-col items-center gap-3`}>
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <h1 className="font-extrabold text-xl text-[#221B2B] dark:text-[#F3EFF6]">We could not find that order</h1>
            <p className="text-xs text-gray-500 dark:text-[#9B8EA9] max-w-sm">Open the payment link from your order email or My Orders, or look the order up with your email address.</p>
            <Link to="/order-tracking" className="mt-2 px-5 py-2.5 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold">Find my order</Link>
          </div>
        ) : isPaid ? (
          <div className={`${card} text-center flex flex-col items-center gap-3`}>
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            <h1 className="font-extrabold text-xl text-[#221B2B] dark:text-[#F3EFF6]">This order is already paid</h1>
            <p className="text-xs text-gray-500 dark:text-[#9B8EA9]">Order #{order.order_number} · {currency}{parseFloat(order.total_amount).toFixed(2)}</p>
            <Link to={trackingUrl} className="mt-2 px-5 py-2.5 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold">Track order</Link>
          </div>
        ) : (
          <div className={`${card} flex flex-col gap-6`}>
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[10px] font-extrabold tracking-wider text-[#EC268F]">Complete payment</span>
              <h1 className="font-extrabold text-2xl text-[#221B2B] dark:text-[#F3EFF6]">Order #{order.order_number}</h1>
              <p className="text-xs text-gray-500 dark:text-[#9B8EA9]">
                {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'} · placed {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-[#FAF7FC] dark:bg-white/5 border border-[#EADBEE] dark:border-white/10 px-5 py-4">
              <span className="text-xs font-bold text-gray-500 dark:text-[#9B8EA9]">Amount to pay</span>
              <span className="text-2xl font-extrabold text-[#5D3E85] dark:text-[#EC268F]">{currency}{parseFloat(order.total_amount).toFixed(2)}</span>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> <span>{error}</span>
              </div>
            )}

            {isPayPalOrder && paypalAvailable ? (
              <>
                <div role="radiogroup" aria-label="How would you like to pay?" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'card', label: 'Debit or credit card', icon: <CreditCard className="w-4 h-4" /> },
                    { id: 'paypal', label: 'PayPal account', icon: <PayPalLogo className="h-3.5 w-auto" /> },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={method === o.id}
                      onClick={() => setMethod(o.id)}
                      className={`flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3.5 text-xs font-bold transition-colors cursor-pointer ${method === o.id ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85]/5 dark:bg-[#EC268F]/10 text-[#5D3E85] dark:text-[#EC268F]' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#C9BED4] hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                      {o.icon} {o.label}
                    </button>
                  ))}
                </div>

                {method === 'card' && !cardFallback ? (
                  paypalOrder?.paypal_order_id ? (
                    <PayPalCardFields
                      paypalOrderId={paypalOrder.paypal_order_id}
                      orderNumber={order.order_number}
                      amountLabel={`${currency}${parseFloat(order.total_amount).toFixed(2)}`}
                      onSuccess={() => navigate(`${trackingUrl}&paypal_success=true`, { replace: true })}
                      onFallbackRequired={() => setCardFallback(true)}
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-500 dark:text-[#9B8EA9]" role="status">
                      <Loader2 className="w-4 h-4 animate-spin" /> Preparing secure card form…
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={payWithPayPal}
                    disabled={starting}
                    className="w-full py-4 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold tracking-wider flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-70"
                  >
                    {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {method === 'card' ? 'Pay by card on PayPal' : 'Continue to PayPal'} · {currency}{parseFloat(order.total_amount).toFixed(2)}
                  </button>
                )}
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-[#9B8EA9]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Payments are processed securely by PayPal. We never see your card number.
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                {isPayPalOrder && (
                  <p className="text-xs text-gray-600 dark:text-[#C9BED4] leading-relaxed">
                    Online card payment is not available right now. You can pay by bank transfer instead, or message us and we will help you complete payment.
                  </p>
                )}
                <div className="rounded-2xl border border-[#EADBEE] dark:border-white/10 bg-[#FAF7FC] dark:bg-white/5 p-5 text-xs text-gray-600 dark:text-[#C9BED4] flex flex-col gap-2">
                  <span className="flex items-center gap-2 font-extrabold text-[#221B2B] dark:text-[#F3EFF6]"><Landmark className="w-4 h-4" /> Pay by bank transfer</span>
                  {hasBankDetails ? (
                    <>
                      <p><strong>Bank:</strong> {settings.bank_name}</p>
                      <p><strong>Account number:</strong> {settings.bank_account_number}</p>
                      <p><strong>Account name:</strong> {settings.bank_account_name}</p>
                      <p><strong>Reference:</strong> {order.order_number}</p>
                      <p className="text-[11px] text-gray-400 dark:text-[#9B8EA9] pt-1">Transfer exactly {currency}{parseFloat(order.total_amount).toFixed(2)} using your order number as the reference. We will confirm by email once it arrives.</p>
                    </>
                  ) : (
                    <p>Message us and we will send our bank details for order #{order.order_number}. Your order is held until payment arrives.</p>
                  )}
                </div>
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Message us on WhatsApp about this payment
                  </a>
                ) : (
                  <Link to="/contact" className="w-full py-3.5 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Contact us about this payment
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
