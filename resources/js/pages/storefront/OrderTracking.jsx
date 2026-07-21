import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Calendar, Clock, CreditCard, ShoppingBag, MessageCircle, Landmark, Check, Banknote, ShieldCheck, Compass, Receipt, Loader2 } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import CheckoutStepper from '../../components/storefront/CheckoutStepper';

export default function OrderTracking() {
  const currencySymbol = getCurrencySymbol();
  const [searchParams] = useSearchParams();

  // Search parameters pre-fill
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order_number') || '');
  const [contact, setContact] = useState(searchParams.get('contact') || '');
  const [activeQuery, setActiveQuery] = useState(searchParams.get('order_number') ? { order_number: orderNumber, contact } : null);

  const showOnlineSuccess =
    searchParams.get('paystack_success') === 'true' ||
    searchParams.get('stripe_success') === 'true' ||
    searchParams.get('paypal_success') === 'true' ||
    searchParams.get('flutterwave_success') === 'true';
  const showBankTransferPrompt = searchParams.get('bank_transfer') === 'true';
  const showCodPrompt = searchParams.get('cash_on_delivery') === 'true';

  // Fetch tracking details
  const { data: trackRes, isLoading, error } = useQuery({
    queryKey: ['track-order', activeQuery],
    enabled: !!activeQuery,
    queryFn: async () => {
      const res = await fetch(`/api/track-order?order_number=${activeQuery.order_number}&contact=${encodeURIComponent(activeQuery.contact)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(activeQuery)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Tracking failed');
      }
      return data;
    }
  });

  const order = trackRes?.data;

  // Sync parameters if URL updates
  useEffect(() => {
    if (searchParams.get('order_number') && searchParams.get('contact')) {
      setOrderNumber(searchParams.get('order_number'));
      setContact(searchParams.get('contact'));
      setActiveQuery({
        order_number: searchParams.get('order_number'),
        contact: searchParams.get('contact')
      });
    }
  }, [searchParams]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (orderNumber.trim() && contact.trim()) {
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

  const activeStepIdx = order ? getStatusStepIndex(order.order_status) : 0;

  // WhatsApp click pre-fill message
  const getWhatsAppInquiryLink = () => {
    if (!order) return '';
    const brandName = 'FairQueen Collections';
    const whatsappNum = '2348000000000';
    const message = `Hello ${brandName}, I'm checking on the status of my order #${order.order_number} placed under the name "${order.customer_name}". Can you please update me?`;
    return `https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="bg-[#F5F6F8] min-h-screen font-sans pb-16">
      <SEO title="Track Your Order" description="Track the real-time payment and delivery status of your ecommerce order at FairQueen Collections." />

      {/* Hero Banner Section */}
      <div className="storefront-page-hero bg-gradient-to-br from-[#FAF3E8] to-white pt-8 pb-10 text-center">
        <div className="max-w-2xl mx-auto px-6 flex flex-col items-center">
          {(showOnlineSuccess || showCodPrompt || showBankTransferPrompt) && (
            <div className="mb-4 w-full">
              <CheckoutStepper currentStep={3} />
            </div>
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Order Utility
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mt-4 tracking-tight leading-none">Track Order</h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-3 leading-relaxed">
            Monitor payment receipts, warehouse packaging processing stages, and delivery tracking.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 flex flex-col gap-6">
        
        {/* Checkout Success Alerts */}
        {showOnlineSuccess && (
          <div className="bg-green-50/50 border border-green-200 rounded-2xl p-5 text-center flex flex-col items-center gap-2 animate-scale-up">
            <span className="text-3xl">🎉</span>
            <h2 className="font-serif font-bold text-green-800 text-base">Online Payment Confirmed!</h2>
            <p className="text-xs text-green-600 max-w-md leading-relaxed">
              Thank you for your purchase. Your payment was verified successfully. We are currently preparing your items for delivery.
            </p>
          </div>
        )}

        {showCodPrompt && (
          <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 flex flex-col gap-3 animate-scale-up text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h2 className="font-serif font-bold text-blue-800 text-base">Cash on Delivery Confirmed</h2>
                <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">Your order has been recorded successfully. Please prepare the total invoice amount in cash or bank transfer to settle with the courier upon arrival.</p>
              </div>
            </div>
          </div>
        )}

        {showBankTransferPrompt && (
          <div className="bg-[#FAF3E8]/35 border border-primary/20 rounded-2xl p-5 flex flex-col gap-4 animate-scale-up text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏦</span>
              <div>
                <h2 className="font-serif font-bold text-gray-800 text-base">Bank Transfer Payment Pending</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Your order has been recorded. Please complete the bank transfer below to confirm your purchase.</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 shadow-3xs">
              <div>
                <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Bank Name</span>
                <strong className="text-gray-800 text-sm">Access Bank</strong>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Account Number</span>
                <strong className="text-gray-800 text-sm">1234567890</strong>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Account Name</span>
                <strong className="text-gray-800 text-sm">FairQueen Collections Ltd</strong>
              </div>
            </div>
            
            <p className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
              ⚠️ After transfer, please share the screenshot receipt to our WhatsApp support below referencing your Order Number.
            </p>
          </div>
        )}

        {/* TRACKING SEARCH BOX */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col gap-5 text-left">
          <div>
            <h2 className="font-serif font-bold text-lg text-gray-900">Track Ecommerce Order</h2>
            <p className="text-xs text-gray-400 mt-1">Enter your order parameters to check status history.</p>
          </div>

          <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            <div className="flex flex-col gap-1.5 sm:col-span-5">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Order Number</label>
              <input
                type="text"
                required
                placeholder="e.g. FQ-XXXXXX-XXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-primary text-xs bg-white uppercase font-bold text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-4">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Email / Phone</label>
              <input
                type="text"
                required
                placeholder="e.g. fatima@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-primary text-xs bg-white font-semibold text-gray-800"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-all sm:col-span-3 hover:scale-[1.02] active:scale-[0.98] cursor-pointer h-9.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Track Status
            </button>
          </form>

          {error && (
            <div className="text-xs text-red-500 font-bold flex items-center gap-1 mt-1">
              ❌ Order details not matched. Double check your input values.
            </div>
          )}
        </div>

        {/* TRACKING PROGRESS DETAILS */}
        {isLoading && (
          <div className="h-64 bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center animate-pulse text-gray-400 font-semibold gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            Fetching order details...
          </div>
        )}

        {order && (
          <div className="flex flex-col gap-6 animate-slide-in">
            {/* Timeline tracker */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col gap-8 text-left">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Tracking details for</span>
                  <h3 className="font-bold text-gray-900 text-lg mt-0.5">{order.order_number}</h3>
                </div>
                <span className="text-[10px] font-bold px-3.5 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                  {order.order_status.replace('_', ' ')}
                </span>
              </div>

              {/* Visual step nodes */}
              <div className="flex flex-col sm:flex-row items-center justify-between relative gap-6 sm:gap-0 px-2">
                
                {/* Connector line (Desktop only) */}
                <div className="absolute left-8 right-8 top-5 h-0.5 bg-gray-100 hidden sm:block -z-10">
                  <div
                    className="h-full bg-primary transition-all duration-500"
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
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                        isPassed
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-400'
                      } ${isCurrent && 'ring-4 ring-primary/20'}`}>
                        {isPassed && idx < activeStepIdx ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-[9px] font-bold tracking-wider uppercase ${
                        isPassed ? 'text-gray-800' : 'text-gray-400'
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
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
                <h4 className="font-bold text-[10px] text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Delivery & Customer Details
                </h4>
                <div className="flex flex-col gap-2.5 text-xs text-gray-600 leading-normal">
                  <p>👤 <strong>Name:</strong> {order.customer_name}</p>
                  <p>📞 <strong>Phone:</strong> {order.customer_phone}</p>
                  <p>✉️ <strong>Email:</strong> {order.customer_email}</p>
                  <p>📍 <strong>Method:</strong> {order.delivery_method === 'pickup' ? 'Ecommerce Store Pickup (Abuja)' : 'Home Delivery'}</p>
                  {order.delivery_method === 'delivery' && (
                    <p>🏠 <strong>Address:</strong> {order.delivery_address}, {order.delivery_city}, {order.delivery_state}</p>
                  )}
                </div>
              </div>

              {/* Payment & Invoice stats */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
                <h4 className="font-bold text-[10px] text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-primary" />
                  Invoice Summary
                </h4>
                <div className="flex flex-col gap-2 text-xs text-gray-600 leading-normal">
                  <p>💰 <strong>Subtotal:</strong> {currencySymbol}{parseFloat(order.subtotal).toLocaleString()}</p>
                  {order.discount_amount > 0 && <p className="text-green-600">🏷️ <strong>Discount:</strong> - {currencySymbol}{parseFloat(order.discount_amount).toLocaleString()}</p>}
                  <p>🚚 <strong>Shipping Fee:</strong> {currencySymbol}{parseFloat(order.delivery_fee).toLocaleString()}</p>
                  <p className="border-t border-gray-100 pt-2 text-gray-800 font-bold text-sm">
                    💵 Total: <span className="text-primary font-serif">{currencySymbol}{parseFloat(order.total_amount).toLocaleString()}</span>
                  </p>
                  <p>💳 <strong>Gateway Method:</strong> {order.payment_method === 'paystack' ? 'Online Paystack' : 'Direct Bank Transfer'}</p>
                  <p>📊 <strong>Status:</strong> <span className={`font-semibold uppercase ${order.payment_status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>{order.payment_status}</span></p>
                </div>
              </div>

            </div>

            {/* Ordered items listing */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs text-left flex flex-col gap-3">
              <h4 className="font-bold text-[10px] text-gray-800 uppercase tracking-wider border-b border-gray-55 pb-3">Ordered Items</h4>
              <div className="flex flex-col gap-4 divide-y divide-gray-50">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs pt-3 first:pt-0">
                    <div>
                      <span className="font-bold text-gray-850 block">{item.product_name}</span>
                      <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                        {item.variant_label ? `${item.variant_label} x ` : ''}{item.quantity} units
                      </span>
                    </div>
                    <strong className="text-gray-900 font-semibold">{currencySymbol}{(item.price * item.quantity).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfillments follow up chat */}
            <a
              href={getWhatsAppInquiryLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Inquire about this Order on WhatsApp
            </a>
          </div>
        )}

        {/* Secure Trust Info */}
        <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 bg-white shadow-3xs max-w-md mx-auto w-full text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <ShieldCheck className="w-4.5 h-4.5 text-primary" />
            Security & Guarantee details
          </div>
          <p className="text-[10px] text-gray-400 leading-normal">
            For returns, custom tailoring queries, or package tracking issues, reach support concierge services directly.
          </p>
        </div>

      </div>
    </div>
  );
}
