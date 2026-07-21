import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, CheckCircle, Trash2, ShieldCheck, AlertCircle, Eye, X, Plus, Edit, Loader2, Check, Search } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import ImageUploadField from '../../components/ui/ImageUploadField';

export default function AdminReviews() {
  const queryClient = useQueryClient();

  // lightbox image zoom state
  const [activeImage, setActiveImage] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isApproved, setIsApproved] = useState(true);

  // UI state messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch reviews list
  const { data: reviewsRes, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => apiFetch('/api/admin/reviews').then(res => res.json())
  });

  const reviews = reviewsRes?.data || [];

  // Table state management
  const {
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    requestSort,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredData,
    paginatedData,
    jumpToPage,
    totalCount,
    filteredCount
  } = useTableState({
    data: reviews,
    defaultPageSize: 10,
    defaultSortField: 'id',
    defaultSortOrder: 'desc',
    searchKeys: ['customer_name', 'comment', 'rating', 'product.name']
  });

  // Fetch products lookup list for review dropdown
  const { data: productsRes } = useQuery({
    queryKey: ['admin-reviews-products-lookup'],
    queryFn: () => apiFetch('/api/admin/products').then(res => res.json())
  });

  const products = productsRes?.data || [];

  // Mutations
  const createReviewMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/reviews', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Review added successfully!');
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Review registration failed.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error registering review.');
    }
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Review updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
        setTimeout(() => {
          setShowEditModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Review update failed.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error updating review.');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/reviews/${id}/approve`, { method: 'PUT' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      }
    }
  });

  // Helpers
  const resetForm = () => {
    setCustomerName('');
    setAvatarUrl('');
    setProductId('');
    setRating(5);
    setComment('');
    setImageUrl('');
    setIsApproved(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (rev) => {
    resetForm();
    setSelectedReview(rev);
    setCustomerName(rev.customer_name);
    setAvatarUrl(rev.avatar_url || '');
    setProductId(String(rev.product_id || ''));
    setRating(rev.rating || 5);
    setComment(rev.comment || '');
    setImageUrl(rev.image_url || '');
    setIsApproved(rev.is_approved === 1 || rev.is_approved === true || rev.is_approved === '1');
    setShowEditModal(true);
  };

  const handleApprove = (id) => {
    approveMutation.mutate(id);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to permanently delete this customer review?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    if (!productId) {
      setErrorMsg('Please select a product for the review.');
      setActionLoading(false);
      return;
    }

    const payload = {
      customer_name: customerName,
      avatar_url: avatarUrl || null,
      product_id: parseInt(productId),
      rating: parseInt(rating),
      comment,
      image_url: imageUrl || null,
      is_approved: isApproved
    };

    createReviewMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    if (!productId) {
      setErrorMsg('Please select a product for the review.');
      setActionLoading(false);
      return;
    }

    const payload = {
      customer_name: customerName,
      avatar_url: avatarUrl || null,
      product_id: parseInt(productId),
      rating: parseInt(rating),
      comment,
      image_url: imageUrl || null,
      is_approved: isApproved
    };

    updateReviewMutation.mutate({ id: selectedReview.id, payload });
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Review Moderation</h2>
          <p className="text-xs text-gray-400 mt-1">Moderate customer reviews or post WhatsApp feedback screenshots directly to storefront.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Manual / WhatsApp Review
        </button>
      </div>
 
      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
        <div className="flex-1 max-w-sm relative">
          <input
            type="text"
            placeholder="Search reviews (customer, comment, product...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
        </div>
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          👑 {filteredCount} feedback reviews
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none">
                <th onClick={() => requestSort('customer_name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Customer Info {sortField === 'customer_name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('product.name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Product Name {sortField === 'product.name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('rating')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Rating {sortField === 'rating' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('comment')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Comment / Text {sortField === 'comment' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th className="px-6 py-3">Review Proof / Image</th>
                <th onClick={() => requestSort('is_approved')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Status {sortField === 'is_approved' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((rev) => (
                  <tr key={rev.id} className="hover:bg-gray-55/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        {rev.avatar_url ? (
                          <img loading="lazy" decoding="async" src={rev.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                            {rev.customer_name ? rev.customer_name[0] : 'U'}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-gray-800 block leading-tight">{rev.customer_name}</span>
                          <span className="text-[9px] text-gray-400 block mt-0.5 font-mono">ID: {rev.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-650 font-medium max-w-[120px] truncate">
                      {rev.product ? rev.product.name : <span className="text-gray-400 italic">Deleted Product</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-amber-400 gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < (rev.rating || 5) ? 'fill-current' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs leading-normal">
                      <p className="line-clamp-2">{rev.comment}</p>
                    </td>
                    <td className="px-6 py-4">
                      {rev.image_url ? (
                        <button
                          onClick={() => setActiveImage(rev.image_url)}
                          className="relative w-12 h-10 rounded overflow-hidden border border-gray-150 bg-gray-50 flex items-center justify-center cursor-zoom-in group"
                        >
                          <img loading="lazy" decoding="async" src={rev.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition-opacity">
                            View
                          </span>
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">No image proof</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {rev.is_approved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-600">
                          <Check className="w-2.5 h-2.5" /> APPROVED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprove(rev.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          PENDING APP
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(rev)}
                          className="p-1.5 text-gray-550 hover:text-blue-650 hover:bg-blue-50 rounded transition-all cursor-pointer"
                          title="Edit Review Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rev.id)}
                          className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-50 rounded transition-all cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">No reviews found matching query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table controls */}
        {filteredCount > 0 && (
          <TablePaginationControls
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            filteredCount={filteredCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            onJumpToPage={jumpToPage}
          />
        )}
      </div>

      {/* ZOOM LIGHTBOX */}
      {activeImage && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveImage(null)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActiveImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img loading="lazy" decoding="async" src={activeImage} alt="Feedback Proof Large" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* CREATE REVIEW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Add Review manually</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-150 text-red-500 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Full name"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Target Product *</label>
                  <select
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full h-8.5 cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ImageUploadField
                  label="Customer Avatar (Optional)"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  aspect="compact"
                  hint="Circular profile picture shown next to the review."
                />

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Star Rating *</label>
                  <select
                    value={rating}
                    onChange={e => setRating(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full font-bold h-8.5 cursor-pointer"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                    <option value="2">⭐⭐ (2 Stars)</option>
                    <option value="1">⭐ (1 Star)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Comment / Review Body *</label>
                <textarea
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows="3"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 leading-normal"
                  placeholder="Tell us what the customer said..."
                ></textarea>
              </div>

              <ImageUploadField
                label="Review Screenshot / Proof (Optional)"
                value={imageUrl}
                onChange={setImageUrl}
                aspect="compact"
                hint="Upload a WhatsApp screenshot or any visual review proof."
              />

              <label className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-150 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isApproved}
                  onChange={e => setIsApproved(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5"
                />
                <span className="text-xs font-semibold text-gray-800">Approve instantly for storefront display</span>
              </label>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-205 hover:bg-gray-55 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Register Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REVIEW MODAL */}
      {showEditModal && selectedReview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Edit Review Content</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-150 text-red-500 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Full name"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Target Product *</label>
                  <select
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full h-8.5 cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ImageUploadField
                  label="Customer Avatar"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  aspect="compact"
                  hint="Circular profile picture shown next to the review."
                />

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Star Rating *</label>
                  <select
                    value={rating}
                    onChange={e => setRating(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full font-bold h-8.5 cursor-pointer"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                    <option value="2">⭐⭐ (2 Stars)</option>
                    <option value="1">⭐ (1 Star)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Comment / Review Body *</label>
                <textarea
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows="3"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 leading-normal"
                  placeholder="Tell us what the customer said..."
                ></textarea>
              </div>

              <ImageUploadField
                label="Review Screenshot / Proof"
                value={imageUrl}
                onChange={setImageUrl}
                aspect="compact"
                hint="Upload a screenshot or visual review proof."
              />

              <label className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-150 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isApproved}
                  onChange={e => setIsApproved(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5"
                />
                <span className="text-xs font-semibold text-gray-800">Approve instantly for storefront display</span>
              </label>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-205 hover:bg-gray-55 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : 'Save Review details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
