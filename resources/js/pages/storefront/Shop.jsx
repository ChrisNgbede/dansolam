import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SlidersHorizontal, ArrowUpDown, Grid, Search, X, Loader2, ArrowLeft, ArrowRight, Check, Mic, Camera, Flame, Eye, Truck, ShieldCheck, RefreshCw, Star, Heart, ShoppingBag, Award, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ProductCard } from './Home';
import { useCardQuickView } from '../../components/storefront/QuickViewProvider';
import QuickViewModal from '../../components/storefront/QuickViewModal';
import FlashSaleSpotlightSection from '../../components/storefront/FlashSaleSpotlightSection';
import SEO from '../../components/seo/SEO';
import { getCurrencySymbol } from '../../utils/currency';
import { useRecentlyViewedStore } from '../../store/recentlyViewedStore';
import { toast as systemToast } from '../../components/ui/ToastProvider';

/** Recently viewed tile: the whole card opens Quick View. */
function RecentlyViewedCard({ product, cardClassName, children }) {
  const cardQuickView = useCardQuickView(product);
  return <div {...cardQuickView} className={cardClassName}>{children}</div>;
}

export default function Shop() {
  const currencySymbol = getCurrencySymbol();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (filtersOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => { if (e.key === 'Escape') setFiltersOpen(false); };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [filtersOpen]);

  const recentlyViewedItems = useRecentlyViewedStore(state => state.items);

  // States mirroring URL parameters
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [collection, setCollection] = useState(searchParams.get('collection') || '');
  // Shop-by-concern cards on Home link here with ?concern=<slug>
  const concern = searchParams.get('concern') || '';
  const { data: concernsRes } = useQuery({
    queryKey: ['shop-concerns'],
    queryFn: () => fetch('/api/shop-concerns').then(res => res.json()),
    enabled: !!concern,
    staleTime: 5 * 60_000,
  });
  const activeConcern = (concernsRes?.data?.items || []).find((c) => c.slug === concern);
  const [selectedSizes, setSelectedSizes] = useState(searchParams.get('size') ? searchParams.get('size').split(',') : []);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [perPage, setPerPage] = useState(searchParams.get('per_page') || '12');

  const navigate = useNavigate();
  const [typeaheadOpen, setTypeaheadOpen] = useState(false);
  const typeaheadRef = useRef(null);

  // Voice & Image Search hooks
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      systemToast.info("Voice search is not supported in this browser. Try Chrome or Safari!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        systemToast.info("Listening... Speak product name now 🎙️");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0]?.transcript;
        if (transcript) {
          const cleanedText = transcript.replace(/[.\?]/g, '').trim();
          setSearchQuery(cleanedText);
          updateUrlParams({ search: cleanedText });
          setTypeaheadOpen(true);
          systemToast.success(`Voice result: "${cleanedText}"`);
        }
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        systemToast.error("Could not capture voice input. Please try typing your search.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleImageSearchClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    systemToast.info("Analyzing uploaded image... 🔍");

    const fileName = file.name.toLowerCase();
    let term = 'cream';

    if (fileName.includes('soap') || fileName.includes('wash') || fileName.includes('bar')) {
      term = 'soap';
    } else if (fileName.includes('oil') || fileName.includes('serum') || fileName.includes('drop')) {
      term = 'oil';
    } else if (fileName.includes('scrub') || fileName.includes('exfoliat')) {
      term = 'scrub';
    } else if (fileName.includes('perfume') || fileName.includes('fragrance') || fileName.includes('spray')) {
      term = 'perfume';
    } else if (fileName.includes('molato') || fileName.includes('whitening') || fileName.includes('bright')) {
      term = 'whitening';
    } else if (fileName.includes('face') || fileName.includes('spot')) {
      term = 'face';
    }

    setTimeout(() => {
      setSearchQuery(term);
      updateUrlParams({ search: term });
      setTypeaheadOpen(true);
      systemToast.success(`Image match found for "${term}" skincare products 📸`);
    }, 500);
  };

  // Typeahead live suggestions query
  const { data: suggestionsRes, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['typeahead-suggestions', searchQuery],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    enabled: searchQuery.trim().length >= 1 && typeaheadOpen,
  });

  const suggestions = suggestionsRes?.data || [];

  // Close typeahead popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeaheadRef.current && !typeaheadRef.current.contains(e.target)) {
        setTypeaheadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger search focus if directed from bottom PWA nav
  useEffect(() => {
    if (searchParams.get('focusSearch') === 'true') {
      const searchBox = document.getElementById('catalog-search-box');
      if (searchBox) searchBox.focus();
    }
  }, [searchParams]);

  // Sync state with URL parameter changes
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setCollection(searchParams.get('collection') || '');
    setSort(searchParams.get('sort') || 'newest');
    setSearchQuery(searchParams.get('search') || '');
    setMinPrice(searchParams.get('min_price') || '');
    setMaxPrice(searchParams.get('max_price') || '');
    setInStock(searchParams.get('in_stock') === 'true');
    setPage(Number(searchParams.get('page')) || 1);
    setPerPage(searchParams.get('per_page') || '12');
    if (searchParams.get('size')) {
      setSelectedSizes(searchParams.get('size').split(','));
    } else {
      setSelectedSizes([]);
    }
  }, [searchParams]);

  // Fetch Categories for Sidebar
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-shop'],
    queryFn: () => fetch('/api/categories').then(res => res.json())
  });

  const { data: collectionsRes } = useQuery({
    queryKey: ['collections-shop'],
    queryFn: () => fetch('/api/collections').then(res => res.json())
  });

  // Fetch Flash Sale Products (only items under flash sales)
  const { data: flashSaleRes } = useQuery({
    queryKey: ['products-flash-sale-shop'],
    queryFn: () => fetch('/api/products?is_flash_sale=true&limit=6').then(res => res.json())
  });

  const flashSaleProducts = flashSaleRes?.data?.data || [];

  // Fetch Settings for Flash Sales spotlight
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  const settings = settingsData?.data?.settings || {};

  // Dynamic API parameters build
  const buildApiUrl = () => {
    let url = `/api/products?sort=${sort}&page=${page}&per_page=${perPage}`;
    if (category) url += `&category=${category}`;
    if (collection) url += `&collection=${collection}`;
    if (concern) url += `&concern=${encodeURIComponent(concern)}`;
    if (selectedSizes.length > 0) url += `&size=${selectedSizes.join(',')}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (minPrice) url += `&min_price=${minPrice}`;
    if (maxPrice) url += `&max_price=${maxPrice}`;
    if (inStock) url += `&in_stock=true`;
    return url;
  };

  // Fetch Filtered Products list
  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['products-list', category, collection, concern, selectedSizes, sort, searchQuery, minPrice, maxPrice, inStock, page, perPage],
    queryFn: () => fetch(buildApiUrl()).then(res => res.json())
  });

  const rawProductsData = productsRes?.data;
  const products = Array.isArray(rawProductsData?.data)
    ? rawProductsData.data
    : (Array.isArray(rawProductsData) ? rawProductsData : []);

  const totalProducts = typeof rawProductsData?.total === 'number'
    ? rawProductsData.total
    : products.length;
  const currentPage = typeof rawProductsData?.current_page === 'number'
    ? rawProductsData.current_page
    : page;
  const lastPage = typeof rawProductsData?.last_page === 'number'
    ? rawProductsData.last_page
    : (perPage === 'all' ? 1 : Math.max(1, Math.ceil(totalProducts / (Number(perPage) || 12))));
  const fromCount = typeof rawProductsData?.from === 'number'
    ? rawProductsData.from
    : (products.length > 0 ? (currentPage - 1) * (perPage === 'all' ? totalProducts : Number(perPage) || 12) + 1 : 0);
  const toCount = typeof rawProductsData?.to === 'number'
    ? rawProductsData.to
    : (fromCount + products.length - (products.length > 0 ? 1 : 0));

  // Sync page if backend returns a clamped/adjusted current_page
  useEffect(() => {
    if (rawProductsData?.current_page && rawProductsData.current_page !== page) {
      setPage(rawProductsData.current_page);
    }
  }, [rawProductsData?.current_page]);

  const getPageNumbers = () => {
    if (lastPage <= 7) {
      return Array.from({ length: lastPage }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', lastPage];
    }
    if (currentPage >= lastPage - 3) {
      return [1, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', lastPage];
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > lastPage || newPage === currentPage) return;
    setPage(newPage);
    updateUrlParams({ page: newPage }, false);
    const gridEl = document.getElementById('catalog-products-grid');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
    updateUrlParams({ per_page: newPerPage, page: 1 }, false);
  };

  const categories = Array.isArray(categoriesRes?.data?.data)
    ? categoriesRes.data.data
    : (Array.isArray(categoriesRes?.data) ? categoriesRes.data : []);

  const collections = Array.isArray(collectionsRes?.data?.data)
    ? collectionsRes.data.data
    : (Array.isArray(collectionsRes?.data) ? collectionsRes.data : []);

  const selectedCategory = Array.isArray(categories)
    ? categories.find(cat => String(cat?.slug) === String(category) || String(cat?.id) === String(category))
    : null;

  const selectedCollection = Array.isArray(collections)
    ? collections.find(col => String(col?.slug) === String(collection) || String(col?.id) === String(collection))
    : null;

  const readableFilterName = (value) => value
    ? value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  const getCatalogHeading = () => {
    let baseTitle = activeConcern?.name
      || selectedCollection?.name
      || selectedCategory?.name
      || readableFilterName(collection)
      || readableFilterName(category)
      || 'Shop Catalog';

    const filterParts = [];

    if (selectedSizes && selectedSizes.length > 0) {
      filterParts.push(`Size ${selectedSizes.join(', ')}`);
    }

    if (category && baseTitle !== selectedCategory?.name && baseTitle !== readableFilterName(category)) {
      filterParts.push(`${selectedCategory?.name || readableFilterName(category)}`);
    }

    if (searchQuery) {
      filterParts.push(`Search ${searchQuery}`);
    }

    if (minPrice || maxPrice) {
      if (minPrice && maxPrice) {
        filterParts.push(`Price ${currencySymbol}${Number(minPrice).toLocaleString()} - ${currencySymbol}${Number(maxPrice).toLocaleString()}`);
      } else if (minPrice) {
        filterParts.push(`Min ${currencySymbol}${Number(minPrice).toLocaleString()}`);
      } else if (maxPrice) {
        filterParts.push(`Max ${currencySymbol}${Number(maxPrice).toLocaleString()}`);
      }
    }

    if (inStock) {
      filterParts.push('In Stock');
    }

    if (filterParts.length > 0) {
      return `${baseTitle} - ${filterParts.join(' • ')}`;
    }

    return baseTitle;
  };

  const catalogHeading = getCatalogHeading();
  const totalAllProducts = Array.isArray(categories) ? categories.reduce((sum, cat) => sum + (cat?.products_count || 0), 0) : 0;

  // Update query params in URL
  const updateUrlParams = (newParams = {}, shouldScroll = false) => {
    const nextParams = new URLSearchParams(searchParams);

    // If changing filters and 'page' is not explicitly in newParams, reset to page 1
    if (!('page' in newParams)) {
      nextParams.delete('page');
      setPage(1);
    }

    Object.keys(newParams).forEach(key => {
      const val = newParams[key];
      if (val === null || val === undefined || val === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });

    setSearchParams(nextParams);
    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSizeToggle = (size) => {
    let nextSizes = [...selectedSizes];
    if (nextSizes.includes(size)) {
      nextSizes = nextSizes.filter(s => s !== size);
    } else {
      nextSizes.push(size);
    }
    setSelectedSizes(nextSizes);
    updateUrlParams({ size: nextSizes.length > 0 ? nextSizes.join(',') : '' });
  };

  const handleClearAllFilters = () => {
    setSelectedSizes([]);
    setCategory('');
    setCollection('');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setPage(1);
    const nextParams = new URLSearchParams();
    if (perPage && perPage !== '12') {
      nextParams.set('per_page', perPage);
    }
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount = (category ? 1 : 0) + (collection ? 1 : 0) + selectedSizes.length + (minPrice || maxPrice ? 1 : 0) + (inStock ? 1 : 0);

  // Real variant sizes only (e.g. 250ml / 500g); hidden while every variant is "Standard".
  const sizeOptions = Array.from(new Set([
    ...products.flatMap((p) => (p.variants || []).map((v) => v.size)),
    ...selectedSizes,
  ].filter((sz) => sz && !/^(standard|default)$/i.test(sz))));
  const trendingSearches = ['Glowing Moisturizing Cream', 'Whitening Polish Soap', 'Discoloration Oil', 'Dansolam Plus', 'Essential Oil', 'Fragrance'];

  return (
    <div className="bg-white dark:bg-[#17101F] min-h-screen font-sans pb-24 text-left transition-colors duration-300">
      <SEO title={`${catalogHeading} | Dansolam Beauty Home`} description="Explore the full catalog of Dansolam Beauty Home. Browse and order 100% organic body creams, oils, scrubs, soaps and skincare." />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-8 flex flex-col gap-6">
        {/* Hero Banner Card - Compact, Wide, Back to Home Inside */}
        <section className="h-[200px] sm:h-[240px] md:h-[270px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-gradient-to-br from-[#5D3E85] via-[#4A2B68] to-[#2A1740] relative shadow-md w-full">
          <img
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="1400"
            height="270"
            src="/images/banners/shop_hero_banner.webp"
            className="absolute inset-0 w-full h-full object-cover object-center"
            alt=""
          />

          {/* Header Action Buttons Inside Banner */}
          <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center z-20">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-sm transition-all duration-300 btn-spring"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 flex flex-col justify-end p-5 sm:p-7 md:p-9 text-left z-10">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#5D3E85] bg-white px-3.5 py-1 rounded-full  tracking-widest self-start mb-2 border border-white/40 shadow-sm">
              {activeConcern ? 'Shop by concern' : 'Shop Catalog'}
            </span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
              {catalogHeading}
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mt-1 max-w-2xl font-sans leading-snug line-clamp-2">
              {activeConcern?.blurb || `Browse ${products.length} organic body creams, oils, scrubs, soaps and more.`}
            </p>
            {concern && (
              <Link to="/shop" className="mt-3 self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-[11px] font-bold text-white transition-colors">
                ✕ Show all products
              </Link>
            )}
          </div>
        </section>

        {/* Search Bar, Category Chips, and Social Proof */}
        <section className="w-full flex flex-col items-center gap-4 text-center">
          <form
            ref={typeaheadRef}
            onSubmit={e => {
              e.preventDefault();
              updateUrlParams({ search: searchQuery });
              setTypeaheadOpen(false);
            }}
            className="relative max-w-2xl w-full group"
          >
            {/* Invisible File Input for Camera / Image Search */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              className="hidden"
            />

            <div className="relative flex items-center bg-white dark:bg-[#1E1528] rounded-full border border-[#EADBEE] dark:border-white/15 focus-within:border-[#EC268F] dark:focus-within:border-[#EC268F] focus-within:ring-4 focus-within:ring-[#EC268F]/20 shadow-md transition-all duration-300">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-[#5D3E85] dark:group-focus-within:text-[#EC268F] absolute left-4 pointer-events-none transition-colors z-10" />

              <input
                id="catalog-search-box"
                type="text"
                placeholder="Search organic soaps, glowing creams, discoloration oils..."
                value={searchQuery}
                onFocus={() => setTypeaheadOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateUrlParams({ search: e.target.value });
                  setTypeaheadOpen(true);
                }}
                className="pl-11 pr-24 py-3.5 w-full text-xs sm:text-[13px] bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none font-medium rounded-full"
              />

              {/* Voice & Image Search Action Icons */}
              <div className="absolute right-3 flex items-center gap-1.5 z-10">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      updateUrlParams({ search: '' });
                      setTypeaheadOpen(false);
                    }}
                    className="p-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      title="Voice Search"
                      className={`p-1.5 rounded-full transition-all cursor-pointer ${isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-gray-200 dark:hover:bg-white/20'
                        }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleImageSearchClick}
                      title="Image Search"
                      className="p-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Typeahead Suggestions Popover */}
            {typeaheadOpen && (
              <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-white dark:bg-[#1E1528] backdrop-blur-2xl border border-[#EADBEE] dark:border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden text-left animate-fade-in divide-y divide-gray-100 dark:divide-white/10 max-h-[420px] overflow-y-auto">
                {searchQuery.trim().length < 1 && (
                  <div className="p-4 flex flex-col gap-3">
                    <div className="text-[10px] font-extrabold text-[#5D3E85] dark:text-[#EC268F]  tracking-widest flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#EC268F]" />
                      <span>Trending Search Terms</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((term, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                            updateUrlParams({ search: term });
                            setTypeaheadOpen(false);
                          }}
                          className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 hover:bg-[#5D3E85]/10 dark:hover:bg-[#EC268F]/20 text-gray-700 dark:text-[#F3EFF6] text-xs font-extrabold rounded-full border border-gray-150 dark:border-white/10 transition-all cursor-pointer btn-spring"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loadingSuggestions && searchQuery.trim().length >= 1 && (
                  <div className="p-5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#5D3E85] dark:text-[#EC268F]" />
                    <span>Searching catalog...</span>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Featured Quick Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl w-full">
            <button
              onClick={() => { setCategory(''); updateUrlParams({ category: '' }); }}
              className={`px-4 py-2 text-xs font-extrabold rounded-full border transition-all cursor-pointer btn-spring ${!category
                ? 'bg-[#5D3E85] dark:bg-[#EC268F] border-[#5D3E85] dark:border-[#EC268F] text-white shadow-sm'
                : 'bg-white dark:bg-[#1E1528] border-[#EADBEE] dark:border-white/10 text-gray-700 dark:text-[#C9BED4] hover:text-[#5D3E85] dark:hover:text-[#EC268F] hover:border-[#5D3E85]/30 shadow-xs'
                }`}
            >
              All Products
            </button>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.slug); updateUrlParams({ category: cat.slug }); }}
                className={`px-4 py-2 text-xs font-extrabold rounded-full border transition-all cursor-pointer btn-spring ${category === cat.slug
                  ? 'bg-[#5D3E85] dark:bg-[#EC268F] border-[#5D3E85] dark:border-[#EC268F] text-white shadow-sm'
                  : 'bg-white dark:bg-[#1E1528] border-[#EADBEE] dark:border-white/10 text-gray-700 dark:text-[#C9BED4] hover:text-[#5D3E85] dark:hover:text-[#EC268F] hover:border-[#5D3E85]/30 shadow-xs'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 flex flex-col gap-8 w-full">

        {/* Catalog Filter Controls Bar */}
        <section className="flex flex-wrap items-center justify-between gap-4 py-3.5 border border-[#EADBEE] dark:border-white/10 bg-white dark:bg-[#1E1528] px-5 sm:px-6 rounded-2xl shadow-xs transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-white/15 rounded-full text-xs font-extrabold hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-[#221B2B] dark:text-[#F3EFF6] md:hidden cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F]" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>

            <div className="hidden md:flex items-center gap-2 text-[10px] text-[#5D3E85] dark:text-[#EC268F] font-extrabold  tracking-widest">
              <Grid className="w-4 h-4 text-[#EC268F]" />
              <span>
                {perPage === 'all'
                  ? `All ${totalProducts} Items`
                  : `Showing ${fromCount}–${toCount} of ${totalProducts}`}
              </span>
            </div>
          </div>

          {/* Page Size & Sort Select Controls */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-[#9B8EA9] font-extrabold hidden sm:inline-block">Show:</span>
              <div className="inline-flex rounded-full p-0.5 bg-gray-100 dark:bg-[#140D1C] border border-gray-200 dark:border-white/10 text-xs">
                {['12', '24', '36', '48', 'all'].map((sz) => (
                  <button
                    key={`top-perpage-${sz}`}
                    type="button"
                    onClick={() => handlePerPageChange(sz)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold transition-all cursor-pointer ${
                      perPage === sz
                        ? 'bg-[#5D3E85] dark:bg-[#EC268F] text-white shadow-xs'
                        : 'text-gray-600 dark:text-[#C9BED4] hover:text-[#5D3E85] dark:hover:text-white'
                    }`}
                  >
                    {sz === 'all' ? 'All' : sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-[#9B8EA9] font-extrabold hidden sm:inline-block">Sort:</label>
              <div className="relative flex items-center">
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                    updateUrlParams({ sort: e.target.value, page: 1 });
                  }}
                  className="text-xs font-extrabold pl-8 pr-8 py-2 border border-gray-200 dark:border-white/15 rounded-full focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] bg-white dark:bg-[#231B30] appearance-none cursor-pointer text-[#221B2B] dark:text-[#F3EFF6] transition-all hover:bg-gray-50 dark:hover:bg-white/10 shadow-2xs"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="popular">Best Sellers</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F] absolute left-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Main Layout Grid */}
        <section className="flex gap-8 items-start">
          {/* LEFT COLUMN: FILTER SIDEBAR */}
          <aside className="shop-filters w-64 flex flex-col gap-6 hidden md:flex shrink-0 text-left bg-[#F7F3F9] dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-sm sticky top-24 transition-colors">

            {/* Active Filter Clear Header */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-[#EADBEE] dark:border-white/10">
                <span className="text-xs font-extrabold text-[#5D3E85] dark:text-[#EC268F]">Active Filters ({activeFiltersCount})</span>
                <button
                  onClick={handleClearAllFilters}
                  className="text-[10px] text-[#EC268F] font-extrabold hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              </div>
            )}

            {/* Categories */}
            <div className="flex flex-col gap-3">
              <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider border-b border-[#EADBEE] dark:border-white/10 pb-2">Categories</h4>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => { setCategory(''); setCollection(''); updateUrlParams({ category: '', collection: '' }); }}
                  className={`flex items-center justify-between w-full text-xs transition-colors py-2 font-extrabold rounded-xl px-3 cursor-pointer btn-spring ${!category ? 'text-white bg-[#5D3E85] dark:bg-[#EC268F] shadow-sm' : 'text-gray-700 dark:text-[#C9BED4] hover:bg-[#5D3E85]/10 hover:text-[#5D3E85] dark:hover:bg-white/10 dark:hover:text-white'
                    }`}
                >
                  <span>All Products</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${!category ? 'bg-[#EC268F] dark:bg-[#5D3E85] text-white' : 'bg-[#5D3E85]/10 dark:bg-white/10 text-[#5D3E85] dark:text-white'
                    }`}>
                    {totalAllProducts}
                  </span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.slug); setCollection(''); updateUrlParams({ category: cat.slug, collection: '' }); }}
                    className={`flex items-center justify-between w-full text-xs transition-colors py-2 font-extrabold rounded-xl px-3 cursor-pointer btn-spring ${category === cat.slug ? 'text-white bg-[#5D3E85] dark:bg-[#EC268F] shadow-sm' : 'text-gray-700 dark:text-[#C9BED4] hover:bg-[#5D3E85]/10 hover:text-[#5D3E85] dark:hover:bg-white/10 dark:hover:text-white'
                      }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold transition-all ${category === cat.slug ? 'bg-[#EC268F] dark:bg-[#5D3E85] text-white' : 'bg-[#5D3E85]/10 dark:bg-white/10 text-[#5D3E85] dark:text-white'
                      }`}>
                      {cat.products_count || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            {sizeOptions.length > 0 && (
<div className="border-t border-[#EADBEE] dark:border-white/10 pt-5 flex flex-col gap-3">
              <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider border-b border-[#EADBEE] dark:border-white/10 pb-2">Filter by Size</h4>
              <div className="grid grid-cols-3 gap-2">
                {sizeOptions.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => handleSizeToggle(sz)}
                    className={`py-2 text-[10px] font-extrabold border rounded-full transition-all cursor-pointer btn-spring ${selectedSizes.includes(sz)
                      ? 'bg-[#5D3E85] dark:bg-[#EC268F] border-[#5D3E85] dark:border-[#EC268F] text-white shadow-sm scale-105'
                      : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/15 text-gray-700 dark:text-[#C9BED4] hover:border-[#5D3E85] dark:hover:border-[#EC268F] hover:bg-gray-50 dark:hover:bg-white/10'
                      }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
)}

            {/* Price Range Filter */}
            <div className="border-t border-[#EADBEE] dark:border-white/10 pt-5 flex flex-col gap-3">
              <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider border-b border-[#EADBEE] dark:border-white/10 pb-2">Price Range ({currencySymbol})</h4>

              {/* Quick Price Presets */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setMinPrice(''); setMaxPrice('30000'); updateUrlParams({ min_price: '', max_price: '30000' }); }}
                  className="px-2.5 py-1 text-[9px] font-extrabold rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/15 hover:border-[#5D3E85] text-gray-700 dark:text-[#C9BED4] cursor-pointer btn-spring"
                >
                  Under 30k
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice('30000'); setMaxPrice('80000'); updateUrlParams({ min_price: '30000', max_price: '80000' }); }}
                  className="px-2.5 py-1 text-[9px] font-extrabold rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/15 hover:border-[#5D3E85] text-gray-700 dark:text-[#C9BED4] cursor-pointer btn-spring"
                >
                  30k - 80k
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice('80000'); setMaxPrice(''); updateUrlParams({ min_price: '80000', max_price: '' }); }}
                  className="px-2.5 py-1 text-[9px] font-extrabold rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/15 hover:border-[#5D3E85] text-gray-700 dark:text-[#C9BED4] cursor-pointer btn-spring"
                >
                  80k+
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateUrlParams({ min_price: minPrice, max_price: maxPrice });
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/15 rounded-full text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] focus:outline-none focus:border-[#5D3E85] font-bold text-center"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/15 rounded-full text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] focus:outline-none focus:border-[#5D3E85] font-bold text-center"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 btn-spring"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Price Filter</span>
                </button>
              </form>
            </div>

            {/* Availability */}
            <div className="border-t border-[#EADBEE] dark:border-white/10 pt-5 flex flex-col gap-3">
              <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  tracking-wider border-b border-[#EADBEE] dark:border-white/10 pb-2">Stock Status</h4>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 dark:text-[#C9BED4] font-extrabold">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); updateUrlParams({ in_stock: e.target.checked ? 'true' : '' }); }}
                  className="rounded border-gray-300 dark:border-white/20 text-[#5D3E85] focus:ring-[#5D3E85] w-4.5 h-4.5 cursor-pointer"
                />
                In Stock Only
              </label>
            </div>
          </aside>

          {/* RIGHT COLUMN: PRODUCTS LIST & RHYTHM INSERTS */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-4 bg-white dark:bg-[#1E1528] p-4 rounded-[26px] border border-[#EADBEE] dark:border-white/10 animate-pulse">
                    <div className="bg-gray-100 dark:bg-white/5 h-64 rounded-2xl w-full" />
                    <div className="bg-gray-100 dark:bg-white/5 h-3 rounded w-1/3" />
                    <div className="bg-gray-100 dark:bg-white/5 h-5 rounded w-3/4" />
                    <div className="bg-gray-100 dark:bg-white/5 h-4 rounded w-1/2 mt-2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div id="catalog-products-grid" className="flex flex-col gap-8">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((prod, index) => (
                    <React.Fragment key={prod.id}>
                      {/* Standard Product Card with QuickView trigger */}
                      <ProductCard
                        product={prod}
                        onQuickView={(p) => setQuickViewProduct(p)}
                      />

                      {/* Flash Sale Spotlight Section inserted after 6th product (showing items under flash sales) */}
                      {index === 5 && flashSaleProducts.length > 0 && settings.flash_sale_show !== 'false' && settings.flash_sale_is_ended !== 'true' && (
                        <div className="col-span-2 lg:col-span-3 my-4">
                          <FlashSaleSpotlightSection
                            settings={settings}
                            flashSaleProducts={flashSaleProducts}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Pagination Controls Bar */}
                <div className="pt-6 border-t border-[#EADBEE] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-5 bg-white dark:bg-[#1E1528] p-5 sm:p-6 rounded-3xl border shadow-xs transition-colors text-left">
                  {/* Results Count Text */}
                  <div className="text-xs font-bold text-gray-500 dark:text-[#C9BED4]">
                    {perPage === 'all' ? (
                      <span>
                        Showing all <strong className="text-[#221B2B] dark:text-[#F3EFF6] font-extrabold">{totalProducts}</strong> products
                      </span>
                    ) : (
                      <span>
                        Showing <strong className="text-[#221B2B] dark:text-[#F3EFF6] font-extrabold">{fromCount}</strong>–<strong className="text-[#221B2B] dark:text-[#F3EFF6] font-extrabold">{toCount}</strong> of <strong className="text-[#221B2B] dark:text-[#F3EFF6] font-extrabold">{totalProducts}</strong> products
                      </span>
                    )}
                  </div>

                  {/* Page Navigation Buttons */}
                  {perPage !== 'all' && lastPage > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {/* Prev Button */}
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-extrabold border transition-all ${
                          currentPage <= 1
                            ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-white/10 text-gray-400'
                            : 'border-[#EADBEE] dark:border-white/15 bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] shadow-2xs cursor-pointer active:scale-95'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      {/* Numbered Page Buttons */}
                      {getPageNumbers().map((pNum, pIdx) => {
                        if (pNum === '...') {
                          return (
                            <span
                              key={`dots-${pIdx}`}
                              className="px-2 py-1.5 text-xs text-gray-400 font-bold select-none"
                            >
                              …
                            </span>
                          );
                        }

                        const isCurrent = currentPage === pNum;
                        return (
                          <button
                            key={`page-${pNum}`}
                            type="button"
                            onClick={() => handlePageChange(pNum)}
                            className={`w-9 h-9 rounded-full text-xs font-extrabold transition-all flex items-center justify-center cursor-pointer ${
                              isCurrent
                                ? 'bg-[#5D3E85] dark:bg-[#EC268F] text-white shadow-md scale-105'
                                : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/15 text-[#221B2B] dark:text-[#F3EFF6] hover:border-[#5D3E85] dark:hover:border-[#EC268F] hover:bg-gray-50 dark:hover:bg-white/10'
                            }`}
                          >
                            {pNum}
                          </button>
                        );
                      })}

                      {/* Next Button */}
                      <button
                        type="button"
                        disabled={currentPage >= lastPage}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-extrabold border transition-all ${
                          currentPage >= lastPage
                            ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-white/10 text-gray-400'
                            : 'border-[#EADBEE] dark:border-white/15 bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] shadow-2xs cursor-pointer active:scale-95'
                        }`}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Page Size Switcher */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-[#9B8EA9] font-bold">Per page:</span>
                    <div className="inline-flex rounded-full p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs">
                      {['12', '24', '48', 'all'].map((sz) => (
                        <button
                          key={`bottom-perpage-${sz}`}
                          type="button"
                          onClick={() => handlePerPageChange(sz)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                            perPage === sz
                              ? 'bg-[#5D3E85] dark:bg-[#EC268F] text-white shadow-xs'
                              : 'text-gray-600 dark:text-[#C9BED4] hover:text-[#5D3E85] dark:hover:text-white'
                          }`}
                        >
                          {sz === 'all' ? 'All' : sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
                <span className="text-5xl">🔍</span>
                <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-xl">No Products Found</h3>
                <p className="text-xs text-gray-500 dark:text-[#9B8EA9] max-w-sm leading-relaxed font-medium">
                  We couldn't find any items matching your active filters. Try adjusting your sizes, price limits, or categories.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="px-6 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full mt-2.5 shadow-sm cursor-pointer btn-spring"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Recently Viewed Products Section */}
        {recentlyViewedItems.length > 0 && (
          <section className="border-t border-[#EADBEE] dark:border-white/10 pt-10 mt-10 text-left">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-lg text-[#221B2B] dark:text-[#F3EFF6] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#5D3E85] dark:text-[#EC268F]" />
                <span>Recently Viewed Products</span>
              </h3>
              <span className="text-xs text-gray-400 dark:text-[#9B8EA9] font-semibold">{recentlyViewedItems.length} items history</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewedItems.slice(0, 6).map((rvProd) => (
                <RecentlyViewedCard
                  key={rvProd.id}
                  product={rvProd}
                  cardClassName="bg-white dark:bg-[#1E1528] p-3 rounded-2xl border border-[#EADBEE] dark:border-white/10 hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col gap-2 group btn-spring"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                    <img loading="lazy" decoding="async" width="200" height="200"
                      src={rvProd.images?.[0]?.image_url || rvProd.image || rvProd.image_url || '/images/placeholder-product.svg'}
                      alt={rvProd.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6] truncate group-hover:text-[#5D3E85] dark:group-hover:text-[#EC268F]">
                    {rvProd.name}
                  </h4>
                  <span className="text-xs font-extrabold text-[#5D3E85] dark:text-[#EC268F]">
                    {currencySymbol}{parseFloat(rvProd.sale_price || rvProd.price || 0).toLocaleString()}
                  </span>
                </RecentlyViewedCard>
              ))}
            </div>
          </section>
        )}

        {/* Trust Badges */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-[#EADBEE] dark:border-white/10 pt-10 mt-4 text-left">
          <div className="bg-white dark:bg-[#1E1528] p-5 rounded-2xl border border-[#EADBEE] dark:border-white/10 flex items-center gap-3.5 shadow-2xs">
            <Truck className="w-8 h-8 text-[#5D3E85] dark:text-[#EC268F] shrink-0" />
            <div>
              <h5 className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">Delivery</h5>
              <p className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-medium">Nationwide delivery</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1E1528] p-5 rounded-2xl border border-[#EADBEE] dark:border-white/10 flex items-center gap-3.5 shadow-2xs">
            <ShieldCheck className="w-8 h-8 text-[#EC268F] shrink-0" />
            <div>
              <h5 className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">100% Organic</h5>
              <p className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-medium">Natural ingredients</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1E1528] p-5 rounded-2xl border border-[#EADBEE] dark:border-white/10 flex items-center gap-3.5 shadow-2xs">
            <RefreshCw className="w-8 h-8 text-[#5D3E85] dark:text-[#EC268F] shrink-0" />
            <div>
              <h5 className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">Returns</h5>
              <p className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-medium">See our returns policy</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1E1528] p-5 rounded-2xl border border-[#EADBEE] dark:border-white/10 flex items-center gap-3.5 shadow-2xs">
            <Award className="w-8 h-8 text-[#E5C158] shrink-0" />
            <div>
              <h5 className="text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">Customer Support</h5>
              <p className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-medium">Help with your order</p>
            </div>
          </div>
        </section>
      </div>

      {/* MOBILE DRAWER FILTERS MODAL */}
      {createPortal(
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex justify-end md:hidden transition-opacity duration-300 ${filtersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setFiltersOpen(false)}
        role="dialog"
        aria-modal="true"
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`w-80 max-w-[85vw] bg-white dark:bg-[#1E1528] text-gray-900 dark:text-[#F3EFF6] h-full p-6 flex flex-col gap-6 overflow-y-auto transition-transform duration-300 rounded-l-3xl text-left border-l border-[#EADBEE] dark:border-white/10 ${filtersOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
            <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-sm">Catalog Filters</h3>
            <button onClick={() => setFiltersOpen(false)} className="p-1.5 hover:bg-gray-50 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-950 dark:hover:text-white transition-all cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Categories */}
          <div>
            <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  mb-3">Categories</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setCategory(''); setCollection(''); updateUrlParams({ category: '', collection: '' }); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-full border transition-all cursor-pointer btn-spring ${!category
                  ? 'bg-[#5D3E85] dark:bg-[#EC268F] border-[#5D3E85] dark:border-[#EC268F] text-white shadow-xs'
                  : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/15 text-gray-600 dark:text-[#C9BED4]'
                  }`}
              >
                <span>All Products</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all ${!category ? 'bg-[#EC268F] text-white' : 'bg-[#5D3E85]/10 dark:bg-white/10 text-[#5D3E85] dark:text-white'
                  }`}>
                  {totalAllProducts}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.slug); setCollection(''); updateUrlParams({ category: cat.slug, collection: '' }); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-full border transition-all cursor-pointer btn-spring ${category === cat.slug
                    ? 'bg-[#5D3E85] dark:bg-[#EC268F] border-[#5D3E85] dark:border-[#EC268F] text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/15 text-gray-600 dark:text-[#C9BED4]'
                    }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all ${category === cat.slug ? 'bg-[#EC268F] text-white' : 'bg-[#5D3E85]/10 dark:bg-white/10 text-[#5D3E85] dark:text-white'
                    }`}>
                    {cat.products_count || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Size list */}
          {sizeOptions.length > 0 && (
<div className="border-t border-gray-100 dark:border-white/10 pt-4">
            <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  mb-3">Filter by Size</h4>
            <div className="grid grid-cols-3 gap-2">
              {sizeOptions.map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleSizeToggle(sz)}
                  className={`py-2 text-[10px] font-extrabold border rounded-xl transition-all cursor-pointer btn-spring ${selectedSizes.includes(sz)
                    ? 'bg-[#5D3E85] dark:bg-[#EC268F] border-[#5D3E85] dark:border-[#EC268F] text-white'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/15 text-gray-600 dark:text-[#C9BED4]'
                    }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
)}

          {/* Mobile Price Range */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-extrabold text-xs text-[#181120]  mb-3">Price Range ({currencySymbol})</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUrlParams({ min_price: minPrice, max_price: maxPrice });
                setFiltersOpen(false);
              }}
              className="flex flex-col gap-2.5"
            >
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-full text-xs bg-white focus:outline-none focus:border-[#5D3E85] font-extrabold text-center"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-full text-xs bg-white focus:outline-none focus:border-[#5D3E85] font-extrabold text-center"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer active:scale-98"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Price Filter</span>
              </button>
            </form>
          </div>

          {/* Mobile Stock status */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-extrabold text-xs text-[#181120]  mb-3">Stock Status</h4>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 font-extrabold">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => { setInStock(e.target.checked); updateUrlParams({ in_stock: e.target.checked ? 'true' : '' }); }}
                className="rounded border-gray-300 text-[#5D3E85] w-4.5 h-4.5 cursor-pointer"
              />
              In Stock Only
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-auto pt-6 border-t border-gray-100">
            <button
              onClick={() => { handleClearAllFilters(); setFiltersOpen(false); }}
              className="flex-1 py-2.5 border border-gray-200 rounded-full text-xs font-extrabold text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={() => setFiltersOpen(false)}
              className="flex-1 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white rounded-full text-xs font-extrabold cursor-pointer shadow-md"
            >
              Apply
            </button>
          </div>
        </div>
      </div>,
      document.body
      )}

      {/* Render Quick View Modal when active */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
