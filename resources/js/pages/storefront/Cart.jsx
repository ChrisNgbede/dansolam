import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, Percent, Truck, HelpCircle, ShieldCheck } from 'lucide-react';
import { useCardQuickView } from '../../components/storefront/QuickViewProvider';
import { useCartStore, isUkCountry } from '../../store/cartStore';
import SEO from '../../components/seo/SEO';
import CheckoutStepper from '../../components/storefront/CheckoutStepper';
import { getCurrencySymbol } from '../../utils/currency';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { FieldMessage } from '../../components/ui/FieldMessage';
import { FIELD_ERROR_CLASS, FIELD_VALID_CLASS } from '../../hooks/useLiveValidation';

export default function Cart() {
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol();

  // Zustand State hooks
  const items = useCartStore(state => state.items);
  const coupon = useCartStore(state => state.coupon);
  const shippingRates = useCartStore(state => state.shippingRates);
  const shippingMethodId = useCartStore(state => state.shippingMethodId);
  const deliveryCountry = useCartStore(state => state.deliveryCountry);

  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const setCoupon = useCartStore(state => state.setCoupon);
  const setShippingRates = useCartStore(state => state.setShippingRates);
  const setShippingMethodId = useCartStore(state => state.setShippingMethodId);
  const setDeliveryCountry = useCartStore(state => state.setDeliveryCountry);
  const getEligibleShipping = useCartStore(state => state.getEligibleShipping);
  const getSelectedShipping = useCartStore(state => state.getSelectedShipping);
  const addItem = useCartStore(state => state.addItem);
  const clearCart = useCartStore(state => state.clearCart);

  const getSubtotal = useCartStore(state => state.getSubtotal);
  const getDiscountAmount = useCartStore(state => state.getDiscountAmount);
  const getDeliveryFee = useCartStore(state => state.getDeliveryFee);
  const getTotal = useCartStore(state => state.getTotal);

  // Local state
  const [couponCode, setCouponCode] = useState(coupon ? coupon.code : '');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Lock body scroll when clear cart confirmation is open
  useEffect(() => {
    if (showClearConfirmation) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => { if (e.key === 'Escape') setShowClearConfirmation(false); };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [showClearConfirmation]);

  // Shipping methods (same rules checkout and the server use)
  const { data: shippingRatesRes } = useQuery({
    queryKey: ['public-shipping-rates'],
    queryFn: () => fetch('/api/shipping-rates').then(res => res.json())
  });
  useEffect(() => {
    if (shippingRatesRes?.data) setShippingRates(shippingRatesRes.data);
  }, [shippingRatesRes, setShippingRates]);
  // The cart estimates for the UK until checkout knows the real country.
  useEffect(() => {
    if (!deliveryCountry) setDeliveryCountry('United Kingdom');
  }, [deliveryCountry, setDeliveryCountry]);

  // Fetch Ecommerce Settings for configurations
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-cart'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  const settings = settingsRes?.data?.settings || {};
  const allowOverselling = settings.allow_overselling === 'true' || settings.allow_overselling === true || settings.allow_overselling === '1' || settings.allow_overselling === 1;
  const hasUnavailableItems = !allowOverselling && items.some(item => item.max_stock <= 0 || item.quantity > item.max_stock);

  // Fetch popular products for cross selling
  const { data: crossSellRes } = useQuery({
    queryKey: ['cart-cross-sell'],
    queryFn: () => fetch('/api/products?limit=8').then(res => res.json())
  });
  const allProducts = crossSellRes?.data?.data || [];

  // Filter out products already in cart
  const cartProductIds = items.map(item => item.product_id);
  const crossSellProducts = allProducts
    .filter(p => !cartProductIds.includes(p.id))
    .slice(0, 3);

  const isUkEstimate = isUkCountry(deliveryCountry || 'United Kingdom');
  const eligibleShipping = getEligibleShipping();
  const selectedShipping = getSelectedShipping();
  void shippingRates; void shippingMethodId;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode.trim()) {
      setCouponError('Enter a coupon code first.');
      return;
    }

    try {
      const res = await fetch('/api/coupon/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: getSubtotal()
        })
      });
      const data = await res.json();

      if (data.success) {
        setCoupon(data.data);
        setCouponSuccess(`Coupon "${data.data.code}" applied!`);
      } else {
        setCouponError(data.message);
        setCoupon(null);
      }
    } catch (err) {
      setCouponError('Error verifying coupon');
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
  };

  const handleCheckoutRedirect = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="relative min-h-[75vh] w-full pt-28 sm:pt-36 pb-16 px-4 md:px-6 font-sans animate-fade-in overflow-hidden">
      {/* Full-bleed subtle top-right ambient glow */}
      <div
        className="fixed top-0 right-0 w-[950px] h-[950px] rounded-full pointer-events-none z-0 blur-3xl opacity-75 -translate-y-1/3 translate-x-1/4"
        style={{ background: 'radial-gradient(circle, rgba(236,38,143,0.20) 0%, rgba(93,62,133,0.16) 42%, transparent 70%)' }}
      />

        <SEO title="Your Bag is Empty" description="Your shopping cart is currently empty. Explore our organic skincare and body care products." />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-gray-150 dark:border-gray-750 shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col items-center text-center gap-6 relative overflow-hidden">

          {/* Ambient background glow */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#5D3E85]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill Tag */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#5D3E85]/10 text-[#5D3E85] text-[10px] font-bold  tracking-wider border border-[#5D3E85]/15">
            Shopping Bag Is Empty
          </span>

          {/* Animated Hero Illustration Container */}
          <div className="relative my-2 group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#5D3E85]/15 via-[#5D3E85]/5 to-amber-200/40 dark:from-[#5D3E85]/20 dark:to-amber-500/20 border border-[#5D3E85]/20 flex items-center justify-center shadow-inner transition-transform duration-700 hover:scale-105">
              <ShoppingBag className="w-12 h-12 text-[#5D3E85] transition-transform duration-500 group-hover:rotate-6" />
            </div>
          </div>

          {/* Header & Description */}
          <div className="flex flex-col gap-2.5 max-w-md">
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 dark:text-white tracking-tight">
              Your Bag is Empty
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Explore our 100% organic body creams, oils, scrubs, soaps and skincare.
            </p>
          </div>

          {/* Primary Action Button */}
          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold tracking-wider rounded-full shadow-lg shadow-[#5D3E85]/20 hover:shadow-xl hover:shadow-[#5D3E85]/30 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore Skincare Collection</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          {/* Quick-Shop Category Navigation Pills */}
          <div className="w-full pt-6 border-t border-gray-100 dark:border-gray-700/60 mt-2 flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400  tracking-widest">
              Quick Browse Popular Categories
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/shop"
                className="px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-[#5D3E85]/10 hover:text-[#5D3E85] text-gray-650 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600 transition-all duration-200"
              >
                ✨ All Products
              </Link>
              <Link
                to="/shop"
                className="px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-[#5D3E85]/10 hover:text-[#5D3E85] text-gray-650 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600 transition-all duration-200"
              >
                🌸 Face Care & Serums
              </Link>
              <Link
                to="/shop"
                className="px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-[#5D3E85]/10 hover:text-[#5D3E85] text-gray-650 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600 transition-all duration-200"
              >
                🧴 Body Lotions & Creams
              </Link>
              <Link
                to="/shop"
                className="px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-[#5D3E85]/10 hover:text-[#5D3E85] text-gray-650 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600 transition-all duration-200"
              >
                🌿 Organic Soaps & Scrubs
              </Link>
            </div>
          </div>

          {/* Trust Guarantees Footer Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-gray-400 pt-2 font-medium">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#5D3E85]" /> Nationwide Delivery
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Organic
            </span>
          </div>

        </div>
      </div>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="relative min-h-screen w-full font-sans text-left overflow-hidden">
      {/* Full-bleed subtle top-right ambient glow */}
      <div
        className="fixed top-0 right-0 w-[950px] h-[950px] rounded-full pointer-events-none z-0 blur-3xl opacity-75 -translate-y-1/3 translate-x-1/4"
        style={{ background: 'radial-gradient(circle, rgba(236,38,143,0.20) 0%, rgba(93,62,133,0.16) 42%, transparent 70%)' }}
      />

      <SEO title="Shopping Cart | Dansolam Beauty Home" description="Review items in your shopping cart before placing your order at Dansolam." />

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-16 flex flex-col gap-8 relative z-10">

      {/* Progress Stepper */}
      <CheckoutStepper currentStep={1} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Cart items list */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between gap-4 border-b border-[#EADBEE] dark:border-white/10 pb-4">
            <h1 className="font-extrabold text-xl md:text-2xl text-[#221B2B] dark:text-[#F3EFF6]">
              Shopping Cart ({items.length} items)
            </h1>
            <button type="button" onClick={() => setShowClearConfirmation(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-red-200 dark:border-red-800 bg-white dark:bg-[#1E1528] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-[10px] font-bold  tracking-wider transition-colors cursor-pointer btn-spring">
              <Trash2 className="w-3.5 h-3.5" /> Clear Cart
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={`${item.product_id}-${item.product_variant_id}`}
                className="flex items-center gap-4 bg-white dark:bg-[#1E1528] p-4 rounded-2xl border border-[#EADBEE] dark:border-white/10 hover:border-[#5D3E85]/40 transition-all shadow-xs"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shrink-0 relative">
                  <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                  <span className="text-[8px] text-[#5D3E85] dark:text-[#EC268F] font-bold  tracking-widest leading-none">
                    {item.variant_label ? 'Variant Selection' : 'SHOP Beauty'}
                  </span>
                  <h3 className="font-extrabold text-xs md:text-sm text-[#221B2B] dark:text-[#F3EFF6] truncate leading-snug">{item.name}</h3>
                  {item.variant_label && (
                    <span className="text-[9px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-2 py-0.5 rounded-md text-gray-500 dark:text-[#C9BED4] font-medium inline-block self-start mt-0.5 leading-none">
                      {item.variant_label}
                    </span>
                  )}

                  <div className="flex items-center gap-4 mt-1.5">
                    {/* Quantity adjusts */}
                    <div className="flex items-center border border-gray-200 dark:border-white/15 rounded-lg scale-90 origin-left bg-white dark:bg-[#231B30] shadow-3xs overflow-hidden">
                      <button
                        onClick={(e) => {
                          updateQuantity(item.product_id, item.product_variant_id, item.quantity - 1, allowOverselling);
                          if (e.currentTarget) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            window.dispatchEvent(new CustomEvent('animate-to-cart', {
                              detail: {
                                startX: rect.left + rect.width / 2,
                                startY: rect.top + rect.height / 2,
                                imageUrl: item.image,
                                type: 'subtract',
                                count: 1
                              }
                            }));
                          }
                        }}
                        className="p-1 text-gray-500 dark:text-[#C9BED4] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors w-7 h-7 flex items-center justify-center shrink-0 cursor-pointer"
                        title="Decrease quantity"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6] w-8 text-center select-none">{item.quantity}</span>
                      <button
                        onClick={(e) => {
                          updateQuantity(item.product_id, item.product_variant_id, item.quantity + 1, allowOverselling);
                          if (e.currentTarget) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            window.dispatchEvent(new CustomEvent('animate-to-cart', {
                              detail: {
                                startX: rect.left + rect.width / 2,
                                startY: rect.top + rect.height / 2,
                                imageUrl: item.image,
                                type: 'add',
                                count: 1
                              }
                            }));
                          }
                        }}
                        className="p-1 text-gray-500 dark:text-[#C9BED4] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors w-7 h-7 flex items-center justify-center shrink-0 cursor-pointer"
                        title="Increase quantity"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id, item.product_variant_id)}
                      className="text-red-500 hover:text-red-650 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className={`text-[9px] font-bold  mt-1 tracking-wider leading-none ${item.max_stock > 0 || allowOverselling ? 'text-[#5D3E85] dark:text-[#EC268F]' : 'text-rose-500'}`}>
                    {item.max_stock > 0
                      ? `Only ${item.max_stock} units left`
                      : allowOverselling
                        ? 'Backorder Available'
                        : 'Out of stock'}
                  </span>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-xs md:text-sm text-[#221B2B] dark:text-[#F3EFF6] block leading-none">
                    {currencySymbol}{(item.price * item.quantity).toLocaleString()}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[10px] text-gray-400 dark:text-[#6B6274] font-medium block mt-1.5 leading-none">
                      {currencySymbol}{item.price.toLocaleString()} each
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cross selling / Related Items (Compact Cart Grid) */}
          {crossSellProducts.length > 0 && (
            <div className="border-t border-[#EADBEE] dark:border-white/10 pt-8 mt-6 w-full text-left">
              <h3 className="font-extrabold text-base text-[#221B2B] dark:text-[#F3EFF6] mb-4 flex items-center gap-2">
                <span>✨</span> Complete Your Routine
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {crossSellProducts.map((prod) => (
                  <CartProductCard
                    key={prod.id}
                    product={prod}
                    currencySymbol={currencySymbol}
                    addItem={addItem}
                    allowOverselling={allowOverselling}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary & Guarantee (Sticky & Floating) */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24 self-start z-30 flex flex-col gap-4">
          <div className="bg-white/95 dark:bg-[#1E1528]/95 backdrop-blur-xl border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-4 text-left transition-all duration-300">
            <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-lg border-b border-gray-100 dark:border-white/10 pb-3">Order Summary</h3>

            <div className="flex flex-col gap-3 text-xs text-gray-600 dark:text-[#C9BED4]">
              <div className="flex justify-between items-center text-base py-1">
                <span className="font-bold text-gray-500 dark:text-[#9B8EA9]">Subtotal ({totalItems} items)</span>
                <span className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">{currencySymbol}{getSubtotal().toLocaleString()}</span>
              </div>

              {coupon && (
                <div className="flex justify-between items-center text-green-600 bg-green-50/50 dark:bg-green-950/30 border border-green-100 dark:border-green-800 p-2 rounded-xl">
                  <span className="flex items-center gap-1 font-semibold">
                    Promo: {coupon.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>- {currencySymbol}{getDiscountAmount().toLocaleString()}</span>
                    <button onClick={handleRemoveCoupon} className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer">Remove</button>
                  </div>
                </div>
              )}

              {/* Shipping estimate: same rules as checkout */}
              <div className="border-t border-[#5D3E85]/10 my-2 pt-3 flex flex-col gap-2.5">
                <span className="font-bold text-[#221B2B] dark:text-[#F3EFF6] text-xs block">Shipping to</span>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Shipping destination">
                  {[
                    { label: 'United Kingdom', value: 'United Kingdom', active: isUkEstimate },
                    { label: 'International', value: 'International', active: !isUkEstimate },
                  ].map((dest) => (
                    <button
                      key={dest.value}
                      type="button"
                      role="radio"
                      aria-checked={dest.active}
                      onClick={() => { setDeliveryCountry(dest.value); setShippingMethodId(null); }}
                      className={`py-2 rounded-full border text-center font-bold text-xs transition-all cursor-pointer btn-spring ${dest.active ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85] dark:bg-[#EC268F] text-white shadow-xs' : 'border-gray-200 dark:border-white/15 text-gray-600 dark:text-[#C9BED4] bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                    >
                      {dest.label}
                    </button>
                  ))}
                </div>

                {eligibleShipping.length > 0 ? (
                  <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Shipping method">
                    {eligibleShipping.map((method) => {
                      const checked = selectedShipping?.id === method.id;
                      const price = parseFloat(method.rate || 0);
                      return (
                        <label key={method.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs ${checked ? 'border-[#5D3E85] dark:border-[#EC268F] bg-[#5D3E85]/5 dark:bg-white/5' : 'border-gray-200 dark:border-white/15'}`}>
                          <span className="flex items-center gap-2 min-w-0">
                            <input type="radio" name="cart_shipping" checked={checked} onChange={() => setShippingMethodId(method.id)} className="accent-[#5D3E85] shrink-0" />
                            <span className="truncate text-[#221B2B] dark:text-[#F3EFF6] font-semibold" title={method.description || method.name}>{method.name}</span>
                          </span>
                          <span className="shrink-0 font-bold">{price === 0 ? 'Free' : `${currencySymbol}${price.toFixed(2)}`}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-[#9B8EA9]">Shipping is confirmed at checkout.</span>
                )}
              </div>

              <div className="flex justify-between border-t border-[#5D3E85]/10 pt-3 items-center">
                <span>Delivery Fee</span>
                <span className="font-semibold text-[#221B2B] dark:text-[#F3EFF6]">
                  {selectedShipping ? (getDeliveryFee() > 0 ? `${currencySymbol}${getDeliveryFee().toFixed(2)}` : 'Free') : '—'}
                </span>
              </div>

              <div className="flex justify-between border-t border-[#5D3E85]/20 pt-4 text-[#221B2B] dark:text-[#F3EFF6] items-center gap-4">
                <span className="text-base md:text-lg font-extrabold">Total Amount</span>
                <span className="text-[#5D3E85] dark:text-[#EC268F] text-2xl md:text-3xl font-extrabold leading-none text-right">{currencySymbol}{getTotal(settings).toLocaleString()}</span>
              </div>
            </div>

            {/* Coupon Input */}
            <form onSubmit={handleApplyCoupon} noValidate className="border-t border-[#5D3E85]/10 pt-4 flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider block">Apply Promo Coupon</label>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 w-full max-w-full items-stretch">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, '')); setCouponError(''); setCouponSuccess(''); }}
                  aria-invalid={couponError ? true : undefined}
                  aria-describedby="cart-coupon-message"
                  className={`min-w-0 w-full px-3 py-2 border border-gray-200 dark:border-white/15 rounded-full focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5  font-semibold text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${couponError ? FIELD_ERROR_CLASS : couponSuccess ? FIELD_VALID_CLASS : ''}`}
                />
                <button
                  type="submit"
                  className="max-w-full px-4 py-2 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-[10px] font-extrabold tracking-wider rounded-full transition-colors cursor-pointer btn-spring"
                >
                  Apply
                </button>
              </div>
              {couponSuccess
                ? <span id="cart-coupon-message" aria-live="polite" className="px-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold field-message-in">{couponSuccess}</span>
                : <FieldMessage id="cart-coupon-message" error={couponError} />}
            </form>

            {/* Checkout Button */}
            <button
              onClick={handleCheckoutRedirect}
              disabled={hasUnavailableItems}
              className="w-full mt-2 py-3 bg-[#5D3E85] hover:bg-[#EC268F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-extrabold tracking-wider rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer btn-spring"
            >
              {hasUnavailableItems ? 'Remove Out-of-Stock Items' : 'Proceed to Checkout'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Secure Checkout Badges (Inside sticky sidebar column) */}
          <div className="border border-[#EADBEE] dark:border-white/10 rounded-2xl p-4 flex flex-col gap-2 bg-white/95 dark:bg-[#1E1528]/95 backdrop-blur-xl shadow-sm text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6]">
              <ShieldCheck className="w-4.5 h-4.5 text-[#5D3E85] dark:text-[#EC268F]" />
              <span>Secure Checkout Guarantee</span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-[#9B8EA9] leading-normal">
              Your details are protected using 256-bit SSL encryption and verified secure global payment gateways.
            </p>
          </div>
        </div>
      </div>

      {showClearConfirmation && createPortal(
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-cart-title"
        >
          {/* Backdrop click to close */}
          <div className="fixed inset-0" onClick={() => setShowClearConfirmation(false)} />

          <div onClick={e => e.stopPropagation()} className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-[#1E1528] border border-gray-100 dark:border-white/10 shadow-2xl p-6 text-left animate-fade-in text-[#221B2B] dark:text-[#F3EFF6]">
            <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4"><Trash2 className="w-5 h-5" /></div>
            <h2 id="clear-cart-title" className="font-extrabold text-xl">Clear your cart?</h2>
            <p className="text-xs text-gray-500 dark:text-[#9B8EA9] leading-relaxed mt-2">This will remove all {totalItems} item{totalItems === 1 ? '' : 's'} and any applied coupon from your cart.</p>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowClearConfirmation(false)} className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer">Keep Items</button>
              <button type="button" onClick={() => { clearCart(); setShowClearConfirmation(false); systemToast.success('Cart cleared successfully.'); }} className="flex-1 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">Clear Cart</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </div>
  );
}

// Reusable compact product card specifically styled for the Cart sidebar cross-selling sections
function CartProductCard({ product, currencySymbol, addItem, allowOverselling }) {
  const cardQuickView = useCardQuickView(product);
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);

  const price = product.sale_price || product.price;
  const isSale = !!product.sale_price;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const selectedCardVariant = product.variants?.find(variant => allowOverselling || variant.stock_quantity > 0) || product.variants?.[0] || null;
    addItem(product, selectedCardVariant, 1, allowOverselling);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      {...cardQuickView}
      className="group flex flex-col bg-white dark:bg-[#1E1528] rounded-2xl overflow-hidden hover:shadow-md border border-[#EADBEE] dark:border-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
    >
      {/* Image Block */}
      <div className="h-40 bg-[#FAF9F6] dark:bg-[#100A16] relative overflow-hidden flex items-center justify-center">
        {product.images?.length > 0 ? (
          <img loading="lazy" decoding="async"
            src={product.images[0].image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-gray-300 dark:text-gray-600 text-2xl font-serif">✨</span>
        )}
        {isSale && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full  tracking-wider">
            Sale
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2.5 text-left">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-[#5D3E85] dark:text-[#EC268F] font-bold  tracking-widest truncate leading-none">
            {product.categories?.[0]?.name || product.category?.name || 'SHOP Care'}
          </span>
          <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#5D3E85] dark:group-hover:text-[#EC268F] transition-colors line-clamp-1 leading-snug mt-0.5">
            {product.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1 leading-none">
            <span className="font-bold text-[11px] text-[#221B2B] dark:text-[#F3EFF6]">
              {currencySymbol}{price.toLocaleString()}
            </span>
            {isSale && (
              <span className="text-[9px] text-gray-400 dark:text-[#6B6274] line-through">
                {currencySymbol}{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className={`w-full py-1.5 rounded-full text-[9px] font-extrabold  tracking-wider transition-all cursor-pointer btn-spring ${isAdded
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-[#5D3E85] hover:bg-[#EC268F] text-white'
            }`}
        >
          {isAdded ? 'Added! ✓' : 'Add to Bag'}
        </button>
      </div>
    </div>
  );
}
