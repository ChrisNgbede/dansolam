import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Edit, Save, X, FolderPlus, Link as LinkIcon, Folder,
  Check, ArrowUpRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Image as ImageIcon, Layers, HeartHandshake, Eye, EyeOff, Loader2,
  RefreshCw, Sliders, SlidersHorizontal, Tag, Type, Search, AlertCircle, Upload,
  Target, Compass, Droplets, Package
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import ImageUploadField from '../../components/ui/ImageUploadField';

const CONCERN_FILTER_TYPES = [
  { value: 'category', label: 'Categories' },
  { value: 'collection', label: 'Collections' },
  { value: 'products', label: 'Hand-picked products' },
];

/**
 * Chooses which products a Shop-by-concern card shows. The storefront links the
 * card to /shop?concern=<slug> and counts matching products live.
 */
function ConcernFilterPicker({ item, categories, collections, products, onChange }) {
  const [query, setQuery] = useState('');
  const type = item.filter_type || 'category';
  const selected = (item.filter_values || []).map(String);

  const rawOptions = type === 'products'
    ? products.map((p) => ({ value: String(p.id), label: p.name }))
    : (type === 'collection' ? collections : categories).map((c) => ({
        value: c.slug,
        label: `${c.name}${c.products_count !== undefined ? ` (${c.products_count})` : ''}`,
      }));

  const options = rawOptions.filter((o) => !query || o.label.toLowerCase().includes(query.toLowerCase()));

  const toggle = (value) => onChange({
    filter_values: selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider">
          Products in this card
        </label>
        <span className="text-[9px] font-bold text-gray-400">
          {selected.length} {type === 'products' ? 'products' : type === 'collection' ? 'collections' : 'categories'}
        </span>
      </div>

      {/* Segmented Tab Selector */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200/80 dark:border-white/10">
        {CONCERN_FILTER_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setQuery('');
              onChange({ filter_type: t.value, filter_values: [] });
            }}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              type === t.value
                ? 'bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#EC268F] shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter / Search Bar (shows when items > 4 or in products mode) */}
      {(type === 'products' || rawOptions.length > 4) && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${type}...`}
            className="w-full pl-8 pr-7 py-1.5 border border-gray-200 dark:border-white/10 rounded-xl text-[11px] bg-gray-50/60 dark:bg-white/5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#1E1528] focus:outline-none focus:border-[#5D3E85] focus:ring-1 focus:ring-[#5D3E85]/30 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Chips Container */}
      <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 p-2 border border-gray-200/80 dark:border-white/10 rounded-2xl bg-gray-50/60 dark:bg-white/5 scrollbar-thin">
        {options.length === 0 && (
          <span className="text-[11px] text-gray-400 py-1 px-1">
            {query ? 'No matching items found.' : 'Nothing to choose yet.'}
          </span>
        )}
        {options.map((o) => {
          const isSelected = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 text-left ${
                isSelected
                  ? 'bg-[#5D3E85] border-[#5D3E85] text-white shadow-xs'
                  : 'bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#5D3E85]/50 hover:bg-[#5D3E85]/5'
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 shrink-0" />}
              <span className="truncate max-w-[180px]">{o.label}</span>
            </button>
          );
        })}
      </div>

      {/* Live Status Feedback Banner */}
      <div className="mt-0.5">
        {selected.length > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {selected.length} {type === 'products' ? 'products' : type === 'collection' ? 'collections' : 'categories'} selected · live on storefront
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
            <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Select at least one, or this card will stay hidden on the storefront.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCollections() {
  const currencySymbol = getCurrencySymbol();
  const queryClient = useQueryClient();

  // Active View Tab
  const [activeTab, setActiveTab] = useState('collections'); // 'collections' | 'concerns'

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

  // ─── SHOP BY CONCERN ("Start where your skin is") CONFIGURATION STATES ───
  const [concernShow, setConcernShow] = useState(true);
  const [concernEyebrow, setConcernEyebrow] = useState('Shop by concern');
  const [concernTitle, setConcernTitle] = useState('Start where your skin is');
  const [concernItems, setConcernItems] = useState([]);

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

  // Fetch ecommerce settings for mega menu ads banner & shop by concern
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-admin-collections'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json())
  });

  const collections = collectionsRes?.data || [];
  const products = productsRes?.data || [];
  const categories = categoriesRes?.data || [];
  const settings = settingsRes?.data?.settings || {};

  // Synchronize concern settings from database
  useEffect(() => {
    if (settingsRes?.data?.settings) {
      const s = settingsRes.data.settings;
      if (s.shop_by_concern_show !== undefined) {
        setConcernShow(s.shop_by_concern_show === 'true' || s.shop_by_concern_show === true);
      }
      if (s.shop_by_concern_eyebrow) setConcernEyebrow(s.shop_by_concern_eyebrow);
      if (s.shop_by_concern_title) setConcernTitle(s.shop_by_concern_title);
      if (s.shop_by_concern_items) {
        try {
          const parsed = typeof s.shop_by_concern_items === 'string'
            ? JSON.parse(s.shop_by_concern_items)
            : s.shop_by_concern_items;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConcernItems(parsed);
          }
        } catch (e) {}
      }
    }
  }, [settingsRes]);

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
        systemToast.success('Collection created successfully! ✨');
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
        systemToast.success('Collection updated successfully! ✨');
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
        systemToast.success('Collection deleted.');
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
        systemToast.success('Products linked to collection!');
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
        systemToast.success('Categories linked to collection!');
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
        systemToast.success('Mega menu promotional ads updated! ✨');
      } else {
        systemToast.error('Failed to save banners');
      }
    }
  });

  // Save Concern Settings Mutation
  const saveConcernMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        systemToast.success('Shop by Concern ("Start where your skin is") settings saved successfully! ✨');
        queryClient.invalidateQueries(['settings-admin-collections', 'settings']);
      } else {
        systemToast.error(data.message || 'Failed to save settings');
      }
    }
  });

  const handleSaveConcernSettings = () => {
    saveConcernMutation.mutate({
      shop_by_concern_show: concernShow ? 'true' : 'false',
      shop_by_concern_eyebrow: concernEyebrow,
      shop_by_concern_title: concernTitle,
      shop_by_concern_items: JSON.stringify(concernItems)
    });
  };

  const handleAddConcernCard = () => {
    const newId = Date.now();
    const newCard = {
      id: newId,
      name: '',
      blurb: '',
      image: '',
      filter_type: 'category',
      filter_values: [],
    };
    setConcernItems([...concernItems, newCard]);
  };

  const handleRemoveConcernCard = (id) => {
    setConcernItems(concernItems.filter(c => c.id !== id));
  };

  const handleUpdateConcernCard = (id, field, value) => {
    setConcernItems(concernItems.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleMoveConcernCard = (index, direction) => {
    const nextItems = [...concernItems];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= nextItems.length) return;
    const temp = nextItems[index];
    nextItems[index] = nextItems[targetIdx];
    nextItems[targetIdx] = temp;
    setConcernItems(nextItems);
  };

  const [uploadingCardId, setUploadingCardId] = useState(null);

  const handleCardImageFile = async (cardId, file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      systemToast.error('Only JPEG, PNG, WebP or GIF images are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      systemToast.error('Image must be under 10 MB.');
      return;
    }

    setUploadingCardId(cardId);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiFetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        handleUpdateConcernCard(cardId, 'image', data.url);
        systemToast.success('Card cover updated! ✨');
      } else {
        systemToast.error(data.message || 'Image upload failed');
      }
    } catch {
      systemToast.error('Upload failed. Please check network.');
    } finally {
      setUploadingCardId(null);
    }
  };

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
        const newAds = [...activeAds, { image_url: data.url, link: '/shop', title: 'New Arrival Promo' }];
        saveAdsMutation.mutate(newAds);
      } else {
        systemToast.error(data.message || 'Image upload failed');
      }
    } catch (err) {
      systemToast.error('Upload failed. Please check network.');
    } finally {
      setUploadingAd(false);
    }
  };

  const handleDeleteAd = (index) => {
    const newAds = activeAds.filter((_, i) => i !== index);
    saveAdsMutation.mutate(newAds);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({
      name,
      banner_url: bannerUrl,
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
    const nextPublished = !col.is_published ? true : col.is_published;
    const nextMegaMenu = col.is_published && col.show_in_mega_menu !== false ? false : true;

    updateMutation.mutate({
      id: col.id,
      payload: {
        name: col.name,
        banner_url: col.banner_url,
        description: col.description,
        is_published: nextPublished,
        show_in_mega_menu: nextMegaMenu
      }
    });
  };

  const handleDelete = (id, colName) => {
    if (confirm(`Are you sure you want to delete collection "${colName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenLinkModal = (col) => {
    setLinkingCollection(col);
    const existingIds = col.products ? col.products.map(p => p.id) : [];
    setSelectedProductIds(existingIds);
  };

  const handleOpenCategoryLinkModal = (col) => {
    setLinkingCollectionCategories(col);
    const existingIds = col.categories ? col.categories.map(c => c.id) : [];
    setSelectedCategoryIds(existingIds);
  };

  const toggleProductSelect = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const toggleCategorySelect = (id) => {
    if (selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(cid => cid !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#5D3E85]" />
        <span>Loading Collections & Concerns Studio...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-none text-left">
      
      {/* ─── 1. PAGE HEADER & TAB SWITCHER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-6 text-left">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white leading-tight">
              Collections & Concerns Studio
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
            Manage catalog collections, storefront "Shop by Concern" showcases, and mega menu promos.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 p-1.5 rounded-full border border-gray-200 dark:border-white/10 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'collections'
                ? 'bg-[#5D3E85] text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Catalog Collections ({collections.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('concerns')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'concerns'
                ? 'bg-[#EC268F] text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Shop by Concern ("Start where your skin is")</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── TAB 2: SHOP BY CONCERN ("Start where your skin is") ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'concerns' && (
        <div className="flex flex-col gap-6 animate-fade-in text-left">
          
          {/* Main Controls Card */}
          <div className="bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6 relative overflow-hidden">
            {/* Subtle brand top accent bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#5D3E85] via-[#EC268F] to-[#5D3E85]" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EC268F]/10 border border-[#EC268F]/20 text-[#EC268F] text-[10px] font-black uppercase tracking-widest mb-2">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Storefront Section Configuration</span>
                </div>
                <h3 className="font-extrabold text-gray-950 dark:text-white text-xl md:text-2xl tracking-tight">
                  "Start where your skin is" Showcase Manager
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium max-w-2xl">
                  Configure every detail (eyebrow, heading, cards, images, blurbs, and product links) of the homepage skin concern studio.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleAddConcernCard}
                  className="px-4 py-2.5 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 text-gray-800 dark:text-white border border-gray-300 dark:border-white/20 text-xs font-black rounded-full flex items-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer btn-spring hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-[#5D3E85] dark:text-[#EC268F]" />
                  <span>+ Add Concern Card</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConcernSettings}
                  disabled={saveConcernMutation.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#5D3E85] to-[#EC268F] hover:from-[#4D326F] hover:to-[#D81B7F] !text-white text-white text-xs font-black rounded-full flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer btn-spring disabled:opacity-50"
                  style={{ color: '#ffffff' }}
                >
                  {saveConcernMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin !text-white text-white" />
                      <span className="!text-white text-white font-black">Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 !text-white text-white" />
                      <span className="!text-white text-white font-black">Save All Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Section Heading & Visibility Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#EC268F]" />
                  <span>Section Eyebrow Label</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={concernEyebrow}
                    onChange={e => setConcernEyebrow(e.target.value)}
                    placeholder="e.g. Shop by concern"
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/15 rounded-xl text-xs bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#1E1528] focus:outline-none focus:border-[#5D3E85] focus:ring-2 focus:ring-[#5D3E85]/20 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3 text-[#5D3E85]" />
                  <span>Main Section Headline</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={concernTitle}
                    onChange={e => setConcernTitle(e.target.value)}
                    placeholder="e.g. Start where your skin is"
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-white/15 rounded-xl text-xs bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#1E1528] focus:outline-none focus:border-[#5D3E85] focus:ring-2 focus:ring-[#5D3E85]/20 font-extrabold transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 justify-center">
                <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3 h-3 text-[#5D3E85]" />
                  <span>Storefront Visibility</span>
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={concernShow}
                    onClick={() => setConcernShow(!concernShow)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      concernShow ? 'bg-[#5D3E85]' : 'bg-gray-300 dark:bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        concernShow ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${concernShow ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${concernShow ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    {concernShow ? 'Displaying on Homepage' : 'Hidden from Homepage'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Cards Studio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {concernItems.map((item, index) => {
              const isUploadingThis = uploadingCardId === item.id;

              return (
                <div
                  key={item.id || index}
                  className="bg-white dark:bg-[#1E1528] border border-gray-200/90 dark:border-white/15 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Image & Actions Header */}
                  <div className="relative aspect-square bg-gray-100 dark:bg-white/5 overflow-hidden select-none">
                    {item.image ? (
                      <>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Custom cover badge */}
                        <div className="absolute bottom-3 left-3 bg-[#5D3E85]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                          <ImageIcon className="w-3 h-3" />
                          <span>Custom Cover</span>
                        </div>
                        {/* Quick change/remove overlay actions */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                          <label
                            className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-gray-900 text-[10px] font-bold shadow-md cursor-pointer flex items-center gap-1 transition-all"
                            title="Upload replacement cover"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Change</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => handleCardImageFile(item.id, e.target.files[0])}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleUpdateConcernCard(item.id, 'image', '')}
                            className="p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white shadow-md cursor-pointer transition-all"
                            title="Remove custom cover (reverts to auto-collage)"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#F8F2F8] via-[#FAF5FB] to-[#ECE3EE] dark:from-[#251833] dark:to-[#170E22]">
                        {/* 4-item mini collage preview */}
                        <div className="grid grid-cols-2 gap-1.5 w-24 h-24 mb-2.5 opacity-75">
                          <div className="rounded-lg bg-white/70 dark:bg-white/10 border border-purple-200/50 dark:border-white/10 flex items-center justify-center">
                            <Droplets className="w-3.5 h-3.5 text-[#5D3E85]/70 dark:text-[#EC268F]/70" />
                          </div>
                          <div className="rounded-lg bg-white/70 dark:bg-white/10 border border-purple-200/50 dark:border-white/10 flex items-center justify-center">
                            <ImageIcon className="w-3.5 h-3.5 text-[#5D3E85]/70 dark:text-[#EC268F]/70" />
                          </div>
                          <div className="rounded-lg bg-white/70 dark:bg-white/10 border border-purple-200/50 dark:border-white/10 flex items-center justify-center">
                            <Layers className="w-3.5 h-3.5 text-[#5D3E85]/70 dark:text-[#EC268F]/70" />
                          </div>
                          <div className="rounded-lg bg-white/70 dark:bg-white/10 border border-purple-200/50 dark:border-white/10 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5 text-[#5D3E85]/70 dark:text-[#EC268F]/70" />
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#5D3E85] dark:text-[#EC268F] bg-white/80 dark:bg-white/10 px-2.5 py-0.5 rounded-full shadow-xs mb-1">
                          Storefront Auto-Collage
                        </span>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium max-w-[190px] leading-tight mb-2.5">
                          Live 4-photo collage generated from selected products.
                        </p>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-white/15 hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] text-gray-800 dark:text-white text-[10px] font-black border border-gray-200 dark:border-white/15 shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95">
                          <Upload className="w-3 h-3" />
                          <span>Upload Cover</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => handleCardImageFile(item.id, e.target.files[0])}
                          />
                        </label>
                      </div>
                    )}

                    {/* Uploading Overlay */}
                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                        <Loader2 className="w-6 h-6 animate-spin text-[#5D3E85] dark:text-[#EC268F]" />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Uploading Cover...</span>
                      </div>
                    )}

                    {/* Top Floating Glassmorphism Toolbar */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 z-10 bg-white/90 dark:bg-black/75 backdrop-blur-md p-1 rounded-full shadow-md border border-gray-200/60 dark:border-white/20">
                      <button
                        type="button"
                        onClick={() => handleMoveConcernCard(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/20 text-gray-700 dark:text-white text-xs disabled:opacity-30 cursor-pointer transition-colors"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveConcernCard(index, 1)}
                        disabled={index === concernItems.length - 1}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/20 text-gray-700 dark:text-white text-xs disabled:opacity-30 cursor-pointer transition-colors"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-3 bg-gray-300 dark:bg-white/20" />
                      <button
                        type="button"
                        onClick={() => handleRemoveConcernCard(item.id)}
                        className="p-1 rounded-full hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs cursor-pointer transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Card Index Badge */}
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                      Card #{index + 1}
                    </div>
                  </div>

                  {/* Form Fields for this card */}
                  <div className="p-5 flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider flex items-center justify-between">
                        <span>Card Title</span>
                        <span className="text-[9px] text-gray-400 font-normal">Shown on storefront</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => handleUpdateConcernCard(item.id, 'name', e.target.value)}
                        placeholder="e.g. Brightening & Glow"
                        className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 rounded-xl text-xs bg-gray-50/60 dark:bg-white/5 text-gray-900 dark:text-white font-extrabold focus:bg-white dark:focus:bg-[#1E1528] focus:border-[#5D3E85] focus:ring-2 focus:ring-[#5D3E85]/20 transition-all placeholder:font-normal"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider flex items-center justify-between">
                        <span>Blurb / Description</span>
                        <span className="text-[9px] text-gray-400 font-normal">Formula focus</span>
                      </label>
                      <textarea
                        value={item.blurb}
                        onChange={e => handleUpdateConcernCard(item.id, 'blurb', e.target.value)}
                        placeholder="Target dullness, restore luminosity, and fade uneven pigmentation naturally..."
                        className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 rounded-xl text-xs bg-gray-50/60 dark:bg-white/5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#1E1528] focus:border-[#5D3E85] focus:ring-2 focus:ring-[#5D3E85]/20 transition-all h-20 resize-none leading-relaxed"
                      />
                    </div>

                    <ConcernFilterPicker
                      item={item}
                      categories={categories}
                      collections={collections}
                      products={products}
                      onChange={(patch) => setConcernItems((items) => items.map((c) => (c.id === item.id ? { ...c, ...patch } : c)))}
                    />

                    {/* Compact Image Upload Control */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                      <ImageUploadField
                        label="Custom Card Photo (Optional)"
                        hint="Overrides auto-collage"
                        value={item.image || ''}
                        aspect="compact"
                        onChange={(url) => handleUpdateConcernCard(item.id, 'image', url)}
                      />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── TAB 1: CATALOG COLLECTIONS & MEGA MENU ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'collections' && (
        <div className="flex flex-col gap-8 animate-fade-in text-left">
          
          {/* Header Action / Create trigger */}
          <div className="flex justify-between items-center text-left">
            <div>
              <h3 className="font-extrabold text-xl text-gray-950 dark:text-white">Active Catalog Collections</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Collections group your skincare formulas and display in the navigation mega menu.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2.5 bg-[#5D3E85] hover:bg-[#4D326F] text-white text-xs font-black rounded-full flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer btn-spring"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{showCreateForm ? 'Close Form' : '+ New Collection'}</span>
            </button>
          </div>

          {/* CREATE FORM COLLAPSIBLE */}
          {showCreateForm && (
            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5 text-left animate-fade-in">
              <h3 className="font-extrabold text-base text-gray-950 dark:text-white border-b border-gray-100 dark:border-white/10 pb-3">Create New Collection</h3>
              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Collection Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Glowing Face Formulas"
                      className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="e.g. Handcrafted serums and brightening soaps..."
                      className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85]"
                    />
                  </div>
                </div>

                <ImageUploadField
                  label="Banner Image"
                  value={bannerUrl}
                  onChange={setBannerUrl}
                  aspect="banner"
                  hint="Upload an editorial banner or provide a high resolution image URL."
                />

                <div className="flex flex-wrap gap-4 py-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={e => {
                        setIsPublished(e.target.checked);
                        if (!e.target.checked) setShowInMegaMenu(false);
                      }}
                      className="rounded text-[#5D3E85] w-4 h-4"
                    />
                    Published on storefront
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={showInMegaMenu}
                      onChange={e => {
                        setShowInMegaMenu(e.target.checked);
                        if (e.target.checked) setIsPublished(true);
                      }}
                      className="rounded text-[#5D3E85] w-4 h-4"
                    />
                    Show in Shop Catalog mega menu
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-6 py-2 bg-[#5D3E85] hover:bg-[#4D326F] text-white text-xs font-extrabold rounded-full shadow-md transition-all cursor-pointer btn-spring"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Collection'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MEGA MENU PROMOTIONAL ADS BANNER CARD */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-white/10 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-gray-950 dark:text-white">Shop Catalog Mega Menu Promo Banners</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload rotating promotional banners displayed on the right column of the header menu.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center pt-2">
              {activeAds.map((ad, idx) => (
                <div key={idx} className="relative group w-40 h-28 rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
                  <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteAd(idx)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md cursor-pointer transition-transform hover:scale-110"
                      title="Remove Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <label className="w-40 h-28 border-2 border-dashed border-gray-300 hover:border-[#5D3E85] rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-[#5D3E85]/5 transition-all text-center p-2">
                {uploadingAd ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#5D3E85] font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                  </div>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">+ Add Promo Ad</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleAdUpload} disabled={uploadingAd} />
              </label>
            </div>
          </div>

          {/* COLLECTIONS LIST GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {collections.map((col) => {
              const isEditing = col.id === editingId;
              const itemsCount = col.products ? col.products.length : 0;

              return (
                <div
                  key={col.id}
                  className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  
                  {/* Banner Visual with Gradient Overlay & Badge */}
                  <div className="h-36 bg-gray-900 relative overflow-hidden">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={col.banner_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600'}
                      alt={col.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-between p-4">
                      <span className="text-white text-xs font-black bg-[#5D3E85] px-3.5 py-1 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-300" />
                        <span>{itemsCount} {itemsCount === 1 ? 'product' : 'products'} linked</span>
                      </span>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                        col.is_published ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-200'
                      }`}>
                        {col.is_published ? 'ACTIVE' : 'DRAFT'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body & Editing Form */}
                  <div className="p-6 flex-1 flex flex-col gap-4 justify-between">
                    {isEditing ? (
                      <div className="flex flex-col gap-3 text-left">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase">Collection Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85]"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase">Description</label>
                          <textarea
                            placeholder="Collection editorial description..."
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85] min-h-[60px]"
                          />
                        </div>

                        <ImageUploadField
                          label="Banner Image"
                          value={editBannerUrl}
                          onChange={setEditBannerUrl}
                          aspect="banner"
                          hint="Upload a new banner or keep the current one."
                        />

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">
                          <input
                            type="checkbox"
                            checked={editPublished}
                            onChange={e => {
                              setEditPublished(e.target.checked);
                              if (!e.target.checked) setEditShowInMegaMenu(false);
                            }}
                            className="rounded text-[#5D3E85] w-4 h-4"
                          />
                          Published on storefront
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={editShowInMegaMenu}
                            onChange={e => {
                              setEditShowInMegaMenu(e.target.checked);
                              if (e.target.checked) setEditPublished(true);
                            }}
                            className="rounded text-[#5D3E85] w-4 h-4"
                          />
                          Show in Shop Catalog mega menu
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-sans font-extrabold text-gray-950 dark:text-white text-lg tracking-tight">
                            {col.name}
                          </h3>
                        </div>

                        {col.description ? (
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed font-medium">
                            {col.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No description provided.</p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-md font-bold">
                            /{col.slug}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleMegaMenuToggle(col)}
                            disabled={updateMutation.isPending}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                              col.is_published && col.show_in_mega_menu !== false
                                ? 'bg-[#5D3E85] text-white'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                            }`}
                            title="Click to toggle visibility in navigation mega menu"
                          >
                            <span className={`w-2 h-2 rounded-full ${col.is_published && col.show_in_mega_menu !== false ? 'bg-amber-300 animate-ping' : 'bg-gray-400'}`} />
                            {col.is_published && col.show_in_mega_menu !== false ? 'In mega menu' : 'Hidden from menu'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upgraded High-Contrast Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-white/10 pt-4 mt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateSubmit(col.id)}
                              disabled={updateMutation.isPending}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer btn-spring"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-full border border-gray-300 dark:border-white/15 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditClick(col)}
                              className="px-3.5 py-2 bg-[#5D3E85] hover:bg-[#4D326F] text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer btn-spring"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenLinkModal(col)}
                              className="px-3.5 py-2 bg-[#EC268F] hover:bg-[#C9166F] text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer btn-spring"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span>Link Products</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenCategoryLinkModal(col)}
                              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer btn-spring"
                            >
                              <Folder className="w-3.5 h-3.5" />
                              <span>Link Categories</span>
                            </button>
                          </>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleDelete(col.id, col.name)}
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white rounded-full border border-rose-200 dark:border-rose-900/50 transition-all shadow-xs cursor-pointer hover:scale-110 active:scale-90"
                          title="Delete Collection"
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

        </div>
      )}

      {/* ─── LINK PRODUCTS MODAL ─── */}
      {linkingCollection && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1528] rounded-3xl max-w-lg w-full p-6 flex flex-col gap-5 relative max-h-[85vh] border border-gray-200 dark:border-white/10 text-left">
            <button
              onClick={() => setLinkingCollection(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Link Products to Collection</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select products to associate with <strong className="text-[#5D3E85] dark:text-[#EC268F] font-bold">{linkingCollection.name}</strong></p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96 flex flex-col gap-2 p-1 border border-gray-200 dark:border-white/10 rounded-2xl">
              {products.map(p => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProductSelect(p.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#5D3E85] bg-[#5D3E85]/5 dark:bg-[#5D3E85]/20 text-[#5D3E85] dark:text-[#EC268F] font-bold'
                        : 'border-gray-150 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-[#5D3E85] bg-[#5D3E85] text-white' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="truncate max-w-[280px]">{p.name}</span>
                    </div>
                    <span className="font-mono text-gray-500">{currencySymbol}{p.price}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/10">
              <span className="text-xs text-gray-500 font-bold">{selectedProductIds.length} products selected</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLinkingCollection(null)}
                  className="px-4 py-2 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => syncProductsMutation.mutate({ id: linkingCollection.id, productIds: selectedProductIds })}
                  disabled={syncProductsMutation.isPending}
                  className="px-5 py-2 bg-[#5D3E85] hover:bg-[#4D326F] text-white text-xs font-extrabold rounded-full shadow-md cursor-pointer btn-spring"
                >
                  {syncProductsMutation.isPending ? 'Linking...' : 'Save Product Links'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LINK CATEGORIES MODAL ─── */}
      {linkingCollectionCategories && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1528] rounded-3xl max-w-lg w-full p-6 flex flex-col gap-5 relative max-h-[85vh] border border-gray-200 dark:border-white/10 text-left">
            <button
              onClick={() => setLinkingCollectionCategories(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Link Categories to Collection</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select entire categories to associate with <strong className="text-amber-600 font-bold">{linkingCollectionCategories.name}</strong></p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96 flex flex-col gap-2 p-1 border border-gray-200 dark:border-white/10 rounded-2xl">
              {categories.map(c => {
                const isSelected = selectedCategoryIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCategorySelect(c.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-bold'
                        : 'border-gray-150 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="truncate max-w-[280px]">{c.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">{c.products_count || 0} products</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/10">
              <span className="text-xs text-gray-500 font-bold">{selectedCategoryIds.length} categories selected</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLinkingCollectionCategories(null)}
                  className="px-4 py-2 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => syncCategoriesMutation.mutate({ id: linkingCollectionCategories.id, categoryIds: selectedCategoryIds })}
                  disabled={syncCategoriesMutation.isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-full shadow-md cursor-pointer btn-spring"
                >
                  {syncCategoriesMutation.isPending ? 'Linking...' : 'Save Category Links'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
