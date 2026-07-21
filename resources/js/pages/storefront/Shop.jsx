import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, ArrowUpDown, Grid, Search, X, Loader2, Sparkles, ArrowRight, Check } from 'lucide-react';
import { ProductCard } from './Home';
import SEO from '../../components/seo/SEO';

export default function Shop() {
  const currencySymbol = getCurrencySymbol();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // States mirroring URL parameters
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [collection, setCollection] = useState(searchParams.get('collection') || '');
  const [selectedSizes, setSelectedSizes] = useState(searchParams.get('size') ? searchParams.get('size').split(',') : []);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true');

  const navigate = useNavigate();
  const [typeaheadOpen, setTypeaheadOpen] = useState(false);
  const typeaheadRef = useRef(null);

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

  // Dynamic API parameters build
  const buildApiUrl = () => {
    let url = `/api/products?sort=${sort}`;
    if (category) url += `&category=${category}`;
    if (collection) url += `&collection=${collection}`;
    if (selectedSizes.length > 0) url += `&size=${selectedSizes.join(',')}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (minPrice) url += `&min_price=${minPrice}`;
    if (maxPrice) url += `&max_price=${maxPrice}`;
    if (inStock) url += `&in_stock=true`;
    return url;
  };

  // Fetch Filtered Products list
  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['products-list', category, collection, selectedSizes, sort, searchQuery, minPrice, maxPrice, inStock],
    queryFn: () => fetch(buildApiUrl()).then(res => res.json())
  });

  const products = productsRes?.data?.data || [];
  const categories = categoriesRes?.data || [];
  const collections = collectionsRes?.data || [];
  const selectedCategory = categories.find(cat => String(cat.slug) === String(category) || String(cat.id) === String(category));
  const selectedCollection = collections.find(col => String(col.slug) === String(collection) || String(col.id) === String(collection));

  const readableFilterName = (value) => value
    ? value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  const getCatalogHeading = () => {
    let baseTitle = selectedCollection?.name
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

  const totalAllProducts = categories.reduce((sum, cat) => sum + (cat.products_count || 0), 0);

  // Update query params in URL
  const updateUrlParams = (newParams = {}) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.keys(newParams).forEach(key => {
      const val = newParams[key];
      if (val === null || val === undefined || val === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });

    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setSearchParams(new URLSearchParams());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sizeOptions = ['UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18', 'EU 37', 'EU 38', 'EU 39', 'EU 40', 'EU 41'];

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 pt-20 pb-16 flex flex-col gap-8 bg-white">
      <SEO title={`${catalogHeading} | Dansolam`} description="Explore the full catalog of Dansolam. Browse and order designer outfits, jumpsuits, dresses, heels, bags, and luxury accessories." />

      {/* Search Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6 text-left">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full self-start mb-2.5 inline-block">
            Collections
          </span>
          <h1 className="font-serif font-bold text-3xl md:text-4xl text-gray-900 tracking-tight leading-none">{catalogHeading}</h1>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">
            Explore {products.length} elegant hand-curated designs
          </p>
        </div>

        {/* Global Catalog Typeahead Search Box */}
        <form
          ref={typeaheadRef}
          onSubmit={e => {
            e.preventDefault();
            updateUrlParams({ search: searchQuery });
            setTypeaheadOpen(false);
          }}
          className="relative max-w-sm w-full"
        >
          <input
            id="catalog-search-box"
            type="text"
            placeholder="Search dresses, jumpsuits, sneakers..."
            value={searchQuery}
            onFocus={() => setTypeaheadOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateUrlParams({ search: e.target.value });
              setTypeaheadOpen(true);
            }}
            className="pl-11 pr-10 py-2.5 w-full text-xs bg-[#FAF9F6] rounded-full border border-gray-200 focus:outline-none focus:border-primary focus:bg-white shadow-3xs transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                updateUrlParams({ search: '' });
                setTypeaheadOpen(false);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-650 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Typeahead Suggestions Popover */}
          {typeaheadOpen && searchQuery.trim().length >= 1 && (
            <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-150 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-left animate-fade-in divide-y divide-gray-100 dark:divide-gray-700 max-h-[380px] overflow-y-auto">

              {/* Loading State */}
              {loadingSuggestions && (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Searching ecommerce catalog...</span>
                </div>
              )}

              {/* Product Matches */}
              {!loadingSuggestions && suggestions.length > 0 && (
                <div className="p-2 flex flex-col gap-1">
                  <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Matching Products</span>
                    <span className="text-primary font-semibold">{suggestions.length} results</span>
                  </div>

                  {suggestions.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setTypeaheadOpen(false);
                        navigate(`/product/${prod.slug}`);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 transition-all cursor-pointer group"
                    >
                      <img loading="lazy" decoding="async"
                        src={prod.images?.[0]?.image_url || '/images/products/placeholder.jpg'}
                        alt={prod.name}
                        className="w-10 h-12 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-primary transition-colors">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {prod.categories?.[0]?.name || prod.category?.name || 'Designer Piece'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-gray-900 dark:text-white block">
                          {currencySymbol}{parseFloat(prod.price).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-semibold block">In Stock</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loadingSuggestions && suggestions.length === 0 && (
                <div className="p-6 text-center text-xs text-gray-400 flex flex-col items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-gray-300" />
                  <span>No exact matches found for "{searchQuery}"</span>
                  <span className="text-[10px] text-gray-400">Press enter to view general results</span>
                </div>
              )}

              {/* View All Matches Footer Trigger */}
              <div
                onClick={() => {
                  setTypeaheadOpen(false);
                  updateUrlParams({ search: searchQuery });
                }}
                className="p-3 bg-gray-50/80 dark:bg-gray-700/50 hover:bg-primary/10 text-primary text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>View all results for "{searchQuery}"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>

            </div>
          )}
        </form>
      </div>

      {/* Catalog Filter Controls Bar */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100/60">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all text-gray-750 md:hidden cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters {selectedSizes.length > 0 && `(${selectedSizes.length})`}
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-gray-405 font-bold uppercase tracking-widest">
          <Grid className="w-3.5 h-3.5 text-primary" />
          Ecommerce Grid Layout
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-semibold hidden sm:inline-block">Sort By:</label>
          <div className="relative flex items-center">
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); updateUrlParams({ sort: e.target.value }); }}
              className="text-xs font-bold pl-8 pr-6 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-primary bg-white appearance-none cursor-pointer text-gray-700 transition-all hover:bg-gray-50/50"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popular">Best Sellers</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex gap-10 items-start">
        {/* LEFT COLUMN: FILTER SIDEBAR (Desktop only) */}
        <aside className="w-60 flex flex-col gap-6.5 hidden md:flex shrink-0 text-left">

          {/* Categories */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif font-bold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Categories</h4>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => { setCategory(''); setCollection(''); updateUrlParams({ category: '', collection: '' }); }}
                className={`flex items-center justify-between w-full text-xs transition-colors py-1.5 font-medium rounded-lg px-2 hover:bg-gray-50 ${!category ? 'text-primary font-bold bg-primary/5' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span>All Products</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${!category
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-primary/10 text-primary'
                  }`}>
                  {totalAllProducts}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.slug); setCollection(''); updateUrlParams({ category: cat.slug, collection: '' }); }}
                  className={`flex items-center justify-between w-full text-xs transition-colors py-1.5 font-medium rounded-lg px-2 hover:bg-gray-50 ${category === cat.slug ? 'text-primary font-bold bg-primary/5' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${category === cat.slug
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-primary/10 text-primary'
                    }`}>
                    {cat.products_count || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Size metrics */}
          <div className="border-t border-gray-100 pt-5 flex flex-col gap-3">
            <h4 className="font-serif font-bold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Filter by Size</h4>
            <div className="grid grid-cols-3 gap-2">
              {sizeOptions.map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleSizeToggle(sz)}
                  className={`py-2 text-[10px] font-bold border rounded-xl transition-all cursor-pointer ${selectedSizes.includes(sz)
                      ? 'bg-primary border-primary text-white shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50/50'
                    }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t border-gray-100 pt-5 flex flex-col gap-3">
            <h4 className="font-serif font-bold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Price Range ({currencySymbol})</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUrlParams({ min_price: minPrice, max_price: maxPrice });
              }}
              className="flex flex-col gap-2.5"
            >
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-full text-xs bg-white focus:outline-none focus:border-primary font-semibold text-center"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-full text-xs bg-white focus:outline-none focus:border-primary font-semibold text-center"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer active:scale-98"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Price Filter</span>
              </button>
            </form>
          </div>

          {/* Availability */}
          <div className="border-t border-gray-100 pt-5 flex flex-col gap-3">
            <h4 className="font-serif font-bold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Stock Status</h4>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-600 font-semibold">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => { setInStock(e.target.checked); updateUrlParams({ in_stock: e.target.checked ? 'true' : '' }); }}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer"
              />
              In Stock Only
            </label>
          </div>

          {/* Clear Actions */}
          <button
            onClick={handleClearAllFilters}
            className="text-xs text-red-500 hover:text-red-700 font-bold text-left mt-3.5 flex items-center gap-1 cursor-pointer"
          >
            Clear All Filters
          </button>
        </aside>

        {/* RIGHT COLUMN: PRODUCTS LIST */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4 bg-white p-3 rounded-2xl border border-gray-100 animate-pulse">
                  <div className="bg-gray-55 h-60 md:h-64 rounded-xl w-full" />
                  <div className="bg-gray-55 h-3 rounded w-1/3" />
                  <div className="bg-gray-55 h-5 rounded w-3/4" />
                  <div className="bg-gray-55 h-4 rounded w-1/2 mt-2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="bg-[#FAF9F6]/45 border border-gray-100 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4">
              <span className="text-5xl">🔍</span>
              <h3 className="font-serif font-bold text-gray-800 text-xl">No Products Found</h3>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                We couldn't find any products matching your active filters. Try adjusting your sizes, price limits, or categories.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-full mt-2.5 shadow-sm cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER FILTERS MODAL */}
      <div
        className={`fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex justify-end md:hidden transition-opacity duration-300 ${filtersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setFiltersOpen(false)}
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`w-80 max-w-[85vw] bg-white h-full p-6 flex flex-col gap-6 overflow-y-auto transition-transform duration-300 rounded-l-3xl text-left ${filtersOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-serif font-bold text-gray-900 text-sm">Filters</h3>
            <button onClick={() => setFiltersOpen(false)} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-950 transition-all cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Categories */}
          <div>
            <h4 className="font-serif font-bold text-xs text-gray-800 uppercase mb-3">Categories</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setCategory(''); setCollection(''); updateUrlParams({ category: '', collection: '' }); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${!category
                    ? 'bg-primary border-primary text-white shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600'
                  }`}
              >
                <span>All Products</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all ${!category
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/10 text-primary'
                  }`}>
                  {totalAllProducts}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.slug); setCollection(''); updateUrlParams({ category: cat.slug, collection: '' }); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${category === cat.slug
                      ? 'bg-primary border-primary text-white shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600'
                    }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all ${category === cat.slug
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                    }`}>
                    {cat.products_count || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Size list */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-serif font-bold text-xs text-gray-800 uppercase mb-3">Filter by Size</h4>
            <div className="grid grid-cols-3 gap-2">
              {sizeOptions.map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleSizeToggle(sz)}
                  className={`py-2 text-[10px] font-semibold border rounded-xl transition-all cursor-pointer ${selectedSizes.includes(sz)
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-gray-200 text-gray-600'
                    }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Price Range */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-serif font-bold text-xs text-gray-800 uppercase mb-3">Price Range ({currencySymbol})</h4>
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
                  className="w-full px-3 py-2 border border-gray-250 rounded-full text-xs bg-white focus:outline-none focus:border-primary font-semibold text-center"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-full text-xs bg-white focus:outline-none focus:border-primary font-semibold text-center"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer active:scale-98"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Price Filter</span>
              </button>
            </form>
          </div>

          {/* Mobile Stock status */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-serif font-bold text-xs text-gray-800 uppercase mb-3">Stock Status</h4>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 font-semibold">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => { setInStock(e.target.checked); updateUrlParams({ in_stock: e.target.checked ? 'true' : '' }); }}
                className="rounded border-gray-300 text-primary w-4.5 h-4.5 cursor-pointer"
              />
              In Stock Only
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-auto pt-6 border-t border-gray-100">
            <button
              onClick={() => { handleClearAllFilters(); setFiltersOpen(false); }}
              className="flex-1 py-2.5 border border-gray-200 rounded-full text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={() => setFiltersOpen(false)}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full text-xs font-semibold cursor-pointer shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
