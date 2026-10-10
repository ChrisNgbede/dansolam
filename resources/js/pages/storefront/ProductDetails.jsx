import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ShoppingCart, MessageCircle, Heart, Plus, Minus, Check, HelpCircle, X, Eye, Info } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { ProductCard } from './Home';
import SEO from '../../components/seo/SEO';
import CaptchaWidget from '../../components/ui/CaptchaWidget';
import { FormattedText } from '../../utils/formatText';
import FacelessAvatar from '../../components/ui/FacelessAvatar';
import { useLiveValidation } from '../../hooks/useLiveValidation';
import { FieldMessage, PasswordStrength } from '../../components/ui/FieldMessage';
import * as rules from '../../utils/validators';

// "Standard"/"Default" variants carry no information for shoppers, so leave them out.
function variantLabel(variant, sep = ', ') {
  if (!variant) return '';
  const parts = [];
  if (variant.size && !/^(standard|default)$/i.test(variant.size)) parts.push(`Size: ${variant.size}`);
  if (variant.color && !/^(standard|default)$/i.test(variant.color)) parts.push(`Color: ${variant.color}`);
  return parts.join(sep);
}

export default function ProductDetails() {
  const currencySymbol = getCurrencySymbol();
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const addItem = useCartStore(state => state.addItem);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const wishlistItems = useWishlistStore(state => state.items);

  // States
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [modalSizeTab, setModalSizeTab] = useState('dresses');
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [adding, setAdding] = useState(false);

  // Review states
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewAvatarUrl, setReviewAvatarUrl] = useState('');
  const [reviewImageUrl, setReviewImageUrl] = useState('');
  const [reviewCaptchaVerified, setReviewCaptchaVerified] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const reviewV = useLiveValidation({ reviewName, reviewComment, reviewAvatarUrl, reviewImageUrl }, {
    reviewName: [rules.required('Enter your name as you would like it shown.'), rules.maxLength(255)],
    reviewComment: [rules.required('Tell us what you think of this product.'), rules.minLength(10, 'Please write at least 10 characters.'), rules.maxLength(2000)],
    reviewAvatarUrl: [rules.url()],
    reviewImageUrl: [rules.url()],
  }, { fieldMap: { customer_name: 'reviewName', comment: 'reviewComment', avatar_url: 'reviewAvatarUrl', image_url: 'reviewImageUrl' } });
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  // Lock background body scroll when size guide or review image lightbox is open
  useEffect(() => {
    const isModalOpen = sizeGuideOpen || !!activeLightboxImage;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSizeGuideOpen(false);
          setActiveLightboxImage(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [sizeGuideOpen, activeLightboxImage]);

  // Fetch Product Details
  const { data: productRes, isLoading } = useQuery({
    queryKey: ['product-details', slug],
    queryFn: () => fetch(`/api/products/${slug}`).then(res => res.json())
  });

  const product = productRes?.data;
  const hasWishlist = product ? wishlistItems.some(item => item.id === product.id) : false;

  // Fetch Storefront Settings
  const { data: settingsRes } = useQuery({
    queryKey: ['storefront-settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data?.settings || {};
  const isSoldCountEnabled = settings.sold_count_enabled === 'true' || settings.sold_count_enabled === true || settings.sold_count_enabled === undefined;
  const isSizeGuideEnabled = settings.show_size_guide_on_product === 'true' || settings.show_size_guide_on_product === true || settings.show_size_guide_on_product === undefined;
  const allowOverselling = settings.allow_overselling === 'true' || settings.allow_overselling === true || settings.allow_overselling === '1' || settings.allow_overselling === 1;

  // Set modal guide tab dynamically based on product name / category
  useEffect(() => {
    if (product) {
      const catNames = (product.categories ? product.categories.map(c => c.name) : [product.category?.name || '']).join(' ').toLowerCase();
      const isOilOrSerum = product.name?.toLowerCase().includes('oil') ||
        product.name?.toLowerCase().includes('serum') ||
        product.name?.toLowerCase().includes('perfume') ||
        catNames.includes('oils') ||
        catNames.includes('serum');
      if (isOilOrSerum) {
        setModalSizeTab('oils');
      } else {
        setModalSizeTab('creams');
      }
    }
  }, [product]);

  // Track recently viewed
  useEffect(() => {
    if (product) {
      try {
        const items = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
        const filtered = items.filter(p => p.id !== product.id);
        filtered.unshift({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          sale_price: product.sale_price,
          stock_quantity: product.stock_quantity,
          category: product.categories?.[0] || product.category,
          categories: product.categories,
          images: product.images,
          variants: product.variants
        });
        localStorage.setItem('recently_viewed', JSON.stringify(filtered.slice(0, 4)));
      } catch (e) {
        console.error('Error saving recently viewed', e);
      }
    }
  }, [product]);

  // Fetch Related Products
  const primaryCatId = product?.categories?.[0]?.id || product?.category_id;
  const { data: relatedRes } = useQuery({
    queryKey: ['related-products', primaryCatId],
    enabled: !!primaryCatId,
    queryFn: () => fetch(`/api/products?limit=5&category=${primaryCatId}`).then(res => res.json())
  });

  // Review Mutation
  const addReviewMutation = useMutation({
    mutationFn: (newReview) => {
      return fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(newReview)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (!data.success) {
        if (!reviewV.applyServerErrors(data.errors)) setReviewError(data.message || 'Your review could not be submitted. Please try again.');
        return;
      }
      if (data.success) {
        reviewV.reset();
        setReviewSuccess(true);
        queryClient.invalidateQueries(['product-details', slug]);
        setReviewName('');
        setReviewComment('');
        setReviewImageUrl('');
        setTimeout(() => setReviewSuccess(false), 5000);
      }
    },
    onError: () => setReviewError('Could not reach the server. Please try again.'),
  });

  const relatedProducts = relatedRes?.data?.data?.filter(p => p.id !== product?.id).slice(0, 4) || [];

  // Sizing & Color variants mapping
  const variants = product?.variants || [];
  const sizes = [...new Set(variants.map(v => v.size))].filter(Boolean);
  const colors = [...new Set(variants.map(v => v.color))].filter(Boolean);

  // Auto-select standard selections on load
  useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariant(variants[0]);
      setSelectedSize(variants[0].size);
      setSelectedColor(variants[0].color);
    }
  }, [variants]);

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const match = variants.find(v => v.size === size && (selectedColor ? v.color === selectedColor : true)) ||
      variants.find(v => v.size === size);
    if (match) {
      setSelectedVariant(match);
      if (match.color) setSelectedColor(match.color);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const match = variants.find(v => v.color === color && (selectedSize ? v.size === selectedSize : true)) ||
      variants.find(v => v.color === color);
    if (match) {
      setSelectedVariant(match);
      if (match.size) setSelectedSize(match.size);
    }
  };

  const handleAddToCart = (e) => {
    setAdding(true);
    addItem(product, selectedVariant, quantity, allowOverselling);

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('animate-to-cart', {
        detail: {
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
          imageUrl: selectedVariant?.image_url || product.images?.[0]?.image_url
        }
      }));
    }

    setAddedToCartToast(true);
    setTimeout(() => {
      setAdding(false);
      setAddedToCartToast(false);
    }, 3000);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity, allowOverselling);
    navigate('/checkout');
  };

  // WhatsApp click pre-fill message
  const getWhatsAppLink = () => {
    const brandName = settings.ecommerce_name || 'Dansolam';
    const whatsappNum = String(settings.whatsapp_number || '+234 800 000 0000').replace(/[^0-9]/g, '');
    const currentUrl = window.location.href;
    const priceText = `${currencySymbol}${parseFloat(selectedVariant?.price || product.sale_price || product.price).toLocaleString()}`;
    const variantDesc = variantLabel(selectedVariant) ? `(${variantLabel(selectedVariant)})` : '';

    const message = `Hello ${brandName}, I'm interested in purchasing the "${product.name}" ${variantDesc} - Price: ${priceText}. Here is the link: ${currentUrl}`;
    return `https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`;
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewError('');
    if (!reviewV.validateAll()) return;
    const isCaptchaEnabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;
    const isReviewEnabled = settings.captcha_on_reviews === undefined ? true : (settings.captcha_on_reviews === 'true' || settings.captcha_on_reviews === true);
    if (isCaptchaEnabled && isReviewEnabled && !reviewCaptchaVerified) {
      setReviewError('Please complete the security check before submitting your review.');
      return;
    }
    addReviewMutation.mutate({
      customer_name: reviewName,
      avatar_url: reviewAvatarUrl || null,
      rating: reviewRating,
      comment: reviewComment,
      image_url: reviewImageUrl || null
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-8 animate-pulse">
        <div className="flex-1 bg-gray-100 h-96 rounded-2xl" />
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-gray-100 h-4 rounded w-1/4" />
          <div className="bg-gray-100 h-8 rounded w-3/4" />
          <div className="bg-gray-100 h-6 rounded w-1/3" />
          <div className="bg-gray-100 h-24 rounded w-full" />
          <div className="bg-gray-100 h-10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto text-center py-24 flex flex-col items-center gap-4">
        <span className="text-5xl">👗</span>
        <h2 className="font-serif font-bold text-gray-800 text-lg">Product Not Found</h2>
        <p className="text-xs text-gray-500">The product you are trying to view does not exist or has been archived.</p>
        <Link to="/shop" className="px-6 py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full shadow-md transition-all">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Calculate pricing values
  const activePrice = selectedVariant?.price || product.sale_price || product.price;
  const isSale = !!product.sale_price || (selectedVariant && !!selectedVariant.sale_price);
  const basePrice = selectedVariant?.sale_price ? selectedVariant.price : product.price;

  // Stock count
  const activeStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const isOutOfStock = activeStock <= 0;
  const canOrder = allowOverselling || !isOutOfStock;

  const DEFAULT_PRODUCT_FALLBACK = '/images/placeholder-product.svg';
  const getValidImage = (url) => {
    if (url && typeof url === 'string' && url.trim().length > 3) {
      const trimmed = url.trim();
      return trimmed.startsWith('http') || trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }
    return DEFAULT_PRODUCT_FALLBACK;
  };

  return (
    <div className="bg-white dark:bg-[#17101F] min-h-screen pt-28 sm:pt-36 pb-20 px-4 sm:px-6 md:px-12 font-sans transition-colors duration-300 relative overflow-hidden w-full">
      {/* Full-bleed subtle top-right ambient glow */}
      <div
        className="fixed top-0 right-0 w-[950px] h-[950px] rounded-full pointer-events-none z-0 blur-3xl opacity-75 -translate-y-1/3 translate-x-1/4"
        style={{ background: 'radial-gradient(circle, rgba(236,38,143,0.20) 0%, rgba(93,62,133,0.16) 42%, transparent 70%)' }}
      />

      <SEO title={product.name} description={product.short_description || product.seo_description || `Purchase ${product.name} at Dansolam Beauty Home. High quality beauty products.`} />

      <div className="max-w-7xl mx-auto flex flex-col gap-12 text-left relative z-10">
        {/* Product Details Section */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

          {/* Left Column: Image gallery */}
          <div className="flex-1 w-full flex flex-col gap-3">
            <div className="h-96 md:h-[480px] bg-white dark:bg-[#1E1528] rounded-3xl overflow-hidden shadow-sm relative border border-[#EADBEE] dark:border-white/10">
              <img loading="eager" decoding="async" fetchPriority="high"
                src={getValidImage(product.images?.[activeImageIdx]?.image_url || product.image_url)}
                alt={product.name}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PRODUCT_FALLBACK; }}
                className="w-full h-full object-cover animate-fade-in"
              />
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                {isSale && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full  shadow-xs">
                    Sale Offer
                  </span>
                )}
                {product?.is_new_arrival && (
                  <span className="bg-[#EC268F] text-white text-[10px] font-extrabold px-3 py-1 rounded-full  shadow-xs">
                    New
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails row */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-gray-50 dark:bg-white/5 transition-all cursor-pointer btn-spring ${activeImageIdx === idx ? 'border-[#5D3E85] dark:border-[#EC268F] ring-2 ring-[#5D3E85]/20' : 'border-transparent'}`}
                  >
                    <img loading="lazy" decoding="async" src={getValidImage(img.image_url)} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PRODUCT_FALLBACK; }} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Buying parameters */}
          <div className="flex-1 flex flex-col gap-5 w-full text-left">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#5D3E85] dark:text-[#EC268F] font-extrabold  tracking-wider">
                {product.categories && product.categories.length > 0
                  ? product.categories.map(c => c.name).join(' · ')
                  : (product.category?.name || 'Skincare')}
              </span>SHOP
              <h1 className="font-extrabold text-2xl md:text-4xl text-[#221B2B] dark:text-[#F3EFF6] leading-tight">
                {product.name}
              </h1>
              <p className="text-xs text-gray-400 dark:text-[#9B8EA9] mt-1">SKU: {selectedVariant?.sku || product.sku}</p>
            </div>

            {/* Star review average & Sold count */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 text-[#EC268F]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#EC268F] text-[#EC268F]" />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-[#9B8EA9] font-medium">
                  ({product.reviews?.length || 0} reviews)
                </span>
              </div>
              {isSoldCountEnabled && Number(product.total_sold) > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#EC268F]/10 text-[#EC268F] border border-[#EC268F]/20  tracking-wide">
                  🔥 {Number(product.total_sold).toLocaleString()} sold so far
                </span>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2.5 py-3 border-y border-gray-200/80 dark:border-white/10">
              <span className="font-extrabold text-3xl text-[#5D3E85] dark:text-[#EC268F]">
                {currencySymbol}{parseFloat(activePrice).toLocaleString()}
              </span>
              {isSale && (
                <span className="text-xs text-gray-400 dark:text-[#6B6274] line-through">
                  {currencySymbol}{parseFloat(basePrice).toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-600 dark:text-[#C9BED4] leading-relaxed font-medium">{product.short_description || product.description}</p>

            {/* STOCK BADGES */}
            <div>
              {isOutOfStock && !allowOverselling ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  Out of Stock
                </span>
              ) : isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 animate-pulse">
                  ⚠️ Available on backorder
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5D3E85]/10 dark:bg-[#EC268F]/15 text-[#5D3E85] dark:text-[#EC268F] border border-[#5D3E85]/20 dark:border-[#EC268F]/30">
                  Only {activeStock} left in stock
                </span>
              )}
            </div>

            {/* QUANTITY SELECTOR & BUY ACTIONS */}
            {canOrder && (
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider">Quantity</span>
                  <div className="flex items-center border border-gray-200 dark:border-white/15 rounded-full bg-white dark:bg-[#1E1528] px-1">
                    <button
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
                                imageUrl: selectedVariant?.image_url || product.images?.[0]?.image_url,
                                type: 'subtract',
                                count: 1
                              }
                            }));
                          }
                        }
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-[#C9BED4] transition-colors rounded-full cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6] w-10 text-center select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={(e) => {
                        const nextQty = allowOverselling ? quantity + 1 : Math.min(activeStock, quantity + 1);
                        if (nextQty !== quantity) {
                          setQuantity(nextQty);
                          if (e.currentTarget) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            window.dispatchEvent(new CustomEvent('animate-to-cart', {
                              detail: {
                                startX: rect.left + rect.width / 2,
                                startY: rect.top + rect.height / 2,
                                imageUrl: selectedVariant?.image_url || product.images?.[0]?.image_url,
                                type: 'add',
                                count: 1
                              }
                            }));
                          }
                        }
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-[#C9BED4] transition-colors rounded-full cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Buying CTA */}
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className={`flex-1 py-4 text-xs font-extrabold rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg btn-spring ${adding
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#EC268F] hover:bg-[#C9166F] text-white active:scale-[0.98]'
                      }`}
                  >
                    {adding ? <Check className="w-4 h-4 text-white" /> : <ShoppingCart className="w-4 h-4 text-white" />}
                    {adding ? 'Added to Bag ✓' : 'Add to Bag'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-4 bg-[#5D3E85] hover:bg-[#4A2B68] text-white text-xs font-extrabold rounded-full text-center shadow-lg transition-all cursor-pointer active:scale-[0.98] btn-spring"
                  >
                    Instant Checkout
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`px-4.5 py-4 rounded-full transition-all flex items-center justify-center cursor-pointer btn-spring ${hasWishlist
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-500 border border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-[#1E1528] border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white'
                      }`}
                    title={hasWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${hasWishlist
                        ? 'fill-red-500 text-red-500 stroke-red-500'
                        : 'text-[#181120] dark:text-white stroke-[#181120] dark:stroke-white'
                        }`}
                      strokeWidth={2.2}
                    />
                  </button>
                </div>

                {/* WhatsApp Social selling inquiry */}
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-full shadow-md transition-all cursor-pointer btn-spring"
                >
                  <MessageCircle className="w-4 h-4 text-white fill-white" />
                  <span>Inquire via WhatsApp AGENT</span>
                </a>
              </div>
            )}

            {/* Delivery & return info snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div className="bg-[#FAF7FC] dark:bg-[#1E1528] p-3.5 rounded-2xl border border-[#EADBEE] dark:border-white/10 text-xs text-[#5C5566] dark:text-[#C9BED4] flex items-center gap-2.5">
                <span className="text-base">✈️</span>
                <div>
                  <strong className="block text-[#221B2B] dark:text-[#F3EFF6]">Dispatch in 24h</strong>
                  <span className="text-[11px] text-[#5C5566] dark:text-[#9B8EA9]">Same-day express · Fast doorstep courier</span>
                </div>
              </div>
              <div className="bg-[#FAF7FC] dark:bg-[#1E1528] p-3.5 rounded-2xl border border-[#EADBEE] dark:border-white/10 text-xs text-[#5C5566] dark:text-[#C9BED4] flex items-center gap-2.5">
                <span className="text-base">✨</span>
                <div>
                  <strong className="block text-[#221B2B] dark:text-[#F3EFF6]">100% Organic Purity</strong>
                  <span className="text-[11px] text-[#5C5566] dark:text-[#9B8EA9]">Zero steroids · Certified botanical oils</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Description & Review Tabs */}
        <div className="border-t border-gray-100 dark:border-white/10 pt-8 max-w-4xl text-left">
          <h2 className="font-extrabold text-xl text-[#221B2B] dark:text-[#F3EFF6] mb-6">Product Details & Specs</h2>
          <div className="mb-12 text-[#221B2B] dark:text-[#C9BED4]">
            <FormattedText text={product.description} />
          </div>

          {/* Reviews Block */}
          <div className="border-t border-gray-100 dark:border-white/10 pt-8">
            <h3 className="font-extrabold text-lg text-[#221B2B] dark:text-[#F3EFF6] mb-6">Customer Reviews</h3>

            {/* List reviews */}
            <div className="flex flex-col gap-6 mb-8">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 p-5 rounded-2xl shadow-sm flex flex-col gap-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FacelessAvatar
                          src={rev.avatar_url}
                          name={rev.customer_name}
                          className="w-8 h-8"
                        />
                        <div>
                          <span className="font-semibold text-xs text-[#221B2B] dark:text-[#F3EFF6] block">{rev.customer_name}</span>
                          <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] block mt-0.5">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <p className="text-xs text-gray-600 dark:text-[#C9BED4] italic flex-1">"{rev.comment || 'No text review left.'}"</p>
                      {rev.image_url && (
                        <div className="w-14 h-14 border border-gray-200 dark:border-white/10 rounded overflow-hidden cursor-pointer hover:opacity-85 transition-all shrink-0 bg-gray-50 dark:bg-white/5" onClick={() => setActiveLightboxImage(rev.image_url)}>
                          <img loading="lazy" decoding="async" src={rev.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 dark:text-[#9B8EA9] italic">No reviews for this product yet. Be the first to share your experience!</p>
              )}
            </div>

            {/* Add review form */}
            <div className="bg-[#FAF7FC] dark:bg-[#1E1528] p-6 rounded-2xl border border-[#EADBEE] dark:border-white/10 text-left">
              <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  mb-4">Write a Review</h4>
              {reviewSuccess ? (
                <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl p-4 text-xs font-semibold mb-4">
                  Thank you! Your review has been submitted successfully and is under moderation.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} noValidate className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-semibold ">Your Name</label>
                      <input
                        {...reviewV.bind('reviewName')}
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        className={`px-3 py-2 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${reviewV.stateClass('reviewName')}`}
                        placeholder="e.g. Fatima A."
                      />
                      <FieldMessage {...reviewV.message('reviewName')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-semibold ">Rating</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(parseInt(e.target.value))}
                        className="px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6] cursor-pointer"
                      >
                        <option value="5">5 Stars (Excellent)</option>
                        <option value="4">4 Stars (Good)</option>
                        <option value="3">3 Stars (Average)</option>
                        <option value="2">2 Stars (Poor)</option>
                        <option value="1">1 Star (Very Bad)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-semibold ">Avatar Image URL (Optional)</label>
                      <input
                        {...reviewV.bind('reviewAvatarUrl')}
                        type="text"
                        value={reviewAvatarUrl}
                        onChange={(e) => setReviewAvatarUrl(e.target.value)}
                        className={`px-3 py-2 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${reviewV.stateClass('reviewAvatarUrl')}`}
                        placeholder="e.g. Profile photo URL"
                      />
                      <FieldMessage {...reviewV.message('reviewAvatarUrl')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-semibold ">Review Screenshot URL (Optional)</label>
                      <input
                        {...reviewV.bind('reviewImageUrl')}
                        type="text"
                        value={reviewImageUrl}
                        onChange={(e) => setReviewImageUrl(e.target.value)}
                        className={`px-3 py-2 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${reviewV.stateClass('reviewImageUrl')}`}
                        placeholder="WhatsApp/Instagram screenshot link"
                      />
                      <FieldMessage {...reviewV.message('reviewImageUrl')} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-semibold ">Comment</label>
                    <textarea
                      {...reviewV.bind('reviewComment')}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows="3"
                      className={`px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] transition-colors ${reviewV.stateClass('reviewComment')}`}
                      placeholder="Tell us about the skin results, texture, and delivery experience..."
                    ></textarea>
                    <FieldMessage {...reviewV.message('reviewComment', reviewComment ? `${reviewComment.length}/2000` : 'At least 10 characters.')} />
                    {reviewError && <FieldMessage error={reviewError} />}
                  </div>

                  <CaptchaWidget
                    settings={settings}
                    formType="reviews"
                    verified={reviewCaptchaVerified}
                    setVerified={setReviewCaptchaVerified}
                  />

                  <button
                    type="submit"
                    disabled={addReviewMutation.isPending || (!reviewCaptchaVerified && (settings.captcha_enabled === 'true' || settings.captcha_enabled === true))}
                    className="self-start px-6 py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full shadow-md transition-all cursor-pointer btn-spring"
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-100 dark:border-white/10 pt-8 w-full text-left">
            <h3 className="font-extrabold text-xl text-[#221B2B] dark:text-[#F3EFF6] mb-6">You May Also Like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}

        {/* SIZE GUIDE MODAL/OVERLAY */}
        {sizeGuideOpen && createPortal(
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Skincare Volume & Application Guide"
          >
            {/* Backdrop click */}
            <div className="fixed inset-0" onClick={() => setSizeGuideOpen(false)} />

            <div
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#1E1528] text-gray-900 dark:text-[#F3EFF6] rounded-3xl max-w-2xl w-full p-6 flex flex-col gap-4 relative z-10 max-h-[85vh] overflow-y-auto custom-sidebar-scroll shadow-[0_25px_70px_rgba(0,0,0,0.5)] border border-gray-150 dark:border-white/10"
            >
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full cursor-pointer transition-all hover:rotate-90"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="font-serif font-bold text-lg text-gray-950 dark:text-white">Skincare Volume & Application Guide</h3>
                <p className="text-[10px] text-gray-400 dark:text-[#9B8EA9] mt-0.5">Recommended application methods and net volumes for Dansolam organic products.</p>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-gray-150 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setModalSizeTab('creams')}
                  className={`px-4 py-2 text-xs font-bold  tracking-wider transition-all border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${modalSizeTab === 'creams' || modalSizeTab === 'dresses'
                    ? 'border-[#5D3E85] text-[#5D3E85] dark:border-[#EC268F] dark:text-[#EC268F]'
                    : 'border-transparent text-gray-400 hover:text-gray-650 dark:hover:text-white'
                    }`}
                >
                  ✨ Creams & Soaps
                </button>
                <button
                  type="button"
                  onClick={() => setModalSizeTab('oils')}
                  className={`px-4 py-2 text-xs font-bold  tracking-wider transition-all border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${modalSizeTab === 'oils' || modalSizeTab === 'shoes'
                    ? 'border-[#5D3E85] text-[#5D3E85] dark:border-[#EC268F] dark:text-[#EC268F]'
                    : 'border-transparent text-gray-400 hover:text-gray-650 dark:hover:text-white'
                    }`}
                >
                  🌿 Oils & Fragrances
                </button>
              </div>

              {/* Modal Tables content */}
              {modalSizeTab === 'creams' || modalSizeTab === 'dresses' ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm bg-white dark:bg-[#231B30]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-150 dark:border-white/10 text-[9px] text-gray-500 dark:text-[#9B8EA9]  tracking-wider font-semibold">
                        <th className="p-3">Product Line</th>
                        <th className="p-3">Net Vol</th>
                        <th className="p-3">Usage</th>
                        <th className="p-3">Target Concern</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-[#C9BED4]">
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">Glowing Moisturizing Cream</td>
                        <td className="p-3">500g</td>
                        <td className="p-3">Daily Morning & Night</td>
                        <td className="p-3">Hydration & Glow</td>
                      </tr>
                      <tr className="hover:bg-gray-50/55 bg-gray-50/20 dark:bg-white/2">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">Whitening Polish Soap</td>
                        <td className="p-3">750ml</td>
                        <td className="p-3">Daily Wash</td>
                        <td className="p-3">Pores & Spots</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">Dansolam Plus (Molato)</td>
                        <td className="p-3">500g</td>
                        <td className="p-3">Daily Face/Body</td>
                        <td className="p-3">Sunburn & Discolouration</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 bg-gray-50/20 dark:bg-white/2">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">Glowing Face Cream (SPF 30)</td>
                        <td className="p-3">30g</td>
                        <td className="p-3">Day & Night</td>
                        <td className="p-3">Facial Dark Spots</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm bg-white dark:bg-[#231B30]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-150 dark:border-white/10 text-[9px] text-gray-500 dark:text-[#9B8EA9]  tracking-wider font-semibold">
                        <th className="p-3">Product Line</th>
                        <th className="p-3">Net Vol</th>
                        <th className="p-3">Application</th>
                        <th className="p-3">Key Ingredients</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-[#C9BED4]">
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">Discoloration Oil</td>
                        <td className="p-3">250ml</td>
                        <td className="p-3">Massage targeted areas</td>
                        <td className="p-3">Almond & Organic Herbs</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 bg-gray-50/20 dark:bg-white/2">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">Essential Oil</td>
                        <td className="p-3">250ml</td>
                        <td className="p-3">After bath care</td>
                        <td className="p-3">100% Botanical Oils</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-2 mt-2">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 ">
                  <Info className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F]" /> Organic Skincare Disclaimer
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
                  For best results, store all Dansolam organic products in a cool, dry place away from direct sunlight. Perform a patch test before first full application.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* REVIEW LIGHTBOX MODAL */}
        {activeLightboxImage && createPortal(
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain animate-fade-in"
            onClick={() => setActiveLightboxImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Review Image Lightbox"
          >
            <div className="relative max-w-2xl w-full bg-white dark:bg-[#1E1528] rounded-3xl overflow-hidden p-3 flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.5)] border border-white/10" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setActiveLightboxImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer z-10 hover:rotate-90"
                aria-label="Close image"
              >
                <X className="w-4 h-4" />
              </button>
              <img loading="lazy" decoding="async" src={activeLightboxImage} alt="Storefront Review Lightbox" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
            </div>
          </div>,
          document.body
        )}

        {/* Toast Notification for Added to Cart */}
        {addedToCartToast && (
          <div className="fixed bottom-6 right-6 bg-white border border-gray-150 rounded-2xl shadow-2xl p-4 z-50 flex items-center gap-3.5 animate-slide-in max-w-sm w-full">
            <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
              <img loading="lazy" decoding="async"
                src={product.images?.[0]?.image_url || '/images/placeholder-product.svg'}
                className="w-full h-full object-cover"
                alt={product.name}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full  tracking-wider">Added to Bag</span>
              <h4 className="text-xs font-bold text-gray-805 truncate mt-1">{product.name}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {variantLabel(selectedVariant, ' · ') || 'Standard'}
              </p>
            </div>
            <button
              onClick={() => setAddedToCartToast(false)}
              className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
