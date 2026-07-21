import { getCurrencySymbol } from '../../utils/currency';
import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Save, X, FolderPlus } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import ImageUploadField from '../../components/ui/ImageUploadField';

export default function AdminCollections() {
  const currencySymbol = getCurrencySymbol();
  const queryClient = useQueryClient();

  // Dialog/modal and inline edit states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [showInMegaMenu, setShowInMegaMenu] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublished, setEditPublished] = useState(true);
  const [editShowInMegaMenu, setEditShowInMegaMenu] = useState(true);

  // Product linking state
  const [linkingCollection, setLinkingCollection] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Category linking state
  const [linkingCollectionCategories, setLinkingCollectionCategories] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Mega menu ads settings uploading state
  const [uploadingAd, setUploadingAd] = useState(false);

  // Fetch collections
  const { data: collectionsRes, isLoading } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: () => apiFetch('/api/admin/collections').then(res => res.json())
  });

  // Fetch products for linking
  const { data: productsRes } = useQuery({
    queryKey: ['admin-products-list-sync'],
    queryFn: () => apiFetch('/api/admin/products').then(res => res.json())
  });

  // Fetch categories for linking
  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories-list-sync'],
    queryFn: () => apiFetch('/api/admin/categories').then(res => res.json())
  });

  // Fetch ecommerce settings for mega menu ads banner
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-admin-collections'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json())
  });

  const collections = collectionsRes?.data || [];
  const products = productsRes?.data || [];
  const categories = categoriesRes?.data || [];
  const settings = settingsRes?.data?.settings || {};

  // Safely parse sliding ads
  let activeAds = [];
  try {
    if (typeof settings.mega_menu_ads === 'string') {
      activeAds = JSON.parse(settings.mega_menu_ads);
    } else if (Array.isArray(settings.mega_menu_ads)) {
      activeAds = settings.mega_menu_ads;
    }
  } catch (e) {
    activeAds = [];
  }

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newCol) => {
      return apiFetch('/api/admin/collections', {
        method: 'POST',
        body: JSON.stringify(newCol)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-collections']);
        setShowCreateForm(false);
        setName('');
        setBannerUrl('');
        setDescription('');
        setIsPublished(true);
        setShowInMegaMenu(true);
      } else {
        systemToast.error(data.message || 'Creation failed');
      }
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-collections']);
        setEditingId(null);
      } else {
        systemToast.error(data.message || 'Update failed');
      }
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/collections/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-collections']);
      }
    }
  });

  // Sync Products Mutation
  const syncProductsMutation = useMutation({
    mutationFn: ({ id, productIds }) => {
      return apiFetch(`/api/admin/collections/${id}/products`, {
        method: 'POST',
        body: JSON.stringify({ product_ids: productIds })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-collections']);
        setLinkingCollection(null);
      } else {
        systemToast.error(data.message || 'Product sync failed');
      }
    }
  });

  // Sync Categories Mutation
  const syncCategoriesMutation = useMutation({
    mutationFn: ({ id, categoryIds }) => {
      return apiFetch(`/api/admin/collections/${id}/categories`, {
        method: 'POST',
        body: JSON.stringify({ category_ids: categoryIds })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-collections']);
        setLinkingCollectionCategories(null);
      } else {
        systemToast.error(data.message || 'Category sync failed');
      }
    }
  });

  // Save Settings Mutation for Mega Menu Ads
  const saveAdsMutation = useMutation({
    mutationFn: (updatedAds) => {
      return apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ mega_menu_ads: JSON.stringify(updatedAds) })
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['settings-admin-collections', 'settings']);
      } else {
        systemToast.error('Failed to save banners');
      }
    }
  });

  const handleAdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAd(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiFetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const updatedAds = [...activeAds, data.url];
        saveAdsMutation.mutate(updatedAds);
      } else {
        systemToast.error(data.message || 'Upload failed');
      }
    } catch {
      systemToast.error('Upload failed');
    } finally {
      setUploadingAd(false);
    }
  };

  const handleDeleteAd = (idxToDelete) => {
    if (confirm('Are you sure you want to remove this advertisement image?')) {
      const updatedAds = activeAds.filter((_, idx) => idx !== idxToDelete);
      saveAdsMutation.mutate(updatedAds);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      banner_url: bannerUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=300',
      description,
      is_published: isPublished,
      show_in_mega_menu: showInMegaMenu
    });
  };

  const handleEditClick = (col) => {
    setEditingId(col.id);
    setEditName(col.name);
    setEditBannerUrl(col.banner_url || '');
    setEditDescription(col.description || '');
    setEditPublished(!!col.is_published);
    setEditShowInMegaMenu(!!col.is_published && col.show_in_mega_menu !== false);
  };

  const handleUpdateSubmit = (id) => {
    updateMutation.mutate({
      id,
      payload: {
        name: editName,
        banner_url: editBannerUrl,
        description: editDescription,
        is_published: editPublished,
        show_in_mega_menu: editShowInMegaMenu
      }
    });
  };

  const handleMegaMenuToggle = (col) => {
    updateMutation.mutate({
      id: col.id,
      payload: {
        name: col.name,
        banner_url: col.banner_url,
        description: col.description,
        is_published: col.show_in_mega_menu === false ? true : !!col.is_published,
        show_in_mega_menu: col.show_in_mega_menu === false
      }
    });
  };

  const handleDelete = (id, label) => {
    if (confirm(`Delete collection "${label}"? Products in it will not be deleted.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenLinkModal = (col) => {
    setLinkingCollection(col);
    // Pre-fill active checks
    const activeIds = col.products ? col.products.map(p => p.id) : [];
    setSelectedProductIds(activeIds);
  };

  const handleOpenCategoryLinkModal = (col) => {
    setLinkingCollectionCategories(col);
    // Pre-fill active checks
    const activeIds = col.categories ? col.categories.map(c => c.id) : [];
    setSelectedCategoryIds(activeIds);
  };

  const toggleProductSelect = (prodId) => {
    if (selectedProductIds.includes(prodId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== prodId));
    } else {
      setSelectedProductIds([...selectedProductIds, prodId]);
    }
  };

  const toggleCategorySelect = (catId) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Collections / Lookbooks</h2>
          <p className="text-xs text-gray-405 mt-1 font-semibold">Organize catalog items into social storefront collections (e.g. Office Wear, Weekend Drop).</p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {/* CREATE FORM */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} className="bg-white border border-gray-250 p-5 rounded-xl flex flex-col gap-4 max-w-xl shadow-sm">
          <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider">Create Curated Collection</h3>
          <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Collection Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Weekend Lookbook"
                value={name}
                onChange={e => setName(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Description</label>
              <textarea
                placeholder="e.g. Clean silhouettes and warm earthy tones for mid-season styling."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none min-h-[60px]"
              />
            </div>

            <ImageUploadField
              label="Banner Image"
              value={bannerUrl}
              onChange={setBannerUrl}
              aspect="banner"
              hint="Wide banner image shown at the top of the collection."
            />

          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-650 font-semibold mt-1">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => {
                setIsPublished(e.target.checked);
                if (!e.target.checked) setShowInMegaMenu(false);
              }}
              className="rounded border-gray-300 text-primary w-4.5 h-4.5"
            />
            Publish collection instantly on storefront
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-700">
            <span>Show in Shop Catalog mega menu</span>
            <input
              type="checkbox"
              checked={showInMegaMenu}
              onChange={e => {
                setShowInMegaMenu(e.target.checked);
                if (e.target.checked) setIsPublished(true);
              }}
              className="rounded border-gray-300 text-primary w-4.5 h-4.5"
            />
          </label>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm">Save Collection</button>
          </div>
        </form>
      )}

      {/* MEGA MENU ADVERTISEMENTS PANEL */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="font-serif font-bold text-base text-gray-900">Mega Menu Advertisement Banners</h3>
          <p className="text-xs text-gray-400 mt-0.5">Upload sliding promotional banner images displayed on the storefront shop catalog navigation panel.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {activeAds.map((adUrl, idx) => (
            <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-150 group">
              <img loading="lazy" decoding="async" src={adUrl} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDeleteAd(idx)}
                  className="p-1.5 bg-red-650 hover:bg-red-750 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add Ad Button card */}
          <label className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all aspect-[3/4]">
            {uploadingAd ? (
              <span className="text-xs text-gray-450 animate-pulse font-medium">Uploading...</span>
            ) : (
              <>
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-[10px] text-gray-450 mt-1.5 font-bold uppercase">Add Banner</span>
              </>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleAdUpload} disabled={uploadingAd} />
          </label>
        </div>
      </div>

      {/* COLLECTIONS LIST GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col) => {
          const isEditing = col.id === editingId;
          const itemsCount = col.products ? col.products.length : 0;

          return (
            <div key={col.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
              
              {/* Banner visual */}
              <div className="h-32 bg-gray-150 relative">
                <img loading="lazy" decoding="async" src={col.banner_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=300'} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                  <span className="text-white text-xs font-bold bg-primary px-2.5 py-0.5 rounded-full">
                    {itemsCount} pieces linked
                  </span>
                </div>
              </div>

              {/* Editing logic inline */}
              <div className="p-5 flex-1 flex flex-col gap-4 justify-between">
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-250 rounded text-xs bg-white focus:outline-none"
                    />
                    <textarea
                      placeholder="Collection description"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-250 rounded text-xs bg-white focus:outline-none min-h-[60px]"
                    />
                    <ImageUploadField
                      label="Banner Image"
                      value={editBannerUrl}
                      onChange={setEditBannerUrl}
                      aspect="banner"
                      hint="Upload a new banner or keep the current one."
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                      <input type="checkbox" checked={editPublished} onChange={e => {
                        setEditPublished(e.target.checked);
                        if (!e.target.checked) setEditShowInMegaMenu(false);
                      }} className="rounded" />
                      Published on storefront
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                      <input type="checkbox" checked={editShowInMegaMenu} onChange={e => {
                        setEditShowInMegaMenu(e.target.checked);
                        if (e.target.checked) setEditPublished(true);
                      }} className="rounded" />
                      Show in Shop Catalog mega menu
                    </label>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-serif font-bold text-gray-900 text-base">{col.name}</h3>
                    {col.description && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-3 leading-relaxed">{col.description}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2">Slug: <span className="font-mono">{col.slug}</span></p>
                    <span className={`inline-block mt-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      col.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {col.is_published ? 'ACTIVE' : 'DRAFT'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMegaMenuToggle(col)}
                      disabled={updateMutation.isPending}
                      className={`ml-2 inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border transition-colors ${
                        col.is_published && col.show_in_mega_menu !== false
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${col.is_published && col.show_in_mega_menu !== false ? 'bg-primary' : 'bg-gray-300'}`} />
                      {col.is_published && col.show_in_mega_menu !== false ? 'IN MEGA MENU' : 'HIDDEN FROM MENU'}
                    </button>
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex gap-2 items-center justify-between border-t border-gray-50 pt-4 mt-2">
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleUpdateSubmit(col.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold rounded flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 border border-gray-200 text-gray-700 text-[10px] font-semibold rounded flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(col)}
                          className="px-3 py-1.5 border border-gray-200 text-gray-700 text-[10px] font-semibold rounded flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleOpenLinkModal(col)}
                          className="px-3 py-1.5 bg-primary text-white text-[10px] font-semibold rounded flex items-center gap-1 shadow-sm"
                        >
                          🔗 Link Products
                        </button>
                        <button
                          onClick={() => handleOpenCategoryLinkModal(col)}
                          className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-semibold rounded flex items-center gap-1 shadow-sm"
                        >
                          📁 Link Categories
                        </button>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => handleDelete(col.id, col.name)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* LINK PRODUCTS MODAL */}
      {linkingCollection && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 relative max-h-[85vh]">
            <button
              onClick={() => setLinkingCollection(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">Link Products to "{linkingCollection.name}"</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Select from current ecommerce catalog items to sync lookbook listings.</p>
            </div>

            {/* List products with checkboxes */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[50vh]">
              {products.map((prod) => {
                const isSelected = selectedProductIds.includes(prod.id);

                return (
                  <label
                    key={prod.id}
                    className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer text-xs transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-150 hover:bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProductSelect(prod.id)}
                      className="rounded border-gray-300 text-primary w-4.5 h-4.5"
                    />
                    <div className="w-8 h-8 rounded bg-gray-50 overflow-hidden shrink-0">
                      <img loading="lazy" decoding="async" src={prod.images?.[0]?.image_url || '/images/products/placeholder.jpg'} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 block">{prod.name}</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">{currencySymbol}{parseFloat(prod.price).toLocaleString()}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end border-t border-gray-50 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setLinkingCollection(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => syncProductsMutation.mutate({ id: linkingCollection.id, productIds: selectedProductIds })}
                className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save Mappings
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LINK CATEGORIES MODAL */}
      {linkingCollectionCategories && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 relative max-h-[85vh]">
            <button
              onClick={() => setLinkingCollectionCategories(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">Link Categories to "{linkingCollectionCategories.name}"</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Select from active categories to display under this collection in the mega menu.</p>
            </div>

            {/* List categories with checkboxes */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[50vh]">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);

                return (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer text-xs transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-150 hover:bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategorySelect(cat.id)}
                      className="rounded border-gray-300 text-primary w-4.5 h-4.5"
                    />
                    <div className="w-8 h-8 rounded bg-gray-50 overflow-hidden shrink-0">
                      <img loading="lazy" decoding="async" src={cat.image_url || '/images/categories/placeholder.jpg'} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 block">{cat.name}</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">Slug: {cat.slug}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end border-t border-gray-50 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setLinkingCollectionCategories(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => syncCategoriesMutation.mutate({ id: linkingCollectionCategories.id, categoryIds: selectedCategoryIds })}
                className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save Mappings
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
