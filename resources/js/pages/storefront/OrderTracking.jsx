import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Calendar, Clock, CreditCard, ShoppingBag, MessageCircle, Landmark, Check, Banknote, ShieldCheck, Compass, Receipt, Loader2, ArrowLeft } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import CheckoutStepper from '../../components/storefront/CheckoutStepper';
import { useLiveValidation } from '../../hooks/useLiveValidation';
import { FieldMessage, PasswordStrength } from '../../components/ui/FieldMessage';
import * as rules from '../../utils/validators';

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

  return (
    <div className="bg-white dark:bg-[#17101F] min-h-screen font-sans pb-20 transition-colors duration-300">
      <SEO title="Track Your Order - Dansolam Beauty Home" description="Track the real-time payment and delivery status of your order at Dansolam Beauty Home." />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-12 flex flex-col gap-6">
        {/* Hero Banner Card - Compact, Wide, Back to Home Inside */}
        <section className="h-[200px] sm:h-[240px] md:h-[270px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-gradient-to-br from-[#5D3E85] via-[#4A2B68] to-[#2A1740] relative shadow-md w-full">

          {/* Header Action Buttons Inside Banner */}
          <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center z-20">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-sm transition-all duration-300 btn-spring"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 md:p-9 text-left z-10">
            {(showOnlineSuccess || showCodPrompt || showBankTransferPrompt) && (
              <div className="mb-2 w-full max-w-xl">
                <CheckoutStepper currentStep={3} />
              </div>
            )}
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#5D3E85] bg-white px-3.5 py-1 rounded-full  tracking-widest self-start mb-2 border border-white/40 shadow-sm">
              Live Order Tracking
            </span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
              Track Your Order
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mt-1 max-w-2xl font-sans leading-snug line-clamp-2">
              Monitor payment receipts, shop processing stages, and real-time delivery status.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto w-full flex flex-col gap-8 text-left">

          {/* Checkout Success Alerts */}
          {paymentConfirmed && (
            <div className="bg-green-50/50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-3xl p-6 text-center flex flex-col items-center gap-2 animate-scale-up">
              <span className="text-3xl">🎉</span>
              <h2 className="font-extrabold text-green-800 dark:text-green-300 text-base">Online Payment Confirmed!</h2>
              <p className="text-xs text-green-600 dark:text-green-400 max-w-md leading-relaxed">
                Thank you for your purchase. Your payment was verified successfully. We are currently preparing your items for delivery.
              </p>
            </div>
          )}

          {showCodPrompt && (
            <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-3xl p-6 flex flex-col gap-3 animate-scale-up text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <h2 className="font-extrabold text-blue-800 dark:text-blue-300 text-base">Cash on Delivery Confirmed</h2>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 leading-relaxed">Your order has been recorded successfully. Please prepare the total invoice amount in cash or bank transfer to settle with the courier upon arrival.</p>
                </div>
              </div>
            </div>
          )}

          {showBankTransferPrompt && (
            <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 flex flex-col gap-4 animate-scale-up text-left text-[#221B2B] dark:text-[#F3EFF6]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏦</span>
                <div>
                  <h2 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-base">Bank Transfer Payment Pending</h2>
                  <p className="text-[11px] text-gray-500 dark:text-[#9B8EA9] mt-0.5 leading-relaxed">Your order has been recorded. Please complete the bank transfer below to confirm your purchase.</p>
                </div>
              </div>

              <div className="bg-[#FAF7FC] dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-[#C9BED4] shadow-3xs">
                <div>
                  <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold block  tracking-wider">Bank Name</span>
                  <strong className="text-[#221B2B] dark:text-[#F3EFF6] text-sm">Access Bank</strong>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold block  tracking-wider">Account Number</span>
                  <strong className="text-[#221B2B] dark:text-[#F3EFF6] text-sm">1234567890</strong>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold block  tracking-wider">Account Name</span>
                  <strong className="text-[#221B2B] dark:text-[#F3EFF6] text-sm">Dansolam Ltd</strong>
                </div>
              </div>

              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                ⚠️ After transfer, please share the screenshot receipt to our WhatsApp support below referencing your Order Number.
              </p>
            </div>
          )}

          {/* TRACKING SEARCH BOX */}
          <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col gap-6 text-left">
            <div>
              <h2 className="font-extrabold text-xl text-[#221B2B] dark:text-[#F3EFF6]">Track Order Status</h2>
              <p className="text-xs text-gray-400 dark:text-[#9B8EA9] mt-1">Enter your order parameters to check status history.</p>
            </div>

            <form onSubmit={handleTrackSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              <div className="flex flex-col gap-1.5 sm:col-span-5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">
                  Order Number <span className="text-[#EC268F]">*</span>
                </label>
                <input
                  {...v.bind('orderNumber')}
                  type="text"
                  placeholder="e.g. FQ-AB12CD-345"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className={`px-4 py-3 border-2 border-[#D4C3E2] dark:border-white/20 rounded-full focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs bg-[#FAF7FC] dark:bg-[#140D1C]  font-bold text-[#221B2B] dark:text-[#F3EFF6] shadow-xs transition-colors ${v.stateClass('orderNumber')}`}
                />
                <FieldMessage {...v.message('orderNumber')} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-4">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">
                  Email / Phone <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  {...v.bind('contact')}
                  type="text"
                  placeholder="e.g. fatima@example.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className={`px-4 py-3 border-2 border-[#D4C3E2] dark:border-white/20 rounded-full focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs bg-[#FAF7FC] dark:bg-[#140D1C] font-semibold text-[#221B2B] dark:text-[#F3EFF6] shadow-xs transition-colors ${v.stateClass('contact')}`}
                />
                <FieldMessage {...v.message('contact', "Adds a check that the order is yours.")} />
              </div>
              <button
                type="submit"
                className="py-3 px-6 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold tracking-wider rounded-full flex items-center justify-center gap-2 shadow-md transition-all sm:col-span-3 sm:mt-[22px] hover:scale-[1.02] active:scale-[0.98] cursor-pointer h-11 shrink-0 btn-spring"
              >
                <Search className="w-4 h-4" />
                Track Status
              </button>
            </form>

            {isError && (
              <div className="text-xs text-red-500 font-bold flex items-center gap-1 mt-1">
                ❌ Order details not matched. Double check your input values.
              </div>
            )}
          </div>

          {/* TRACKING PROGRESS DETAILS */}
          {isLoading && (
            <div className="h-64 bg-white dark:bg-[#1E1528] border border-gray-100 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center animate-pulse text-gray-400 font-semibold gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#5D3E85] dark:text-[#EC268F]" />
              Fetching order details...
            </div>
          )}

          {order && (
            <div className="flex flex-col gap-6 animate-slide-in">
              {/* Timeline tracker */}
              <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col gap-8 text-left text-[#221B2B] dark:text-[#F3EFF6]">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
                  <div>
                    <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9]  font-bold tracking-wider">Tracking details for</span>
                    <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-xl mt-0.5">{order.order_number}</h3>
                  </div>
                  <span className="text-[10px] font-extrabold px-4 py-1.5 rounded-full bg-[#EC268F]/15 text-[#EC268F]  tracking-wider">
                    {order.order_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Visual step nodes */}
                <div className="flex flex-col sm:flex-row items-center justify-between relative gap-6 sm:gap-0 px-2">

                  {/* Connector line (Desktop only) */}
                  <div className="absolute left-8 right-8 top-5 h-1 bg-gray-100 dark:bg-white/10 hidden sm:block -z-10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5D3E85] dark:bg-[#EC268F] transition-all duration-500"
                      style={{ width: `${(Math.max(0, activeStepIdx) / 5) * 100}%` }}
                    />
                  </div>

                  {[
                    { label: 'Placed', status: 'pending_payment' },
                    { label: 'Paid', status: 'paid' },
                    { label: 'Processing', status: 'processing' },
                    { label: 'Packed', status: 'packed' },
                    { label: order.delivery_method === 'pickup' ? 'Ready Pickup' : 'Shipped', status: 'shipped' },
                    { label: 'Delivered', status: 'delivered' }
                  ].map((step, idx) => {
                    const isPassed = idx <= activeStepIdx;
                    const isCurrent = idx === activeStepIdx;

                    return (
                      <div key={step.status} className="flex sm:flex-col items-center gap-3 sm:gap-2 w-full sm:w-auto relative">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-extrabold text-xs transition-all shrink-0 ${isPassed
                          ? 'bg-[#5D3E85] dark:bg-[#EC268F] border-[#5D3E85] dark:border-[#EC268F] text-white shadow-md'
                          : 'bg-white dark:bg-[#231B30] border-gray-200 dark:border-white/15 text-gray-400'
                          } ${isCurrent && 'ring-4 ring-[#EC268F]/30 bg-[#EC268F] border-[#EC268F]'}`}>
                          {isPassed && idx < activeStepIdx ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[9px] font-extrabold tracking-wider  ${isPassed ? 'text-[#221B2B] dark:text-[#F3EFF6]' : 'text-gray-400 dark:text-[#6B6274]'
                          }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}

                </div>
              </div>

              {/* Customer info & Invoice details summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">

                {/* Delivery address details */}
                <div className="bg-white dark:bg-[#1E1528] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
                  <h4 className="font-bold text-[10px] text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider border-b border-gray-100 dark:border-white/10 pb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F]" />
                    Delivery & Customer Details
                  </h4>
                  <div className="flex flex-col gap-2.5 text-xs text-gray-600 dark:text-[#C9BED4] leading-normal">
                    <p>👤 <strong>Name:</strong> {order.customer_name}</p>
                    <p>📞 <strong>Phone:</strong> {order.customer_phone}</p>
                    <p>✉️ <strong>Email:</strong> {order.customer_email}</p>
                    <p>📍 <strong>Method:</strong> {order.delivery_method === 'pickup' ? 'Store Pickup (SHOP)' : 'Home Delivery'}</p>
                    {order.delivery_method === 'delivery' && (
                      <p>🏠 <strong>Address:</strong> {order.delivery_address}, {order.delivery_city}, {order.delivery_state}</p>
                    )}
                  </div>
                </div>

                {/* Payment & Invoice stats */}
                <div className="bg-white dark:bg-[#1E1528] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
                  <h4 className="font-bold text-[10px] text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider border-b border-gray-100 dark:border-white/10 pb-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F]" />
                    Invoice Summary
                  </h4>
                  <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-[#C9BED4] leading-normal">
                    <p>💰 <strong>Subtotal:</strong> {currencySymbol}{parseFloat(order.subtotal).toLocaleString()}</p>
                    {order.discount_amount > 0 && <p className="text-green-600 dark:text-green-400">🏷️ <strong>Discount:</strong> - {currencySymbol}{parseFloat(order.discount_amount).toLocaleString()}</p>}
                    <p>🚚 <strong>Shipping Fee:</strong> {currencySymbol}{parseFloat(order.delivery_fee).toLocaleString()}</p>
                    <p className="border-t border-gray-100 dark:border-white/10 pt-2 text-[#221B2B] dark:text-[#F3EFF6] font-bold text-sm">
                      💵 Total: <span className="text-[#5D3E85] dark:text-[#EC268F] font-extrabold">{currencySymbol}{parseFloat(order.total_amount).toLocaleString()}</span>
                    </p>
                    <p>💳 <strong>Gateway Method:</strong> {GATEWAY_LABELS[order.payment_method] || String(order.payment_method || '').replace(/_/g, ' ')}</p>
                    <p>📊 <strong>Status:</strong> <span className={`font-semibold  ${order.payment_status === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{order.payment_status}</span></p>
                  </div>
                </div>

              </div>

              {/* Ordered items listing */}
              <div className="bg-white dark:bg-[#1E1528] border border-gray-100 dark:border-white/10 rounded-2xl p-6 shadow-xs text-left flex flex-col gap-3">
                <h4 className="font-bold text-[10px] text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider border-b border-gray-100 dark:border-white/10 pb-3">Ordered Items</h4>
                <div className="flex flex-col gap-4 divide-y divide-gray-100 dark:divide-white/10">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs pt-3 first:pt-0">
                      <div>
                        <span className="font-bold text-[#221B2B] dark:text-[#F3EFF6] block">{item.product_name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-[#9B8EA9] font-semibold block mt-0.5">
                          {item.variant_label ? `${item.variant_label} x ` : ''}{item.quantity} units
                        </span>
                      </div>
                      <strong className="text-[#221B2B] dark:text-[#F3EFF6] font-semibold">{currencySymbol}{(item.price * item.quantity).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fulfillments follow up chat */}
              <a
                href={getWhatsAppInquiryLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold tracking-wider rounded-full shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer btn-spring"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                Inquire about this Order on WhatsApp
              </a>
            </div>
          )}

          {/* Secure Trust Info */}
          <div className="border border-[#EADBEE] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-2 bg-white dark:bg-[#1E1528] shadow-3xs max-w-md mx-auto w-full text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6]">
              <ShieldCheck className="w-4.5 h-4.5 text-[#5D3E85] dark:text-[#EC268F]" />
              Security & Guarantee details
            </div>
            <p className="text-[10px] text-gray-400 dark:text-[#9B8EA9] leading-normal">
              For returns, product questions or delivery issues, contact our customer care team directly.
            </p>
          </div>

        </section>
      </div>
    </div>
  );
}
