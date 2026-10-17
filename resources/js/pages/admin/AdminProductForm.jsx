import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X, Image as ImageIcon, Weight, Ruler, Palette, ShieldAlert, ChevronDown, Search, Check } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import RichTextEditor from '../../components/ui/RichTextEditor';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { tagIconGlyph } from '../../utils/productDisplay';

export default function AdminProductForm() {
  const currencySymbol = getCurrencySymbol();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  // Basic form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [catSearch, setCatSearch] = useState('');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [status, setStatus] = useState('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('3');
  const [salesOverride, setSalesOverride] = useState('0');

  // Product Attributes (for shipping calculations)
  const [weight, setWeight] = useState('');
  const [colorAttribute, setColorAttribute] = useState('');
  const [widthAttr, setWidthAttr] = useState('');
  const [heightAttr, setHeightAttr] = useState('');
  const [depthAttr, setDepthAttr] = useState('');
  const [material, setMaterial] = useState('');
  const [isFragile, setIsFragile] = useState(false);

  // Multi images state (stores server URLs)
  const [images, setImages] = useState([]);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');
  const imgInputRef = useRef(null);

  // Variants list state
  const [variants, setVariants] = useState([
    { size: 'UK 14', color: 'Black', stock_quantity: 5, price: '' },
    { size: 'UK 16', color: 'Black', stock_quantity: 5, price: '' }
  ]);

  // Tags list state
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Fetch product tags list
  const { data: tagsRes } = useQuery({
    queryKey: ['admin-product-tags-form'],
    queryFn: () => apiFetch('/api/admin/product-tags').then(res => res.json())
  });
  const productTagsList = tagsRes?.data || [];

  // Submit states
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Categories for dropdown
  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories-form'],
    queryFn: () => apiFetch('/api/admin/categories').then(res => res.json())
  });
  const categories = categoriesRes?.data || [];

  // Fetch Product details if Edit
  const { data: editProductRes, isLoading: editLoading } = useQuery({
    queryKey: ['admin-edit-product', id],
    enabled: isEdit,
    queryFn: () => apiFetch(`/api/admin/products`).then(res => res.json())
  });

  // Load product data into state on Edit load
  useEffect(() => {
    if (isEdit && editProductRes?.data) {
      // Find current editing product from the list query
      const prod = editProductRes.data.find(p => p.id === parseInt(id));
      if (prod) {
        setName(prod.name);
        if (prod.categories && prod.categories.length > 0) {
          setSelectedCategoryIds(prod.categories.map(c => c.id));
        } else if (prod.category_id) {
          setSelectedCategoryIds([prod.category_id]);
        } else {
          setSelectedCategoryIds([]);
        }
        setDescription(prod.description || '');
        setShortDescription(prod.short_description || '');
        setPrice(prod.price);
        setSalePrice(prod.sale_price || '');
        setCostPrice(prod.cost_price || '');
        setStatus(prod.status);
        setIsFeatured(!!prod.is_featured);
        setIsNewArrival(!!prod.is_new_arrival);
        setIsBestSeller(!!prod.is_best_seller);
        setHasVariants(!!prod.has_variants);
        setStockQuantity(prod.stock_quantity.toString());
        setLowStockThreshold(prod.low_stock_threshold.toString());
        setSalesOverride((prod.sales_override || 0).toString());
        setSku(prod.sku || '');

        // Load product attributes
        setWeight(prod.weight || '');
        setColorAttribute(prod.color_attribute || '');
        setWidthAttr(prod.width || '');
        setHeightAttr(prod.height || '');
        setDepthAttr(prod.depth || '');
        setMaterial(prod.material || '');
        setIsFragile(!!prod.is_fragile);
        
        if (prod.images && prod.images.length > 0) {
          setImages(prod.images.map(img => img.image_url));
        }

        if (prod.variants && prod.variants.length > 0) {
          setVariants(prod.variants.map(v => ({
            id: v.id,
            size: v.size,
            color: v.color,
            stock_quantity: v.stock_quantity,
            price: v.price || ''
          })));
        }

        if (prod.tags) {
          setSelectedTagIds(prod.tags.map(t => t.id));
        }
      }
    }
  }, [isEdit, editProductRes]);

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleImgFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { setImgError('Only JPEG, PNG, WebP or GIF allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { setImgError('Image must be under 10 MB.'); return; }

    setImgError('');
    setImgUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiFetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImages(prev => [...prev, data.url]);
      } else {
        setImgError(data.message || 'Upload failed.');
      }
    } catch {
      setImgError('Network error uploading image.');
    } finally {
      setImgUploading(false);
    }
  }, []);

  const handleAddVariant = () => {
    setVariants([...variants, { size: 'UK 12', color: 'Black', stock_quantity: 5, price: '' }]);
  };

  const handleRemoveVariant = (idx) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx, key, value) => {
    const nextVariants = [...variants];
    nextVariants[idx][key] = value;
    setVariants(nextVariants);
  };

  const handleAutoGenerateSku = async () => {
    try {
      const res = await apiFetch('/api/admin/products/generate-sku');
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setSku(data.sku);
      } else {
        systemToast.error(data?.message || 'Could not generate a SKU. Please try again.');
      }
    } catch {
      systemToast.error('Network error auto-generating SKU');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');

    const payload = {
      name,
      category_ids: selectedCategoryIds,
      category_id: selectedCategoryIds[0] || null,
      description,
      short_description: shortDescription,
      price: parseFloat(price),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      cost_price: costPrice ? parseFloat(costPrice) : null,
      status,
      is_featured: isFeatured,
      is_new_arrival: isNewArrival,
      is_best_seller: isBestSeller,
      has_variants: hasVariants,
      stock_quantity: hasVariants ? 0 : parseInt(stockQuantity), // backend aggregates variants stock
      low_stock_threshold: parseInt(lowStockThreshold),
      sales_override: parseInt(salesOverride) || 0,
      images,
      variants: hasVariants ? variants : null,
      tag_ids: selectedTagIds,
      sku: sku || null,
      weight: weight ? parseFloat(weight) : null,
      color_attribute: colorAttribute || null,
      width: widthAttr ? parseFloat(widthAttr) : null,
      height: heightAttr ? parseFloat(heightAttr) : null,
      depth: depthAttr ? parseFloat(depthAttr) : null,
      material: material || null,
      is_fragile: isFragile,
    };

    const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setFormLoading(false);

      if (data.success) {
        queryClient.invalidateQueries(['admin-products', 'admin-metrics']);
        systemToast.success(isEdit ? 'Product changes saved successfully.' : 'Product created successfully.');
        navigate('/admin/products');
      } else {
        setErrorMsg(data.message || 'Error processing request.');
      }
    } catch (e) {
      setFormLoading(false);
      setErrorMsg('Server connection failed. Try again.');
    }
  };

  if (isEdit && editLoading) {
    return <div className="animate-pulse bg-white rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors self-start">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Products
      </Link>

      <div>
        <h2 className="font-serif font-bold text-2xl text-gray-900">
          {isEdit ? 'Edit product' : 'Create new product'}
        </h2>
        <p className="text-xs text-gray-400 mt-1">Specify sizing metrics, stock variants, prices, and imagery.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 w-full">
        
        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
              placeholder="e.g. Luxury Velvet Suit Set"
            />
          </div>
          <div className="flex flex-col gap-1.5 relative" ref={catDropdownRef}>
            <label className="text-[10px] text-gray-500 font-semibold uppercase flex items-center justify-between">
              <span>Categories (Multi-Select)</span>
              {selectedCategoryIds.length > 0 && (
                <span className="text-[9px] text-primary font-bold">{selectedCategoryIds.length} selected</span>
              )}
            </label>
            
            <div 
              role="button"
              tabIndex={0}
              aria-haspopup="true"
              aria-expanded={catDropdownOpen}
              aria-label={`Categories: ${selectedCategoryIds.length} selected`}
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCatDropdownOpen(!catDropdownOpen); }
                if (e.key === 'Escape') setCatDropdownOpen(false);
              }}
              className="adm-field-box min-h-10 px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-pointer"
            >
              {selectedCategoryIds.length === 0 ? (
                <span className="text-sm text-gray-400 px-1.5 select-none">Select categories...</span>
              ) : (
                selectedCategoryIds.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  if (!cat) return null;
                  return (
                    <span 
                      key={cat.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200/70 text-xs font-semibold shadow-xs animate-in fade-in zoom-in-95 duration-150"
                    >
                      {cat.image_url && <img loading="lazy" decoding="async" src={cat.image_url} alt="" className="w-3.5 h-3.5 object-cover rounded-full" />}
                      <span>{cat.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== cat.id));
                        }}
                        aria-label={`Remove ${cat.name}`}
                        className="text-amber-700 hover:text-amber-950 p-0.5 rounded-full hover:bg-amber-200/50 cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              )}
              <div className="ml-auto pr-2 text-gray-400 pointer-events-none">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Dropdown Menu */}
            {catDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 flex flex-col">
                <div className="p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={catSearch}
                      onChange={e => setCatSearch(e.target.value)}
                      placeholder="Search categories..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-primary bg-white"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="overflow-y-auto p-1 max-h-48 divide-y divide-gray-50">
                  {categories
                    .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                    .map(cat => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== cat.id));
                            } else {
                              setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50/70 text-amber-900 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          {cat.image_url && <img loading="lazy" decoding="async" src={cat.image_url} alt="" className="w-4 h-4 object-cover rounded-full" />}
                          <span className="flex-1">{cat.name}</span>
                        </div>
                      );
                    })}
                  {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-400 italic">No categories found</div>
                  )}
                </div>
                {selectedCategoryIds.length > 0 && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-medium">{selectedCategoryIds.length} categories assigned</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryIds([])}
                      className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product SKU/Code Option */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-50 pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Product SKU / Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 flex-1"
                placeholder="Leave blank to autogenerate"
              />
              <button
                type="button"
                onClick={handleAutoGenerateSku}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors border border-gray-200 cursor-pointer"
              >
                Auto Generate
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Base Price ({currencySymbol})</label>
            <input
              type="number"
              required
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
              placeholder="e.g. 45000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Sale Price ({currencySymbol}) - Optional</label>
            <input
              type="number"
              value={salePrice}
              onChange={e => setSalePrice(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
              placeholder="e.g. 35000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Cost Price ({currencySymbol}) - Admin Only</label>
            <input
              type="number"
              value={costPrice}
              onChange={e => setCostPrice(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
              placeholder="e.g. 20000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-50 pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Status</label>
            <SearchableSelect
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
              <option value="archived">Archived</option>
            </SearchableSelect>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Sales Count Override</label>
            <input
              type="number"
              value={salesOverride}
              onChange={e => setSalesOverride(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
              placeholder="e.g. 150"
            />
          </div>
          
          {/* Flags checkboxes */}
          <div className="flex items-center gap-4 sm:col-span-1 mt-4 text-xs font-semibold text-gray-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="rounded border-gray-300 text-primary w-4 h-4" />
              Featured
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={isNewArrival} onChange={e => setIsNewArrival(e.target.checked)} className="rounded border-gray-300 text-primary w-4 h-4" />
              New
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={isBestSeller} onChange={e => setIsBestSeller(e.target.checked)} className="rounded border-gray-300 text-primary w-4 h-4" />
              Best
            </label>
          </div>

          {/* Tags list selectors */}
          {productTagsList.length > 0 && (
            <div className="sm:col-span-3 flex flex-col gap-2 mt-3">
              <label className="text-[10px] text-gray-500 font-bold uppercase block">Product Badges / Tags</label>
              <div className="flex gap-2.5 flex-wrap bg-gray-50 p-3 rounded-xl border border-gray-150">
                {productTagsList.map(t => {
                  const active = selectedTagIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      style={{
                        backgroundColor: active ? t.bg_color : 'var(--adm-surface)',
                        color: active ? t.text_color : 'var(--adm-muted)',
                        borderColor: active ? t.bg_color : 'var(--adm-field-border)'
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer select-none transition-all border shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => {
                          if (active) {
                            setSelectedTagIds(selectedTagIds.filter(id => id !== t.id));
                          } else {
                            setSelectedTagIds([...selectedTagIds, t.id]);
                          }
                        }}
                        className="sr-only"
                      />
                      {tagIconGlyph(t.icon) && <span aria-hidden="true">{tagIconGlyph(t.icon)}</span>}
                      {t.image_url && <img loading="lazy" decoding="async" src={t.image_url} alt="" className="w-3.5 h-3.5 object-cover rounded-full" />}
                      <span>{t.label_text || t.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-500 font-semibold uppercase">Short description</label>
          <input
            type="text"
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
            placeholder="e.g. Deep hydrating moisture cream with SPF 50 & botanical extracts."
          />
        </div>

        <RichTextEditor
          label="Long description"
          value={description}
          onChange={setDescription}
          placeholder="Application rituals, active ingredients, skin types, and skincare benefits..."
        />

        {/* PRODUCT IMAGES */}
        <div className="border-t border-gray-50 pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-500 font-semibold uppercase">Product Images</label>
            <span className="text-[9px] text-gray-400">JPEG, PNG, WebP, GIF · max 10 MB each</span>
          </div>

          {/* Thumbnail strip of already uploaded images */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden group">
                  <img loading="lazy" decoding="async" src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 text-center text-[8px] font-bold text-white bg-primary/70 py-0.5">Main</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => !imgUploading && imgInputRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && imgInputRef.current?.click()}
            className={`w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center gap-3 cursor-pointer transition-all
              ${imgUploading ? 'opacity-60 pointer-events-none border-gray-200 bg-gray-50' : 'border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5'}`}
          >
            {imgUploading ? (
              <><Loader2 className="w-5 h-5 animate-spin text-primary" /><span className="text-xs text-gray-500">Uploading...</span></>
            ) : (
              <><Upload className="w-5 h-5 text-gray-400" /><span className="text-xs text-gray-500 font-semibold">Click to add image</span></>
            )}
          </div>

          {imgError && <p className="text-[9px] text-red-500 font-semibold">{imgError}</p>}

          <input
            ref={imgInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleImgFileChange}
          />
        </div>

        {/* PRODUCT ATTRIBUTES (Shipping & Physical) */}
        <div className="border-t border-gray-50 pt-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Weight className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Product Attributes & Dimensions</span>
            <span className="text-[9px] text-gray-400 ml-1">(optional — used for shipping cost calculations)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                placeholder="e.g. 1.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Width (cm)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={widthAttr}
                onChange={e => setWidthAttr(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                placeholder="e.g. 30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Height (cm)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={heightAttr}
                onChange={e => setHeightAttr(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                placeholder="e.g. 20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Depth (cm)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={depthAttr}
                onChange={e => setDepthAttr(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                placeholder="e.g. 10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase flex items-center gap-1"><Palette className="w-3 h-3" /> Color</label>
              <input
                type="text"
                value={colorAttribute}
                onChange={e => setColorAttribute(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                placeholder="e.g. Rose Gold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-500 font-semibold uppercase flex items-center gap-1"><Ruler className="w-3 h-3" /> Material</label>
              <input
                type="text"
                value={material}
                onChange={e => setMaterial(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                placeholder="e.g. Silk, Cotton, Leather"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors w-full">
                <input
                  type="checkbox"
                  checked={isFragile}
                  onChange={e => setIsFragile(e.target.checked)}
                  className="rounded border-amber-300 text-amber-600 w-4 h-4"
                />
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Fragile Item</span>
              </label>
            </div>
          </div>
        </div>

        {/* VARIANTS CONFIG */}
        <div className="border-t border-gray-50 pt-4 flex flex-col gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 uppercase tracking-wider">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={e => setHasVariants(e.target.checked)}
              className="rounded border-gray-300 text-primary w-4 h-4"
            />
            Product has Size or Color variations
          </label>

          {hasVariants ? (
            /* VARIANT MATRIX BUILDER */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold">Variant Combinations Matrix</span>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="text-[10px] text-primary font-bold hover:underline"
                >
                  + Add Variant row
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {variants.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center text-xs">
                    <input
                      type="text"
                      placeholder="Size (e.g. UK 16)"
                      required
                      value={v.size}
                      onChange={e => handleVariantChange(idx, 'size', e.target.value)}
                      className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Color (e.g. Black)"
                      required
                      value={v.color}
                      onChange={e => handleVariantChange(idx, 'color', e.target.value)}
                      className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Stock quantity"
                      required
                      value={v.stock_quantity}
                      onChange={e => handleVariantChange(idx, 'stock_quantity', parseInt(e.target.value))}
                      className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Price override (Optional)"
                      value={v.price}
                      onChange={e => handleVariantChange(idx, 'price', e.target.value)}
                      className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* SIMPLE STOCK METRICS */
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-semibold uppercase">Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. 10"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-semibold uppercase">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  required
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. 3"
                />
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-500 rounded-lg p-3 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-150">
          <Link
            to="/admin/products"
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={formLoading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>

      </form>
    </div>
  );
}
