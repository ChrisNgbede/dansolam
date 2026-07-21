import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Landmark, CheckCircle, Loader2, Banknote } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import SEO from '../../components/seo/SEO';
import CheckoutStepper from '../../components/storefront/CheckoutStepper';
import { COUNTRIES, getStates } from '../../utils/geoData';
import CaptchaWidget from '../../components/ui/CaptchaWidget';

export default function Checkout() {
  const currencySymbol = getCurrencySymbol();
  const navigate = useNavigate();
  
  // Zustand State hooks
  const items = useCartStore(state => state.items);
  const coupon = useCartStore(state => state.coupon);
  const deliveryMethod = useCartStore(state => state.deliveryMethod);
  const deliveryZone = useCartStore(state => state.deliveryZone);
  const shippingOption = useCartStore(state => state.shippingOption);
  const getSubtotal = useCartStore(state => state.getSubtotal);
  const getDiscountAmount = useCartStore(state => state.getDiscountAmount);
  const getDeliveryFee = useCartStore(state => state.getDeliveryFee);
  const getTotal = useCartStore(state => state.getTotal);
  const clearCart = useCartStore(state => state.clearCart);
  const setShippingRates = useCartStore(state => state.setShippingRates);
  const getAppliedShippingRates = useCartStore(state => state.getAppliedShippingRates);
  const setDeliveryMethod = useCartStore(state => state.setDeliveryMethod);
  const setDeliveryZone = useCartStore(state => state.setDeliveryZone);
  const setShippingOption = useCartStore(state => state.setShippingOption);
  const setDeliveryCountry = useCartStore(state => state.setDeliveryCountry);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Abuja');
  const [country, setCountry] = useState('Nigeria');
  const [checkoutCaptchaVerified, setCheckoutCaptchaVerified] = useState(false);

  useEffect(() => {
    setDeliveryCountry(country);
  }, [country, setDeliveryCountry]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  // Submit states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Mock Paystack Modal State
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState(null);
  const [paystackLoading, setPaystackLoading] = useState(false);

  // Fetch settings for bank transfers details
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-checkout'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  const settings = settingsRes?.data?.settings || {
    bank_name: 'Access Bank',
    bank_account_number: '1234567890',
    bank_account_name: 'Dansolam Ltd'
  };
  const storefrontEnabled = (key) => ['storefront', 'both'].includes(settings[key] || 'both');

  useEffect(() => {
    const available = [];
    if (storefrontEnabled('payment_transfer_channel')) available.push('bank_transfer');
    if (storefrontEnabled('payment_card_channel') && settings.payment_gateway_active !== 'bank_transfer') available.push(settings.payment_gateway_active);
    if (storefrontEnabled('payment_cash_channel') && settings.cod_enabled === 'true') available.push('cash_on_delivery');
    if (available.length && !available.includes(paymentMethod)) setPaymentMethod(available[0]);
  }, [settings.payment_transfer_channel, settings.payment_card_channel, settings.payment_cash_channel, settings.payment_gateway_active, settings.cod_enabled]);

  // Fetch public shipping rates
  const { data: shippingRatesRes } = useQuery({
    queryKey: ['public-shipping-rates'],
    queryFn: () => fetch('/api/shipping-rates').then(res => res.json())
  });

  useEffect(() => {
    if (shippingRatesRes?.data) {
      setShippingRates(shippingRatesRes.data);
    }
  }, [shippingRatesRes, setShippingRates]);

  // Fetch delivery zones list
  const { data: zonesRes } = useQuery({
    queryKey: ['delivery-zones-checkout'],
    queryFn: () => fetch('/api/delivery-zones').then(res => res.json())
  });
  const zones = zonesRes?.data || [];

  // Default pre-select zone
  useEffect(() => {
    if (zones.length > 0 && !deliveryZone) {
      setDeliveryZone(zones[0]);
    }
  }, [zones, deliveryZone, setDeliveryZone]);

  // Sync default active gateway from settings
  useEffect(() => {
    if (settings.payment_gateway_active) {
      setPaymentMethod(settings.payment_gateway_active);
    }
  }, [settings]);

  // Pre-fill fields if customer logged in
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('fairqueen_customer_token');
      if (token) {
        try {
          const res = await fetch('/api/customer/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setName(data.data.name);
            setEmail(data.data.email);
            setPhone(data.data.phone || '');
            
            // Fetch default address
            const addrRes = await fetch('/api/customer/addresses', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const addrData = await addrRes.json();
            const defaultAddr = addrData.data?.find(a => a.is_default) || addrData.data?.[0];
            if (defaultAddr) {
              setAddress(defaultAddr.address_line_1);
              setCity(defaultAddr.city);
              setState(defaultAddr.state);
              setCountry(defaultAddr.country);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchProfile();
  }, []);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const isCaptchaEnabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;
    const isCheckoutEnabled = settings.captcha_on_checkout === undefined ? true : (settings.captcha_on_checkout === 'true' || settings.captcha_on_checkout === true);
    if (isCaptchaEnabled && isCheckoutEnabled && !checkoutCaptchaVerified) {
      setErrorMsg('Please complete the security verification challenge before placing your order.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('fairqueen_customer_token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      delivery_address: address,
      delivery_city: city,
      delivery_state: state,
      delivery_country: country,
      delivery_method: deliveryMethod,
      delivery_zone_id: deliveryZone ? deliveryZone.id : null,
      shipping_option: shippingOption,
      payment_method: paymentMethod,
      coupon_code: coupon ? coupon.code : null,
      notes: notes,
      items: items.map(item => ({
        product_id: item.product_id,
        variant_id: item.product_variant_id,
        quantity: item.quantity
      }))
    };

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        if (['paystack', 'stripe', 'paypal', 'flutterwave'].includes(paymentMethod)) {
          // Open mock payment simulation modal
          setCreatedOrderDetails(data.data);
          setShowPaystackModal(true);
          setLoading(false);
        } else if (paymentMethod === 'cash_on_delivery') {
          // COD placed successfully
          clearCart();
          navigate(`/order-tracking?order_number=${data.data.order_number}&contact=${encodeURIComponent(email)}&cash_on_delivery=true`);
        } else {
          // Bank Transfer placed successfully
          clearCart();
          navigate(`/order-tracking?order_number=${data.data.order_number}&contact=${encodeURIComponent(email)}&bank_transfer=true`);
        }
      } else {
        setErrorMsg(data.message || 'Checkout failed. Please verify details.');
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg('Server connection error. Please try again.');
      setLoading(false);
    }
  };

  // Simulating payment completion on mock Gateway dialog
  const handleCompletePaystackPayment = async () => {
    if (!createdOrderDetails) return;
    setPaystackLoading(true);

    const payload = {
      reference: `${createdOrderDetails.reference}-mock-success`,
      order_number: createdOrderDetails.order_number,
      gateway: paymentMethod
    };

    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      setPaystackLoading(false);
      if (data.success) {
        setShowPaystackModal(false);
        clearCart();
        navigate(`/order-tracking?order_number=${createdOrderDetails.order_number}&contact=${encodeURIComponent(email)}&${paymentMethod}_success=true`);
      } else {
        systemToast.error('Payment verification failed. Please try again.');
      }
    } catch (e) {
      setPaystackLoading(false);
      systemToast.error('Network error verifying payment.');
    }
  };

  return (
    <div className="checkout-page max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-16 flex flex-col gap-6">
      <SEO title="Secure Checkout" description="Secure payment and delivery checkout options for Dansolam." />
      
      {/* Step Progress Bar */}
      <CheckoutStepper currentStep={2} />

      <Link
        to="/cart"
        className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-gray-950 dark:hover:text-gray-950 hover:bg-yellow-400 dark:hover:bg-yellow-400 hover:border-yellow-400 dark:hover:border-yellow-400 shadow-3xs hover:shadow-xs transition-all duration-300 self-start mt-1"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-950 group-hover:-translate-x-0.5 transition-all duration-300" />
        <span>Back to Cart</span>
      </Link>

      <div className="border-b border-gray-100/60 pb-5 text-left">
        <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full self-start mb-2.5 inline-block">
          Secure Payment
        </span>
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-gray-900 tracking-tight leading-none">
          Checkout Shipping & Payment
        </h1>
        <p className="text-[11px] text-gray-400 mt-2 font-medium">
          Confirm details and choose a convenient gateway to complete your ecommerce order.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Form details */}
        <form onSubmit={handleCheckoutSubmit} className="flex-1 w-full bg-white rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6 border-0 text-left">
          <h3 className="font-serif font-bold text-xs text-gray-900 uppercase tracking-widest border-b border-gray-100/60 pb-2">Customer Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                placeholder="e.g. Fatima Abubakar"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                placeholder="e.g. +234 80 1234 5678"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
              placeholder="e.g. fatima@example.com"
            />
          </div>

          {/* Delivery Method Options */}
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
            <span className="font-serif font-bold text-xs text-gray-900 uppercase tracking-widest border-b border-gray-100/60 pb-2">Delivery Options</span>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`py-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer shadow-3xs ${
                  deliveryMethod === 'delivery' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                }`}
              >
                Home Delivery
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`py-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer shadow-3xs ${
                  deliveryMethod === 'pickup' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                }`}
              >
                Store Pickup
              </button>
            </div>
          </div>

          {/* Shipping option & zone selectors if Home Delivery is selected */}
          {deliveryMethod === 'delivery' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF9F6] p-5 rounded-2xl border-0 shadow-3xs w-full">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Shipping Type</label>
                <select
                  value={shippingOption}
                  onChange={(e) => setShippingOption(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white text-xs text-gray-800 font-medium h-10 w-full cursor-pointer shadow-3xs"
                >
                  <option value="standard">Standard Domestic Delivery</option>
                  <option value="same_day">Same Day Express (+{currencySymbol}{parseFloat(settings.shipping_same_day_surcharge || 5000).toLocaleString()})</option>
                  <option value="international">International Shipping ({currencySymbol}{parseFloat(settings.shipping_international_base || 25000).toLocaleString()})</option>
                </select>
              </div>

              {shippingOption !== 'international' && zones.length > 0 && (
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Delivery Area / Zone</label>
                  <select
                    value={deliveryZone?.id || ''}
                    onChange={(e) => {
                      const z = zones.find(x => x.id === parseInt(e.target.value));
                      if (z) setDeliveryZone(z);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white text-xs text-gray-800 font-medium h-10 w-full cursor-pointer shadow-3xs"
                  >
                    <option value="" disabled>-- Select Zone --</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} (+{currencySymbol}{parseFloat(z.shipping_fee).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {deliveryMethod === 'delivery' && (
            <>
              <h3 className="font-serif font-bold text-xs text-gray-900 uppercase tracking-widest border-b border-gray-100/60 pb-2 mt-2">Delivery Address</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                  placeholder="e.g. Plot 12, Wuse II"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                    placeholder="e.g. Abuja"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Country</label>
                  <select
                    value={country}
                    onChange={e => { setCountry(e.target.value); setState(''); }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 cursor-pointer h-[38px] w-full shadow-3xs font-medium"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">State</label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 cursor-pointer h-[38px] w-full shadow-3xs font-medium"
                  >
                    <option value="">Select State</option>
                    {getStates(country).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <h3 className="font-serif font-bold text-xs text-gray-900 uppercase tracking-widest border-b border-gray-100/60 pb-2 mt-2">Payment Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Configure Active Default Online Gateway */}
            {storefrontEnabled('payment_card_channel') && settings.payment_gateway_active && settings.payment_gateway_active !== 'bank_transfer' && (
              <label className={`border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs ${
                paymentMethod === settings.payment_gateway_active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-650 hover:bg-gray-55'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === settings.payment_gateway_active}
                    onChange={() => setPaymentMethod(settings.payment_gateway_active)}
                    className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs block capitalize text-gray-800">
                      {settings.payment_gateway_active === 'paystack' && 'Paystack Online Checkout'}
                      {settings.payment_gateway_active === 'stripe' && 'Stripe Credit Card Payment'}
                      {settings.payment_gateway_active === 'paypal' && 'PayPal Express Checkout'}
                      {settings.payment_gateway_active === 'flutterwave' && 'Flutterwave Checkout'}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">
                      {settings.payment_gateway_active === 'paystack' && 'Pay securely with Cards or Transfer'}
                      {settings.payment_gateway_active === 'stripe' && 'Visa, Mastercard, AMEX'}
                      {settings.payment_gateway_active === 'paypal' && 'Pay with PayPal Wallet or Cards'}
                      {settings.payment_gateway_active === 'flutterwave' && 'Multi-Currency card processing'}
                    </span>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-primary shrink-0" />
              </label>
            )}

            {storefrontEnabled('payment_transfer_channel') && <label className={`border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs ${
              paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-655 hover:bg-gray-55'
            }`}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-xs block text-gray-800">Bank Transfer (Manual)</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Transfer directly to our account</span>
                </div>
              </div>
              <Landmark className="w-4 h-4 text-primary shrink-0" />
            </label>}

            {storefrontEnabled('payment_cash_channel') && settings.cod_enabled === 'true' && (
              <label className={`border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs ${
                paymentMethod === 'cash_on_delivery' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-655 hover:bg-gray-55'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                    className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs block text-gray-800">Cash on Delivery (COD)</span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Pay when your order is delivered</span>
                  </div>
                </div>
                <Banknote className="w-4 h-4 text-primary shrink-0" />
              </label>
            )}
          </div>

          {/* Conditional Bank Details display */}
          {paymentMethod === 'bank_transfer' && (
            <div className="bg-[#FAF3E8]/40 rounded-2xl p-5 text-xs text-gray-650 flex flex-col gap-2 leading-relaxed animate-fade-in border-0 shadow-3xs">
              <span className="font-serif font-bold text-gray-900 text-xs tracking-wider border-b border-primary/10 pb-1.5 uppercase">Our Bank Details:</span>
              <p className="mt-1">🏦 <strong>Bank:</strong> {settings.bank_name}</p>
              <p>🔢 <strong>Account Number:</strong> {settings.bank_account_number}</p>
              <p>👤 <strong>Account Name:</strong> {settings.bank_account_name}</p>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal border-t border-primary/5 pt-1.5">⚠️ Please transfer the exact amount and track your order to get payment approval details.</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Order Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows="2"
              className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full resize-none leading-relaxed h-20"
              placeholder="e.g. Size adjustments, delivery landmarks, or call-before-delivery instructions..."
            ></textarea>
          </div>

          <CaptchaWidget
            settings={settings}
            formType="checkout"
            verified={checkoutCaptchaVerified}
            setVerified={setCheckoutCaptchaVerified}
          />

          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl p-4 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 hover:scale-101 cursor-pointer uppercase tracking-wider"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Order...
              </>
            ) : (
              ['paystack', 'stripe', 'paypal', 'flutterwave'].includes(paymentMethod)
                ? 'Proceed to Pay Online'
                : paymentMethod === 'cash_on_delivery'
                  ? 'Place Order via Cash on Delivery'
                  : 'Place Order via Bank Transfer'
            )}
          </button>
        </form>

        {/* Right Column: Mini Invoice Tally */}
        <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-[#111111] border border-gray-100 dark:border-transparent rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-left lg:sticky lg:top-24 self-start max-h-[calc(100vh-7rem)]">
          <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-lg border-b border-gray-100 dark:border-transparent pb-3 shrink-0">Your Order</h3>
          
          <div className="flex flex-col gap-2 max-h-[38vh] overflow-y-auto pr-1.5 overscroll-contain">
            {items.map((item) => (
              <div key={`${item.product_id}-${item.product_variant_id}`} className="flex justify-between items-center gap-3 text-xs p-2.5 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl border border-gray-100/50 dark:border-transparent shadow-3xs">
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-gray-850 truncate block leading-tight">{item.name}</span>
                  <span className="text-[9px] text-gray-400 block mt-1 truncate">{item.variant_label || 'Standard selection'}</span>
                </div>
                <div className="shrink-0 text-right flex flex-col items-end gap-1">
                  <span className="font-bold text-gray-900">{currencySymbol}{(item.price * item.quantity).toLocaleString()}</span>
                  <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-primary/12 text-primary text-[9px] font-bold">×{item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-primary/5 pt-4 flex flex-col gap-3 text-xs text-gray-600 shrink-0">
            <div className="flex justify-between items-center text-base py-1">
              <span className="font-semibold text-gray-700">Subtotal</span>
              <span className="font-serif text-xl font-bold text-gray-950">{currencySymbol}{getSubtotal().toLocaleString()}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({coupon.code})</span>
                <span>- {currencySymbol}{getDiscountAmount().toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery method</span>
              <span className="font-semibold text-gray-900 capitalize">{deliveryMethod}</span>
            </div>
            {deliveryMethod === 'delivery' && (
              <div className="flex flex-col gap-1 border-t border-b border-gray-100 py-1.5 my-1">
                {getAppliedShippingRates(settings).map((rate, i) => (
                  <div key={i} className="flex justify-between text-[11px] text-gray-550">
                    <span>{rate.name}</span>
                    <span className="font-semibold text-gray-850">{currencySymbol}{rate.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center gap-4 border-t border-primary/10 pt-4 text-gray-900 mt-1">
              <span className="text-base md:text-lg font-extrabold">Total Amount</span>
              <span className="text-primary font-serif text-2xl md:text-3xl font-bold leading-none text-right">{currencySymbol}{getTotal(settings).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC GATEWAY OVERLAY MODAL */}
      {showPaystackModal && createdOrderDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-6 text-center border border-gray-100 animate-scale-up">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl mx-auto font-bold font-serif ${
              paymentMethod === 'paystack' ? 'bg-emerald-500' :
              paymentMethod === 'stripe' ? 'bg-indigo-600' :
              paymentMethod === 'paypal' ? 'bg-blue-600' : 'bg-amber-500'
            }`}>
              {paymentMethod === 'paystack' && 'P'}
              {paymentMethod === 'stripe' && 'S'}
              {paymentMethod === 'paypal' && 'P'}
              {paymentMethod === 'flutterwave' && 'F'}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-gray-900 text-lg capitalize">{paymentMethod} Sandbox checkout</h3>
              <p className="text-xs text-gray-500">
                Simulating secure online transaction for order <strong className="text-gray-800">{createdOrderDetails.order_number}</strong>.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-left flex flex-col gap-2 border border-gray-100 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Merchant</span>
                <span className="font-bold text-gray-800">Dansolam</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Email</span>
                <span className="font-bold text-gray-800">{createdOrderDetails.email}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Amount Due</span>
                <span className="font-bold text-primary">{currencySymbol}{parseFloat(createdOrderDetails.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Gateway ref</span>
                <span className="font-bold text-gray-850 font-mono text-[10px] truncate w-36 text-right">{createdOrderDetails.reference}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCompletePaystackPayment}
                disabled={paystackLoading}
                className={`w-full py-3 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all ${
                  paymentMethod === 'paystack' ? 'bg-emerald-500 hover:bg-emerald-600' :
                  paymentMethod === 'stripe' ? 'bg-indigo-600 hover:bg-indigo-700' :
                  paymentMethod === 'paypal' ? 'bg-blue-600 hover:bg-blue-750' : 'bg-amber-500 hover:bg-amber-605'
                }`}
              >
                {paystackLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authorizing payment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Sandbox Payment
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPaystackModal(false)}
                disabled={paystackLoading}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg text-center transition-all"
              >
                Cancel / Decline Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
