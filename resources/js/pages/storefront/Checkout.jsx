import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Landmark, CheckCircle, Loader2, Banknote, User, Lock, Mail, Phone, ShieldCheck, LogIn, UserPlus, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../hooks/useAuth';
import SEO from '../../components/seo/SEO';
import CheckoutStepper from '../../components/storefront/CheckoutStepper';
import { COUNTRIES, getStates } from '../../utils/geoData';
import CaptchaWidget from '../../components/ui/CaptchaWidget';
import { PaystackLogo, StripeLogo, PayPalLogo } from '../../components/storefront/PaymentGatewayLogos';
import PayPalCardFields from '../../components/storefront/PayPalCardFields';
import { useLiveValidation } from '../../hooks/useLiveValidation';
import { FieldMessage, PasswordStrength } from '../../components/ui/FieldMessage';
import * as rules from '../../utils/validators';
import PayPalPaymentModal from '../../components/storefront/PayPalPaymentModal';

const CHECKOUT_PROMPTS = {
  details: 'Please check the highlighted details.',
  login: 'Please log in or create an account above to proceed with your order.',
  shipping: 'Please choose a shipping method.',
  country: 'Please select your country to see shipping options.',
  captcha: 'Please complete the security verification challenge before placing your order.',
};

export default function Checkout() {
  const currencySymbol = getCurrencySymbol();
  const navigate = useNavigate();
  const { customer, loading: authLoading, customerLogin, customerRegister, customerLogout } = useAuth();
  
  // Zustand State hooks
  const items = useCartStore(state => state.items);
  const coupon = useCartStore(state => state.coupon);
  // Subscribed so the shipping list updates as items, rates or country change.
  const shippingRates = useCartStore(state => state.shippingRates);
  const shippingMethodId = useCartStore(state => state.shippingMethodId);
  // Re-render once the store has the country the form just set.
  const storeCountry = useCartStore(state => state.deliveryCountry);
  const setShippingMethodId = useCartStore(state => state.setShippingMethodId);
  const getEligibleShipping = useCartStore(state => state.getEligibleShipping);
  const getSelectedShipping = useCartStore(state => state.getSelectedShipping);
  const getSubtotal = useCartStore(state => state.getSubtotal);
  const getDiscountAmount = useCartStore(state => state.getDiscountAmount);
  const getDeliveryFee = useCartStore(state => state.getDeliveryFee);
  const getTotal = useCartStore(state => state.getTotal);
  const clearCart = useCartStore(state => state.clearCart);
  const setShippingRates = useCartStore(state => state.setShippingRates);
  const getAppliedShippingRates = useCartStore(state => state.getAppliedShippingRates);
  const setDeliveryCountry = useCartStore(state => state.setDeliveryCountry);

  // Authentication Mode on Checkout (for guest users)
  const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [authRemember, setAuthRemember] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  // Shipping options for this country and item count (re-evaluated every render;
  // the subscriptions above trigger it when rates, choice or items change).
  const eligibleShipping = country ? getEligibleShipping() : [];
  const selectedShipping = country ? getSelectedShipping() : null;
  void shippingRates; void shippingMethodId; void storeCountry;
  const [checkoutCaptchaVerified, setCheckoutCaptchaVerified] = useState(false);

  useEffect(() => {
    setDeliveryCountry(country);
  }, [country, setDeliveryCountry]);

  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  // Submit states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live validation for the sign in, register and delivery forms.
  const loginV = useLiveValidation({ authEmail, authPassword }, {
    authEmail: [rules.required('Enter your email address.'), rules.email()],
    authPassword: [rules.required('Enter your password.')],
  }, { fieldMap: { email: 'authEmail', password: 'authPassword' } });

  const registerV = useLiveValidation({ authName, authEmail, authPhone, authPassword, authPasswordConfirm }, {
    authName: [rules.required('Enter your full name.'), rules.minLength(2, 'Enter your full name.'), rules.maxLength(255)],
    authEmail: [rules.required('Enter your email address.'), rules.email()],
    authPhone: [rules.phone()],
    authPassword: [rules.required('Choose a password.'), rules.minLength(6, 'Use at least 6 characters.')],
    authPasswordConfirm: [rules.required('Type your password again.'), rules.matches('authPassword', 'The passwords do not match.')],
  }, { fieldMap: { name: 'authName', email: 'authEmail', phone: 'authPhone', password: 'authPassword', password_confirmation: 'authPasswordConfirm' } });

  const deliveryV = useLiveValidation({ name, phone, email, address, city, country, state, notes }, {
    name: [rules.required("Enter the recipient's full name."), rules.maxLength(255)],
    phone: [rules.required('Enter a phone number for the courier.'), rules.phone(), rules.maxLength(50)],
    email: [rules.required('Enter an email for your receipt and tracking.'), rules.email()],
    address: [rules.required('Enter the street address.'), rules.minLength(5, 'Enter the full street address, including the house number.')],
    city: [rules.required('Enter the town or city.'), rules.maxLength(255)],
    country: [rules.required('Choose a country to see shipping options.')],
    state: [rules.required(country ? 'Choose a county, state or region.' : 'Choose a country first.')],
    notes: [rules.maxLength(1000)],
  }, { fieldMap: { customer_name: 'name', customer_phone: 'phone', customer_email: 'email', delivery_address: 'address', delivery_city: 'city', delivery_country: 'country', delivery_state: 'state' } });

  // "Fix this first" prompts above the Place Order button clear themselves as soon
  // as the customer has fixed what they point at.
  useEffect(() => {
    const resolved = {
      [CHECKOUT_PROMPTS.details]: deliveryV.formValid,
      [CHECKOUT_PROMPTS.login]: !!customer,
      [CHECKOUT_PROMPTS.shipping]: !!selectedShipping,
      [CHECKOUT_PROMPTS.country]: !!country,
      [CHECKOUT_PROMPTS.captcha]: checkoutCaptchaVerified,
    };
    if (resolved[errorMsg]) setErrorMsg('');
  }, [errorMsg, deliveryV.formValid, customer, selectedShipping, country, checkoutCaptchaVerified]);
  
  // Modal Payment Gateway States
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState(null);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [paypalSubMethod, setPaypalSubMethod] = useState('paypal_balance');
  // On-page PayPal payment (card form or PayPal popup) once the order exists.
  const [paypalPayOpen, setPaypalPayOpen] = useState(false);
  const [paypalPayMethod, setPaypalPayMethod] = useState('card');
  // Set when PayPal's inline card fields are unavailable for this merchant account,
  // so the card option falls back to the hosted redirect instead of dead-ending.
  const [cardFieldsUnavailable, setCardFieldsUnavailable] = useState(false);

  const handlePayPalCardSuccess = () => {
    setShowPaystackModal(false);
    clearCart();
    navigate(`/order-tracking?order_number=${createdOrderDetails.order_number}&contact=${encodeURIComponent(email)}&paypal_success=true`);
  };

  // Lock background scroll when payment modal is open
  useEffect(() => {
    if (showPaystackModal) {
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [showPaystackModal]);

  // Fetch settings for bank transfers details
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-checkout'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  const ecommerce = settingsRes?.data?.ecommerce || { name: 'Dansolam Beauty Home' };
  const settings = settingsRes?.data?.settings || {};
  const hasBankDetails = Boolean(settings.bank_name && settings.bank_account_number && settings.bank_account_name);
  const storefrontEnabled = (key) => ['storefront', 'both'].includes(settings[key] || 'both');

  // PayPal is offered only when the server says it can take real payments
  // (enabled, configured and not in sandbox on the live site).
  const { data: paypalConfigRes } = useQuery({
    queryKey: ['paypal-client-config'],
    queryFn: () => fetch('/api/paypal/client-config').then(res => res.json()),
    staleTime: 60_000,
  });
  const paypalAvailable = paypalConfigRes?.data?.enabled === true;

  useEffect(() => {
    const available = [];
    if (storefrontEnabled('payment_transfer_channel')) available.push('bank_transfer');
    if (storefrontEnabled('payment_card_channel') && settings.payment_gateway_active !== 'bank_transfer'
      && (settings.payment_gateway_active !== 'paypal' || paypalAvailable)) available.push(settings.payment_gateway_active);
    if (storefrontEnabled('payment_cash_channel') && settings.cod_enabled === 'true') available.push('cash_on_delivery');
    if (paymentMethod === 'paypal' && paypalConfigRes && !paypalAvailable) setPaymentMethod(available[0] || 'bank_transfer');
    else if (available.length && !available.includes(paymentMethod)) setPaymentMethod(available[0]);
  }, [settings.payment_transfer_channel, settings.payment_card_channel, settings.payment_cash_channel, settings.payment_gateway_active, settings.cod_enabled, paypalAvailable, paypalConfigRes]);

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

  // Sync default active gateway from settings
  useEffect(() => {
    if (settings.payment_gateway_active) {
      setPaymentMethod(settings.payment_gateway_active);
    }
  }, [settings]);

  // Pre-fill customer info whenever authenticated customer state is updated
  useEffect(() => {
    if (customer) {
      if (customer.name) setName(customer.name);
      if (customer.email) setEmail(customer.email);
      if (customer.phone) setPhone(customer.phone);

      // Check customer.addresses first (from login / profile payload)
      if (customer.addresses && customer.addresses.length > 0) {
        const defaultAddr = customer.addresses.find(a => a.is_default) || customer.addresses[0];
        if (defaultAddr) {
          if (defaultAddr.address_line_1) setAddress(defaultAddr.address_line_1);
          if (defaultAddr.city) setCity(defaultAddr.city);
          if (defaultAddr.state) setState(defaultAddr.state);
          if (defaultAddr.country) setCountry(defaultAddr.country);
        }
      } else {
        // Fallback: check locally stored last-used shipping data for this customer
        const cached = localStorage.getItem(`dansolam_shipping_${customer.email}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.address) setAddress(parsed.address);
            if (parsed.city) setCity(parsed.city);
            if (parsed.state) setState(parsed.state);
            if (parsed.country) setCountry(parsed.country);
            if (parsed.phone && !customer.phone) setPhone(parsed.phone);
          } catch (e) {
            console.error(e);
          }
        }
      }

      const fetchCustomerAddress = async () => {
        const token = localStorage.getItem('dansolam_customer_token') || sessionStorage.getItem('dansolam_customer_token');
        if (token) {
          try {
            const addrRes = await fetch('/api/customer/addresses', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const addrData = await addrRes.json();
            const defaultAddr = addrData.data?.find(a => a.is_default) || addrData.data?.[0];
            if (defaultAddr) {
              if (defaultAddr.address_line_1) setAddress(defaultAddr.address_line_1);
              if (defaultAddr.city) setCity(defaultAddr.city);
              if (defaultAddr.state) setState(defaultAddr.state);
              if (defaultAddr.country) setCountry(defaultAddr.country);

              localStorage.setItem(`dansolam_shipping_${customer.email}`, JSON.stringify({
                address: defaultAddr.address_line_1 || '',
                city: defaultAddr.city || '',
                state: defaultAddr.state || '',
                country: defaultAddr.country || '',
                phone: customer.phone || ''
              }));
            }
          } catch (e) {
            console.error(e);
          }
        }
      };

      fetchCustomerAddress();
    }
  }, [customer]);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  // Handle Inline Customer Login
  const handleInlineLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!loginV.validateAll()) return;
    setAuthSubmitting(true);
    setAuthError('');
    try {
      const result = await customerLogin(authEmail.trim(), authPassword, authRemember);
      if (result.success) {
        systemToast.success('Logged in successfully! Welcome back.');
        const u = result.customer;
        if (u) {
          if (u.name) setName(u.name);
          if (u.email) setEmail(u.email);
          if (u.phone) setPhone(u.phone);
          const defaultAddr = u.addresses?.find(a => a.is_default) || u.addresses?.[0];
          if (defaultAddr) {
            if (defaultAddr.address_line_1) setAddress(defaultAddr.address_line_1);
            if (defaultAddr.city) setCity(defaultAddr.city);
            if (defaultAddr.state) setState(defaultAddr.state);
            if (defaultAddr.country) setCountry(defaultAddr.country);
          } else {
            const cached = localStorage.getItem(`dansolam_shipping_${u.email}`);
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed.address) setAddress(parsed.address);
                if (parsed.city) setCity(parsed.city);
                if (parsed.state) setState(parsed.state);
                if (parsed.country) setCountry(parsed.country);
              } catch (err) {
                console.error(err);
              }
            }
          }
        }
      } else if (!loginV.applyServerErrors(result.errors)) {
        setAuthError(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Handle Inline Customer Registration
  const handleInlineRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!registerV.validateAll()) return;
    setAuthSubmitting(true);
    setAuthError('');
    try {
      const result = await customerRegister(authName.trim(), authEmail.trim(), authPhone.trim(), authPassword, authPasswordConfirm);
      if (result.success) {
        systemToast.success('Account created successfully! You can now complete your order.');
      } else if (!registerV.applyServerErrors(result.errors)) {
        setAuthError(result.message || 'Registration failed.');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    
    if (!customer) {
      setErrorMsg(CHECKOUT_PROMPTS.login);
      return;
    }

    if (!deliveryV.validateAll()) {
      setErrorMsg(CHECKOUT_PROMPTS.details);
      return;
    }

    if (!selectedShipping) {
      setErrorMsg(country ? CHECKOUT_PROMPTS.shipping : CHECKOUT_PROMPTS.country);
      return;
    }

    const isCaptchaEnabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;
    const isCheckoutEnabled = settings.captcha_on_checkout === undefined ? true : (settings.captcha_on_checkout === 'true' || settings.captcha_on_checkout === true);
    if (isCaptchaEnabled && isCheckoutEnabled && !checkoutCaptchaVerified) {
      setErrorMsg(CHECKOUT_PROMPTS.captcha);
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('dansolam_customer_token') || sessionStorage.getItem('dansolam_customer_token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Save shipping data locally for instant retrieval
    const activeEmail = email || customer?.email;
    if (activeEmail) {
      localStorage.setItem(`dansolam_shipping_${activeEmail}`, JSON.stringify({
        address,
        city,
        state,
        country,
        phone: phone || customer?.phone || ''
      }));
    }

    const payload = {
      customer_name: name || customer.name,
      customer_email: email || customer.email,
      customer_phone: phone || customer.phone,
      delivery_address: address,
      delivery_city: city,
      delivery_state: state,
      delivery_country: country,
      shipping_rate_id: selectedShipping ? selectedShipping.id : null,
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
        if (paymentMethod === 'paypal' && !paypalConfigRes?.data?.mock) {
          // Pay on this page: card form or PayPal popup, no redirect.
          setCreatedOrderDetails({ ...data.data, email: data.data.email || email });
          setPaypalPayOpen(true);
          setLoading(false);
        } else if (paymentMethod === 'paypal') {
          // Local simulation only (no PayPal credentials).
          try {
            const paypalRes = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_number: data.data.order_number })
            });
            const paypalData = await paypalRes.json();
            if (paypalData.success) {
              setCreatedOrderDetails({
                ...data.data,
                paypal_order_id: paypalData.data.paypal_order_id,
                approve_url: paypalData.data.approve_url,
                paypal_amount: paypalData.data.amount,
                paypal_currency: paypalData.data.currency,
                is_mock: paypalData.data.mock
              });
              setShowPaystackModal(true);
            } else {
              setErrorMsg(paypalData.message || 'Failed to initialize PayPal order.');
            }
          } catch (ppErr) {
            setErrorMsg('Server connection error initializing PayPal.');
          }
          setLoading(false);
        } else if (['paystack', 'stripe', 'flutterwave'].includes(paymentMethod)) {
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
        setErrorMsg(deliveryV.applyServerErrors(data.errors) ? CHECKOUT_PROMPTS.details : (data.message || 'Checkout failed. Please verify details.'));
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg('Server connection error. Please try again.');
      setLoading(false);
    }
  };

  // Gateway Payment Completion Handler
  const handleCompletePaystackPayment = async () => {
    if (!createdOrderDetails) return;
    setPaystackLoading(true);

    if (paymentMethod === 'paypal' && createdOrderDetails.paypal_order_id) {
      // PayPal requires buyer approval first — redirect to PayPal's approve_url.
      // After approval, PayPal redirects back to return_url with ?token=PAYPAL_ORDER_ID
      // which is handled by the useEffect below to auto-capture.
      if (createdOrderDetails.approve_url) {
        // Store order details in sessionStorage so we can capture after PayPal redirect
        sessionStorage.setItem('paypal_pending_order', JSON.stringify({
          order_number: createdOrderDetails.order_number,
          paypal_order_id: createdOrderDetails.paypal_order_id,
          email: createdOrderDetails.email || email,
        }));
        // Redirect buyer to PayPal to approve the payment
        window.location.href = createdOrderDetails.approve_url;
      } else {
        // Mock mode or no approve_url — capture directly
        try {
          const captureRes = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paypal_order_id: createdOrderDetails.paypal_order_id,
              order_number: createdOrderDetails.order_number
            })
          });
          const captureData = await captureRes.json();
          setPaystackLoading(false);

          if (captureData.success) {
            setShowPaystackModal(false);
            clearCart();
            navigate(`/order-tracking?order_number=${createdOrderDetails.order_number}&contact=${encodeURIComponent(email)}&paypal_success=true`);
          } else {
            systemToast.error(captureData.message || 'PayPal capture failed.');
          }
        } catch (err) {
          setPaystackLoading(false);
          systemToast.error('PayPal authorization error.');
        }
      }
      return;
    }

    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: createdOrderDetails.order_number,
          reference: `TEST-REF-${Date.now()}`
        })
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

  // Auto-capture PayPal order when buyer returns from PayPal approval redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paypalToken = urlParams.get('token'); // PayPal appends ?token=PAYPAL_ORDER_ID on return
    const paypalReturn = urlParams.get('paypal_return');
    const paypalCancel = urlParams.get('paypal_cancel');
    const urlOrderNumber = urlParams.get('order_number');

    if (paypalCancel) {
      systemToast.error('PayPal payment was cancelled. You can try again.');
      window.history.replaceState({}, '', '/checkout');
      return;
    }

    // Only proceed if we have a token (from PayPal redirect) or explicit paypal_return flag
    if (paypalToken || paypalReturn) {
      const pendingStr = sessionStorage.getItem('paypal_pending_order');
      const pending = pendingStr ? JSON.parse(pendingStr) : null;
      sessionStorage.removeItem('paypal_pending_order');

      const orderNumber = pending?.order_number || urlOrderNumber;
      const paypalOrderId = pending?.paypal_order_id || paypalToken;
      const contactEmail = pending?.email || email;

      if (!orderNumber || !paypalOrderId) {
        // Not enough info to capture — shouldn't normally happen
        return;
      }

      // Auto-capture the approved order
      (async () => {
        try {
          const captureRes = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paypal_order_id: paypalOrderId,
              order_number: orderNumber,
            })
          });
          const captureData = await captureRes.json();

          if (captureData.success) {
            clearCart();
            navigate(`/order-tracking?order_number=${orderNumber}&contact=${encodeURIComponent(contactEmail)}&paypal_success=true`);
          } else {
            systemToast.error(captureData.message || 'PayPal payment capture failed after approval.');
            window.history.replaceState({}, '', '/checkout');
          }
        } catch (err) {
          systemToast.error('Network error capturing PayPal payment.');
          window.history.replaceState({}, '', '/checkout');
        }
      })();
    }
  }, []); // Run once on mount

  return (
    <div className="checkout-page relative min-h-screen w-full">
      {/* Ambient decorative glow */}
      <div
        className="fixed top-0 right-0 w-[950px] h-[950px] rounded-full pointer-events-none z-0 blur-3xl opacity-75 -translate-y-1/3 translate-x-1/4"
        style={{ background: 'radial-gradient(circle, rgba(236,38,143,0.20) 0%, rgba(93,62,133,0.16) 42%, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-16 flex flex-col gap-8 relative z-10">
        <SEO title="Secure Checkout" description="Secure payment and delivery checkout options for Dansolam." />
      
        {/* Step Progress Bar */}
        <CheckoutStepper currentStep={2} />

        <Link
          to="/cart"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] shadow-xs transition-all duration-300 self-start btn-spring"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>

        {/* 2-Column Responsive Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {/* Left Main Content (Forms & Flows) */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">

            {/* STEP 1: AUTHENTICATION GATE (Required to proceed) */}
            {!customer ? (
              <div className="bg-white dark:bg-[#1E1528] border-2 border-[#5D3E85]/20 dark:border-[#EC268F]/30 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col gap-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#5D3E85]/10 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex flex-col gap-1.5 border-b border-gray-100 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#5D3E85] dark:bg-[#EC268F] text-white font-extrabold text-xs flex items-center justify-center">1</span>
                    <h2 className="font-extrabold text-xl text-[#221B2B] dark:text-[#F3EFF6]">Account Authentication</h2>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-[#9B8EA9] pl-8">
                    To complete your purchase, please log in to your account or create a new one. Your order tracking and receipts will be secured to your profile.
                  </p>
                </div>

                {/* Account Type Selector Tabs */}
                <div className="grid grid-cols-2 p-1 bg-[#FAF7FC] dark:bg-white/5 rounded-2xl border border-gray-200/80 dark:border-white/10 max-w-md">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthError(''); }}
                    className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      authTab === 'login'
                        ? 'bg-white dark:bg-[#281C36] text-[#5D3E85] dark:text-[#EC268F] shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Existing Customer (Login)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setAuthError(''); }}
                    className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      authTab === 'register'
                        ? 'bg-white dark:bg-[#281C36] text-[#5D3E85] dark:text-[#EC268F] shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>New Customer (Register)</span>
                  </button>
                </div>

                {authError && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* LOGIN TAB FORM */}
                {authTab === 'login' && (
                  <form onSubmit={handleInlineLogin} noValidate className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Email Address</label>
                        <div className="relative">
                          <input
                            {...loginV.bind('authEmail')}
                            type="email"
                            value={authEmail}
                            onChange={e => setAuthEmail(e.target.value)}
                            placeholder="e.g. amina@example.com"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${loginV.stateClass('authEmail')}`}
                          />
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <FieldMessage {...loginV.message('authEmail')} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Password</label>
                        <div className="relative">
                          <input
                            {...loginV.bind('authPassword')}
                            type="password"
                            value={authPassword}
                            onChange={e => setAuthPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${loginV.stateClass('authPassword')}`}
                          />
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <FieldMessage {...loginV.message('authPassword')} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300 font-medium">
                        <input
                          type="checkbox"
                          checked={authRemember}
                          onChange={e => setAuthRemember(e.target.checked)}
                          className="rounded text-[#5D3E85] focus:ring-[#5D3E85]"
                        />
                        <span>Remember me</span>
                      </label>
                      <Link to="/forgot-password" className="text-xs text-[#5D3E85] dark:text-[#EC268F] font-bold hover:underline">
                        Forgot Password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full sm:w-auto self-start px-8 py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold tracking-wider rounded-full flex items-center justify-center gap-2 shadow-md transition-all btn-spring cursor-pointer mt-2"
                    >
                      {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                      <span>Login & Continue to Checkout</span>
                    </button>
                  </form>
                )}

                {/* REGISTER TAB FORM */}
                {authTab === 'register' && (
                  <form onSubmit={handleInlineRegister} noValidate className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Full Name</label>
                        <div className="relative">
                          <input
                            {...registerV.bind('authName')}
                            type="text"
                            value={authName}
                            onChange={e => setAuthName(e.target.value)}
                            placeholder="e.g. Amina Mohammed"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${registerV.stateClass('authName')}`}
                          />
                          <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <FieldMessage {...registerV.message('authName')} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Email Address</label>
                        <div className="relative">
                          <input
                            {...registerV.bind('authEmail')}
                            type="email"
                            value={authEmail}
                            onChange={e => setAuthEmail(e.target.value)}
                            placeholder="e.g. amina@example.com"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${registerV.stateClass('authEmail')}`}
                          />
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <FieldMessage {...registerV.message('authEmail')} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Phone (Optional)</label>
                        <div className="relative">
                          <input
                            {...registerV.bind('authPhone')}
                            type="tel"
                            value={authPhone}
                            onChange={e => setAuthPhone(e.target.value)}
                            placeholder="e.g. +234 801 234 5678"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${registerV.stateClass('authPhone')}`}
                          />
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <FieldMessage {...registerV.message('authPhone', "Optional. Include your country code.")} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Password</label>
                        <div className="relative">
                          <input
                            {...registerV.bind('authPassword')}
                            type="password"
                            value={authPassword}
                            onChange={e => setAuthPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${registerV.stateClass('authPassword')}`}
                          />
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <FieldMessage {...registerV.message('authPassword')} />
                        <PasswordStrength value={authPassword} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Confirm Password</label>
                        <div className="relative">
                          <input
                            {...registerV.bind('authPasswordConfirm')}
                            type="password"
                            value={authPasswordConfirm}
                            onChange={e => setAuthPasswordConfirm(e.target.value)}
                            placeholder="Repeat password"
                            className={`w-full pl-9 pr-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${registerV.stateClass('authPasswordConfirm')}`}
                          />
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <FieldMessage {...registerV.message('authPasswordConfirm')} />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full sm:w-auto self-start px-8 py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold tracking-wider rounded-full flex items-center justify-center gap-2 shadow-md transition-all btn-spring cursor-pointer mt-2"
                    >
                      {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      <span>Create Account & Continue to Checkout</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* LOGGED IN CUSTOMER BADGE */
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 flex items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold  tracking-wider block">Authenticated Customer</span>
                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug">{customer.name} ({customer.email})</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={customerLogout}
                  className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-white/20 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                >
                  Switch Account
                </button>
              </div>
            )}

            {/* STEP 2: CHECKOUT DETAILS & DELIVERY FORM (Visible only when authenticated) */}
            {customer && (
              <form onSubmit={handleCheckoutSubmit} noValidate className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6 text-left animate-slide-in">
                
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#5D3E85] dark:bg-[#EC268F] text-white font-extrabold text-xs flex items-center justify-center">2</span>
                    <div>
                      <h2 className="font-extrabold text-xl md:text-2xl text-[#221B2B] dark:text-[#F3EFF6]">Delivery & Payment</h2>
                      <p className="text-xs text-gray-400 dark:text-[#9B8EA9] mt-0.5">Choose your delivery destination and preferred payment method.</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  tracking-widest border-b border-gray-100 dark:border-white/10 pb-2">Recipient Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider">Full Name</label>
                      <input
                        {...deliveryV.bind('name')}
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className={`px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] shadow-3xs w-full font-medium transition-colors ${deliveryV.stateClass('name')}`}
                        placeholder="e.g. Amina Mohammed"
                      />
                      <FieldMessage {...deliveryV.message('name')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider">Phone Number</label>
                      <input
                        {...deliveryV.bind('phone')}
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className={`px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] shadow-3xs w-full font-medium transition-colors ${deliveryV.stateClass('phone')}`}
                        placeholder="e.g. +44 7700 900123"
                      />
                      <FieldMessage {...deliveryV.message('phone')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider">Email (Receipts & Tracking)</label>
                      <input
                        {...deliveryV.bind('email')}
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className={`px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] shadow-3xs w-full font-medium transition-colors ${deliveryV.stateClass('email')}`}
                        placeholder="e.g. alex@example.com"
                      />
                      <FieldMessage {...deliveryV.message('email', "We send your receipt and tracking link here.")} />
                    </div>
                  </div>
                </div>

                {/* Delivery Address Fields */}
                {(
                  <>
                    <h3 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  tracking-widest border-b border-gray-100 dark:border-white/10 pb-2 mt-2">Physical Delivery Address</h3>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider">Street Address & Landmark</label>
                      <input
                        {...deliveryV.bind('address')}
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className={`px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] shadow-3xs w-full font-medium transition-colors ${deliveryV.stateClass('address')}`}
                        placeholder="e.g. 12 High Street, Flat 3"
                      />
                      <FieldMessage {...deliveryV.message('address')} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider">City</label>
                        <input
                          {...deliveryV.bind('city')}
                          type="text"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          className={`px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] shadow-3xs w-full font-medium transition-colors ${deliveryV.stateClass('city')}`}
                          placeholder="e.g. London"
                        />
                        <FieldMessage {...deliveryV.message('city')} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider">Country</label>
                        <select
                          {...deliveryV.bind('country')}
                          value={country}
                          onChange={e => { setCountry(e.target.value); setState(''); }}
                          className={`px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6] cursor-pointer h-[38px] w-full shadow-3xs font-medium transition-colors ${deliveryV.stateClass('country')}`}
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <FieldMessage {...deliveryV.message('country')} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider">State / Province</label>
                        <select
                          {...deliveryV.bind('state')}
                          value={state}
                          onChange={e => setState(e.target.value)}
                          className={`px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6] cursor-pointer h-[38px] w-full shadow-3xs font-medium transition-colors ${deliveryV.stateClass('state')}`}
                        >
                          <option value="">{country ? 'Select State' : 'Select Country First'}</option>
                          {country && getStates(country).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <FieldMessage {...deliveryV.message('state')} />
                      </div>
                    </div>
                  </>
                )}

                {/* Shipping method — only the methods that apply to this country and item count */}
                <div className="flex flex-col gap-3 pt-4">
                  <h3 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6] tracking-widest pb-1">Shipping Method</h3>
                  {!country ? (
                    <p className="text-xs text-gray-500 dark:text-[#9B8EA9]">Select your country above to see shipping options.</p>
                  ) : eligibleShipping.length === 0 ? (
                    <p className="text-xs text-rose-600">No shipping option is available for this order. Please contact us to arrange delivery.</p>
                  ) : (
                    <div role="radiogroup" aria-label="Shipping method" className="flex flex-col gap-2">
                      {eligibleShipping.map((method) => {
                        const checked = selectedShipping?.id === method.id;
                        const price = parseFloat(method.rate || 0);
                        return (
                          <label
                            key={method.id}
                            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-colors ${
                              checked
                                ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85]/5 dark:bg-white/5'
                                : 'border-gray-200 dark:border-white/15 hover:border-[#5D3E85]/50'
                            }`}
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <input
                                type="radio"
                                name="shipping_method"
                                checked={checked}
                                onChange={() => setShippingMethodId(method.id)}
                                className="accent-[#5D3E85] w-4 h-4 shrink-0"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-bold text-[#221B2B] dark:text-[#F3EFF6]">{method.name}</span>
                                {method.description && (
                                  <span className="block text-xs text-gray-500 dark:text-[#9B8EA9] mt-0.5">{method.description}</span>
                                )}
                              </span>
                            </span>
                            <span className={`shrink-0 text-sm font-extrabold ${price === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#221B2B] dark:text-[#F3EFF6]'}`}>
                              {price === 0 ? 'Free' : `${currencySymbol}${price.toFixed(2)}`}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment Gateways Selection */}
                <h3 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  tracking-widest border-b border-gray-100 dark:border-white/10 pb-2 mt-2">Payment Channels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* 1. Paystack Gateway */}
                  {storefrontEnabled('payment_card_channel') && (settings.paystack_enabled === undefined || ['true', '1', true, 1].includes(settings.paystack_enabled)) && (
                    <label className={`border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs ${
                      paymentMethod === 'paystack' ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85]/5 dark:bg-[#EC268F]/10 text-[#5D3E85] dark:text-[#EC268F]' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#C9BED4] hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'paystack'}
                          onChange={() => setPaymentMethod('paystack')}
                          className="text-[#5D3E85] focus:ring-[#5D3E85] w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs block text-[#221B2B] dark:text-[#F3EFF6]">Paystack Payments</span>
                          <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] block mt-0.5">Debit/Credit Cards, Instant Bank & Digital Wallets</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-3xs">
                        <PaystackLogo className="h-4.5 w-auto" variant="adaptive" />
                      </div>
                    </label>
                  )}

                  {/* 2. Stripe Gateway */}
                  {storefrontEnabled('payment_card_channel') && (settings.stripe_enabled === undefined || ['true', '1', true, 1].includes(settings.stripe_enabled)) && (
                    <label className={`border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs ${
                      paymentMethod === 'stripe' ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85]/5 dark:bg-[#EC268F]/10 text-[#5D3E85] dark:text-[#EC268F]' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#C9BED4] hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'stripe'}
                          onChange={() => setPaymentMethod('stripe')}
                          className="text-[#5D3E85] focus:ring-[#5D3E85] w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs block text-[#221B2B] dark:text-[#F3EFF6]">Stripe Global Payments</span>
                          <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] block mt-0.5">Visa, Mastercard, AMEX & Apple Pay</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-3xs">
                        <StripeLogo className="h-4 w-auto" />
                      </div>
                    </label>
                  )}

                  {/* 3. PayPal Gateway */}
                  {storefrontEnabled('payment_card_channel') && paypalAvailable && (
                    <label className={`border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs ${
                      paymentMethod === 'paypal' ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85]/5 dark:bg-[#EC268F]/10 text-[#5D3E85] dark:text-[#EC268F]' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#C9BED4] hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'paypal'}
                          onChange={() => setPaymentMethod('paypal')}
                          className="text-[#5D3E85] focus:ring-[#5D3E85] w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs block text-[#221B2B] dark:text-[#F3EFF6]">PayPal Express Checkout</span>
                          <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] block mt-0.5">PayPal Balance & International Cards</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-3xs">
                        <PayPalLogo className="h-4.5 w-auto" />
                      </div>
                    </label>
                  )}

                  {/* 4. Bank Transfer */}
                  {storefrontEnabled('payment_transfer_channel') && (settings.bank_transfer_enabled === undefined || ['true', '1', true, 1].includes(settings.bank_transfer_enabled)) && (
                    <label className={`border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs ${
                      paymentMethod === 'bank_transfer' ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85]/5 dark:bg-[#EC268F]/10 text-[#5D3E85] dark:text-[#EC268F]' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#C9BED4] hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'bank_transfer'}
                          onChange={() => setPaymentMethod('bank_transfer')}
                          className="text-[#5D3E85] focus:ring-[#5D3E85] w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs block text-[#221B2B] dark:text-[#F3EFF6]">Bank Transfer (Manual)</span>
                          <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] block mt-0.5">Transfer directly to official account</span>
                        </div>
                      </div>
                      <Landmark className="w-4 h-4 text-[#5D3E85] dark:text-[#EC268F] shrink-0" />
                    </label>
                  )}

                  {/* 5. Cash on Delivery */}
                  {storefrontEnabled('payment_cash_channel') && (settings.cod_enabled === 'true' || settings.cod_enabled === true || settings.cod_enabled === '1' || settings.cod_enabled === 1) && (
                    <label className={`border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs ${
                      paymentMethod === 'cash_on_delivery' ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85]/5 dark:bg-[#EC268F]/10 text-[#5D3E85] dark:text-[#EC268F]' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#C9BED4] hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cash_on_delivery'}
                          onChange={() => setPaymentMethod('cash_on_delivery')}
                          className="text-[#5D3E85] focus:ring-[#5D3E85] w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs block text-[#221B2B] dark:text-[#F3EFF6]">Cash on Delivery (COD)</span>
                          <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] block mt-0.5">Pay when your order arrives</span>
                        </div>
                      </div>
                      <Banknote className="w-4 h-4 text-[#5D3E85] dark:text-[#EC268F] shrink-0" />
                    </label>
                  )}
                </div>

                {/* Conditional Bank Details display */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="bg-[#FAF7FC] dark:bg-white/5 rounded-2xl p-5 text-xs text-gray-600 dark:text-[#C9BED4] flex flex-col gap-2 leading-relaxed animate-fade-in border border-gray-100 dark:border-white/10 shadow-3xs">
                    <span className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-xs tracking-wider border-b border-[#5D3E85]/10 pb-1.5 ">Our Bank Details:</span>
                    {hasBankDetails ? (
                      <>
                        <p className="mt-1">🏦 <strong>Bank:</strong> {settings.bank_name}</p>
                        <p>🔢 <strong>Account Number:</strong> {settings.bank_account_number}</p>
                        <p>👤 <strong>Account Name:</strong> {settings.bank_account_name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-[#9B8EA9] mt-1 leading-normal border-t border-[#5D3E85]/10 pt-1.5">⚠️ Please transfer the exact amount and use your order number as the reference.</p>
                      </>
                    ) : (
                      <p className="mt-1">Place your order and we will email you our bank details and your order reference so you can complete the transfer. Your order is held until payment arrives.</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider">Order Notes (Optional)</label>
                  <textarea
                    {...deliveryV.bind('notes')}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows="2"
                    className={`px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF9F6] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] shadow-3xs w-full resize-none leading-relaxed h-20 font-medium transition-colors ${deliveryV.stateClass('notes')}`}
                    placeholder="e.g. Delivery landmarks or call-before-delivery instructions..."
                  ></textarea>
                  <FieldMessage {...deliveryV.message('notes', notes ? `${notes.length}/1000` : null)} />
                </div>

                <CaptchaWidget
                  settings={settings}
                  formType="checkout"
                  verified={checkoutCaptchaVerified}
                  setVerified={setCheckoutCaptchaVerified}
                />

                {errorMsg && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold tracking-wider rounded-full flex items-center justify-center gap-1.5 shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] cursor-pointer btn-spring"
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
            )}

          </div>

          {/* Right Column: Floating Sticky Order Summary Card */}
          <div className="lg:col-span-4 w-full">
            <div className="sticky top-24 z-30 bg-white/95 dark:bg-[#1E1528]/95 backdrop-blur-xl border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4 text-left transition-all duration-300">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-lg">Your Order</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#5D3E85]/10 text-[#5D3E85] dark:text-[#EC268F]">
                  {items.reduce((s, i) => s + i.quantity, 0)} Items
                </span>
              </div>
              
              {/* Product items scroll area */}
              <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1.5 overscroll-contain">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.product_variant_id}`} className="flex justify-between items-center gap-3 text-xs p-2.5 bg-[#FAF7FC] dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-3xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] truncate block leading-tight">{item.name}</span>
                      <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] block mt-0.5 truncate">{item.variant_label || 'Standard selection'}</span>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <span className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">{currencySymbol}{(item.price * item.quantity).toLocaleString()}</span>
                      <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-[#5D3E85]/15 dark:bg-[#EC268F]/20 text-[#5D3E85] dark:text-[#EC268F] text-[9px] font-extrabold">×{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price breakdown and shipping surcharges */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex flex-col gap-2.5 text-xs text-gray-600 dark:text-[#C9BED4]">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-[#9B8EA9]">Subtotal</span>
                  <span className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">{currencySymbol}{getSubtotal().toLocaleString()}</span>
                </div>

                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between items-center text-xs text-green-600 dark:text-green-400">
                    <span>Discount Code</span>
                    <span className="font-bold">-{currencySymbol}{getDiscountAmount().toLocaleString()}</span>
                  </div>
                )}

                {/* Dynamic Applied Shipping Breakdown */}
                <div className="flex flex-col gap-1 py-1 border-y border-dashed border-gray-100 dark:border-white/10">
                  {getAppliedShippingRates().length === 0 ? (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-[#9B8EA9]">Shipping</span>
                      <span className="text-gray-400">{country ? 'Not available' : 'Select country'}</span>
                    </div>
                  ) : getAppliedShippingRates().map((rateLine, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-[#9B8EA9] truncate pr-2">Shipping · {rateLine.name}</span>
                      <span className="font-semibold text-[#221B2B] dark:text-[#F3EFF6] shrink-0">
                        {rateLine.amount === 0
                          ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">Free</span>
                          : `${currencySymbol}${rateLine.amount.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center gap-4 border-t border-gray-100 dark:border-white/10 pt-3 text-[#221B2B] dark:text-[#F3EFF6] mt-0.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs  tracking-wider text-gray-400 dark:text-[#9B8EA9]">Total Due</span>
                    <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9]">VAT & Taxes Included</span>
                  </div>
                  <span className="text-[#5D3E85] dark:text-[#EC268F] text-2xl md:text-3xl font-extrabold leading-none text-right">
                    {currencySymbol}{getTotal(settings).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DYNAMIC GATEWAY OVERLAY MODAL (PORTALED DIRECTLY TO DOCUMENT.BODY) */}
      <PayPalPaymentModal
        open={paypalPayOpen && !!createdOrderDetails}
        orderNumber={createdOrderDetails?.order_number}
        method={paypalPayMethod}
        onMethodChange={setPaypalPayMethod}
        amountLabel={`${currencySymbol}${parseFloat(createdOrderDetails?.total_amount || 0).toFixed(2)}`}
        onSuccess={() => { setPaypalPayOpen(false); handlePayPalCardSuccess(); }}
        onClose={() => {
          // The order is saved: empty the bag (so it is not ordered twice) and let the
          // customer finish payment from the order's payment page.
          setPaypalPayOpen(false);
          clearCart();
          navigate(`/pay/${encodeURIComponent(createdOrderDetails.order_number)}?contact=${encodeURIComponent(createdOrderDetails.email || email)}`);
        }}
      />

      {showPaystackModal && createdOrderDetails && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white dark:bg-[#1E1528] rounded-3xl p-7 max-w-md w-full shadow-2xl flex flex-col gap-6 text-center border border-[#EADBEE] dark:border-white/12 animate-scale-up my-auto relative z-10">
            
            {/* Gateway Icon / Logo Badge */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto font-bold shadow-lg p-2.5 ${
              paymentMethod === 'paystack' ? 'bg-white shadow-emerald-500/20 border border-emerald-100' :
              paymentMethod === 'stripe' ? 'bg-white shadow-indigo-500/20 border border-indigo-100' :
              paymentMethod === 'paypal' ? 'bg-white shadow-blue-500/20 border border-blue-100' :
              'bg-gradient-to-tr from-[#5D3E85] to-[#EC268F] shadow-[#5D3E85]/20'
            }`}>
              {paymentMethod === 'paystack' && <PaystackLogo className="h-6 w-auto" />}
              {paymentMethod === 'stripe' && <StripeLogo className="h-5 w-auto" />}
              {paymentMethod === 'paypal' && <PayPalLogo className="h-6 w-auto" />}
              {paymentMethod === 'flutterwave' && <span className="text-xl font-extrabold text-white">F</span>}
            </div>

            <div>
              <span className="text-[10px] tracking-widest font-extrabold text-[#5D3E85] dark:text-[#EC268F] block mb-1">
                {paymentMethod === 'paypal' ? 'PayPal Gateway' : 'Secure Online Payment'}
              </span>
              <h3 className="font-extrabold text-xl text-[#221B2B] dark:text-[#F3EFF6]">
                {paymentMethod === 'paypal' ? 'Complete purchase with PayPal' : 'Complete secure payment'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-[#9B8EA9] mt-1.5 leading-relaxed">
                {paymentMethod === 'paypal'
                  ? (paypalSubMethod === 'paypal_credit_card' && !cardFieldsUnavailable
                      ? 'Enter your card details below to pay securely without leaving this page.'
                      : 'You will be securely redirected to PayPal to sign in and authorize your payment.')
                  : `Please authorize payment for Order #${createdOrderDetails.order_number}`}
              </p>
            </div>

            {/* PayPal Funding Options Selection (when PayPal gateway is chosen) */}
            {paymentMethod === 'paypal' && (
              <div className="flex flex-col gap-2 text-left">
                <span className="text-[10px] font-bold text-gray-400 dark:text-[#9B8EA9]  tracking-wider">
                  Select payment source
                </span>
                <div className="flex flex-col gap-2">
                  <label
                    onClick={() => setPaypalSubMethod('paypal_balance')}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      paypalSubMethod === 'paypal_balance'
                        ? 'border-[#0079C1] bg-blue-50/60 dark:bg-blue-950/30 text-gray-900 dark:text-white shadow-xs'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paypal_sub"
                        checked={paypalSubMethod === 'paypal_balance'}
                        onChange={() => setPaypalSubMethod('paypal_balance')}
                        className="text-[#0079C1] focus:ring-[#0079C1] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6]">PayPal account balance</span>
                        <span className="text-[10px] text-gray-500 dark:text-[#9B8EA9]">Fast 1-click checkout with existing balance or linked bank</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      Standard
                    </span>
                  </label>

                  <label
                    onClick={() => setPaypalSubMethod('paypal_credit_card')}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      paypalSubMethod === 'paypal_credit_card'
                        ? 'border-[#0079C1] bg-blue-50/60 dark:bg-blue-950/30 text-gray-900 dark:text-white shadow-xs'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paypal_sub"
                        checked={paypalSubMethod === 'paypal_credit_card'}
                        onChange={() => setPaypalSubMethod('paypal_credit_card')}
                        className="text-[#0079C1] focus:ring-[#0079C1] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6]">Debit or credit card via PayPal</span>
                        <span className="text-[10px] text-gray-500 dark:text-[#9B8EA9]">Visa, MasterCard, American Express, Discover</span>
                      </div>
                    </div>
                    <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                  </label>
                </div>
              </div>
            )}

            {/* Inline PayPal card form — keeps the buyer on-site for card payments */}
            {paymentMethod === 'paypal' && paypalSubMethod === 'paypal_credit_card' && !cardFieldsUnavailable && createdOrderDetails?.paypal_order_id && (
              <PayPalCardFields
                paypalOrderId={createdOrderDetails.paypal_order_id}
                orderNumber={createdOrderDetails.order_number}
                amountLabel={`${currencySymbol}${parseFloat(createdOrderDetails?.total_amount || getTotal(settings)).toLocaleString()}`}
                onSuccess={handlePayPalCardSuccess}
                onFallbackRequired={() => setCardFieldsUnavailable(true)}
              />
            )}

            {/* Order Tally Box */}
            <div className="bg-[#FAF7FC] dark:bg-white/5 rounded-2xl p-4 text-left flex flex-col gap-2.5 border border-[#EADBEE] dark:border-white/10 text-xs">
              <div className="flex justify-between text-gray-500 dark:text-[#9B8EA9]">
                <span>Merchant</span>
                <span className="font-bold text-gray-800 dark:text-[#F3EFF6]">{ecommerce?.name || 'Dansolam Beauty Home'}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-[#9B8EA9]">
                <span>Account Email</span>
                <span className="font-bold text-gray-800 dark:text-[#F3EFF6] truncate max-w-[200px]">{createdOrderDetails?.email || customer?.email || email}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-[#9B8EA9] pt-2 border-t border-gray-200/50 dark:border-white/10">
                <span className="font-bold text-gray-700 dark:text-[#C9BED4]">Total Payable</span>
                <span className="font-extrabold text-[#5D3E85] dark:text-[#EC268F] text-base">{currencySymbol}{parseFloat(createdOrderDetails?.total_amount || getTotal(settings)).toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons — the redirect CTA is hidden while inline card fields are active */}
            <div className="flex flex-col gap-2.5">
              {!(paymentMethod === 'paypal' && paypalSubMethod === 'paypal_credit_card' && !cardFieldsUnavailable) && (
              <button
                type="button"
                onClick={handleCompletePaystackPayment}
                disabled={paystackLoading}
                className={`w-full py-4 text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg transition-all btn-spring ${
                  paymentMethod === 'paystack' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25' :
                  paymentMethod === 'stripe' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25' :
                  paymentMethod === 'paypal' ? 'bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-600 hover:to-blue-700 shadow-blue-500/25' : 'bg-[#5D3E85] hover:bg-[#EC268F]'
                }`}
              >
                {paystackLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'stripe' ? 'Authorize card payment' :
                       paymentMethod === 'paypal' ? 'Continue to PayPal →' :
                       paymentMethod === 'paystack' ? 'Authorize Paystack payment' : 'Complete online payment'}
                    </span>
                  </>
                )}
              </button>
              )}
              <button
                type="button"
                onClick={() => setShowPaystackModal(false)}
                disabled={paystackLoading}
                className="w-full py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-600 dark:text-[#C9BED4] text-xs font-bold rounded-full text-center transition-all cursor-pointer"
              >
                Cancel / Return to checkout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
