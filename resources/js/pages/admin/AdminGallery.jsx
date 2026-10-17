import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Image as ImageIcon, Upload, Folder, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import ImageUploadField from '../../components/ui/ImageUploadField';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { getAdminToken } from '../../components/auth/RequireAdminAuth';

export default function AdminGallery() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  // Category selection states
  const [activeCategory, setActiveCategory] = useState(null); // Selected category name, or null to show album list
  const [categoryType, setCategoryType] = useState('existing'); // 'existing' or 'new'
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Bulk Category selection states
  const [bulkCategoryType, setBulkCategoryType] = useState('existing'); // 'existing' or 'new'
  const [bulkSelectedCategory, setBulkSelectedCategory] = useState('General');
  const [bulkNewCategoryName, setBulkNewCategoryName] = useState('');

  // UI state messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Lightbox Zoom
  const [lightboxImg, setLightboxImg] = useState(null);

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

  // Fetch gallery items
  const { data: galleryRes, isLoading } = useQuery({
    queryKey: ['admin-gallery-items'],
    queryFn: () => apiFetch('/api/admin/gallery').then(res => res.json())
  });

  const galleryItems = galleryRes?.data || [];

  // Get unique categories list for dropdowns
  const uniqueCategories = Array.from(new Set(galleryItems.map(item => item.category || 'General')));

  // Group items by category to construct album collections
  const categoriesMap = {};
  galleryItems.forEach(item => {
    const cat = item.category || 'General';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
    categoriesMap[cat].push(item);
  });

  const albumCategories = Object.keys(categoriesMap).map(catName => ({
    name: catName,
    items: categoriesMap[catName],
    previewUrl: categoriesMap[catName][0]?.image_url || '/images/placeholder-product.svg',
    totalCount: categoriesMap[catName].length,
    visibleCount: categoriesMap[catName].filter(item => item.is_visible).length,
  }));

  // Items for the currently opened album category
  const filteredCategoryItems = activeCategory ? (categoriesMap[activeCategory] || []) : [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/gallery', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Gallery item registered successfully!');
        queryClient.invalidateQueries({ queryKey: ['admin-gallery-items'] });
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Error saving gallery item.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error saving gallery item.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Gallery item updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['admin-gallery-items'] });
        setTimeout(() => {
          setShowEditModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Error updating gallery item.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error updating gallery item.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE'
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['admin-gallery-items'] });
      } else {
        systemToast.error(data.message || 'Error deleting gallery item.');
      }
    }
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: (formData) => {
      const token = getAdminToken();
      return fetch('/api/admin/gallery/bulk-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      setBulkUploading(false);
      if (data.success) {
        setBulkMsg(data.message);
        queryClient.invalidateQueries({ queryKey: ['admin-gallery-items'] });
        setTimeout(() => {
          setShowBulkModal(false);
          setBulkFiles([]);
          setBulkMsg('');
          setBulkNewCategoryName('');
        }, 2000);
      } else {
        setBulkMsg(data.message || 'Upload failed.');
      }
    },
    onError: () => {
      setBulkUploading(false);
      setBulkMsg('Network error during upload.');
    }
  });

  const handleBulkUpload = () => {
    if (bulkFiles.length === 0) { setBulkMsg('Please select images.'); return; }
    setBulkUploading(true); setBulkMsg('');
    const formData = new FormData();
    bulkFiles.forEach(f => formData.append('images[]', f));

    const catName = bulkCategoryType === 'new' ? (bulkNewCategoryName.trim() || 'General') : bulkSelectedCategory;
    formData.append('category', catName);

    bulkUploadMutation.mutate(formData);
  };

  const handleBulkFileChange = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = ''; // so the same files can be chosen again
    setBulkFiles(prev => [...prev, ...files]);
  };

  const removeBulkFile = (idx) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setDescription('');
    setLinkUrl('');
    setIsVisible(true);
    setErrorMsg('');
    setSuccessMsg('');
    setCategoryType('existing');
    setSelectedCategory(activeCategory || 'General');
    setNewCategoryName('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    resetForm();
    setSelectedItem(item);
    setTitle(item.title || '');
    setImageUrl(item.image_url || '');
    setDescription(item.description || '');
    setLinkUrl(item.link_url || '');
    setIsVisible(item.is_visible === 1 || item.is_visible === true || item.is_visible === '1');
    setSelectedCategory(item.category || 'General');
    setCategoryType('existing');
    setShowEditModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    if (!imageUrl) {
      setErrorMsg('Please upload an image.');
      setActionLoading(false);
      return;
    }

    const catName = categoryType === 'new' ? (newCategoryName.trim() || 'General') : selectedCategory;

    const payload = {
      title,
      category: catName,
      image_url: imageUrl,
      description,
      link_url: linkUrl,
      is_visible: isVisible
    };

    createMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    if (!imageUrl) {
      setErrorMsg('Please upload an image.');
      setActionLoading(false);
      return;
    }

    const catName = categoryType === 'new' ? (newCategoryName.trim() || 'General') : selectedCategory;

    const payload = {
      title,
      category: catName,
      image_url: imageUrl,
      description,
      link_url: linkUrl,
      is_visible: isVisible
    };

    updateMutation.mutate({ id: selectedItem.id, payload });
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to permanently delete this photo showcase item?')) {
      deleteMutation.mutate(id);
    }
  };

  const openBulkModal = () => {
    setBulkFiles([]);
    setBulkMsg('');
    setBulkSelectedCategory(activeCategory || 'General');
    setBulkCategoryType('existing');
    setShowBulkModal(true);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Gallery & Lookbooks</h2>
          <p className="text-xs text-gray-400 mt-1">Manage public lookbooks, photo archives, and fashion showcase collections grouped by albums.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openBulkModal}
            className="admin-btn-secondary gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Showcase Item
          </button>
        </div>
      </div>

      {activeCategory === null ? (
        /* ALBUM CATEGORIES DASHBOARD VIEW */
        albumCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {albumCategories.map((album) => (
              <div
                key={album.name}
                onClick={() => setActiveCategory(album.name)}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-64"
              >
                {/* Preview Image container */}
                <div className="h-44 w-full bg-gray-50 overflow-hidden relative">
                  <img loading="lazy" decoding="async"
                    src={album.previewUrl}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <div className="flex items-center gap-1.5 text-white">
                      <Folder className="w-4 h-4 fill-white/20 shrink-0" />
                      <span className="text-sm font-bold font-serif line-clamp-1">{album.name}</span>
                    </div>
                  </div>
                </div>

                {/* Info and Navigation bar */}
                <div className="p-3 flex-1 flex items-center justify-between bg-gray-50/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">{album.totalCount} Photo{album.totalCount !== 1 ? 's' : ''}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{album.visibleCount} Publicly Visible</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary group-hover:underline flex items-center gap-0.5">
                    Open Album →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-16 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mt-1">Lookbooks are Empty</h3>
            <p className="text-xs text-gray-450 max-w-sm">No photo Lookbook showcase uploads found. Add albums and showcase images to present collections on the frontend.</p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm mt-2 transition-all cursor-pointer"
            >
              Create First Album
            </button>
          </div>
        )
      ) : (
        /* DETAILED IMAGES COLLECTION IN SINGLE CATEGORY ALBUM */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Albums
            </button>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-semibold">
              Album: <strong className="text-gray-700 uppercase font-serif ml-1">{activeCategory}</strong>
            </span>
          </div>

          {filteredCategoryItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {filteredCategoryItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative ${
                    !item.is_visible ? 'border-dashed border-gray-300' : 'border-gray-200'
                  }`}
                >
                  {/* Visibility Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    {item.is_visible ? (
                      <span className="bg-green-100/90 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Eye className="w-3 h-3" /> Visible
                      </span>
                    ) : (
                      <span className="bg-gray-100/90 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <EyeOff className="w-3 h-3" /> Hidden
                      </span>
                    )}
                  </div>

                  {/* Showcase Image container */}
                  <div
                    className="h-48 w-full bg-gray-55 overflow-hidden cursor-zoom-in relative"
                    onClick={() => setLightboxImg(item.image_url)}
                  >
                    <img loading="lazy" decoding="async" src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold bg-black/50 px-2.5 py-1 rounded-full">Zoom View</span>
                    </div>
                  </div>

                  {/* Description details */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.title || 'Untitled Showcase Item'}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{item.description || 'No description provided.'}</p>
                      {item.link_url && (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline font-semibold mt-1 inline-flex items-center gap-1"
                        >
                          🔗 Link attachment
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-3 mt-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-gray-500 hover:text-blue-650 hover:bg-blue-50 rounded transition-all cursor-pointer"
                        title="Edit Item details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-50 rounded transition-all cursor-pointer"
                        title="Delete Showcase Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-16 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mt-1">Album is Empty</h3>
              <p className="text-xs text-gray-450 max-w-sm">No images in this album category yet. Click Add Showcase Item or Bulk Upload to load files.</p>
            </div>
          )}
        </div>
      )}

      {/* LIGHTBOX ZOOM SCREEN */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxImg(null)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img loading="lazy" decoding="async" src={lightboxImg} alt="Large Showcase item" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Add Photo Showcase</h3>
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
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <ImageUploadField
                label="Photo / Showcase Image *"
                value={imageUrl}
                onChange={setImageUrl}
                required
                aspect="video"
                hint="Upload the main showcase photo for this gallery item."
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Album Category</label>
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setCategoryType('existing')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      categoryType === 'existing'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryType('new')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      categoryType === 'new'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Create New Category
                  </button>
                </div>

                {categoryType === 'existing' ? (
                  <SearchableSelect
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  >
                    {uniqueCategories.length > 0 ? (
                      uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      <option value="General">General</option>
                    )}
                  </SearchableSelect>
                ) : (
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
                    placeholder="Enter new album category name"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Title / Heading</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
                  placeholder="e.g. Summer Silk Jumpsuits"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Description / Caption</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows="3"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  placeholder="Brief context detailing styles..."
                ></textarea>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Link URL (Optional CTA link)</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-650"
                  placeholder="e.g. /shop?category=jumpsuits"
                />
              </div>

              <label className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-150 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={e => setIsVisible(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5"
                />
                <span className="text-xs font-semibold text-gray-800">Display item publicly in gallery page</span>
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
                  ) : 'Register Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Edit Gallery Showcase</h3>
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
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <ImageUploadField
                label="Photo / Showcase Image *"
                value={imageUrl}
                onChange={setImageUrl}
                required
                aspect="video"
                hint="Upload a replacement photo or keep the current one."
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Album Category</label>
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setCategoryType('existing')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      categoryType === 'existing'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryType('new')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      categoryType === 'new'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                    }`}
                  >
                    Create New Category
                  </button>
                </div>

                {categoryType === 'existing' ? (
                  <SearchableSelect
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
                  >
                    {uniqueCategories.length > 0 ? (
                      uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      <option value="General">General</option>
                    )}
                  </SearchableSelect>
                ) : (
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
                    placeholder="Enter new album category name"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Title / Heading</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Description / Caption</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows="3"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                ></textarea>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-555 font-bold uppercase">Link URL</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                />
              </div>

              <label className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-150 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={e => setIsVisible(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5"
                />
                <span className="text-xs font-semibold text-gray-800">Display item publicly in gallery page</span>
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
                  ) : 'Save Showcase details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Bulk Image Upload</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {bulkMsg && (
              <div className={`${bulkMsg.includes('success') ? 'bg-green-50 border-green-200 text-green-600' : 'bg-amber-50 border-amber-200 text-amber-600'} border rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5`}>
                {bulkMsg.includes('success') ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {bulkMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5 mb-2">
              <label className="text-[10px] text-gray-550 font-bold uppercase">Upload Into Category</label>
              <div className="grid grid-cols-2 gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setBulkCategoryType('existing')}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    bulkCategoryType === 'existing'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setBulkCategoryType('new')}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    bulkCategoryType === 'new'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-55'
                  }`}
                >
                  Create New Category
                </button>
              </div>

              {bulkCategoryType === 'existing' ? (
                <SearchableSelect
                  value={bulkSelectedCategory}
                  onChange={e => setBulkSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
                >
                  {uniqueCategories.length > 0 ? (
                    uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  ) : (
                    <option value="General">General</option>
                  )}
                </SearchableSelect>
              ) : (
                <input
                  type="text"
                  required
                  value={bulkNewCategoryName}
                  onChange={e => setBulkNewCategoryName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
                  placeholder="Enter new album category name"
                />
              )}
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('bulk-file-input').click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
              onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary'); }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary');
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                setBulkFiles(prev => [...prev, ...files]);
              }}
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-semibold">Click or drag images here</p>
              <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WebP up to 10MB each</p>
              <input id="bulk-file-input" type="file" multiple accept="image/*" onChange={handleBulkFileChange} className="hidden" />
            </div>

            {bulkFiles.length > 0 && (
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                <p className="text-xs font-bold text-gray-600">{bulkFiles.length} file(s) selected</p>
                <div className="grid grid-cols-4 gap-2">
                  {bulkFiles.map((file, idx) => (
                    <div key={idx} className="relative group animate-fade-in">
                      <img loading="lazy" decoding="async" src={URL.createObjectURL(file)} alt={file.name} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                      <button
                        onClick={() => removeBulkFile(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                      >×</button>
                      <p className="text-[8px] text-gray-400 truncate mt-0.5">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4">
              <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button
                onClick={handleBulkUpload}
                disabled={bulkUploading || bulkFiles.length === 0}
                className="admin-btn-primary gap-1.5 disabled:opacity-50"
              >
                {bulkUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload {bulkFiles.length} Image(s)</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
