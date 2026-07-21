import React, { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Plus, Loader2, CheckCircle, AlertCircle, Sparkles, MessageCircleHeart, X } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function Reviews() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
  // Submit Review Form States
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(null);
  
  // UI Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [prevReviewsCount, setPrevReviewsCount] = useState(0);

  // 1. Fetch public reviews summary metrics (fetches up to 1000 to compute breakdown averages)
  const { data: summaryRes } = useQuery({
    queryKey: ['public-reviews-summary'],
    queryFn: () => fetch('/api/reviews?limit=1000').then(res => res.json())
  });
  const allReviewsForMetrics = summaryRes?.data?.data || [];

  // 2. Infinite scroll reviews list query (page size 9)
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: feedLoading
  } = useInfiniteQuery({
    queryKey: ['public-reviews-infinite-feed'],
    queryFn: ({ pageParam = 1 }) => 
      fetch(`/api/reviews?page=${pageParam}&limit=9`).then(res => res.json()),
    getNextPageParam: (lastPage) => {
      const paginator = lastPage?.data;
      if (paginator && paginator.current_page < paginator.last_page) {
        return paginator.current_page + 1;
      }
      return undefined;
    }
  });

  // Extract flattened reviews list from paginated infinite scroll results
  const reviews = infiniteData
    ? infiniteData.pages.flatMap(page => {
        const paginator = page?.data;
        return Array.isArray(paginator) ? paginator : (paginator?.data || []);
      })
    : [];

  // 3. Auto Load More Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const threshold = 120; // px from bottom to trigger fetch
      const isNearBottom = 
        window.innerHeight + window.scrollY >= 
        document.documentElement.scrollHeight - threshold;

      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 3b. Smooth Scroll to Newly Loaded Review Content
  useEffect(() => {
    if (reviews.length > prevReviewsCount) {
      if (prevReviewsCount > 0) {
        setTimeout(() => {
          const firstNewReviewIndex = prevReviewsCount;
          const element = document.getElementById(`review-card-${firstNewReviewIndex}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
      setPrevReviewsCount(reviews.length);
    }
  }, [reviews.length, prevReviewsCount]);

  // 4. Fetch catalog products to select in form (only when form is showing)
  const { data: productsRes } = useQuery({
    queryKey: ['public-products-review-dropdown'],
    queryFn: () => fetch('/api/products?limit=500').then(res => res.json()),
    enabled: showForm
  });
  const products = Array.isArray(productsRes?.data) 
    ? productsRes.data 
    : (productsRes?.data?.data || []);

  // 5. Mutation to submit review (asynchronous POST)
  const submitMutation = useMutation({
    mutationFn: ({ productId, payload }) => {
      // Determine correct URL based on product selection
      const url = productId ? `/api/products/${productId}/reviews` : '/api/reviews';
      return fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        setSuccessMsg(data.message || 'Thank you! Your review has been submitted successfully and is awaiting moderation.');
        setCustomerName('');
        setComment('');
        setRating(5);
        setSelectedProductId('');
        
        // Invalidate queries to reload review lists
        queryClient.invalidateQueries({ queryKey: ['public-reviews-summary'] });
        queryClient.invalidateQueries({ queryKey: ['public-reviews-infinite-feed'] });

        // Autoclose form modal after success
        setTimeout(() => {
          setShowForm(false);
          setSuccessMsg('');
        }, 3000);
      } else {
        setErrorMsg(data.message || 'Error submitting review.');
      }
    },
    onError: () => {
      setErrorMsg('Network error submitting review. Please try again.');
    }
  });

  // Calculate general rating scores
  const totalReviews = allReviewsForMetrics.length;
  const avgRating = totalReviews > 0
    ? (allReviewsForMetrics.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const starBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allReviewsForMetrics.forEach(r => {
    if (starBreakdown[r.rating] !== undefined) {
      starBreakdown[r.rating]++;
    }
  });

  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  const handleRatingClick = (val) => {
    setRating(val);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please input your name.');
      return;
    }
    if (!comment.trim()) {
      setErrorMsg('Please write a short review comment.');
      return;
    }

    submitMutation.mutate({
      productId: selectedProductId || null,
      payload: {
        customer_name: customerName,
        rating,
        comment
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8 font-sans">
      <SEO
        title="Customer Testimonials & Reviews"
        description="Read what our clients say about Dansolam. Verified customer experiences, sizing feedback, and fabric quality reviews."
      />

      {/* Header Info */}
      <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-1.5">
          <MessageCircleHeart className="w-3.5 h-3.5" />
          Customer Love
        </span>
        <h1 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 leading-tight">Reviews & Testimonials</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          See verified testimonials from our clients on sizing fit, premium fabric quality, and customer support services.
        </p>
      </div>

      {/* Ratings Overview Summary & Action Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white dark:bg-[#111111] border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        
        {/* Big Average */}
        <div className="text-center flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-6 md:pb-0 md:pr-6 gap-2">
          <span className="text-5xl font-serif font-bold text-gray-900 leading-none">{avgRating}</span>
          <div className="flex items-center gap-0.5 mt-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(parseFloat(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-250'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
            Based on {totalReviews} verified ratings
          </span>
        </div>

        {/* Stars Breakdown progress bars */}
        <div className="flex flex-col gap-2 flex-1 md:col-span-2 md:pl-6">
          <div className="flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = starBreakdown[stars];
              const pct = getPercentage(count);
              return (
                <div key={stars} className="flex items-center gap-3 text-[11px] text-gray-600 font-medium">
                  <span className="w-8 text-right shrink-0">{stars} Stars</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                  <span className="w-12 text-right shrink-0 text-gray-400 font-bold">{pct}% ({count})</span>
                </div>
              );
            })}
          </div>

          {/* Action trigger button */}
          <div className="flex justify-center md:justify-end mt-4 pt-3 border-t border-primary/5">
            <button
              onClick={() => {
                setShowForm(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Write A Product Review
            </button>
          </div>
        </div>

      </div>

      {/* ─── WRITE A REVIEW MODAL DIALOG ─── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-4 border border-gray-100 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-serif font-bold text-gray-900 text-sm">Write a Product Review</h3>
              </div>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Product (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Select Product (Optional)</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white cursor-pointer h-9 text-gray-800 font-medium"
                  >
                    <option value="">-- General Store Review --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Your Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Fatima A."
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    required
                  />
                </div>
              </div>

              {/* Interactive Star Rating */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Rate Product *</label>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer text-amber-400"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-250'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[11px] text-gray-400 font-bold ml-2">
                    {rating === 5 && '😍 Love it! (5/5)'}
                    {rating === 4 && '😊 Great product (4/5)'}
                    {rating === 3 && '😐 Average (3/5)'}
                    {rating === 2 && '👎 Disappointed (2/5)'}
                    {rating === 1 && '😡 Very Poor (1/5)'}
                  </span>
                </div>
              </div>

              {/* Review comment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Review Comments *</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell us about the fabric quality, stitching, and fit sizing recommendation..."
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-xs bg-white text-gray-850 h-24 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 text-red-500 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-55 pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
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

      {/* ─── REVIEWS FEED LISTING ─── */}
      {feedLoading && reviews.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-44 w-full" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {reviews.map((rev, index) => (
              <div 
                key={rev.id} 
                id={`review-card-${index}`}
                className="bg-white border border-gray-100 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all animate-scale-up"
              >
                {/* Review Stars & Text */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-250'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-650 leading-relaxed font-sans text-xs italic">
                    "{rev.comment || 'Excellent product quality.'}"
                  </p>
                </div>

                {/* Author & Product Reference */}
                <div className="flex flex-col gap-3 mt-2 border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 uppercase select-none">
                      {rev.customer_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 text-[11px] block">{rev.customer_name}</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">
                        {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Linked Product Card */}
                  {rev.product ? (
                    <Link 
                      to={`/product/${rev.product.slug}`} 
                      className="flex items-center gap-2 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 p-2 rounded-xl transition-all"
                    >
                      {rev.product.images?.length > 0 ? (
                        <img loading="lazy" decoding="async" 
                          src={rev.product.images[0].image_url} 
                          alt="" 
                          className="w-8 h-8 rounded object-cover border border-gray-200" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs">🛍️</div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider leading-none">Reviewing:</span>
                        <span className="text-[10px] font-semibold text-gray-700 block truncate mt-1 leading-none">{rev.product.name}</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 p-2 rounded-xl text-[10px] font-medium text-primary">
                      ✨ General Ecommerce & Service Review
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Asynchronous Loading More Status */}
          {isFetchingNextPage && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 mt-2 animate-pulse">
              <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/5 px-4 py-2 rounded-full shadow-3xs border border-primary/10">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                Fetching customer reviews...
              </div>
            </div>
          )}

          {!hasNextPage && reviews.length > 0 && (
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest py-4 border-t border-gray-50">
              👑 You have viewed all customer reviews
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 italic bg-gray-50 rounded-2xl border border-gray-100">
          No customer reviews left yet. Be the first to share your experience!
        </div>
      )}

    </div>
  );
}
