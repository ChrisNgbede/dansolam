import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2, X, Search, Loader2, Package, FolderPlus, Upload, Layers, Settings2,
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { toast } from '../ui/ToastProvider';
import ImageUploadField from '../ui/ImageUploadField';
import { getCurrencySymbol } from '../../utils/currency';

const productImage = (p) => p?.images?.[0]?.image_url || p?.image_url || null;
const inMegaMenu = (col) => !!col.is_published && col.show_in_mega_menu !== false;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

async function request(url, method, body) {
  const res = await apiFetch(url, { method, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

/** On/off switch built on a checkbox, so it ignores the admin's global button styling. */
function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className={`inline-flex items-center gap-2 select-none ${disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input type="checkbox" className="sr-only peer" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden="true" className="relative w-9 h-5 shrink-0 rounded-full bg-gray-300 dark:bg-white/20 peer-checked:bg-[#5D3E85] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#5D3E85] peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{label}</span>
    </label>
  );
}

/** The collection's banner, or a 2×2 of its product photos when it has none. */
function CollectionThumb({ col, productsById, className = 'w-20 h-14' }) {
  const shots = (col.products || []).map((p) => productImage(productsById[p.id])).filter(Boolean).slice(0, 4);
  return (
    <div className={`${className} rounded-xl overflow-hidden bg-[#F8EEF6] dark:bg-white/10 shrink-0`}>
      {col.banner_url ? (
        <img src={col.banner_url} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : shots.length ? (
        <div className={`grid w-full h-full gap-px ${shots.length > 1 ? 'grid-cols-2' : ''}`}>
          {shots.map((src) => <img key={src} src={src} alt="" loading="lazy" className="w-full h-full object-cover bg-white" />)}
        </div>
      ) : (
        <div className="w-full h-full grid place-items-center"><Layers className="w-5 h-5 text-[#5D3E85]/40 dark:text-white/40" /></div>
      )}
    </div>
  );
}

/** Searchable checklist used for both products and categories. */
function Checklist({ items, selected, onToggle, onSetAll, noun, renderMeta }) {
  const [query, setQuery] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);
  const q = query.trim().toLowerCase();
  const visible = items.filter((i) => (!q || i.name.toLowerCase().includes(q)) && (!onlySelected || selected.includes(i.id)));
  const allVisibleOn = visible.length > 0 && visible.every((i) => selected.includes(i.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Find a ${noun}…`} aria-label={`Find a ${noun}`} className="w-full pl-10" />
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
          Selected only
        </label>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span>{selected.length} selected</span>
        {visible.length > 0 && (
          <button type="button" className="hover:underline font-semibold text-[#5D3E85] dark:text-[#C4A4F0]" onClick={() => onSetAll(visible.map((i) => i.id), !allVisibleOn)}>
            {allVisibleOn ? 'Clear these' : `Select ${q || onlySelected ? 'these' : 'all'}`}
          </button>
        )}
      </div>
      <div className="h-[22rem] overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5">
        {visible.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 p-4">Nothing matches.</p>}
        {visible.map((i) => {
          const on = selected.includes(i.id);
          return (
            <label key={i.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${on ? 'bg-[#5D3E85]/5 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
              <input type="checkbox" checked={on} onChange={() => onToggle(i.id)} />
              {i.image !== undefined && (
                <span className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/10 shrink-0 grid place-items-center">
                  {i.image ? <img src={i.image} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
                </span>
              )}
              <span className="flex-1 min-w-0 truncate text-sm text-gray-800 dark:text-gray-100">{i.name}</span>
              <span className="text-xs text-gray-400 tabular-nums shrink-0">{renderMeta(i)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
];

/** One dialog for creating or editing a collection: details, products and categories together. */
function CollectionDialog({ col, products, categories, onClose }) {
  const queryClient = useQueryClient();
  const currency = getCurrencySymbol();
  const isNew = !col;
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState({
    name: col?.name || '',
    description: col?.description || '',
    banner_url: col?.banner_url || '',
    is_published: col ? !!col.is_published : true,
    show_in_mega_menu: col ? inMegaMenu(col) : true,
  });
  const initialProducts = useMemo(() => (col?.products || []).map((p) => p.id), [col]);
  const initialCategories = useMemo(() => (col?.categories || []).map((c) => c.id), [col]);
  const [productIds, setProductIds] = useState(initialProducts);
  const [categoryIds, setCategoryIds] = useState(initialCategories);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  const toggleIn = (setter) => (id) => setter((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  const setAllIn = (setter) => (ids, on) => setter((list) => (on ? [...new Set([...list, ...ids])] : list.filter((x) => !ids.includes(x))));

  const detailsChanged = isNew || form.name !== col.name || form.description !== (col.description || '')
    || form.banner_url !== (col.banner_url || '') || form.is_published !== !!col.is_published || form.show_in_mega_menu !== inMegaMenu(col);
  const productsChanged = !sameSet(productIds, initialProducts);
  const categoriesChanged = !sameSet(categoryIds, initialCategories);
  const dirty = detailsChanged || productsChanged || categoriesChanged;
  const renamed = !isNew && form.name.trim() !== col.name;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const close = () => {
    if (dirty && !isNew && !window.confirm('Discard your unsaved changes?')) return;
    onClose();
  };

  const save = useMutation({
    mutationFn: async () => {
      let id = col?.id;
      if (detailsChanged) {
        const data = await request(isNew ? '/api/admin/collections' : `/api/admin/collections/${id}`, isNew ? 'POST' : 'PUT', { ...form, name: form.name.trim() });
        id = data.data.id;
      }
      if (productsChanged) await request(`/api/admin/collections/${id}/products`, 'POST', { product_ids: productIds });
      if (categoriesChanged) await request(`/api/admin/collections/${id}/categories`, 'POST', { category_ids: categoryIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      toast.success(isNew ? `"${form.name.trim()}" created.` : 'Collection saved.');
      onClose();
    },
    onError: (err) => {
      // A new collection may exist even if linking failed; refresh so it isn't created twice.
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      toast.error(err.message);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setTab('details'); return; }
    save.mutate();
  };

  const counts = { products: productIds.length, categories: categoryIds.length };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-dialog-title"
        className="bg-white dark:bg-[#1E1528] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-white/10 text-left overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="min-w-0">
            <h3 id="collection-dialog-title" className="truncate">{isNew ? 'New collection' : col.name}</h3>
            {!isNew && <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">/{col.slug}</p>}
          </div>
          <button type="button" onClick={close} title="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6">
          <div className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-full" role="tablist">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={tab === t.key ? 'bg-white' : ''}>
                {t.label}{counts[t.key] !== undefined && <span className="ml-1.5 text-gray-400 tabular-nums">{counts[t.key]}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'details' && (
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="col-name" className="block">Name</label>
                <input id="col-name" type="text" required autoFocus value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Glowing Face Formulas" className="w-full" />
                {renamed && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
                    Renaming changes the link to this collection. Shop-by-concern cards and saved links that use /{col.slug} will need updating.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="col-desc" className="block">Description</label>
                <textarea id="col-desc" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="A sentence or two shoppers see on the collection page." className="w-full resize-none" />
              </div>
              <ImageUploadField label="Banner" value={form.banner_url} onChange={(url) => set({ banner_url: url })} aspect="banner" hint="Optional. Without one, the admin shows the collection's product photos." />
              <div className="flex flex-col gap-3 pt-1">
                <Switch label="Published on the storefront" checked={form.is_published} onChange={(on) => set({ is_published: on, show_in_mega_menu: on && form.show_in_mega_menu })} />
                <Switch label="Listed in the Shop mega menu" checked={form.show_in_mega_menu} onChange={(on) => set({ show_in_mega_menu: on, is_published: on || form.is_published })} />
              </div>
            </div>
          )}

          {tab === 'products' && (
            <Checklist
              noun="product"
              items={products.map((p) => ({ id: p.id, name: p.name, image: productImage(p), price: p.price, status: p.status }))}
              selected={productIds}
              onToggle={toggleIn(setProductIds)}
              onSetAll={setAllIn(setProductIds)}
              renderMeta={(p) => (p.status && p.status !== 'published' ? <span className="text-amber-600">{p.status}</span> : `${currency}${p.price}`)}
            />
          )}

          {tab === 'categories' && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Every product in a linked category also appears in this collection.</p>
              <Checklist
                noun="category"
                items={categories.map((c) => ({ id: c.id, name: c.name, count: c.products_count || 0 }))}
                selected={categoryIds}
                onToggle={toggleIn(setCategoryIds)}
                onSetAll={setAllIn(setCategoryIds)}
                renderMeta={(c) => plural(c.count, 'product', 'products')}
              />
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/10">
          <span className="text-xs text-gray-500 dark:text-gray-400">{dirty && !isNew ? 'Unsaved changes' : ''}</span>
          <div className="flex gap-2">
            <button type="button" onClick={close} className="bg-white">Cancel</button>
            <button type="submit" disabled={save.isPending || !dirty || !form.name.trim()} className="admin-btn-primary">
              {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{save.isPending ? 'Saving…' : isNew ? 'Create collection' : 'Save'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Rotating promo images in the right column of the Shop mega menu. */
function PromoBanners({ settings }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const ads = useMemo(() => {
    try {
      const raw = typeof settings.mega_menu_ads === 'string' ? JSON.parse(settings.mega_menu_ads) : settings.mega_menu_ads;
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }, [settings.mega_menu_ads]);

  const saveAds = useMutation({
    mutationFn: (next) => request('/api/admin/settings', 'PUT', { mega_menu_ads: JSON.stringify(next) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings-admin-collections'] }),
    onError: (err) => toast.error(err.message),
  });

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiFetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) saveAds.mutate([...ads, { image_url: data.url, link: '/shop', title: 'Promo' }]);
      else toast.error(data.message || 'Image upload failed');
    } catch {
      toast.error('Upload failed. Please check your connection.');
    } finally {
      setUploading(false);
    }
  };

  const updateLink = (index, link) => {
    const clean = link.trim() || '/shop';
    if (clean === ads[index].link) return;
    saveAds.mutate(ads.map((ad, i) => (i === index ? { ...ad, link: clean } : ad)));
  };

  const remove = (index) => {
    if (!window.confirm('Remove this promo banner from the mega menu?')) return;
    saveAds.mutate(ads.filter((_, i) => i !== index));
  };

  return (
    <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/15 rounded-3xl p-6 flex flex-col gap-4">
      <div>
        <h3>Mega menu promo banners</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">They rotate in the right-hand column of the Shop menu. Set where each one links to.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ads.map((ad, i) => (
          <div key={`${ad.image_url}-${i}`} className="flex flex-col gap-2">
            <div className="relative aspect-[3/2] rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10">
              <img src={ad.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur">
                <button type="button" onClick={() => remove(i)} disabled={saveAds.isPending} title="Remove banner" className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              type="text"
              defaultValue={ad.link || '/shop'}
              onBlur={(e) => updateLink(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              aria-label={`Link for banner ${i + 1}`}
              placeholder="/shop"
              className="w-full font-mono"
            />
          </div>
        ))}
        <label className={`aspect-[3/2] rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/15 hover:border-[#5D3E85] hover:bg-[#5D3E85]/5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center ${uploading ? 'pointer-events-none opacity-70' : ''}`}>
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-[#5D3E85]" /> : <Upload className="w-5 h-5 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{uploading ? 'Uploading…' : 'Add banner'}</span>
          <span className="text-xs text-gray-400">JPEG, PNG or WebP</span>
          <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} />
        </label>
      </div>
    </div>
  );
}

/** Catalog collections: a searchable list with quick switches, plus one dialog to edit everything. */
export default function CollectionsManager({ collections, products, categories, settings }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null); // null | 'new' | collection
  const [pendingId, setPendingId] = useState(null);

  const productsById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const q = query.trim().toLowerCase();
  const visible = collections.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.slug || '').includes(q));
  const publishedCount = collections.filter((c) => c.is_published).length;
  const menuCount = collections.filter(inMegaMenu).length;

  const quickUpdate = useMutation({
    mutationFn: ({ col, patch }) => request(`/api/admin/collections/${col.id}`, 'PUT', {
      name: col.name,
      banner_url: col.banner_url,
      description: col.description,
      is_published: !!col.is_published,
      show_in_mega_menu: inMegaMenu(col),
      ...patch,
    }),
    onMutate: ({ col }) => setPendingId(col.id),
    onSettled: () => { setPendingId(null); queryClient.invalidateQueries({ queryKey: ['admin-collections'] }); },
    onError: (err) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (col) => request(`/api/admin/collections/${col.id}`, 'DELETE'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-collections'] }),
    onError: (err) => toast.error(err.message),
  });

  const confirmDelete = (col) => {
    if (window.confirm(`Delete "${col.name}"? Its products stay in the catalog; only the grouping is removed.`)) remove.mutate(col);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-left">
      <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/15 rounded-3xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-white/10">
          <div className="min-w-0">
            <h3>Collections</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {plural(collections.length, 'collection', 'collections')} · {publishedCount} published · {menuCount} in the mega menu
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {collections.length > 5 && (
              <div className="relative w-56">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a collection…" aria-label="Find a collection" className="w-full pl-10" />
              </div>
            )}
            <button type="button" onClick={() => setDialog('new')} className="admin-btn-primary">
              <FolderPlus className="w-4 h-4" />
              <span>New collection</span>
            </button>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Layers className="w-10 h-10 text-[#5D3E85]/40" />
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Collections group products for the storefront and the Shop mega menu. Create your first one to get started.</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="p-8 text-sm text-center text-gray-500 dark:text-gray-400">No collections match "{query}".</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {visible.map((col) => {
              const busy = pendingId === col.id && quickUpdate.isPending;
              const productCount = col.products?.length || 0;
              const categoryCount = col.categories?.length || 0;
              return (
                <li key={col.id} className="flex flex-wrap lg:flex-nowrap items-center gap-x-5 gap-y-3 px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setDialog(col)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDialog(col); } }}
                    className="flex items-center gap-4 flex-1 min-w-[16rem] cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-[#5D3E85]"
                  >
                    <CollectionThumb col={col} productsById={productsById} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{col.name}</span>
                        {!col.is_published && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 shrink-0">Draft</span>}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${col.description ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 italic'}`}>
                        {col.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 tabular-nums">
                        <span className={productCount ? '' : 'text-amber-700 dark:text-amber-400'}>{plural(productCount, 'product', 'products')}</span>
                        {categoryCount > 0 && <> · {plural(categoryCount, 'category', 'categories')}</>}
                        <span className="font-mono text-gray-400"> · /{col.slug}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <Switch label="Published" checked={!!col.is_published} disabled={busy}
                      onChange={(on) => quickUpdate.mutate({ col, patch: { is_published: on, show_in_mega_menu: on && inMegaMenu(col) } })} />
                    <Switch label="Mega menu" checked={inMegaMenu(col)} disabled={busy}
                      onChange={(on) => quickUpdate.mutate({ col, patch: { show_in_mega_menu: on, is_published: on || !!col.is_published } })} />
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <button type="button" onClick={() => setDialog(col)} className="bg-white">
                      <Settings2 className="w-4 h-4" />
                      <span>Manage</span>
                    </button>
                    <button type="button" onClick={() => confirmDelete(col)} disabled={remove.isPending} title={`Delete ${col.name}`} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <PromoBanners settings={settings} />

      {dialog && (
        <CollectionDialog
          key={dialog === 'new' ? 'new' : dialog.id}
          col={dialog === 'new' ? null : dialog}
          products={products}
          categories={categories}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
