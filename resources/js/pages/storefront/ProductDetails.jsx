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
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

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

  // Set modal size tab dynamically based on product name / category
  useEffect(() => {
    if (product) {
      const catNames = (product.categories ? product.categories.map(c => c.name) : [product.category?.name || '']).join(' ').toLowerCase();
      const isShoes = product.name?.toLowerCase().includes('sneakers') ||
                      product.name?.toLowerCase().includes('shoes') ||
                      product.name?.toLowerCase().includes('footwear') ||
                      product.name?.toLowerCase().includes('heels') ||
                      catNames.includes('shoes') ||
                      catNames.includes('footwear');
      if (isShoes) {
        setModalSizeTab('shoes');
      } else {
        setModalSizeTab('dresses');
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
      if (data.success) {
        setReviewSuccess(true);
        queryClient.invalidateQueries(['product-details', slug]);
        setReviewName('');
        setReviewComment('');
        setTimeout(() => setReviewSuccess(false), 5000);
      }
    }
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
    const brandName = 'Dansolam';
    const whatsappNum = '2348000000000';
    const currentUrl = window.location.href;
    const priceText = `${currencySymbol}${parseFloat(selectedVariant?.price || product.sale_price || product.price).toLocaleString()}`;
    const variantDesc = selectedVariant ? `(Size: ${selectedVariant.size}, Color: ${selectedVariant.color})` : '';
    
    const message = `Hello ${brandName}, I'm interested in purchasing the "${product.name}" ${variantDesc} - Price: ${priceText}. Here is the link: ${currentUrl}`;
    return `https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`;
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    const isCaptchaEnabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;
    const isReviewEnabled = settings.captcha_on_reviews === undefined ? true : (settings.captcha_on_reviews === 'true' || settings.captcha_on_reviews === true);
    if (isCaptchaEnabled && isReviewEnabled && !reviewCaptchaVerified) {
      alert('Please complete the security verification challenge before submitting your review.');
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
        <Link to="/shop" className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm">
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

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-12">
      <SEO title={product.name} description={product.short_description || product.seo_description || `Purchase ${product.name} at Dansolam. High quality designer wear.`} />
      
      {/* Product Details Section */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
        
        {/* Left Column: Image gallery */}
        <div className="flex-1 w-full flex flex-col gap-3">
          <div className="h-96 md:h-[480px] bg-gray-105 rounded-2xl overflow-hidden shadow-sm relative">
            <img loading="eager" decoding="async" fetchPriority="high"
              src={product.images?.[activeImageIdx]?.image_url || '/images/products/placeholder.jpg'}
              alt={product.name}
              className="w-full h-full object-cover animate-fade-in"
            />
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
              {isSale && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                  Sale Offer
                </span>
              )}
              {product?.is_new_arrival && (
                <span className="bg-yellow-400 text-gray-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shadow-xs">
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
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 bg-gray-50 ${activeImageIdx === idx ? 'border-primary' : 'border-transparent'}`}
                >
                  <img loading="lazy" decoding="async" src={img.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Buying parameters */}
        <div className="flex-1 flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-primary font-bold uppercase tracking-wider">
              {product.categories && product.categories.length > 0
                ? product.categories.map(c => c.name).join(' · ')
                : (product.category?.name || 'Collection')}
            </span>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 mt-1">SKU: {selectedVariant?.sku || product.sku}</p>
          </div>

          {/* Star review average & Sold count */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                ({product.reviews?.length || 0} reviews)
              </span>
            </div>
            {isSoldCountEnabled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250/30 uppercase tracking-wide">
                🔥 {product.total_sold || 28} sold so far
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2.5 py-2 border-y border-gray-150">
            <span className="font-serif font-bold text-2xl text-gray-950">
              {currencySymbol}{parseFloat(activePrice).toLocaleString()}
            </span>
            {isSale && (
              <span className="text-xs text-gray-400 line-through">
                {currencySymbol}{parseFloat(basePrice).toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">{product.short_description || product.description}</p>

          {/* SIZES MATRIX */}
          {sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Select Size</span>
                {isSizeGuideEnabled && (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[10px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    Size Chart 📏
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => handleSizeSelect(sz)}
                    className={`px-3.5 py-2 text-xs font-bold border rounded-lg transition-all ${
                      selectedSize === sz
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-250 text-gray-705 hover:border-gray-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* COLORS MATRIX */}
          {colors.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider block mb-2">Available Colors</span>
              <div className="flex gap-2">
                {colors.map((col) => (
                  <button
                    key={col}
                    onClick={() => handleColorSelect(col)}
                    className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all ${
                      selectedColor === col
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-255 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STOCK BADGES */}
          <div>
            {isOutOfStock && !allowOverselling ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-655 border border-red-200">
                Out of Stock
              </span>
            ) : isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-605 border border-orange-200 animate-pulse">
                ⚠️ Only 0 left — available on backorder
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-605 border border-orange-200">
                Only {activeStock} left
              </span>
            )}
          </div>

          {/* QUANTITY SELECTOR & BUY ACTIONS */}
          {canOrder && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 py-1 text-sm font-semibold text-gray-800 w-12 text-center select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(allowOverselling ? quantity + 1 : Math.min(activeStock, quantity + 1))}
                    className="p-2 hover:bg-gray-50 text-gray-605 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Buying CTA */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`flex-1 py-3.5 text-xs font-bold rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    adding 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-yellow-400 hover:bg-yellow-500 text-gray-950 shadow-xs active:scale-[0.98]'
                  }`}
                >
                  {adding ? <Check className="w-4 h-4 text-white" /> : <ShoppingCart className="w-4 h-4 text-gray-950" />}
                  {adding ? 'Added ✓' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full text-center shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`px-4.5 py-3.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                    hasWishlist
                      ? 'bg-red-50 text-red-500 hover:bg-red-100/50'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={hasWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-4 h-4 ${hasWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              {/* WhatsApp Social selling inquiry */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg border border-gray-200 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
                Inquire via WhatsApp
              </a>
            </div>
          )}

          {/* Delivery & return info snapshot */}
          <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 leading-relaxed flex flex-col gap-2 mt-4">
            <p>✈️ <strong>Delivery Estimate:</strong> Abuja: 1-2 days | Nationwide: 3-5 days | Worldwide: 5-10 days.</p>
            <p>🔄 <strong>Return Policy:</strong> Exchange or store credit within 7 days of purchase. Tags must be intact.</p>
          </div>

        </div>
      </div>

      {/* Description & Review Tabs */}
      <div className="border-t border-gray-100 pt-8 max-w-4xl">
        <h2 className="font-serif font-bold text-xl text-gray-900 mb-6">Product Details & Specs</h2>
        <div className="prose prose-sm text-gray-600 leading-relaxed mb-12">
          {product.description}
        </div>

        {/* Reviews Block */}
        <div className="border-t border-gray-50 pt-8">
          <h3 className="font-serif font-bold text-lg text-gray-900 mb-6">Customer Reviews</h3>

          {/* List reviews */}
          <div className="flex flex-col gap-6 mb-8">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {rev.avatar_url ? (
                        <img loading="lazy" decoding="async" src={rev.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase">
                          {rev.customer_name[0]}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-xs text-gray-850 block">{rev.customer_name}</span>
                        <span className="text-[9px] text-gray-400 block mt-0.5">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-primary">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <p className="text-xs text-gray-600 italic flex-1">"{rev.comment || 'No text review left.'}"</p>
                    {rev.image_url && (
                      <div className="w-14 h-14 border border-gray-200 rounded overflow-hidden cursor-pointer hover:opacity-85 transition-all shrink-0 bg-gray-50" onClick={() => setActiveLightboxImage(rev.image_url)}>
                        <img loading="lazy" decoding="async" src={rev.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No reviews for this product yet. Be the first to share your experience!</p>
            )}
          </div>

          {/* Add review form */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h4 className="font-semibold text-xs text-gray-805 uppercase mb-4">Write a Review</h4>
            {reviewSuccess ? (
              <div className="bg-green-50 border border-green-205 text-green-605 rounded-lg p-4 text-xs font-semibold mb-4">
                Thank you! Your review has been submitted successfully and is under moderation.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="e.g. Fatima A."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Rating</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
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
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Avatar Image URL (Optional)</label>
                    <input
                      type="text"
                      value={reviewAvatarUrl}
                      onChange={(e) => setReviewAvatarUrl(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="e.g. Profile photo URL"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Review Screenshot URL (Optional)</label>
                    <input
                      type="text"
                      value={reviewImageUrl}
                      onChange={(e) => setReviewImageUrl(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="WhatsApp/Instagram screenshot link"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-semibold uppercase">Comment</label>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows="3"
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="Tell us about the fabric quality, fitting, and delivery experience..."
                  ></textarea>
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
                  className="self-start px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm"
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
        <div className="border-t border-gray-100 pt-8 w-full">
          <h3 className="font-serif font-bold text-xl text-gray-900 mb-6">You May Also Like</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL/OVERLAY */}
      {sizeGuideOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 flex flex-col gap-4 relative max-h-[85vh] overflow-y-auto custom-sidebar-scroll shadow-2xl">
            <button
              onClick={() => setSizeGuideOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-55 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif font-bold text-lg text-gray-950">Size & Sizing Metrics Chart</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Please measure yourself before purchasing to ensure fit correctness.</p>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-150">
              <button
                onClick={() => setModalSizeTab('dresses')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                  modalSizeTab === 'dresses'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-650'
                }`}
              >
                👗 Dresses & Jumpsuits
              </button>
              <button
                onClick={() => setModalSizeTab('shoes')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                  modalSizeTab === 'shoes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-650'
                }`}
              >
                👠 Shoes & Footwear
              </button>
            </div>

            {/* Modal Tables content */}
            {modalSizeTab === 'dresses' ? (
              <div className="overflow-x-auto rounded-2xl border border-gray-150 shadow-sm bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                      <th className="p-3">UK Size</th>
                      <th className="p-3">US Size</th>
                      <th className="p-3">EU Size</th>
                      <th className="p-3">Bust (in)</th>
                      <th className="p-3">Waist (in)</th>
                      <th className="p-3">Hips (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3 font-semibold text-gray-900">UK 8</td>
                      <td className="p-3">US 4</td>
                      <td className="p-3">EU 36</td>
                      <td className="p-3">32"</td>
                      <td className="p-3">25"</td>
                      <td className="p-3">35"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/55 bg-gray-50/20">
                      <td className="p-3 font-semibold text-gray-900">UK 10</td>
                      <td className="p-3">US 6</td>
                      <td className="p-3">EU 38</td>
                      <td className="p-3">34"</td>
                      <td className="p-3">27"</td>
                      <td className="p-3">37"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3 font-semibold text-gray-900">UK 12</td>
                      <td className="p-3">US 8</td>
                      <td className="p-3">EU 40</td>
                      <td className="p-3">36"</td>
                      <td className="p-3">29"</td>
                      <td className="p-3">39"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 bg-gray-50/20">
                      <td className="p-3 font-semibold text-gray-900">UK 14</td>
                      <td className="p-3">US 10</td>
                      <td className="p-3">EU 42</td>
                      <td className="p-3">38"</td>
                      <td className="p-3">31"</td>
                      <td className="p-3">41"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/55">
                      <td className="p-3 font-semibold text-gray-900">UK 16</td>
                      <td className="p-3">US 12</td>
                      <td className="p-3">EU 44</td>
                      <td className="p-3">40"</td>
                      <td className="p-3">33"</td>
                      <td className="p-3">43"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 bg-gray-50/20">
                      <td className="p-3 font-semibold text-gray-900">UK 18</td>
                      <td className="p-3">US 14</td>
                      <td className="p-3">EU 46</td>
                      <td className="p-3">42"</td>
                      <td className="p-3">35"</td>
                      <td className="p-3">45"</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-150 shadow-sm bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                      <th className="p-3">EU Shoe Size</th>
                      <th className="p-3">UK Size</th>
                      <th className="p-3">US Size</th>
                      <th className="p-3">Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr className="hover:bg-gray-50/55">
                      <td className="p-3 font-semibold text-gray-900">EU 37</td>
                      <td className="p-3">UK 4</td>
                      <td className="p-3">US 6</td>
                      <td className="p-3">23.5 cm</td>
                    </tr>
                    <tr className="hover:bg-gray-50/55 bg-gray-50/20">
                      <td className="p-3 font-semibold text-gray-900">EU 38</td>
                      <td className="p-3">UK 5</td>
                      <td className="p-3">US 7</td>
                      <td className="p-3">24.0 cm</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3 font-semibold text-gray-900">EU 39</td>
                      <td className="p-3">UK 6</td>
                      <td className="p-3">US 8</td>
                      <td className="p-3">24.5 cm</td>
                    </tr>
                    <tr className="hover:bg-gray-50/55 bg-gray-50/20">
                      <td className="p-3 font-semibold text-gray-900">EU 40</td>
                      <td className="p-3">UK 7</td>
                      <td className="p-3">US 9</td>
                      <td className="p-3">25.0 cm</td>
                    </tr>
                    <tr className="hover:bg-gray-50/55">
                      <td className="p-3 font-semibold text-gray-900">EU 41</td>
                      <td className="p-3">UK 8</td>
                      <td className="p-3">US 10</td>
                      <td className="p-3">25.5 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex flex-col gap-2 mt-2">
              <span className="text-[10px] font-bold text-gray-700 flex items-center gap-1.5 uppercase">
                <Info className="w-3.5 h-3.5 text-primary" /> Fabric stretch disclaimer
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                Fits may vary depending on design details, fabrics flexibility, and tailoring structures. If you fall between sizes, we recommend sizing up or contacting showroom support.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* REVIEW LIGHTBOX MODAL */}
      {activeLightboxImage && createPortal(
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveLightboxImage(null)}>
          <div className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden p-2 flex flex-col" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            <img loading="lazy" decoding="async" src={activeLightboxImage} alt="Storefront Review Lightbox" className="w-full h-auto max-h-[75vh] object-contain rounded" />
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification for Added to Cart */}
      {addedToCartToast && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-150 rounded-2xl shadow-2xl p-4 z-50 flex items-center gap-3.5 animate-slide-in max-w-sm w-full">
          <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
            <img loading="lazy" decoding="async" 
              src={product.images?.[0]?.image_url || '/images/products/placeholder.jpg'} 
              className="w-full h-full object-cover" 
              alt={product.name}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Added to Bag</span>
            <h4 className="text-xs font-bold text-gray-805 truncate mt-1">{product.name}</h4>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {selectedVariant ? `Size: ${selectedVariant.size} · Color: ${selectedVariant.color}` : 'Standard Edition'}
            </p>
          </div>
          <button 
            onClick={() => setAddedToCartToast(false)}
            className="p-1 hover:bg-gray-55 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
