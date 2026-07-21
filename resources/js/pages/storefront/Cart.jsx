import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, Percent, Truck, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import SEO from '../../components/seo/SEO';
import CheckoutStepper from '../../components/storefront/CheckoutStepper';
import { getCurrencySymbol } from '../../utils/currency';
import { toast as systemToast } from '../../components/ui/ToastProvider';

export default function Cart() {
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol();

  // Zustand State hooks
  const items = useCartStore(state => state.items);
  const coupon = useCartStore(state => state.coupon);
  const deliveryMethod = useCartStore(state => state.deliveryMethod);
  const deliveryZone = useCartStore(state => state.deliveryZone);
  const shippingOption = useCartStore(state => state.shippingOption);
  
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const setCoupon = useCartStore(state => state.setCoupon);
  const setDeliveryZone = useCartStore(state => state.setDeliveryZone);
  const setDeliveryMethod = useCartStore(state => state.setDeliveryMethod);
  const setShippingOption = useCartStore(state => state.setShippingOption);
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

  // Fetch Delivery Zones for calculations
  const { data: zonesRes } = useQuery({
    queryKey: ['delivery-zones-cart'],
    queryFn: () => fetch('/api/delivery-zones').then(res => res.json())
  });

  // Fetch Ecommerce Settings for configurations
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-cart'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  
  const zones = zonesRes?.data || [];
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

  // Default select first zone if none active
  if (zones.length > 0 && !deliveryZone) {
    setDeliveryZone(zones[0]);
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    
    if (!couponCode.trim()) return;

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
      <div className="max-w-2xl mx-auto py-16 px-4 md:px-6 font-sans animate-fade-in">
        <SEO title="Your Bag is Empty" description="Your shopping cart is currently empty. Explore our latest luxury drop and designer collections." />
        
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-gray-150 dark:border-gray-750 shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col items-center text-center gap-6 relative overflow-hidden">
          
          {/* Ambient background glow */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill Tag */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/15 animate-pulse">
            <Sparkles className="w-3 h-3" />
            Shopping Bag Is Empty
          </span>

          {/* Animated Hero Illustration Container */}
          <div className="relative my-2 group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary/15 via-primary/5 to-amber-200/40 dark:from-primary/20 dark:to-amber-500/20 border border-primary/20 flex items-center justify-center shadow-inner transition-transform duration-700 hover:scale-105">
              <ShoppingBag className="w-12 h-12 text-primary transition-transform duration-500 group-hover:rotate-6" />
            </div>
            
            {/* Animated floating sparkle badge */}
            <div className="absolute -top-1 -right-1 p-2 bg-gradient-to-tr from-amber-500 to-amber-400 text-white rounded-full shadow-md animate-bounce">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Header & Description */}
          <div className="flex flex-col gap-2.5 max-w-md">
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 dark:text-white tracking-tight">
              Your Bag is Empty
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Explore our latest luxury drops, designer clothing, shoes, and handcrafted accessories curated to elevate your personal style.
            </p>
          </div>

          {/* Primary Action Button */}
          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore Designer Collection</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          {/* Quick-Shop Category Navigation Pills */}
          <div className="w-full pt-6 border-t border-gray-100 dark:border-gray-700/60 mt-2 flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Quick Browse Popular Categories
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/shop"
                className="px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-primary/10 hover:text-primary text-gray-650 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600 transition-all duration-200"
              >
                ✨ All Products
              </Link>
              <Link
                to="/shop?category=clothing"
                className="px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-primary/10 hover:text-primary text-gray-650 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600 transition-all duration-200"
              >
                👗 Clothing & Apparel
              </Link>
              <Link
                to="/shop?category=bags"
                className="px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-primary/10 hover:text-primary text-gray-650 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600 transition-all duration-200"
              >
                👜 Luxury Bags
              </Link>
              <Link
                to="/shop?category=shoes"
                className="px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-primary/10 hover:text-primary text-gray-650 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600 transition-all duration-200"
              >
                👠 Heels & Shoes
              </Link>
            </div>
          </div>

          {/* Trust Guarantees Footer Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-gray-400 pt-2 font-medium">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-primary" /> Free Express Delivery
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Authentic Guarantee
            </span>
          </div>

        </div>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 font-sans">
      <SEO title="Shopping Cart" description="Review items in your shopping cart before placing your order at FairQueen Collections." />

      {/* Progress Stepper */}
      <CheckoutStepper currentStep={1} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Cart items list */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-gray-900">
              Shopping Cart ({items.length} items)
            </h1>
            <button type="button" onClick={() => setShowClearConfirmation(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wider transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear Cart
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={`${item.product_id}-${item.product_variant_id}`}
                className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all shadow-xs"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 relative">
                  <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                    {item.variant_label ? 'Variant Selection' : 'Designer Piece'}
                  </span>
                  <h3 className="font-semibold text-xs md:text-sm text-gray-800 truncate leading-snug">{item.name}</h3>
                  {item.variant_label && (
                    <span className="text-[9px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md text-gray-500 font-medium inline-block self-start mt-0.5 leading-none">
                      {item.variant_label}
                    </span>
                  )}
                  
                  <div className="flex items-center gap-4 mt-1.5">
                    {/* Quantity adjusts */}
                    <div className="flex items-center border border-gray-200 rounded-lg scale-90 origin-left bg-white shadow-3xs overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.product_variant_id, item.quantity - 1, allowOverselling)}
                        className="p-1 text-gray-500 hover:bg-gray-50 transition-colors w-7 h-7 flex items-center justify-center shrink-0"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-bold text-gray-800 w-8 text-center select-none">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.product_variant_id, item.quantity + 1, allowOverselling)}
                        className="p-1 text-gray-500 hover:bg-gray-50 transition-colors w-7 h-7 flex items-center justify-center shrink-0"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id, item.product_variant_id)}
                      className="text-red-500 hover:text-red-650 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className={`text-[9px] font-bold uppercase mt-1 tracking-wider leading-none ${item.max_stock > 0 || allowOverselling ? 'text-primary' : 'text-rose-500'}`}>
                    {item.max_stock > 0
                      ? `Only ${item.max_stock} units left`
                      : allowOverselling
                        ? 'Backorder Available'
                        : 'Out of stock'}
                  </span>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <span className="font-semibold text-xs md:text-sm text-gray-900 block leading-none">
                    {currencySymbol}{(item.price * item.quantity).toLocaleString()}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[10px] text-gray-400 font-medium block mt-1.5 leading-none">
                      {currencySymbol}{item.price.toLocaleString()} each
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cross selling / Related Items (Compact Cart Grid) */}
          {crossSellProducts.length > 0 && (
            <div className="border-t border-gray-100 pt-8 mt-6 w-full text-left">
              <h3 className="font-serif font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
                <span>🛍️</span> Complete Your Look
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

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 self-start">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-transparent rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-left">
            <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-lg border-b border-gray-100 dark:border-transparent pb-3">Order Summary</h3>

            <div className="flex flex-col gap-3 text-xs text-gray-600">
              <div className="flex justify-between items-center text-base py-1">
                <span className="font-semibold text-gray-700">Subtotal</span>
                <span className="font-serif text-xl font-bold text-gray-950">{currencySymbol}{getSubtotal().toLocaleString()}</span>
              </div>

              {coupon && (
                <div className="flex justify-between items-center text-green-600 bg-green-50/50 border border-green-100 p-2 rounded-xl">
                  <span className="flex items-center gap-1 font-semibold">
                    Promo: {coupon.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>- {currencySymbol}{getDiscountAmount().toLocaleString()}</span>
                    <button onClick={handleRemoveCoupon} className="text-[9px] font-bold text-red-500 hover:underline">Remove</button>
                  </div>
                </div>
              )}

              {/* Delivery Methods toggle */}
              <div className="border-t border-primary/5 my-2 pt-3 flex flex-col gap-2.5">
                <span className="font-bold text-gray-800 text-[10px] uppercase tracking-wider block">Delivery Method</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`py-2 rounded-lg border text-center font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                      deliveryMethod === 'delivery' ? 'border-primary bg-primary text-white shadow-xs' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Home Delivery
                  </button>
                  <button
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`py-2 rounded-lg border text-center font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                      deliveryMethod === 'pickup' ? 'border-primary bg-primary text-white shadow-xs' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Store Pickup
                  </button>
                </div>
              </div>

              {/* Home Delivery Options */}
              {deliveryMethod === 'delivery' && (
                <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-primary/5">
                  <span className="font-bold text-gray-800 text-[10px] uppercase tracking-wider block">Shipping Type</span>
                  <select
                    value={shippingOption}
                    onChange={(e) => setShippingOption(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white text-xs text-gray-700 font-medium cursor-pointer"
                  >
                    <option value="standard">Standard Domestic Delivery</option>
                    <option value="same_day">Same Day Express (+{currencySymbol}{parseFloat(settings.shipping_same_day_surcharge || 5000).toLocaleString()})</option>
                    <option value="international">International Shipping ({currencySymbol}{parseFloat(settings.shipping_international_base || 25000).toLocaleString()})</option>
                  </select>
                </div>
              )}

              {/* Delivery Zone select */}
              {deliveryMethod === 'delivery' && shippingOption !== 'international' && zones.length > 0 && (
                <div className="flex flex-col gap-2 mt-1.5">
                  <label className="font-bold text-gray-800 text-[10px] uppercase tracking-wider block">Select Delivery Area</label>
                  <select
                    value={deliveryZone?.id || ''}
                    onChange={(e) => {
                      const z = zones.find(x => x.id === parseInt(e.target.value));
                      if (z) setDeliveryZone(z);
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white text-xs text-gray-700 font-medium cursor-pointer"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} (+{currencySymbol}{parseFloat(z.shipping_fee).toLocaleString()})
                      </option>
                    ))}
                  </select>
                  {deliveryZone && (
                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                      Estimated Duration: {shippingOption === 'same_day' ? 'Today (Same Day)' : deliveryZone.estimated_days}
                    </span>
                  )}
                </div>
              )}

              {/* Free shipping ribbon notice if dynamic rule active */}
              {parseFloat(settings.shipping_free_threshold) > 0 && getSubtotal() < parseFloat(settings.shipping_free_threshold) && (
                <div className="bg-yellow-50/70 border border-yellow-100 text-yellow-800 p-2.5 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 mt-1 leading-snug">
                  💡 Add {currencySymbol}{(parseFloat(settings.shipping_free_threshold) - getSubtotal()).toLocaleString()} more to get FREE shipping!
                </div>
              )}

              {/* 5 items surcharge warning */}
              {totalItems > 5 && (
                <div className="bg-orange-50/70 border border-orange-100 text-orange-700 p-2.5 rounded-xl text-[10px] font-semibold mt-1 leading-snug">
                  📦 Bulk Order: Added {currencySymbol}{(parseFloat(settings.shipping_item_multiplier || 1500) * (totalItems - 5)).toLocaleString()} surcharge ({currencySymbol}{parseFloat(settings.shipping_item_multiplier || 1500).toLocaleString()} per piece above 5).
                </div>
              )}

              <div className="flex justify-between border-t border-primary/5 pt-3 items-center">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  {getDeliveryFee(settings) > 0 ? `${currencySymbol}${getDeliveryFee(settings).toLocaleString()}` : 'Free'}
                </span>
              </div>

              <div className="flex justify-between border-t border-primary/10 pt-4 text-gray-900 items-center gap-4">
                <span className="text-base md:text-lg font-extrabold">Total Amount</span>
                <span className="text-primary font-serif text-2xl md:text-3xl font-bold leading-none text-right">{currencySymbol}{getTotal(settings).toLocaleString()}</span>
              </div>
            </div>

            {/* Coupon Input */}
            <form onSubmit={handleApplyCoupon} className="border-t border-primary/5 pt-4 flex flex-col gap-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Apply Promo Coupon</label>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 w-full max-w-full items-stretch">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="min-w-0 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white uppercase font-semibold text-gray-800"
                />
                <button
                  type="submit"
                  className="max-w-full px-3.5 py-2 bg-gray-800 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponError && <span className="text-[10px] text-red-500 font-semibold block mt-0.5">{couponError}</span>}
              {couponSuccess && <span className="text-[10px] text-green-600 font-semibold block mt-0.5">{couponSuccess}</span>}
            </form>

            {/* Checkout Button */}
            <button
              onClick={handleCheckoutRedirect}
              disabled={hasUnavailableItems}
              className="w-full mt-2 py-3 bg-primary hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {hasUnavailableItems ? 'Remove Out-of-Stock Items' : 'Proceed to Checkout'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Secure Checkout Badges */}
          <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-2.5 bg-white shadow-3xs text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <ShieldCheck className="w-4.5 h-4.5 text-primary" />
              Secure Checkout Guarantee
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              Your details are protected using industry-grade SSL encryption and secure merchant integrations.
            </p>
          </div>
        </div>
      </div>

      {showClearConfirmation && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="clear-cart-title">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-gray-100 shadow-2xl p-6 text-left animate-fade-in">
            <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4"><Trash2 className="w-5 h-5" /></div>
            <h2 id="clear-cart-title" className="font-serif text-xl font-bold text-gray-900">Clear your cart?</h2>
            <p className="text-xs text-gray-500 leading-relaxed mt-2">This will remove all {totalItems} item{totalItems === 1 ? '' : 's'} and any applied coupon from your cart.</p>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowClearConfirmation(false)} className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50">Keep Items</button>
              <button type="button" onClick={() => { clearCart(); setShowClearConfirmation(false); systemToast.success('Cart cleared successfully.'); }} className="flex-1 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold">Clear Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable compact product card specifically styled for the Cart sidebar cross-selling sections
function CartProductCard({ product, currencySymbol, addItem, allowOverselling }) {
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
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer relative"
    >
      {/* Image Block */}
      <div className="h-40 bg-[#FAF9F6] relative overflow-hidden flex items-center justify-center">
        {product.images?.length > 0 ? (
          <img loading="lazy" decoding="async"
            src={product.images[0].image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
        ) : (
          <span className="text-gray-300 text-2xl font-serif">👑</span>
        )}
        {isSale && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Sale
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2.5">
        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest truncate leading-none">
            {product.categories?.[0]?.name || product.category?.name || 'Designer Wear'}
          </span>
          <h4 className="font-serif font-bold text-xs text-gray-900 group-hover:text-primary transition-colors line-clamp-1 leading-snug mt-0.5">
            {product.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1 leading-none">
            <span className="font-bold text-[11px] text-gray-900">
              {currencySymbol}{price.toLocaleString()}
            </span>
            {isSale && (
              <span className="text-[9px] text-gray-400 line-through">
                {currencySymbol}{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className={`w-full py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isAdded
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-primary hover:bg-primary-hover text-white'
          }`}
        >
          {isAdded ? 'Added! ✓' : 'Buy'}
        </button>
      </div>
    </div>
  );
}
