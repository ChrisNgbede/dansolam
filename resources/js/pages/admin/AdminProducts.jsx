import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect, useRef } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, FolderTree, X, Check, Loader2, Filter, Star, Tag, Eye, TrendingUp, History, User, Calendar, Zap, Sliders, Upload, Image as ImageIcon, ScanBarcode } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import BarcodePrintModal from '../../components/admin/BarcodePrintModal';

export default function AdminProducts() {
  const currencySymbol = getCurrencySymbol();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);

  // Category and Tag Modal scroll & focus refs
  const catFormRef = useRef(null);
  const catModalContentRef = useRef(null);
  const catNameInputRef = useRef(null);
  const tagFormRef = useRef(null);
  const tagModalContentRef = useRef(null);
  const tagNameInputRef = useRef(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch all products
  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiFetch('/api/admin/products').then(res => res.json())
  });

  const products = productsRes?.data || [];

  // Categories CRUD and Filter states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewingProduct, setViewingProduct] = useState(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState('general');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Category Form state
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catIsVisible, setCatIsVisible] = useState(true);
  const [catActionLoading, setCatActionLoading] = useState(false);
  const [catImageUploading, setCatImageUploading] = useState(false);

  const handleCatImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCatImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    apiFetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        setCatImageUploading(false);
        if (data.success && data.url) {
          setCatImageUrl(data.url);
          systemToast.success('Category image uploaded successfully!');
        } else {
          systemToast.error(data.message || 'Image upload failed');
        }
      })
      .catch(err => {
        setCatImageUploading(false);
        systemToast.error('Failed to upload image');
      });
  };

  // Fetch categories list
  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => apiFetch('/api/admin/categories').then(res => res.json())
  });
  const categories = categoriesRes?.data || [];

  // Product Tags states
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [tagLabelText, setTagLabelText] = useState('');
  const [tagIcon, setTagIcon] = useState('');
  const [tagImageUrl, setTagImageUrl] = useState('');
  const [tagBgColor, setTagBgColor] = useState('#f3f4f6');
  const [tagTextColor, setTagTextColor] = useState('#1f2937');
  const [tagActionLoading, setTagActionLoading] = useState(false);

  // Fetch product tags list
  const { data: tagsRes } = useQuery({
    queryKey: ['admin-product-tags'],
    queryFn: () => apiFetch('/api/admin/product-tags').then(res => res.json())
  });
  const tags = tagsRes?.data || [];

  // Fetch admin metrics for best selling card
  const { data: metricsRes } = useQuery({
    queryKey: ['admin-metrics-products'],
    queryFn: () => apiFetch('/api/admin/metrics').then(res => res.json())
  });
  const bestSellers = metricsRes?.data?.bestSellers || metricsRes?.data?.best_sellers || [];

  // Fetch detailed history for selected product
  const { data: productHistoryRes, isLoading: historyLoading } = useQuery({
    queryKey: ['admin-product-history', viewingProduct?.id],
    queryFn: () => apiFetch(`/api/admin/products/${viewingProduct.id}/history`).then(res => res.json()),
    enabled: !!viewingProduct?.id
  });
  const productHistory = productHistoryRes?.data || { sales_history: [], stock_history: [] };

  // Tag CRUD Mutations
  const createTagMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/product-tags', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setTagActionLoading(false);
      if (data.success) {
        queryClient.invalidateQueries(['admin-product-tags', 'admin-products']);
        resetTagForm();
      } else {
        systemToast.error(data.message || 'Creation failed');
      }
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/product-tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setTagActionLoading(false);
      if (data.success) {
        queryClient.invalidateQueries(['admin-product-tags', 'admin-products']);
        resetTagForm();
      } else {
        systemToast.error(data.message || 'Update failed');
      }
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/product-tags/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-product-tags', 'admin-products']);
      } else {
        systemToast.error(data.message || 'Delete failed');
      }
    }
  });

  const resetTagForm = () => {
    setEditingTag(null);
    setTagName('');
    setTagLabelText('');
    setTagIcon('');
    setTagImageUrl('');
    setTagBgColor('#f3f4f6');
    setTagTextColor('#1f2937');
  };

  const handleTagSubmit = (e) => {
    e.preventDefault();
    setTagActionLoading(true);
    const payload = {
      name: tagName,
      label_text: tagLabelText || tagName,
      icon: tagIcon,
      image_url: tagImageUrl,
      bg_color: tagBgColor,
      text_color: tagTextColor
    };

    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, payload });
    } else {
      createTagMutation.mutate(payload);
    }
  };

  const handleEditTag = (t) => {
    setEditingTag(t);
    setTagName(t.name);
    setTagLabelText(t.label_text || '');
    setTagIcon(t.icon || '');
    setTagImageUrl(t.image_url || '');
    setTagBgColor(t.bg_color || '#f3f4f6');
    setTagTextColor(t.text_color || '#1f2937');

    // Smoothly autoscroll to the edit tag area
    setTimeout(() => {
      if (tagModalContentRef.current) {
        tagModalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (tagFormRef.current) {
        tagFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (tagNameInputRef.current) {
        tagNameInputRef.current.focus();
        tagNameInputRef.current.select?.();
      }
    }, 60);
  };

  const handleDeleteTag = (id, name) => {
    if (confirm(`Are you sure you want to delete product tag "${name}"?`)) {
      deleteTagMutation.mutate(id);
    }
  };

  // Filter products by selected category and status
  const filteredProducts = products.filter(p => {
    if (categoryFilter) {
      const catId = parseInt(categoryFilter);
      const pCats = p.categories && p.categories.length > 0 ? p.categories : (p.category ? [p.category] : []);
      if (!pCats.some(c => c.id === catId)) return false;
    }
    if (statusFilter) {
      if (statusFilter === 'low_stock') {
        if (p.stock_quantity > 3) return false;
      } else {
        if (p.status !== statusFilter) return false;
      }
    }
    return true;
  });

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
    data: filteredProducts,
    defaultPageSize: 10,
    defaultSortField: 'name',
    defaultSortOrder: 'asc',
    searchKeys: ['name', 'category.name', 'price', 'status']
  });

  // Category CRUD Mutations
  const createCatMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setCatActionLoading(false);
      if (data.success) {
        queryClient.invalidateQueries(['admin-categories-list', 'admin-products']);
        resetCatForm();
      } else {
        systemToast.error(data.message || 'Creation failed');
      }
    }
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setCatActionLoading(false);
      if (data.success) {
        queryClient.invalidateQueries(['admin-categories-list', 'admin-products']);
        resetCatForm();
      } else {
        systemToast.error(data.message || 'Update failed');
      }
    }
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-categories-list', 'admin-products']);
      } else {
        systemToast.error(data.message || 'Delete failed');
      }
    }
  });

  const resetCatForm = () => {
    setEditingCategory(null);
    setCatName('');
    setCatParentId('');
    setCatImageUrl('');
    setCatIsVisible(true);
  };

  const handleCatSubmit = (e) => {
    e.preventDefault();
    setCatActionLoading(true);
    const payload = {
      name: catName,
      parent_id: catParentId ? parseInt(catParentId) : null,
      image_url: catImageUrl || null,
      is_visible: catIsVisible
    };

    if (editingCategory) {
      updateCatMutation.mutate({ id: editingCategory.id, payload });
    } else {
      createCatMutation.mutate(payload);
    }
  };

  const handleEditCat = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatParentId(cat.parent_id || '');
    setCatImageUrl(cat.image_url || '');
    setCatIsVisible(!!cat.is_visible);

    // Smoothly autoscroll to the edit category area
    setTimeout(() => {
      if (catModalContentRef.current) {
        catModalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (catFormRef.current) {
        catFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (catNameInputRef.current) {
        catNameInputRef.current.focus();
        catNameInputRef.current.select?.();
      }
    }, 60);
  };

  const handleDeleteCat = (id, name) => {
    if (confirm(`Are you sure you want to delete category "${name}"? Products in this category will be set to Unassigned.`)) {
      deleteCatMutation.mutate(id);
    }
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-products']);
      } else {
        systemToast.error(data.message || 'Deletion failed');
      }
    }
  });

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action will permanently remove all variants and details.`)) {
      deleteMutation.mutate(id);
    }
  };

  // Toggle Featured Mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/products/${id}/featured`, { method: 'PUT' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-products']);
      } else {
        systemToast.error(data.message || 'Failed to toggle featured status');
      }
    }
  });

  const handleToggleFeatured = (id) => {
    toggleFeaturedMutation.mutate(id);
  };

  // Bulk Product selection states
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Barcode Print Studio states
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeProducts, setBarcodeProducts] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle Flash Sale Mutation
  const toggleFlashSaleMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/products/${id}/flash-sale`, { method: 'PUT' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-products']);
        const isAdded = data.data?.is_flash_sale;
        setToast({
          message: isAdded
            ? `"${data.data?.name || 'Product'}" successfully added to Flash Sale! ⚡`
            : `"${data.data?.name || 'Product'}" removed from Flash Sale.`,
          type: 'success'
        });
      } else {
        systemToast.error(data.message || 'Failed to toggle flash sale status');
      }
    }
  });

  const handleToggleFlashSale = (id) => {
    toggleFlashSaleMutation.mutate(id);
  };

  // Bulk Flash Sale Mutation
  const bulkFlashSaleMutation = useMutation({
    mutationFn: ({ ids, is_flash_sale }) => {
      return apiFetch('/api/admin/products/bulk-flash-sale', {
        method: 'POST',
        body: JSON.stringify({ ids, is_flash_sale })
      }).then(res => res.json());
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        const count = selectedProductIds.length;
        setSelectedProductIds([]);
        queryClient.invalidateQueries(['admin-products']);
        setToast({
          message: variables.is_flash_sale
            ? `${count} products successfully added to Flash Sale! ⚡`
            : `${count} products removed from Flash Sale.`,
          type: 'success'
        });
      } else {
        systemToast.error(data.message || 'Failed to update flash sale status');
      }
    }
  });

  const handleBulkFlashSale = (is_flash_sale) => {
    if (selectedProductIds.length === 0) return;
    bulkFlashSaleMutation.mutate({ ids: selectedProductIds, is_flash_sale });
  };

  // Fetch settings for Flash Sale config
  const { data: settingsRes } = useQuery({
    queryKey: ['admin-settings-flash-sale'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json())
  });
  const settings = settingsRes?.data?.settings || {};

  // Global settings modal states
  const [showFlashSaleModal, setShowFlashSaleModal] = useState(false);
  const [flashSaleShow, setFlashSaleShow] = useState(false);
  const [flashSaleBadge, setFlashSaleBadge] = useState('');
  const [flashSaleTitle, setFlashSaleTitle] = useState('');
  const [flashSaleSubtitle, setFlashSaleSubtitle] = useState('');
  const [flashSaleCtaText, setFlashSaleCtaText] = useState('');
  const [flashSaleCtaLink, setFlashSaleCtaLink] = useState('');
  const [flashSaleDiscount, setFlashSaleDiscount] = useState('');
  const [flashSaleEndTime, setFlashSaleEndTime] = useState('');
  const [flashSaleBannerUrl, setFlashSaleBannerUrl] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Sync settings when fetched
  useEffect(() => {
    if (settings) {
      setFlashSaleShow(settings.flash_sale_show === 'true' || settings.flash_sale_show === true);
      setFlashSaleBadge(settings.flash_sale_badge || '⚡ FLASH SALE SPOTLIGHT');
      setFlashSaleTitle(settings.flash_sale_title || 'Signature Organic Skincare Flash Deals');
      setFlashSaleSubtitle(settings.flash_sale_subtitle || 'Exclusive limited-time flash discounts on our bestselling whitening soaps, discoloration oils, and rejuvenating creams.');
      setFlashSaleCtaText(settings.flash_sale_cta_text || 'SHOP FLASH DEALS →');
      setFlashSaleCtaLink(settings.flash_sale_cta_link || '/shop?flash_sale=true');
      setFlashSaleDiscount(settings.flash_sale_discount_percent || '25% OFF');
      setFlashSaleEndTime(settings.flash_sale_end_time || '');
      setFlashSaleBannerUrl(settings.flash_sale_banner_url || '');
    }
  }, [settings]);

  // Update Ecommerce Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-settings-flash-sale']);
        setShowFlashSaleModal(false);
      } else {
        systemToast.error(data.message || 'Failed to update settings');
      }
    }
  });

  const handleSaveFlashSaleSettings = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      flash_sale_show: flashSaleShow ? 'true' : 'false',
      flash_sale_badge: flashSaleBadge,
      flash_sale_title: flashSaleTitle,
      flash_sale_subtitle: flashSaleSubtitle,
      flash_sale_cta_text: flashSaleCtaText,
      flash_sale_cta_link: flashSaleCtaLink,
      flash_sale_discount_percent: flashSaleDiscount,
      flash_sale_end_time: flashSaleEndTime,
      flash_sale_banner_url: flashSaleBannerUrl
    });
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiFetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setFlashSaleBannerUrl(data.url);
      } else {
        systemToast.error(data.message || 'Upload failed');
      }
    } catch {
      systemToast.error('Failed to upload banner image.');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Product Management</h2>
          <p className="text-xs text-gray-400 mt-1">Upload designer items, modify prices, and check sizes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetCatForm();
              setShowCategoryModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-250 shadow-sm transition-all cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-gray-450" />
            Manage Categories
          </button>
          <button
            onClick={() => {
              resetTagForm();
              setShowTagModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-250 shadow-sm transition-all cursor-pointer"
          >
            <Tag className="w-4 h-4 text-gray-450" />
            Manage Tags
          </button>
          <button
            onClick={() => {
              setBarcodeProducts(products);
              setShowBarcodeModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-lg border border-violet-200 shadow-sm transition-all cursor-pointer"
          >
            <ScanBarcode className="w-4 h-4 text-violet-500" />
            Print Barcodes
          </button>
          <button
            onClick={() => setShowFlashSaleModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-705 text-xs font-semibold rounded-lg border border-red-200 shadow-sm transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-red-550 animate-pulse" />
            Configure Flash Sale
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Mini Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-150 p-4 rounded-xl shadow-sm flex items-center gap-4 dark:bg-gray-805">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
            📦
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total Products</span>
            <span className="text-base font-bold text-gray-850 dark:text-white mt-0.5">{products.length} items</span>
          </div>
        </div>
        <div className="bg-white border border-gray-150 p-4 rounded-xl shadow-sm flex items-center gap-4 dark:bg-gray-805">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg shrink-0">
            🔥
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Best Seller</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate mt-1 max-w-[150px] leading-tight" title={bestSellers[0]?.product_name || 'None'}>
              {bestSellers[0]?.product_name || 'None'}
            </span>
          </div>
        </div>
        <div className="bg-white border border-gray-150 p-4 rounded-xl shadow-sm flex items-center gap-4 dark:bg-gray-805">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-505 flex items-center justify-center font-bold text-lg shrink-0">
            ⚠️
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Low/Out of Stock</span>
            <span className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5">
              {products.filter(p => p.stock_quantity <= 3).length} products
            </span>
          </div>
        </div>
        <div className="bg-white border border-gray-150 p-4 rounded-xl shadow-sm flex items-center gap-4 dark:bg-gray-805">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-lg shrink-0">
            ✏️
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Published / Drafts</span>
            <span className="text-[11px] font-bold text-gray-850 dark:text-white mt-1 leading-tight">
              {products.filter(p => p.status === 'published').length} Active / {products.filter(p => p.status === 'draft').length} Drafts
            </span>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products (title, status...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <Filter className="w-3.5 h-3.5 text-gray-450 shrink-0" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none bg-white cursor-pointer text-gray-700 h-[34px] font-medium"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none bg-white cursor-pointer text-gray-700 h-[34px] font-medium"
            >
              <option value="">All Statuses</option>
              <option value="published">Published / Active</option>
              <option value="draft">Drafts</option>
              <option value="low_stock">Low Stock (≤ 3)</option>
            </select>
          </div>
        </div>

        <span className="text-[10px] text-gray-400 font-bold uppercase">
          👑 {filteredCount} catalog items
        </span>
      </div>

      {/* Products Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none">
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-350 text-[#b8860b] focus:ring-[#b8860b] cursor-pointer"
                  />
                </th>
                <th onClick={() => requestSort('name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Product {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('category.name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Category {sortField === 'category.name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('price')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Price {sortField === 'price' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('stock_quantity')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Stock Quantity {sortField === 'stock_quantity' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('is_featured')} className="px-6 py-3 cursor-pointer hover:bg-gray-100 text-center">
                  Featured {sortField === 'is_featured' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('is_flash_sale')} className="px-6 py-3 cursor-pointer hover:bg-gray-100 text-center">
                  Flash Sale {sortField === 'is_flash_sale' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('status')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Status {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((prod) => {
                  const sizes = prod.variants ? [...new Set(prod.variants.map(v => v.size))].filter(Boolean) : [];

                  return (
                    <tr key={prod.id} className="hover:bg-gray-55/20 transition-colors">
                      <td className="px-4 py-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(prod.id)}
                          onChange={() => handleSelectProduct(prod.id)}
                          className="rounded border-gray-350 text-[#b8860b] focus:ring-[#b8860b] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {prod.images?.[0]?.image_url && (
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-55 shrink-0 border border-gray-150">
                              <img loading="lazy" decoding="async" src={prod.images[0].image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-gray-900 block">{prod.name}</span>
                              {prod.tags && prod.tags.map(t => (
                                <span
                                  key={t.id}
                                  style={{ backgroundColor: t.bg_color, color: t.text_color }}
                                  className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase shrink-0"
                                >
                                  {t.icon && <span>{t.icon}</span>}
                                  {t.image_url && <img loading="lazy" decoding="async" src={t.image_url} alt="" className="w-2.5 h-2.5 object-cover rounded-full" />}
                                  <span>{t.label_text || t.name}</span>
                                </span>
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-400 block mt-0.5 font-sans">
                              {sizes.length > 0 ? `Sizes: ${sizes.join(', ')}` : 'One Size'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const cats = prod.categories && prod.categories.length > 0 ? prod.categories : (prod.category ? [prod.category] : []);
                          if (cats.length === 0) return <span className="text-gray-400 italic text-xs">Unassigned</span>;
                          return (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {cats.map(c => (
                                <span key={c.id} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-semibold">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{currencySymbol}{parseFloat(prod.price).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${prod.stock_quantity <= 3 ? 'text-red-500 font-bold' : 'text-gray-650'}`}>
                          {prod.stock_quantity} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(prod.id)}
                          className="focus:outline-none p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer mx-auto block"
                          title={prod.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          <Star className={`w-4 h-4 transition-all ${prod.is_featured
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 hover:text-amber-500'
                            }`} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleFlashSale(prod.id)}
                          className="focus:outline-none p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer mx-auto block"
                          title={prod.is_flash_sale ? 'Remove from Flash Sale' : 'Add to Flash Sale'}
                        >
                          <Zap className={`w-4 h-4 transition-all ${prod.is_flash_sale
                              ? 'fill-amber-500 text-amber-500 font-bold drop-shadow'
                              : 'text-gray-300 hover:text-amber-500'
                            }`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${prod.status === 'published' ? 'bg-green-50 text-green-600' :
                            prod.status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-500'
                          }`}>
                          {(prod.status || 'draft').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setBarcodeProducts([prod]);
                              setShowBarcodeModal(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded transition-all cursor-pointer"
                            title="Print Barcode Label"
                          >
                            <ScanBarcode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setViewingProduct(prod);
                              setActiveHistoryTab('general');
                            }}
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-all cursor-pointer"
                            title="View Product History & Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/admin/products/${prod.id}/edit`}
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-all"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 text-gray-500 hover:text-red-655 hover:bg-red-50 rounded transition-all cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">No products found matching query.</td>
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

      {/* Floating Bulk Actions Bar */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-6 border border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="bg-[#b8860b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {selectedProductIds.length}
            </span>
            <span className="text-xs font-semibold text-gray-300">items selected</span>
          </div>
          <div className="h-4 w-[1px] bg-gray-700" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkFlashSale(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-900 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-gray-900" />
              Add to Flash Sale
            </button>
            <button
              onClick={() => handleBulkFlashSale(false)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-250 hover:text-white text-xs font-bold rounded-lg border border-gray-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
            <button
              onClick={() => {
                const selected = products.filter(p => selectedProductIds.includes(p.id));
                setBarcodeProducts(selected);
                setShowBarcodeModal(true);
              }}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              Print Labels
            </button>
            <button
              onClick={() => setSelectedProductIds([])}
              className="text-xs text-gray-455 hover:text-white transition-colors px-2 py-1 ml-2 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* CATEGORIES CRUD POPUP MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div ref={catModalContentRef} className="bg-white rounded-xl p-6 max-w-5xl w-full shadow-2xl flex flex-col gap-5 border border-gray-100 max-h-[85vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-gray-900 text-lg">Product Categories Manager</h3>
              </div>
              <button
                onClick={() => {
                  resetCatForm();
                  setShowCategoryModal(false);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left Column: Form (Create / Edit) */}
              <div ref={catFormRef} className="md:col-span-2 flex flex-col gap-4 border-r border-gray-100 pr-0 md:pr-6">
                <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider border-b border-gray-50 pb-1.5">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h4>
                <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Category Name</label>
                    <input
                      ref={catNameInputRef}
                      type="text"
                      required
                      value={catName}
                      onChange={e => setCatName(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="e.g. Elegant Jumpsuits"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Parent Category</label>
                    <select
                      value={catParentId}
                      onChange={e => setCatParentId(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white cursor-pointer"
                    >
                      <option value="">Top Level (None)</option>
                      {categories
                        .filter(c => !editingCategory || c.id !== editingCategory.id) // avoid self selection
                        .map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Category Image Upload & Manager */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Category Image / Banner</label>

                    {catImageUrl ? (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                        <img src={catImageUrl} alt="Category Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="p-1.5 bg-white text-gray-800 rounded-full cursor-pointer hover:bg-gray-100 shadow-md" title="Replace Image">
                            <Upload className="w-3.5 h-3.5" />
                            <input type="file" accept="image/*" onChange={handleCatImageUpload} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setCatImageUrl('')}
                            className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-gray-50/50 hover:bg-primary/5 transition-all text-center">
                        {catImageUploading ? (
                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold py-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-[11px] font-semibold text-gray-600">Click to upload category image</span>
                            <span className="text-[9px] text-gray-400">PNG, JPG, WEBP up to 5MB</span>
                            <input type="file" accept="image/*" onChange={handleCatImageUpload} className="hidden" />
                          </>
                        )}
                      </label>
                    )}

                    <input
                      type="text"
                      value={catImageUrl}
                      onChange={e => setCatImageUrl(e.target.value)}
                      placeholder="Or paste image URL..."
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-600 bg-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700 select-none py-1">
                    <input
                      type="checkbox"
                      checked={catIsVisible}
                      onChange={e => setCatIsVisible(e.target.checked)}
                      className="rounded border-gray-300 text-primary w-4.5 h-4.5"
                    />
                    Visible on Storefront
                  </label>

                  <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-50">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={resetCatForm}
                        className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={catActionLoading}
                      className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded shadow-sm flex items-center justify-center gap-1"
                    >
                      {catActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {editingCategory ? 'Save Changes' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Listing Categories */}
              <div className="md:col-span-3 flex flex-col gap-3">
                <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider border-b border-gray-50 pb-1.5">
                  Available Categories ({categories.length})
                </h4>
                <div className="flex flex-col gap-2">
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <div
                        key={cat.id}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-150 hover:bg-gray-55/20 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              className="w-10 h-10 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 border border-gray-250 shrink-0 flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-semibold text-gray-800 truncate">{cat.name}</span>
                            <span className="text-[10px] text-gray-400 truncate">
                              {cat.parent ? `Parent: ${cat.parent.name}` : 'Top Level Category'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Visibility badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${cat.is_visible ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {cat.is_visible ? 'VISIBLE' : 'HIDDEN'}
                          </span>

                          {/* Clickable Products Count - sets filter & closes */}
                          <button
                            onClick={() => {
                              setCategoryFilter(cat.id.toString());
                              setShowCategoryModal(false);
                            }}
                            className="text-[10px] font-bold text-primary hover:underline"
                            title="Filter Products Table by Category"
                          >
                            {cat.products_count || 0} products
                          </button>

                          <div className="flex gap-1.5 border-l border-gray-200 pl-3">
                            <button
                              onClick={() => handleEditCat(cat)}
                              className="p-1 text-gray-500 hover:text-blue-650 hover:bg-blue-50 rounded transition-all"
                              title="Edit Category Properties"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCat(cat.id, cat.name)}
                              className="p-1 text-red-500 hover:text-red-750 hover:bg-red-50 rounded transition-all"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic py-6 text-center">No categories configured yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT TAGS CRUD POPUP MODAL */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div ref={tagModalContentRef} className="bg-white rounded-xl p-6 max-w-5xl w-full shadow-2xl flex flex-col gap-5 border border-gray-100 max-h-[85vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-gray-900 text-lg">Product Tags Manager</h3>
              </div>
              <button
                onClick={() => {
                  resetTagForm();
                  setShowTagModal(false);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form panel */}
              <form ref={tagFormRef} onSubmit={handleTagSubmit} className="md:col-span-5 flex flex-col gap-4 border-r border-gray-100 pr-0 md:pr-6">
                <h4 className="font-serif font-bold text-gray-800 text-sm">
                  {editingTag ? 'Edit Tag Details' : 'Create New Tag'}
                </h4>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Tag Name *</label>
                  <input
                    ref={tagNameInputRef}
                    type="text"
                    required
                    value={tagName}
                    onChange={e => setTagName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g., Flash Sale"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Label Text (defaults to name)</label>
                  <input
                    type="text"
                    value={tagLabelText}
                    onChange={e => setTagLabelText(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g., FLASH SALE"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Icon / Emoji</label>
                    <input
                      type="text"
                      value={tagIcon}
                      onChange={e => setTagIcon(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                      placeholder="e.g., 🔥 or ✨"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Badge Preview</label>
                    <div className="h-8.5 rounded border border-gray-150 bg-gray-50 flex items-center justify-center">
                      <span
                        style={{ backgroundColor: tagBgColor, color: tagTextColor }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase"
                      >
                        {tagIcon && <span>{tagIcon}</span>}
                        {tagImageUrl && <img loading="lazy" decoding="async" src={tagImageUrl} alt="" className="w-3.5 h-3.5 object-cover rounded-full" />}
                        <span>{tagLabelText || tagName || 'PREVIEW'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Badge Image URL (Optional)</label>
                  <input
                    type="text"
                    value={tagImageUrl}
                    onChange={e => setTagImageUrl(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="https://example.com/badge.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Background Color</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={tagBgColor}
                        onChange={e => setTagBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-205 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={tagBgColor}
                        onChange={e => setTagBgColor(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-200 text-[10px] w-20 focus:outline-none focus:border-primary font-mono text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Text Color</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={tagTextColor}
                        onChange={e => setTagTextColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-205 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={tagTextColor}
                        onChange={e => setTagTextColor(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-200 text-[10px] w-20 focus:outline-none focus:border-primary font-mono text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-50">
                  {editingTag && (
                    <button
                      type="button"
                      onClick={resetTagForm}
                      className="px-3 py-1.5 border border-gray-200 text-gray-650 hover:bg-gray-55 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={tagActionLoading}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    {tagActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingTag ? 'Update Tag' : 'Create Tag'}
                  </button>
                </div>
              </form>

              {/* List panel */}
              <div className="md:col-span-7 flex flex-col gap-3">
                <h4 className="font-serif font-bold text-gray-850 text-sm">Configured Tags</h4>
                <div className="border border-gray-150 rounded-lg divide-y divide-gray-100 max-h-96 overflow-y-auto custom-sidebar-scroll bg-white">
                  {tags.length > 0 ? (
                    tags.map(t => (
                      <div key={t.id} className="p-3 flex justify-between items-center gap-3 hover:bg-gray-50/50 transition-all">
                        <div className="flex items-center gap-3">
                          <span
                            style={{ backgroundColor: t.bg_color, color: t.text_color }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase"
                          >
                            {t.icon && <span>{t.icon}</span>}
                            {t.image_url && <img loading="lazy" decoding="async" src={t.image_url} alt="" className="w-3.5 h-3.5 object-cover rounded-full" />}
                            <span>{t.label_text || t.name}</span>
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">({t.name})</span>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEditTag(t)}
                            className="p-1 text-gray-500 hover:text-blue-650 hover:bg-blue-50 rounded transition-all"
                            title="Edit Tag"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(t.id, t.name)}
                            className="p-1 text-red-550 hover:text-red-750 hover:bg-red-50 rounded transition-all"
                            title="Delete Tag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic py-6 text-center">No tags configured yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* VIEW PRODUCT DETAILS & HISTORY MODAL */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in" onClick={() => setViewingProduct(null)}>
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-150 animate-scale-up text-left" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                {viewingProduct.images?.[0]?.image_url && (
                  <img loading="lazy" decoding="async" src={viewingProduct.images[0].image_url} alt="" className="w-12 h-12 rounded object-cover border border-gray-200 shrink-0" />
                )}
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-lg">{viewingProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-medium">SKU: <span className="font-mono">{viewingProduct.sku || 'N/A'}</span></span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Categories: {(() => {
                        const cats = viewingProduct.categories && viewingProduct.categories.length > 0 ? viewingProduct.categories : (viewingProduct.category ? [viewingProduct.category] : []);
                        return cats.length > 0 ? cats.map(c => c.name).join(', ') : 'Unassigned';
                      })()}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${viewingProduct.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {(viewingProduct.status || 'draft').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingProduct(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 gap-4 text-xs font-semibold select-none shrink-0">
              <button
                onClick={() => setActiveHistoryTab('general')}
                className={`pb-2.5 transition-all border-b-2 px-1 cursor-pointer ${activeHistoryTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                General & Variants
              </button>
              <button
                onClick={() => setActiveHistoryTab('sales')}
                className={`pb-2.5 transition-all border-b-2 px-1 cursor-pointer ${activeHistoryTab === 'sales' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                Sales History ({productHistory.sales_history?.length || 0})
              </button>
              <button
                onClick={() => setActiveHistoryTab('stock')}
                className={`pb-2.5 transition-all border-b-2 px-1 cursor-pointer ${activeHistoryTab === 'stock' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                Stock Adjustments ({productHistory.stock_history?.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 min-h-[300px]">
              {historyLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-450 gap-2 font-semibold text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading history data...
                </div>
              ) : (
                <>
                  {activeHistoryTab === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 flex flex-col gap-4">
                        <div>
                          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">Description</h4>
                          <div className="text-xs text-gray-650 leading-relaxed bg-gray-55 p-4 rounded-xl border border-gray-100 max-h-[160px] overflow-y-auto custom-sidebar-scroll">
                            {viewingProduct.description || <span className="italic text-gray-400">No description provided for this product.</span>}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">Variants Details</h4>
                          <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-gray-55 text-gray-550 font-bold uppercase text-[9px] border-b border-gray-150">
                                  <th className="px-4 py-2">Size</th>
                                  <th className="px-4 py-2">Variant SKU</th>
                                  <th className="px-4 py-2">Stock Level</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {viewingProduct.variants?.length > 0 ? (
                                  viewingProduct.variants.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50/20">
                                      <td className="px-4 py-2 font-semibold text-gray-700">{v.size || 'One Size'}</td>
                                      <td className="px-4 py-2 font-mono text-gray-500">{v.sku || 'N/A'}</td>
                                      <td className="px-4 py-2">
                                        <span className={`font-semibold ${v.stock_quantity <= v.low_stock_threshold ? 'text-red-500' : 'text-gray-700'}`}>
                                          {v.stock_quantity} units
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="3" className="px-4 py-4 text-center text-gray-400 italic">No variants details configured.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-55 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                        <h4 className="font-bold text-gray-805 text-xs uppercase tracking-wider">Metrics Summary</h4>
                        <div className="flex flex-col gap-3.5 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-450 block font-medium">Retail Price</span>
                            <strong className="text-gray-900 text-sm mt-0.5 block">{currencySymbol}{parseFloat(viewingProduct.price).toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-455 block font-medium">Total Stock</span>
                            <strong className="text-gray-800 text-sm mt-0.5 block">{viewingProduct.stock_quantity} units</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-455 block font-medium">Featured Status</span>
                            <strong className="text-gray-800 mt-0.5 block">{viewingProduct.is_featured ? '⭐ Featured Item' : 'Standard Item'}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-455 block font-medium">Date Uploaded</span>
                            <strong className="text-gray-800 mt-0.5 block font-mono">{new Date(viewingProduct.created_at).toLocaleDateString()}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeHistoryTab === 'sales' && (
                    <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                      <div className="max-h-[300px] overflow-y-auto custom-sidebar-scroll">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-55 text-gray-550 font-bold uppercase text-[9px] border-b border-gray-150 sticky top-0">
                              <th className="px-4 py-2.5">Order</th>
                              <th className="px-4 py-2.5">Customer</th>
                              <th className="px-4 py-2.5">Date</th>
                              <th className="px-4 py-2.5">Qty</th>
                              <th className="px-4 py-2.5">Price</th>
                              <th className="px-4 py-2.5">Total</th>
                              <th className="px-4 py-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {productHistory.sales_history?.length > 0 ? (
                              productHistory.sales_history.map((s, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/20">
                                  <td className="px-4 py-2.5 font-bold text-gray-750">{s.order_number}</td>
                                  <td className="px-4 py-2.5 font-semibold text-gray-805">
                                    {s.customer_name}
                                    <span className="block text-[9px] text-gray-400 font-normal mt-0.5">{s.customer_email}</span>
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-gray-450">{new Date(s.created_at).toLocaleDateString()}</td>
                                  <td className="px-4 py-2.5 font-semibold text-gray-700">{s.quantity}</td>
                                  <td className="px-4 py-2.5 text-gray-650">{currencySymbol}{parseFloat(s.price).toLocaleString()}</td>
                                  <td className="px-4 py-2.5 font-bold text-gray-850">{currencySymbol}{parseFloat(s.total).toLocaleString()}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${s.status === 'delivered' ? 'bg-green-50 text-green-600' :
                                        s.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                                      }`}>
                                      {s.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-gray-400 italic">No sales logs recorded for this item yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeHistoryTab === 'stock' && (
                    <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                      <div className="max-h-[300px] overflow-y-auto custom-sidebar-scroll">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-55 text-gray-550 font-bold uppercase text-[9px] border-b border-gray-150 sticky top-0">
                              <th className="px-4 py-2.5">Date & Time</th>
                              <th className="px-4 py-2.5">Variant Size</th>
                              <th className="px-4 py-2.5">Action Log</th>
                              <th className="px-4 py-2.5">Adjustment</th>
                              <th className="px-4 py-2.5">New Stock</th>
                              <th className="px-4 py-2.5">Staff User</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {productHistory.stock_history?.length > 0 ? (
                              productHistory.stock_history.map((st, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/20">
                                  <td className="px-4 py-2.5 font-mono text-gray-455">{new Date(st.created_at).toLocaleString()}</td>
                                  <td className="px-4 py-2.5 font-semibold text-gray-750">{st.variant?.size || 'One Size'}</td>
                                  <td className="px-4 py-2.5 text-left">
                                    <span className="font-semibold block text-gray-808">{st.action}</span>
                                    {st.notes && <span className="text-[9px] text-gray-400 block mt-0.5">{st.notes}</span>}
                                  </td>
                                  <td className="px-4 py-2.5 font-bold">
                                    <span className={st.quantity_changed > 0 ? 'text-green-600' : 'text-red-500'}>
                                      {st.quantity_changed > 0 ? `+${st.quantity_changed}` : st.quantity_changed}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 font-bold text-gray-800">{st.new_stock_quantity} units</td>
                                  <td className="px-4 py-2.5 font-medium text-gray-655">{st.user?.name || 'System Seeder'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-400 italic">No manual inventory adjustments logged yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configure Flash Sale Modal */}
      {showFlashSaleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-scale-up">

            {/* Header */}
            <div className="bg-gray-55 border-b border-gray-150 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                <h3 className="font-serif font-bold text-lg text-gray-900">Configure Flash Sale</h3>
              </div>
              <button
                onClick={() => setShowFlashSaleModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFlashSaleSettings}>
              <div className="p-6 flex flex-col gap-4 text-left">

                {/* Toggle Active */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-900">Enable Flash Sale / Spotlight Banner</span>
                    <span className="text-[10px] text-gray-450 mt-0.5">Displays dynamic swiping banner card after the hero section</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={flashSaleShow}
                    onChange={e => setFlashSaleShow(e.target.checked)}
                    className="rounded text-[#b8860b] focus:ring-[#b8860b] w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Badge Tag */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pill Badge Tag</label>
                  <input
                    type="text"
                    value={flashSaleBadge}
                    onChange={e => setFlashSaleBadge(e.target.value)}
                    placeholder="e.g. 👑 EDITORIAL SPOTLIGHT or ⚡ FLASH SALE"
                    className="px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-primary text-xs rounded-lg w-full bg-white text-gray-800 font-medium"
                  />
                </div>

                {/* Flash Sale Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Headline</label>
                  <input
                    type="text"
                    value={flashSaleTitle}
                    onChange={e => setFlashSaleTitle(e.target.value)}
                    placeholder="e.g. Signature Organic Skincare Flash Deals"
                    className="px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-primary text-xs rounded-lg w-full bg-white text-gray-800 font-medium"
                    required
                  />
                </div>

                {/* Subtitle */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Subtitle Description</label>
                  <textarea
                    rows={2}
                    value={flashSaleSubtitle}
                    onChange={e => setFlashSaleSubtitle(e.target.value)}
                    placeholder="e.g. Exclusive limited-time flash discounts on our bestselling whitening soaps and discoloration oils."
                    className="px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-primary text-xs rounded-lg w-full bg-white text-gray-800 font-medium resize-none"
                  />
                </div>

                {/* CTA Text and Link Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CTA Button Text</label>
                    <input
                      type="text"
                      value={flashSaleCtaText}
                      onChange={e => setFlashSaleCtaText(e.target.value)}
                      placeholder="e.g. BOOK SESSION →"
                      className="px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-primary text-xs rounded-lg w-full bg-white text-gray-800 font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CTA Button Link</label>
                    <input
                      type="text"
                      value={flashSaleCtaLink}
                      onChange={e => setFlashSaleCtaLink(e.target.value)}
                      placeholder="e.g. /fitting-sessions or /shop"
                      className="px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-primary text-xs rounded-lg w-full bg-white text-gray-800 font-medium"
                    />
                  </div>
                </div>

                {/* Expiry Datetime & Discount % */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Countdown Timer Ends At</label>
                    <input
                      type="datetime-local"
                      value={flashSaleEndTime}
                      onChange={e => setFlashSaleEndTime(e.target.value)}
                      className="px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-primary text-xs rounded-lg w-full bg-white text-gray-800 font-medium cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Discount Tag (Optional)</label>
                    <input
                      type="text"
                      value={flashSaleDiscount}
                      onChange={e => setFlashSaleDiscount(e.target.value)}
                      placeholder="e.g. 30% OFF or SAVE ₦10,000"
                      className="px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-primary text-xs rounded-lg w-full bg-white text-gray-800 font-medium"
                    />
                  </div>
                </div>

                {/* Banner Upload / URL */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Flash Sale Banner Image</label>

                  {/* Banner Preview & Upload Box */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-all relative group">
                    {flashSaleBannerUrl ? (
                      <div className="w-full relative">
                        <img loading="lazy" decoding="async"
                          src={flashSaleBannerUrl}
                          alt="Banner Preview"
                          className="w-full h-32 object-cover rounded-lg shadow-sm border border-gray-150"
                        />
                        <button
                          type="button"
                          onClick={() => setFlashSaleBannerUrl('')}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 transition-all"
                          title="Remove Image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full py-4">
                        {uploadingBanner ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <>
                            <span className="text-2xl">🖼️</span>
                            <span className="text-[11px] font-bold text-primary group-hover:underline">Upload Banner Image</span>
                            <span className="text-[9px] text-gray-400">PNG, JPG or WEBP up to 2MB</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={uploadingBanner}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Manual URL Input */}
                  <input
                    type="text"
                    value={flashSaleBannerUrl}
                    onChange={e => setFlashSaleBannerUrl(e.target.value)}
                    placeholder="Or enter banner image URL manually"
                    className="px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-primary text-xs rounded-lg w-full bg-white text-gray-800 font-medium"
                  />
                </div>

              </div>

              {/* Actions Footer */}
              <div className="bg-gray-50 border-t border-gray-150 px-6 py-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFlashSaleModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {toast && createPortal(
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white border border-gray-800 rounded-2xl shadow-2xl p-4 z-50 flex items-center gap-3 animate-slide-in max-w-sm w-full">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary fill-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Flash Sale</span>
            <p className="text-xs font-bold text-white mt-1 leading-normal">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}
      {/* BARCODE PRINT STUDIO MODAL */}
      <BarcodePrintModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        products={barcodeProducts}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
