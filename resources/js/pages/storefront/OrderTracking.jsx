import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, CreditCard, ShoppingBag, MessageCircle, Landmark, Check, CheckCircle2, Banknote, ShieldCheck, Receipt, ArrowLeft, Truck, Store, Package } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import CheckoutStepper from '../../components/storefront/CheckoutStepper';
import { useLiveValidation } from '../../hooks/useLiveValidation';
import { FieldMessage } from '../../components/ui/FieldMessage';
import * as rules from '../../utils/validators';
import { needsPayment, payOrderUrl } from '../../utils/orderPayment';

// Product photo for an order line; falls back to the product's initial if there is
// no image or it fails to load.
function ItemThumb({ src, name }) {
  const [failed, setFailed] = useState(false);
  const box = 'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden shrink-0 border border-[#F0E6F5] dark:border-white/10';
  if (!src || failed) {
    return (
      <span className={`${box} bg-gradient-to-br from-[#F6EEF9] to-[#FCE7F3] dark:from-white/10 dark:to-white/5 flex items-center justify-center text-xl font-bold text-[#5D3E85] dark:text-[#F9A8D4]`} aria-hidden="true">
        {String(name || '?').trim().charAt(0).toUpperCase()}
      </span>
    );
  }
  return <img src={src} alt="" loading="eager" decoding="async" onError={() => setFailed(true)} className={`${box} object-cover bg-[#FAF7FC] dark:bg-white/5`} />;
}

export default function OrderTracking() {
  const currencySymbol = getCurrencySymbol();
  const [searchParams] = useSearchParams();

  // Search parameters pre-fill
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order_number') || '');
  const [contact, setContact] = useState(searchParams.get('contact') || '');
  const [activeQuery, setActiveQuery] = useState(searchParams.get('order_number') ? { order_number: searchParams.get('order_number'), contact: searchParams.get('contact') || '' } : null);

  const showOnlineSuccess =
    searchParams.get('paystack_success') === 'true' ||
    searchParams.get('stripe_success') === 'true' ||
    searchParams.get('paypal_success') === 'true' ||
    searchParams.get('flutterwave_success') === 'true';
  const showBankTransferPrompt = searchParams.get('bank_transfer') === 'true';
  const showCodPrompt = searchParams.get('cash_on_delivery') === 'true';

  // Sync parameters if URL updates
  useEffect(() => {
    const urlOrderNumber = searchParams.get('order_number');
    const urlContact = searchParams.get('contact') || '';
    if (urlOrderNumber) {
      setOrderNumber(urlOrderNumber);
      setContact(urlContact);
      setActiveQuery({
        order_number: urlOrderNumber.trim(),
        contact: urlContact.trim()
      });
    }
  }, [searchParams]);

  const v = useLiveValidation({ orderNumber, contact }, {
    orderNumber: [rules.required('Enter your order number from the confirmation email.'), rules.minLength(5, 'That looks too short for an order number.')],
    contact: [(value) => {
      if (!value || !value.trim()) return null;
      return value.includes('@') ? rules.email()(value) : rules.phone('Enter the email or phone number used on the order.')(value);
    }],
  });

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!v.validateAll()) return;
    if (orderNumber.trim()) {
      setActiveQuery({ order_number: orderNumber.trim(), contact: contact.trim() });
    }
  };

  const getStatusStepIndex = (status) => {
    const steps = [
      'pending_payment',
      'paid',
      'processing',
      'packed',
      'shipped', // or ready_for_pickup
      'delivered'
    ];

    // Normalize aliases
    let currentStatus = status;
    if (status === 'ready_for_pickup') currentStatus = 'shipped';

    return steps.indexOf(currentStatus);
  };

  // Fetch Order Details
  const { data: orderResponse, isLoading, isError } = useQuery({
    queryKey: ['track-order', activeQuery],
    queryFn: () => {
      if (!activeQuery || !activeQuery.order_number) return null;
      const params = new URLSearchParams();
      params.append('order_number', activeQuery.order_number);
      if (activeQuery.contact) {
        params.append('contact', activeQuery.contact);
      }
      return fetch(`/api/orders/track?${params.toString()}`)
        .then(res => {
          if (!res.ok) throw new Error('Order not found or invalid details.');
          return res.json();
        });
    },
    enabled: !!activeQuery && !!activeQuery.order_number,
    retry: false
  });

  const order = orderResponse?.data;
  // The "payment confirmed" banner follows the order's real status, not the link.
  const paymentConfirmed = showOnlineSuccess && ['paid', 'authorized'].includes(order?.payment_status);
  const GATEWAY_LABELS = {
    paypal: 'PayPal / Card',
    paystack: 'Paystack',
    stripe: 'Card (Stripe)',
    flutterwave: 'Flutterwave',
    bank_transfer: 'Direct Bank Transfer',
    cash_on_delivery: 'Cash on Delivery',
  };
  const activeStepIdx = order ? getStatusStepIndex(order.order_status) : 0;

  // Fetch store settings
  const { data: settingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data?.settings || {};

  // WhatsApp click pre-fill message
  const getWhatsAppInquiryLink = () => {
    if (!order) return '';
    const brandName = settings.ecommerce_name || 'Dansolam';
    const whatsappNum = String(settings.whatsapp_number || '+234 800 000 0000').replace(/[^0-9]/g, '');
    const message = `Hello ${brandName}, I'm checking on the status of my order #${order.order_number} placed under the name "${order.customer_name}". Can you please update me?`;
    return `https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`;
  };

  const money = (n) => `${currencySymbol}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const when = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null);
  const ORDER_STATUS_LABELS = {
    pending_payment: 'Awaiting payment', paid: 'Paid', processing: 'Processing', packed: 'Packed',
    shipped: 'Shipped', ready_for_pickup: 'Ready for collection', delivered: 'Delivered',
    cancelled: 'Cancelled', refunded: 'Refunded',
  };
  const PAYMENT_STATUS = {
    paid: ['Paid', 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'],
    authorized: ['Authorised', 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'],
    pending: ['Payment pending', 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30'],
    failed: ['Payment failed', 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30'],
    refunded: ['Refunded', 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/15'],
    partially_refunded: ['Partly refunded', 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-gray-200 dark:border-white/15'],
  };
  const humanise = (s) => String(s || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const isPickup = order?.delivery_method === 'pickup';
  const steps = order ? [
    { label: 'Placed', date: when(order.created_at) },
    { label: 'Paid', date: when(order.paid_at) },
    { label: 'Processing' },
    { label: 'Packed' },
    { label: isPickup ? 'Ready to collect' : 'Shipped' },
    { label: isPickup ? 'Collected' : 'Delivered', date: when(order.delivered_at) },
  ] : [];
  const stopped = order && activeStepIdx < 0; // cancelled / refunded orders have no progress
  const [paymentLabel, paymentClass] = PAYMENT_STATUS[order?.payment_status] || [humanise(order?.payment_status), PAYMENT_STATUS.refunded[1]];
  const address = order ? [order.delivery_address, order.delivery_city, order.delivery_state, order.delivery_postcode, order.delivery_country].filter(Boolean).join(', ') : '';
  const hasBankDetails = Boolean(settings.bank_name && settings.bank_account_number && settings.bank_account_name);
  const card = 'bg-white dark:bg-[#1E1528] border border-[#E4D6EE] dark:border-white/10 rounded-3xl shadow-[0_1px_2px_rgba(34,27,43,0.05),0_12px_32px_-16px_rgba(93,62,133,0.28)] dark:shadow-none';
  const Row = ({ label, children, strong }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-white/10 last:border-0">
      <dt className="text-xs text-gray-500 dark:text-[#9B8EA9] shrink-0">{label}</dt>
      <dd className={`text-right min-w-0 break-words ${strong ? 'text-base font-extrabold text-[#221B2B] dark:text-white' : 'text-sm font-semibold text-[#221B2B] dark:text-[#F3EFF6]'}`}>{children}</dd>
    </div>
  );
  const Section = ({ icon: Icon, title, meta, children }) => (
    <section className={`${card} overflow-hidden`}>
      <header className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#F0E6F5] dark:border-white/10 bg-[#FAF7FC] dark:bg-white/[0.03]">
        <h3 className="flex items-center gap-2.5 text-base text-[#221B2B] dark:text-[#F3EFF6] min-w-0">
          <span className="w-8 h-8 rounded-xl bg-[#5D3E85]/10 dark:bg-[#EC268F]/15 text-[#5D3E85] dark:text-[#F9A8D4] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="truncate">{title}</span>
        </h3>
        {meta && <span className="text-xs font-semibold text-gray-500 dark:text-[#9B8EA9] shrink-0">{meta}</span>}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
  const itemCount = (order?.items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  // Customer care, shown beside an order or on its own before one is found.
  const helpCard = (
    <div className={`${card} p-5 sm:p-6 flex flex-col gap-4`}>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-2xl bg-[#5D3E85]/10 dark:bg-[#EC268F]/15 text-[#5D3E85] dark:text-[#F9A8D4] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base text-[#221B2B] dark:text-[#F3EFF6]">{order ? 'Questions about this order?' : 'Need help?'}</h3>
          <p className="text-xs text-gray-500 dark:text-[#9B8EA9] mt-0.5 leading-relaxed">For returns, product questions or delivery issues, our customer care team is on WhatsApp.</p>
        </div>
      </div>
      <a
        href={order ? getWhatsAppInquiryLink() : `https://wa.me/${String(settings.whatsapp_number || '').replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#25D366] hover:bg-[#1FB457] text-white text-sm font-bold rounded-full transition-colors shrink-0"
      >
        <MessageCircle className="w-4 h-4 fill-white" />
        Chat on WhatsApp
      </a>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#17101F] min-h-screen font-sans pb-20 transition-colors duration-300">
      <SEO title="Track Your Order - Dansolam Beauty Home" description="Track the real-time payment and delivery status of your order at Dansolam Beauty Home." />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-12 flex flex-col gap-8">
        {/* Hero */}
        <section className="rounded-[28px] sm:rounded-[36px] overflow-hidden bg-gradient-to-br from-[#5D3E85] via-[#4A2B68] to-[#2A1740] relative shadow-md w-full px-5 sm:px-8 md:px-10 pt-5 pb-8 sm:pb-10 flex flex-col gap-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 self-start px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-bold text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          {(showOnlineSuccess || showCodPrompt || showBankTransferPrompt) && (
            <div className="w-full max-w-xl hidden sm:block">
              <CheckoutStepper currentStep={3} />
            </div>
          )}
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[11px] font-bold text-[#5D3E85] bg-white px-3 py-1 rounded-full self-start">Live order tracking</span>
            <h1 className="font-serif font-bold text-3xl md:text-4xl text-white leading-tight">Track Your Order</h1>
            <p className="text-sm text-white/80 max-w-2xl leading-relaxed">See your payment, packing and delivery progress in one place.</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto w-full flex flex-col gap-6 text-left">
          {/* Checkout confirmations */}
          {paymentConfirmed && (
            <div className="rounded-3xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-5 sm:p-6 flex items-start gap-4 animate-scale-up">
              <span className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0"><CheckCircle2 className="w-6 h-6" aria-hidden="true" /></span>
              <div>
                <h2 className="text-lg text-emerald-900 dark:text-emerald-200">Payment confirmed</h2>
                <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80 mt-0.5 leading-relaxed">Thank you for your order. We're preparing your items now and will keep this page updated.</p>
              </div>
            </div>
          )}

          {showCodPrompt && (
            <div className="rounded-3xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 p-5 sm:p-6 flex items-start gap-4 animate-scale-up">
              <span className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0"><Banknote className="w-6 h-6" aria-hidden="true" /></span>
              <div>
                <h2 className="text-lg text-sky-900 dark:text-sky-200">Order placed: pay on delivery</h2>
                <p className="text-sm text-sky-800/80 dark:text-sky-200/80 mt-0.5 leading-relaxed">Please have the order total ready to pay the courier when your parcel arrives.</p>
              </div>
            </div>
          )}

          {showBankTransferPrompt && (
            <div className={`${card} p-5 sm:p-6 flex flex-col gap-4 animate-scale-up`}>
              <div className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-2xl bg-[#5D3E85] text-white flex items-center justify-center shrink-0"><Landmark className="w-6 h-6" aria-hidden="true" /></span>
                <div>
                  <h2 className="text-lg text-[#221B2B] dark:text-[#F3EFF6]">Complete your bank transfer</h2>
                  <p className="text-sm text-gray-500 dark:text-[#9B8EA9] mt-0.5 leading-relaxed">Your order is reserved. It will be prepared once the transfer arrives.</p>
                </div>
              </div>
              {hasBankDetails ? (
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-[#FAF7FC] dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4">
                  {[['Bank', settings.bank_name], ['Account number', settings.bank_account_number], ['Account name', settings.bank_account_name]].map(([k, val]) => (
                    <div key={k}>
                      <dt className="text-[11px] text-gray-500 dark:text-[#9B8EA9] font-semibold">{k}</dt>
                      <dd className="text-sm font-bold text-[#221B2B] dark:text-[#F3EFF6] mt-0.5 break-words">{val}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-600 dark:text-[#C9BED4]">We'll send you the bank details by email or WhatsApp shortly.</p>
              )}
              <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3 py-2">
                Use your order number as the payment reference, then send us the receipt on WhatsApp.
              </p>
            </div>
          )}

          {/* Search */}
          <div className={`${card} p-6 sm:p-8 flex flex-col gap-5`}>
            <div>
              <h2 className="text-xl text-[#221B2B] dark:text-[#F3EFF6]">Find your order</h2>
              <p className="text-sm text-gray-500 dark:text-[#9B8EA9] mt-1">Enter the order number from your confirmation email.</p>
            </div>

            <form onSubmit={handleTrackSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              <div className="flex flex-col gap-1.5 sm:col-span-5">
                <label htmlFor="track-order-number" className="text-xs text-gray-600 dark:text-[#C9BED4] font-semibold">
                  Order number <span className="text-[#EC268F]">*</span>
                </label>
                <input
                  id="track-order-number"
                  {...v.bind('orderNumber')}
                  type="text"
                  placeholder="e.g. FQ-AB12CD-345"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className={`h-12 px-4 border border-[#D4C3E2] dark:border-white/20 rounded-2xl focus:outline-none focus:border-[#5D3E85] focus:ring-4 focus:ring-[#5D3E85]/10 dark:focus:border-[#EC268F] text-sm bg-white dark:bg-[#140D1C] font-semibold text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${v.stateClass('orderNumber')}`}
                />
                <FieldMessage {...v.message('orderNumber')} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-4">
                <label htmlFor="track-contact" className="text-xs text-gray-600 dark:text-[#C9BED4] font-semibold">
                  Email or phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="track-contact"
                  {...v.bind('contact')}
                  type="text"
                  placeholder="e.g. fatima@example.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className={`h-12 px-4 border border-[#D4C3E2] dark:border-white/20 rounded-2xl focus:outline-none focus:border-[#5D3E85] focus:ring-4 focus:ring-[#5D3E85]/10 dark:focus:border-[#EC268F] text-sm bg-white dark:bg-[#140D1C] text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${v.stateClass('contact')}`}
                />
                <FieldMessage {...v.message('contact', 'Adds a check that the order is yours.')} />
              </div>
              <button
                type="submit"
                className="h-12 px-6 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-colors sm:col-span-3 sm:mt-[26px] cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Track order
              </button>
            </form>

            {isError && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
                We couldn't find an order with those details. Check the order number and try again.
              </p>
            )}
          </div>

          {isLoading && (
            <div className={`${card} h-56 flex flex-col items-center justify-center gap-3 text-sm text-gray-500 dark:text-[#9B8EA9]`} role="status">
              <span className="page-spinner" aria-hidden="true" />
              Finding your order…
            </div>
          )}

          {order && (
            <div className="flex flex-col gap-6 animate-slide-in">
              {/* Order header: number, status and key facts */}
              <div className={`${card} p-6 sm:p-8 flex flex-col gap-6`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-[#9B8EA9] font-semibold">Order</p>
                    <h2 className="text-2xl sm:text-3xl text-[#221B2B] dark:text-white mt-0.5 break-all">{order.order_number}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#5D3E85]/10 text-[#5D3E85] dark:bg-[#EC268F]/15 dark:text-[#F9A8D4] border border-[#5D3E85]/15 dark:border-[#EC268F]/30">
                      {ORDER_STATUS_LABELS[order.order_status] || humanise(order.order_status)}
                    </span>
                    {/* "Awaiting payment" already says it; don't repeat it as a payment badge. */}
                    {order.order_status !== 'pending_payment' && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${paymentClass}`}>{paymentLabel}</span>
                    )}
                  </div>
                </div>
                <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ['Placed', when(order.created_at) || '—'],
                    ['Items', String(itemCount)],
                    ['Total', money(order.total_amount)],
                    [isPickup ? 'Collection' : 'Delivery', isPickup ? 'Collect from us' : 'Home delivery'],
                  ].map(([k, val]) => (
                    <div key={k} className="rounded-2xl bg-[#FAF7FC] dark:bg-white/5 border border-[#F0E6F5] dark:border-white/10 px-4 py-3">
                      <dt className="text-[11px] font-semibold text-gray-500 dark:text-[#9B8EA9]">{k}</dt>
                      <dd className="text-sm sm:text-base font-bold text-[#221B2B] dark:text-white mt-0.5 truncate">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Main column */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
                  <Section icon={Package} title="Order progress" meta={ORDER_STATUS_LABELS[order.order_status] || humanise(order.order_status)}>
                    {stopped ? (
                      <p className="text-sm text-gray-600 dark:text-[#C9BED4] bg-gray-50 dark:bg-white/5 rounded-2xl px-4 py-3">
                        This order is {humanise(order.order_status).toLowerCase()}. Contact us if you have any questions.
                      </p>
                    ) : (
                      <ol className="flex flex-col sm:flex-row sm:items-start" aria-label="Order progress">
                        {steps.map((step, idx) => {
                          // The last step, once reached, is complete rather than "in progress".
                          const finished = activeStepIdx === steps.length - 1;
                          const done = idx < activeStepIdx || (finished && idx === activeStepIdx);
                          const current = idx === activeStepIdx && !finished;
                          const reached = done || current;
                          return (
                            <li key={step.label} className="relative flex sm:flex-col sm:items-center gap-3 sm:gap-2 sm:flex-1 pb-6 sm:pb-0 last:pb-0" aria-current={current ? 'step' : undefined}>
                              {idx < steps.length - 1 && (
                                <span aria-hidden="true" className={`absolute left-[19px] top-10 bottom-0 w-0.5 sm:left-[calc(50%+24px)] sm:right-[calc(-50%+24px)] sm:top-[19px] sm:bottom-auto sm:w-auto sm:h-0.5 rounded-full ${done ? 'bg-[#5D3E85] dark:bg-[#EC268F]' : 'bg-gray-200 dark:bg-white/15'}`} />
                              )}
                              <span className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2 transition-colors ${
                                done ? 'bg-[#5D3E85] border-[#5D3E85] text-white dark:bg-[#EC268F] dark:border-[#EC268F]'
                                  : current ? 'bg-[#EC268F] border-[#EC268F] text-white ring-4 ring-[#EC268F]/20'
                                    : 'bg-white dark:bg-[#1E1528] border-gray-200 dark:border-white/20 text-gray-400 dark:text-[#9B8EA9]'
                              }`}>
                                {done ? <Check className="w-4 h-4" aria-hidden="true" /> : idx + 1}
                              </span>
                              <span className="flex flex-col sm:items-center sm:text-center pt-2 sm:pt-0">
                                <span className={`text-sm font-semibold ${reached ? 'text-[#221B2B] dark:text-[#F3EFF6]' : 'text-gray-400 dark:text-[#9B8EA9]'}`}>{step.label}</span>
                                {reached && step.date && <span className="text-[11px] text-gray-500 dark:text-[#9B8EA9]">{step.date}</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </Section>

                  <Section icon={ShoppingBag} title="Items in this order" meta={`${itemCount} item${itemCount === 1 ? '' : 's'}`}>
                    <ul className="flex flex-col gap-3">
                      {order.items?.map((item) => (
                        <li key={item.id} className="flex items-center gap-4 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-[#D4C3E2] dark:hover:border-white/20 transition-colors">
                          <ItemThumb src={item.variant?.image_url || item.product?.images?.[0]?.image_url} name={item.product_name} />
                          <div className="flex-1 min-w-0">
                            {item.product?.slug ? (
                              <Link to={`/product/${item.product.slug}`} className="text-sm font-semibold text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] line-clamp-2">{item.product_name}</Link>
                            ) : (
                              <span className="text-sm font-semibold text-[#221B2B] dark:text-[#F3EFF6] line-clamp-2">{item.product_name}</span>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {item.variant_label && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#5D3E85]/10 text-[#5D3E85] dark:bg-[#EC268F]/15 dark:text-[#F9A8D4]">{item.variant_label}</span>}
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-[#C9BED4]">Qty {item.quantity}</span>
                              <span className="text-[11px] text-gray-500 dark:text-[#9B8EA9]">{money(item.price)} each</span>
                            </div>
                          </div>
                          <span className="text-sm sm:text-base font-bold text-[#221B2B] dark:text-white shrink-0">{money(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/10 text-sm">
                      <span className="text-gray-500 dark:text-[#9B8EA9]">Items subtotal</span>
                      <span className="font-bold text-[#221B2B] dark:text-white">{money(order.subtotal)}</span>
                    </div>
                  </Section>
                </div>

                {/* Side column */}
                <div className="flex flex-col gap-6 min-w-0 lg:sticky lg:top-24">
                  <Section icon={Receipt} title="Payment summary">
                    <dl>
                      <Row label="Subtotal">{money(order.subtotal)}</Row>
                      {Number(order.discount_amount) > 0 && <Row label={order.coupon_code ? `Discount (${order.coupon_code})` : 'Discount'}><span className="text-emerald-700 dark:text-emerald-300">−{money(order.discount_amount)}</span></Row>}
                      <Row label="Shipping">{Number(order.delivery_fee) > 0 ? money(order.delivery_fee) : 'Free'}</Row>
                      {Number(order.tax_amount) > 0 && <Row label="Tax">{money(order.tax_amount)}</Row>}
                      <Row label="Total" strong>{money(order.total_amount)}</Row>
                      <Row label="Paid with">{GATEWAY_LABELS[order.payment_method] || humanise(order.payment_method)}</Row>
                    </dl>
                    {needsPayment(order) && (
                      <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex flex-col gap-3">
                        <div>
                          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Payment is still pending</p>
                          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">We'll prepare your order once {money(order.total_amount)} has been paid.</p>
                        </div>
                        <Link
                          to={payOrderUrl(order, activeQuery?.contact)}
                          className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#EC268F] hover:bg-[#C9166F] text-white text-sm font-bold rounded-full transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          {order.payment_method === 'bank_transfer' ? 'How to pay' : 'Complete payment'}
                        </Link>
                      </div>
                    )}
                  </Section>

                  <Section icon={isPickup ? Store : Truck} title={isPickup ? 'Collection details' : 'Delivery details'}>
                    <dl>
                      <Row label="Name">{order.customer_name}</Row>
                      {order.customer_phone && <Row label="Phone">{order.customer_phone}</Row>}
                      {order.customer_email && <Row label="Email">{order.customer_email}</Row>}
                      <Row label="Method">{isPickup ? 'Collection' : 'Home delivery'}</Row>
                      {!isPickup && address && <Row label="Address">{address}</Row>}
                    </dl>
                  </Section>

                  {helpCard}
                </div>
              </div>
            </div>
          )}

          {!order && helpCard}
        </section>
      </div>
    </div>
  );
}
