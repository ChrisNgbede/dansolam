import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { X, Star, ShoppingBag, Heart, ShieldCheck, Truck, ArrowRight, Check, RefreshCw, Eye } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useRecentlyViewedStore } from '../../store/recentlyViewedStore';
import { getCurrencySymbol } from '../../utils/currency';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { FormattedText } from '../../utils/formatText';

export default function QuickViewModal({ product, isOpen, onClose }) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const currencySymbol = getCurrencySymbol();
  const addItemToCart = useCartStore(state => state.addItem);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const wishlistItems = useWishlistStore(state => state.items);
  const addRecentlyViewed = useRecentlyViewedStore(state => state.addRecentlyViewed);

  // Track product in recently viewed on modal open
  useEffect(() => {
    if (product && isOpen) {
      addRecentlyViewed(product);
    }
  }, [product, isOpen]);

  // Lock body scroll when QuickViewModal is open
  useEffect(() => {
    if (isOpen && product) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, product, onClose]);

  if (!isOpen || !product) return null;


  const isWishlisted = wishlistItems.some(item => item.id === product.id);

  const reviewCount = Number(product?.reviews_count ?? product?.reviews?.length ?? 0);
  const avgRating = Number(product?.average_rating ?? product?.rating ?? (product?.reviews?.length ? product.reviews.reduce((a, r) => a + Number(r.rating || 0), 0) / product.reviews.length : 0));
  const DEFAULT_FALLBACK = '/images/placeholder-product.svg';
  const images = product.images?.length > 0
    ? product.images.map(img => img.image_url)
    : [product.image_url || product.image || DEFAULT_FALLBACK];

  const mainImage = images[activeImageIndex] || DEFAULT_FALLBACK;

  const rawPrice = product.sale_price || product.price || 0;
  const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
  const originalPrice = product.sale_price ? (typeof product.price === 'number' ? product.price : parseFloat(product.price)) : null;

  const isStock = product.stock_quantity === undefined || product.stock_quantity > 0;

  const handleAddToCart = (e) => {
    addItemToCart({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: numPrice,
      image: mainImage,
      variant_label: selectedSize ? `Size: ${selectedSize}` : null,
      quantity: quantity
    });

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('animate-to-cart', {
        detail: {
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
          imageUrl: mainImage,
          type: 'add',
          count: quantity
        }
      }));
    }

    setIsAdded(true);
    systemToast.success(`${product.name} added to bag! ✨`);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    onClose();
    navigate('/cart');
  };

  // Only offer a choice when the product really has more than one size.
  const availableSizes = Array.from(new Set((product.variants || []).map((v) => v.size)))
    .filter((sz) => sz && !/^(standard|default)$/i.test(sz));

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card Container */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#1E1528] text-[#221B2B] dark:text-[#F3EFF6] rounded-[32px] border border-[#EADBEE] dark:border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden z-10 flex flex-col md:flex-row my-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/95 dark:bg-[#231B30] border border-gray-200 dark:border-white/15 flex items-center justify-center text-[#221B2B] dark:text-white hover:text-[#EC268F] dark:hover:text-[#EC268F] transition-all cursor-pointer shadow-lg hover:scale-105 btn-spring"
          title="Close modal"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Left Column: Image Gallery */}
        <div className="w-full md:w-1/2 bg-[#FAF7FC] dark:bg-[#150F1D] p-6 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-[#EADBEE] dark:border-white/10">
          <div className="relative w-full aspect-4/5 rounded-2xl overflow-hidden bg-white dark:bg-[#100A16] border border-[#EADBEE] dark:border-white/10 shadow-inner flex items-center justify-center group">
            <img decoding="async" width="600" height="600"
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_FALLBACK; }}
            />
            {/* Wishlist Button Badge */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-110 z-20 ${isWishlisted
                  ? 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800'
                  : 'bg-white/95 dark:bg-[#1E1528]/90 backdrop-blur-md border border-gray-200 dark:border-white/15 hover:bg-white'
                }`}
              title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${isWishlisted
                    ? 'fill-red-500 text-red-500 stroke-red-500'
                    : 'text-[#181120] dark:text-white stroke-[#181120] dark:stroke-white'
                  }`}
                strokeWidth={2.2}
              />
            </button>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
              {originalPrice && (
                <span className="px-3 py-1 bg-[#EC268F] text-white text-[10px] font-extrabold  tracking-wider rounded-full shadow-sm">
                  Sale -{Math.round(((originalPrice - numPrice) / originalPrice) * 100)}%
                </span>
              )}
              <span className="px-3 py-1 bg-[#5D3E85] text-white text-[10px] font-extrabold  tracking-wider rounded-full shadow-sm flex items-center gap-1">
                Editor's Pick
              </span>
            </div>
          </div>

          {/* Thumbnails Row if multiple images */}
          {images.length > 1 && (
            <div className="flex items-center gap-2.5 mt-4 overflow-x-auto w-full pb-1 justify-center">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${activeImageIndex === idx ? 'border-[#5D3E85] dark:border-[#EC268F] scale-105 shadow-md' : 'border-gray-200 dark:border-white/15 opacity-60 hover:opacity-100'
                    }`}
                >
                  <img loading="lazy" decoding="async" width="80" height="80" src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Specs & Actions */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto text-left">
          <div className="flex flex-col gap-4">
            {/* Category & Ratings */}
            <div className="flex items-center justify-between gap-2 pr-14">
              <span className="text-[10px] font-extrabold  tracking-widest text-[#5D3E85] dark:text-[#EC268F] bg-[#5D3E85]/10 dark:bg-[#EC268F]/15 px-3 py-1 rounded-full border border-[#5D3E85]/20 dark:border-[#EC268F]/30">
                {product.categories?.[0]?.name || product.category?.name || 'Skincare'}
              </span>
              {reviewCount > 0 && (
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-gray-600 dark:text-[#C9BED4] text-[11px] ml-1">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-extrabold text-[#221B2B] dark:text-[#F3EFF6] leading-tight tracking-tight">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl md:text-3xl font-extrabold text-[#5D3E85] dark:text-[#EC268F]">
                {currencySymbol}{numPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {originalPrice && (
                <span className="text-base text-gray-400 dark:text-[#6B6274] line-through font-semibold">
                  {currencySymbol}{originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="max-h-28 overflow-y-auto text-xs text-gray-600 dark:text-[#C9BED4]">
              <FormattedText text={product.description || ''} />
            </div>

            {/* Size selector — only for products with real size variants */}
            {availableSizes.length > 1 && (
<div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider">Select Size</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-3.5 py-1.5 text-xs font-extrabold rounded-full border transition-all cursor-pointer btn-spring ${selectedSize === size
                        ? 'bg-[#5D3E85] dark:bg-[#EC268F] border-[#5D3E85] dark:border-[#EC268F] text-white shadow-sm scale-105'
                        : 'bg-white dark:bg-[#150F1D] border-gray-200 dark:border-white/15 text-gray-700 dark:text-[#C9BED4] hover:border-[#5D3E85] dark:hover:border-[#EC268F] hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider">Quantity:</span>
              <div className="flex items-center border border-gray-200 dark:border-white/15 rounded-full bg-gray-50 dark:bg-white/5 px-3 py-1 gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    const nextQty = Math.max(1, quantity - 1);
                    if (nextQty !== quantity) {
                      setQuantity(nextQty);
                      if (e.currentTarget) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        window.dispatchEvent(new CustomEvent('animate-to-cart', {
                          detail: {
                            startX: rect.left + rect.width / 2,
                            startY: rect.top + rect.height / 2,
                            imageUrl: mainImage,
                            type: 'subtract',
                            count: 1
                          }
                        }));
                      }
                    }
                  }}
                  className="text-gray-500 dark:text-[#C9BED4] hover:text-black dark:hover:text-white font-bold text-sm cursor-pointer"
                  title="Decrease quantity"
                >
                  -
                </button>
                <span className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6] w-6 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    const nextQty = quantity + 1;
                    setQuantity(nextQty);
                    if (e.currentTarget) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      window.dispatchEvent(new CustomEvent('animate-to-cart', {
                        detail: {
                          startX: rect.left + rect.width / 2,
                          startY: rect.top + rect.height / 2,
                          imageUrl: mainImage,
                          type: 'add',
                          count: 1
                        }
                      }));
                    }
                  }}
                  className="text-gray-500 dark:text-[#C9BED4] hover:text-black dark:hover:text-white font-bold text-sm cursor-pointer"
                  title="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className={`text-[10px] font-bold  tracking-wider ${isStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {isStock ? '✓ In Stock Ready to Ship' : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isStock}
                className={`flex-1 py-3.5 px-6 rounded-full text-xs font-extrabold  tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] btn-spring ${isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#5D3E85] hover:bg-[#EC268F] text-white shadow-[#5D3E85]/25'
                  }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Shopping Bag</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isStock}
                className="py-3.5 px-6 rounded-full bg-[#17101F] hover:bg-[#231B30] text-white text-xs font-extrabold tracking-wider transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border border-white/10 shadow-sm btn-spring"
              >
                Instant Checkout
              </button>
            </div>

            {/* View Full Product Link */}
            <Link
              to={`/product/${product.slug || product.id}`}
              onClick={onClose}
              className="text-center text-xs font-extrabold text-[#5D3E85] dark:text-[#EC268F] hover:underline flex items-center justify-center gap-1.5 py-1"
            >
              <span>View Full Details & Formulation Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Trust Footers */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-white/10 text-[9px] text-gray-500 dark:text-[#9B8EA9] font-bold text-center">
              <span className="flex items-center justify-center gap-1">
                <Truck className="w-3 h-3 text-[#5D3E85] dark:text-[#EC268F]" /> Express Delivery
              </span>
              <span className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> 100% Authentic
              </span>
              <span className="flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 text-[#EC268F]" /> Easy Exchange
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
