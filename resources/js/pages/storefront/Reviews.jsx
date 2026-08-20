import React, { useState } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star, Plus, Loader2, CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import FacelessAvatar from '../../components/ui/FacelessAvatar';

export default function Reviews() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('recent'); // 'recent', 'highest', 'photos', 'verified'

  // Submit Review Form States
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(null);

  // UI Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch live public reviews with dynamic infinite scroll and filtering
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: feedLoading
  } = useInfiniteQuery({
    queryKey: ['public-reviews-dynamic-feed', activeFilter],
    queryFn: ({ pageParam = 1 }) => {
      let url = `/api/reviews?page=${pageParam}&limit=12`;
      if (activeFilter === 'highest') {
        url += '&sort=highest';
      } else if (activeFilter === 'photos') {
        url += '&with_photos=true';
      }
      return fetch(url).then(res => res.json());
    },
    getNextPageParam: (lastPage) => {
      const paginator = lastPage?.data;
      if (paginator && paginator.current_page < paginator.last_page) {
        return paginator.current_page + 1;
      }
      return undefined;
    }
  });

  // Extract reviews list dynamically from paginated backend responses
  const reviews = infiniteData?.pages?.flatMap(page => page?.data?.data || []) || [];

  // Extract live metrics summary directly from API response
  const latestSummary = infiniteData?.pages?.[0]?.summary;
  const totalCount = latestSummary?.total_count || reviews.length || 0;
  const avgRating = latestSummary?.average_rating
    ? Number(latestSummary.average_rating).toFixed(1)
    : (totalCount > 0 ? '5.0' : '0.0');
  
  const starCounts = latestSummary?.star_counts || { 5: totalCount, 4: 0, 3: 0, 2: 0, 1: 0 };

  const getPercent = (count) => {
    if (totalCount === 0) return 0;
    return Math.round((count / totalCount) * 100);
  };

  // 2. Products for review submission dropdown
  const { data: productsRes } = useQuery({
    queryKey: ['public-products-review-dropdown'],
    queryFn: () => fetch('/api/products?limit=500').then(res => res.json()),
    enabled: showForm
  });
  const products = Array.isArray(productsRes?.data)
    ? productsRes.data
    : (productsRes?.data?.data || []);

  // 3. Submit mutation
  const submitMutation = useMutation({
    mutationFn: ({ productId, payload }) => {
      const endpoint = productId ? `/api/products/${productId}/reviews` : '/api/reviews';
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        setSuccessMsg(data.message || 'Review submitted successfully! Thank you for sharing your experience. ✨');
        setCustomerName('');
        setReviewTitle('');
        setComment('');
        setRating(5);
        setSelectedProductId('');

        queryClient.invalidateQueries({ queryKey: ['public-reviews-dynamic-feed'] });

        setTimeout(() => {
          setShowForm(false);
          setSuccessMsg('');
        }, 2500);
      } else {
        setErrorMsg(data.message || 'Error submitting review.');
      }
    },
    onError: () => {
      setErrorMsg('Network error submitting review. Please try again.');
    }
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please provide your name.');
      return;
    }
    if (!comment.trim()) {
      setErrorMsg('Please write your review comment.');
      return;
    }

    const fullComment = reviewTitle.trim() ? `${reviewTitle.trim()} — ${comment.trim()}` : comment.trim();

    submitMutation.mutate({
      productId: selectedProductId || null,
      payload: {
        customer_name: customerName,
        rating,
        comment: fullComment
      }
    });
  };

  // Helper to extract headline and body from comment
  const parseReviewContent = (rev) => {
    const raw = rev.comment || '';
    if (raw.includes(' — ')) {
      const parts = raw.split(' — ');
      return { title: parts[0], body: parts.slice(1).join(' — ') };
    }
    if (raw.length > 50 && raw.includes('.')) {
      const firstDot = raw.indexOf('.');
      return {
        title: raw.substring(0, firstDot),
        body: raw.substring(firstDot + 1).trim()
      };
    }
    return {
      title: rev.product?.name ? `Review for ${rev.product.name}` : 'Verified Client Experience',
      body: raw
    };
  };

  return (
    <div className="bg-[#FBFAF8] dark:bg-[#17101F] min-h-screen font-sans pb-24 transition-colors duration-300 text-left">
      <SEO
        title="Client Reviews & Verified Testimonials | Dansolam Beauty Home"
        description="Read verified client reviews on Dansolam skincare formulas, luxury facial treatments, and organic spa rituals."
      />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-12 flex flex-col gap-6">
        
        {/* ─── HERO SUBHEADER BANNER (Standard Width across all pages) ─── */}
        <div className="h-[200px] sm:h-[240px] md:h-[270px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-gray-900 relative shadow-md w-full">
          <img
            loading="eager"
            decoding="async"
            src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200"
            className="w-full h-full object-cover object-center"
            alt="Dansolam Client Reviews"
          />

          {/* Header Action Buttons Inside Banner */}
          <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center z-20">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-sm transition-all duration-300 btn-spring"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#EC268F] hover:bg-[#C9166F] text-white text-[11px] font-bold shadow-md hover:scale-105 active:scale-95 transition-all btn-spring cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write a Review</span>
            </button>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 flex flex-col justify-end p-5 sm:p-7 md:p-9 text-left z-10">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#5D3E85] bg-white px-3.5 py-1 rounded-full  tracking-widest self-start mb-2 border border-white/40 shadow-sm">
              Client Love
            </span>
            <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-tight">
              Customer Reviews & Testimonials
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mt-1 max-w-2xl font-sans leading-snug line-clamp-2">
              Read verified experiences and feedback on our organic skincare formulas, facials, and spa rituals.
            </p>
          </div>
        </div>

        {/* ─── SECTION 1: DYNAMIC STATS & RATING BREAKDOWN CARD ─── */}
        <div className="bg-white dark:bg-[#1E1528] rounded-[28px] sm:rounded-[32px] border border-[#EADBEE] dark:border-white/10 p-6 sm:p-10 shadow-sm">
          
          <div className="flex flex-col gap-2 text-left">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
              Reviews & Ratings
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-gray-900 dark:text-white font-normal tracking-tight">
              {totalCount.toLocaleString()} verified clients
            </h2>
          </div>

          {/* Top Summary Grid: Score (Left) & Dynamic Bar Breakdown (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-center mt-8 pb-10 border-b border-gray-100 dark:border-white/10">
            
            {/* Left: Score & Write Review Button */}
            <div className="md:col-span-5 flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {avgRating}
                </span>
                <div className="flex items-center gap-1 text-[#EC268F]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[#EC268F] text-[#EC268F]"
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Average across all products
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="px-6 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-semibold rounded-full shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer btn-spring mt-2"
              >
                Write a review
              </button>
            </div>

            {/* Right: Dynamic Star Breakdown Bars */}
            <div className="md:col-span-7 flex flex-col gap-2.5 w-full">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = starCounts[stars] || 0;
                const pct = getPercent(count);
                return (
                  <div key={stars} className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                    <span className="w-10 text-xs text-gray-500 dark:text-gray-400 shrink-0 font-medium">
                      {stars} star
                    </span>
                    
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#5D3E85] dark:bg-[#EC268F] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400 font-mono shrink-0">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* ─── SECTION 2: FILTER PILLS BAR ─── */}
          <div className="pt-8 pb-4 flex flex-wrap gap-2.5 items-center">
            <button
              type="button"
              onClick={() => setActiveFilter('recent')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'recent'
                  ? 'bg-[#181320] text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              Most recent
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('highest')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'highest'
                  ? 'bg-[#181320] text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              Highest rated
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('photos')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'photos'
                  ? 'bg-[#181320] text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              With photos
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('verified')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'verified'
                  ? 'bg-[#181320] text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              Verified purchase
            </button>
          </div>

          {/* ─── SECTION 3: REVIEWS LIST (100% Dynamic from Backend) ─── */}
          {feedLoading && reviews.length === 0 ? (
            <div className="flex flex-col gap-6 py-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-50 dark:bg-white/5 rounded-2xl h-28 w-full" />
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/10 mt-2">
              {reviews.map((rev) => {
                const { title, body } = parseReviewContent(rev);
                const dateStr = rev.created_at
                  ? new Date(rev.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Verified Order';

                return (
                  <div
                    key={rev.id}
                    className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fade-in text-left"
                  >
                    
                    {/* Column 1: Customer Avatar & Name & Date (approx 3 cols) */}
                    <div className="md:col-span-3 flex items-center gap-3.5">
                      <FacelessAvatar
                        src={rev.avatar_url}
                        name={rev.customer_name}
                        className="w-10 h-10"
                      />

                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                          {rev.customer_name || 'Verified Client'}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5">
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Stars, Headline & Comment Body (approx 6 cols) */}
                    <div className="md:col-span-6 flex flex-col gap-2">
                      <div className="flex items-center gap-1 text-[#EC268F]">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-3.5 h-3.5 fill-[#EC268F] text-[#EC268F]"
                          />
                        ))}
                      </div>

                      <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
                        {title}
                      </h3>

                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                        {body}
                      </p>

                      {/* Optional Review Image */}
                      {rev.image_url && (
                        <div className="mt-2">
                          <img
                            src={rev.image_url}
                            alt="Review upload"
                            className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-white/10"
                          />
                        </div>
                      )}
                    </div>

                    {/* Column 3: Verification Badge & Product Name (approx 3 cols) */}
                    <div className="md:col-span-3 md:text-right flex md:flex-col md:items-end justify-between items-center gap-1.5">
                      <span className="inline-block text-[9px] font-extrabold tracking-wider text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded ">
                        VERIFIED
                      </span>

                      {rev.product?.slug ? (
                        <Link
                          to={`/product/${rev.product.slug}`}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#5D3E85] dark:hover:text-[#EC268F] font-normal truncate max-w-[200px] block transition-colors"
                        >
                          {rev.product.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal truncate max-w-[200px] block">
                          {rev.product?.name || 'General Skincare & Spa'}
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-400 text-xs italic">
              No customer reviews matched this filter.
            </div>
          )}

          {/* Load More Button / Indicator */}
          {hasNextPage && (
            <div className="pt-8 flex justify-center border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2.5 rounded-full border border-gray-200 dark:border-white/15 text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer btn-spring"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5D3E85]" />
                    <span>Loading more reviews...</span>
                  </>
                ) : (
                  <span>Load More Reviews</span>
                )}
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ─── WRITE A REVIEW MODAL DIALOG ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1528] text-[#221B2B] dark:text-[#F3EFF6] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-[#EADBEE] dark:border-white/10 animate-scale-up max-h-[90vh] overflow-y-auto text-left">

            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-base">Write a Product Review</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              
              {/* Product selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold uppercase">Product or Service</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6] cursor-pointer"
                >
                  <option value="">-- General Skin Sanctuary Experience --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold uppercase">Your Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Blessing O."
                  className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 rounded-full focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6]"
                  required
                />
              </div>

              {/* Rating */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold uppercase">Rating *</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer text-[#EC268F]"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= (hoverRating || rating) ? 'fill-[#EC268F] text-[#EC268F]' : 'text-gray-200 dark:text-white/20'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold uppercase">Review Headline</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)}
                  placeholder="e.g. Fixed my discoloration in six weeks"
                  className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 rounded-full focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6]"
                />
              </div>

              {/* Review comment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold uppercase">Review Details *</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Describe the texture, results, and how it felt on your skin..."
                  className="px-4 py-3 border border-gray-200 dark:border-white/15 rounded-2xl focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] h-24 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl p-3 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl p-3 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-white/10 pt-4 mt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-white/15 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isLoading}
                  className="px-6 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer btn-spring"
                >
                  {submitMutation.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
