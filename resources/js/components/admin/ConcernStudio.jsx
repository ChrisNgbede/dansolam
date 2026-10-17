import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Save, X, Check, ArrowUp, ArrowDown, ArrowRight, Image as ImageIcon,
  Loader2, Search, AlertCircle, Upload, Target, Eye, EyeOff, Package,
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { toast } from '../ui/ToastProvider';

const FILTER_TYPES = [
  { value: 'category', label: 'Categories', noun: 'category', plural: 'categories' },
  { value: 'collection', label: 'Collections', noun: 'collection', plural: 'collections' },
  { value: 'products', label: 'Products', noun: 'product', plural: 'products' },
];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const productImage = (p) => p.images?.[0]?.image_url || p.image_url || null;
const newest = (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || (b.id || 0) - (a.id || 0);

/**
 * The published products a card links to, newest first, worked out the same way
 * the storefront does (StorefrontController::applyConcernFilter).
 */
function matchingProducts(item, products, collections) {
  const values = (item.filter_values || []).map(String);
  if (!values.length) return [];
  const published = products.filter((p) => p.status === 'published');
  let matches;
  if (item.filter_type === 'products') {
    matches = published.filter((p) => values.includes(String(p.id)));
  } else if (item.filter_type === 'collection') {
    const ids = new Set(collections.filter((c) => values.includes(c.slug)).flatMap((c) => (c.products || []).map((p) => p.id)));
    matches = published.filter((p) => ids.has(p.id));
  } else {
    matches = published.filter((p) => (p.categories || []).some((c) => values.includes(c.slug)));
  }
  return [...matches].sort(newest);
}

/** Whether a card will appear on the homepage, and why not. */
function cardStatus(item, count) {
  if (!item.name?.trim()) return { live: false, label: 'Needs a title' };
  if (!(item.filter_values || []).length) return { live: false, label: 'No products chosen' };
  if (count === 0) return { live: false, label: 'No published products' };
  return { live: true, label: `${count} ${count === 1 ? 'product' : 'products'}` };
}

/** Small cover thumbnail for the card list: the custom photo or the first product shot. */
function CardThumb({ item, shots }) {
  const src = item.image || shots[0];
  return (
    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F8EEF6] dark:bg-white/10 shrink-0 grid place-items-center">
      {src ? (
        <img src={src} alt="" className={`w-full h-full ${item.image ? 'object-cover' : 'object-contain p-1 mix-blend-multiply'}`} />
      ) : (
        <Package className="w-5 h-5 text-[#5D3E85]/50 dark:text-white/40" />
      )}
    </div>
  );
}

/** A faithful copy of the homepage card (Home.jsx), so edits are seen as shoppers will see them. */
function CardPreview({ item, shots, count }) {
  return (
    <div className="group flex flex-col rounded-[28px] overflow-hidden bg-[#2A1740] shadow-sm w-full max-w-[300px] mx-auto">
      <div className="relative aspect-[5/4] bg-[#F8EEF6] overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-white/0 via-transparent to-[#5D3E85]/15" />
        {item.image ? (
          <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-contain p-[5%] rounded-[22px] mix-blend-multiply" />
        ) : shots.length > 0 ? (
          <div className="absolute inset-0 grid place-items-center">
            {shots.map((src, i) => (
              <div key={src} className={`concern-shot concern-shot--${i} absolute w-[42%] aspect-square rounded-2xl overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_14px_28px_rgba(42,23,64,0.22)]`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center px-6">
            <span className="text-xs font-semibold text-[#5D3E85]/70">Choose products to fill this image</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-5">
        <span className="font-serif font-bold text-lg leading-tight text-white">{item.name || 'Card title'}</span>
        {item.blurb && <span className="text-[13px] leading-relaxed text-white/85">{item.blurb}</span>}
        <span className="pt-1.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#F9B8DA]">
          Shop {count} {count === 1 ? 'product' : 'products'}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

/** Chooses which products a card shows: categories, collections or hand-picked products. */
function FilterPicker({ item, categories, collections, products, onChange }) {
  const [query, setQuery] = useState('');
  const type = FILTER_TYPES.find((t) => t.value === item.filter_type) || FILTER_TYPES[0];
  const selected = (item.filter_values || []).map(String);

  const options = useMemo(() => {
    const all = type.value === 'products'
      ? products.map((p) => ({ value: String(p.id), label: p.name, image: productImage(p) }))
      : (type.value === 'collection' ? collections : categories).map((c) => ({
          value: c.slug,
          label: c.name,
          count: c.products_count ?? c.products?.length,
        }));
    const q = query.trim().toLowerCase();
    return q ? all.filter((o) => o.label.toLowerCase().includes(q)) : all;
  }, [type.value, products, collections, categories, query]);

  const labelOf = useMemo(() => {
    const source = type.value === 'products'
      ? products.map((p) => [String(p.id), p.name])
      : (type.value === 'collection' ? collections : categories).map((c) => [c.slug, c.name]);
    return Object.fromEntries(source);
  }, [type.value, products, collections, categories]);

  const toggle = (value) => onChange({
    filter_values: selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
  });

  const switchType = (value) => {
    if (value === type.value) return;
    if (selected.length && !window.confirm(`Switching clears the ${selected.length} ${type.plural} you picked. Continue?`)) return;
    setQuery('');
    onChange({ filter_type: value, filter_values: [] });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-full" role="tablist" aria-label="Choose products by">
          {FILTER_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={type.value === t.value}
              onClick={() => switchType(t.value)}
              className={type.value === t.value ? 'bg-white' : ''}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Find a ${type.noun}…`}
            aria-label={`Find a ${type.noun}`}
            className="w-full pl-10"
          />
        </div>
      </div>

      {/* Selected items stay visible however long the list is. */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Selected:</span>
          {selected.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 pl-3 pr-1 py-0.5 rounded-full bg-[#5D3E85]/10 dark:bg-white/10 text-[#5D3E85] dark:text-white text-xs font-semibold">
              <span className="truncate max-w-[200px]">{labelOf[v] || v}</span>
              <button type="button" onClick={() => toggle(v)} title={`Remove ${labelOf[v] || v}`} className="text-current">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5">
        {options.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 p-4">
            {query ? `No ${type.plural} match "${query}".` : `There are no ${type.plural} yet.`}
          </p>
        )}
        {options.map((o) => {
          const isOn = selected.includes(o.value);
          return (
            <label
              key={o.value}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isOn ? 'bg-[#5D3E85]/5 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <input type="checkbox" checked={isOn} onChange={() => toggle(o.value)} />
              {type.value === 'products' && (
                <span className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/10 shrink-0 grid place-items-center">
                  {o.image ? <img src={o.image} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
                </span>
              )}
              <span className="flex-1 min-w-0 truncate text-sm text-gray-800 dark:text-gray-100">{o.label}</span>
              {o.count !== undefined && (
                <span className="text-xs text-gray-400 tabular-nums shrink-0">{o.count} {o.count === 1 ? 'product' : 'products'}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

const snapshot = (show, eyebrow, title, items) => JSON.stringify({ show, eyebrow, title, items });

/**
 * Admin editor for the homepage "Shop by concern" section: section settings on
 * top, the cards as a reorderable list, and one card's editor with a live preview.
 */
export default function ConcernStudio({ settingsRes, categories, collections, products }) {
  const queryClient = useQueryClient();
  const [show, setShow] = useState(true);
  const [eyebrow, setEyebrow] = useState('Shop by concern');
  const [title, setTitle] = useState('Start where your skin is');
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [saved, setSaved] = useState(null);
  const titleInputRef = useRef(null);

  // Load the saved section once settings arrive.
  useEffect(() => {
    const s = settingsRes?.data?.settings;
    if (!s) return;
    const nextShow = s.shop_by_concern_show === undefined ? true : (s.shop_by_concern_show === 'true' || s.shop_by_concern_show === true);
    const nextEyebrow = s.shop_by_concern_eyebrow || 'Shop by concern';
    const nextTitle = s.shop_by_concern_title || 'Start where your skin is';
    let nextItems = [];
    try {
      const parsed = typeof s.shop_by_concern_items === 'string' ? JSON.parse(s.shop_by_concern_items) : s.shop_by_concern_items;
      if (Array.isArray(parsed)) nextItems = parsed;
    } catch { /* keep empty */ }
    setShow(nextShow);
    setEyebrow(nextEyebrow);
    setTitle(nextTitle);
    setItems(nextItems);
    setSelectedId((id) => (nextItems.some((c) => c.id === id) ? id : nextItems[0]?.id ?? null));
    setSaved(snapshot(nextShow, nextEyebrow, nextTitle, nextItems));
  }, [settingsRes]);

  const dirty = saved !== null && saved !== snapshot(show, eyebrow, title, items);

  // Don't lose unsaved edits to a refresh or closed tab.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const matches = useMemo(
    () => Object.fromEntries(items.map((c) => [c.id, matchingProducts(c, products, collections)])),
    [items, products, collections],
  );
  const shotsFor = (id) => (matches[id] || []).map(productImage).filter(Boolean).slice(0, 3);
  const liveCount = items.filter((c) => cardStatus(c, matches[c.id]?.length || 0).live).length;

  const selectedIndex = items.findIndex((c) => c.id === selectedId);
  const selected = items[selectedIndex];

  const updateCard = (id, patch) => setItems((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addCard = () => {
    const card = { id: Date.now(), name: '', blurb: '', image: '', filter_type: 'category', filter_values: [] };
    setItems((list) => [...list, card]);
    setSelectedId(card.id);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const removeCard = (id) => {
    const card = items.find((c) => c.id === id);
    if (!window.confirm(`Delete "${card?.name || 'Untitled card'}"? It disappears from the homepage when you save.`)) return;
    const index = items.findIndex((c) => c.id === id);
    const rest = items.filter((c) => c.id !== id);
    setItems(rest);
    setSelectedId(rest[Math.min(index, rest.length - 1)]?.id ?? null);
  };

  const moveCard = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((list) => {
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const uploadCover = async (id, file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) { toast.error('Only JPEG, PNG, WebP or GIF images are allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB.'); return; }
    setUploadingId(id);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiFetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) updateCard(id, { image: data.url });
      else toast.error(data.message || 'Image upload failed');
    } catch {
      toast.error('Upload failed. Please check your connection.');
    } finally {
      setUploadingId(null);
    }
  };

  const saveMutation = useMutation({
    // apiFetch announces the result, so no toast here.
    mutationFn: ({ payload }) => apiFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }).then((res) => res.json()),
    onSuccess: (data, { state }) => {
      if (data.success) {
        setSaved(state);
        // The Collections screen reads its own copy of the settings; refresh both.
        queryClient.invalidateQueries({ queryKey: ['settings-admin-collections'] });
        queryClient.invalidateQueries({ queryKey: ['settings'] });
      }
    },
  });

  const save = () => {
    const unnamed = items.filter((c) => !c.name?.trim()).length;
    if (unnamed && !window.confirm(`${unnamed} ${unnamed === 1 ? 'card has' : 'cards have'} no title and won't show on the homepage. Save anyway?`)) return;
    saveMutation.mutate({
      payload: {
        shop_by_concern_show: show ? 'true' : 'false',
        shop_by_concern_eyebrow: eyebrow,
        shop_by_concern_title: title,
        shop_by_concern_items: JSON.stringify(items),
      },
      state: snapshot(show, eyebrow, title, items),
    });
  };

  const selectedCount = selected ? matches[selected.id]?.length || 0 : 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-left">
      {/* Section settings + save */}
      <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/15 rounded-3xl p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3>Homepage section</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {show
                ? `${liveCount} of ${items.length} ${items.length === 1 ? 'card is' : 'cards are'} showing on the homepage.`
                : 'This section is hidden from the homepage.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {dirty && !saveMutation.isPending && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            )}
            <button type="button" onClick={save} disabled={saveMutation.isPending || !dirty} className="admin-btn-primary">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saveMutation.isPending ? 'Saving…' : 'Save changes'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div>
            <label htmlFor="concern-eyebrow" className="block">Eyebrow</label>
            <input id="concern-eyebrow" type="text" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="e.g. Shop by concern" className="w-full" />
          </div>
          <div>
            <label htmlFor="concern-title" className="block">Headline</label>
            <input id="concern-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Start where your skin is" className="w-full" />
          </div>
          <label className="flex items-center gap-3 h-10 cursor-pointer select-none">
            <input type="checkbox" className="sr-only peer" checked={show} onChange={(e) => setShow(e.target.checked)} />
            <span aria-hidden="true" className="relative w-11 h-6 rounded-full bg-gray-300 dark:bg-white/20 peer-checked:bg-[#5D3E85] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#5D3E85] peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
              {show ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              {show ? 'Shown on homepage' : 'Hidden'}
            </span>
          </label>
        </div>

        {saveMutation.data && !saveMutation.data.success && (
          <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {saveMutation.data.message || 'Could not save. Please try again.'}
          </p>
        )}
      </div>

      {/* Cards: list on the left, editor on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
        <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/15 rounded-3xl overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
            <h4>Cards <span className="text-gray-400 font-medium">({items.length})</span></h4>
            <button type="button" onClick={addCard} className="bg-white py-1">
              <Plus className="w-4 h-4" />
              <span>Add card</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <Target className="w-8 h-8 text-[#5D3E85]/40" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No cards yet. Add one for each skin concern you want to feature.</p>
            </div>
          ) : (
            <ul className="p-2 flex flex-col gap-1">
              {items.map((item, index) => {
                const status = cardStatus(item, matches[item.id]?.length || 0);
                const isSelected = item.id === selectedId;
                return (
                  <li
                    key={item.id}
                    className={`group/row flex items-center gap-2 rounded-2xl pr-1 transition-colors ${isSelected ? 'bg-[#5D3E85]/10 dark:bg-white/10 ring-1 ring-[#5D3E85]/30' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(item.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(item.id); } }}
                      className="flex-1 min-w-0 flex items-center gap-3 p-2 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-[#5D3E85]"
                    >
                      <CardThumb item={item} shots={shotsFor(item.id)} />
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${item.name ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                          {item.name || 'Untitled card'}
                        </div>
                        <div className={`text-xs flex items-center gap-1.5 mt-0.5 ${status.live ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.live ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {status.live ? status.label : `Hidden · ${status.label}`}
                        </div>
                      </div>
                    </div>
                    <div className={`flex flex-col transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100 focus-within:opacity-100'}`}>
                      <button type="button" onClick={() => moveCard(index, -1)} disabled={index === 0} title="Move up">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => moveCard(index, 1)} disabled={index === items.length - 1} title="Move down">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected ? (
          <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/15 rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/10">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Card {selectedIndex + 1} of {items.length}</span>
                <h4 className="truncate">{selected.name || 'Untitled card'}</h4>
              </div>
              <button type="button" onClick={() => removeCard(selected.id)} className="bg-white py-1 text-red-700">
                <Trash2 className="w-4 h-4" />
                <span>Delete card</span>
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-8 p-6">
              <div className="flex flex-col gap-6 min-w-0">
                <section className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="concern-card-name" className="block">Title</label>
                    <input
                      id="concern-card-name"
                      ref={titleInputRef}
                      type="text"
                      value={selected.name}
                      onChange={(e) => updateCard(selected.id, { name: e.target.value })}
                      placeholder="e.g. Brightening & Glow"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="concern-card-blurb" className="block">Description</label>
                    <textarea
                      id="concern-card-blurb"
                      rows={2}
                      value={selected.blurb}
                      onChange={(e) => updateCard(selected.id, { blurb: e.target.value })}
                      placeholder="One line on what these products help with."
                      className="w-full resize-none"
                    />
                  </div>
                </section>

                <section className="flex flex-col gap-3 pt-6 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <h4>Products</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      The card links to these on the shop page.{' '}
                      {(selected.filter_values || []).length > 0 && (
                        <span className={selectedCount ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-amber-700 dark:text-amber-400 font-semibold'}>
                          {selectedCount
                            ? `${selectedCount} published ${selectedCount === 1 ? 'product matches' : 'products match'}.`
                            : 'No published products match, so the card stays hidden.'}
                        </span>
                      )}
                    </p>
                  </div>
                  <FilterPicker
                    key={selected.id}
                    item={selected}
                    categories={categories}
                    collections={collections}
                    products={products}
                    onChange={(patch) => updateCard(selected.id, patch)}
                  />
                </section>

                <section className="flex flex-col gap-3 pt-6 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <h4>Cover photo</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Optional. Without one, the card shows the three newest product photos.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {selected.image && (
                      <img src={selected.image} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-white/10" />
                    )}
                    <label className={`admin-btn-secondary inline-flex items-center gap-2 h-10 px-4 rounded-full border border-gray-300 dark:border-white/20 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 ${uploadingId === selected.id ? 'opacity-60 pointer-events-none' : ''}`}>
                      {uploadingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{uploadingId === selected.id ? 'Uploading…' : selected.image ? 'Replace photo' : 'Upload photo'}</span>
                      <input
                        type="file"
                        accept={IMAGE_TYPES.join(',')}
                        className="sr-only"
                        onChange={(e) => { uploadCover(selected.id, e.target.files[0]); e.target.value = ''; }}
                      />
                    </label>
                    {selected.image && (
                      <button type="button" onClick={() => updateCard(selected.id, { image: '' })} className="bg-white">
                        <ImageIcon className="w-4 h-4" />
                        <span>Use product photos</span>
                      </button>
                    )}
                    <span className="text-xs text-gray-400">JPEG, PNG or WebP, up to 10 MB</span>
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Homepage preview
                </span>
                <CardPreview item={selected} shots={shotsFor(selected.id)} count={selectedCount} />
                {!cardStatus(selected, selectedCount).live && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Hidden on the homepage: {cardStatus(selected, selectedCount).label.toLowerCase()}.
                  </p>
                )}
              </aside>
            </div>
          </div>
        ) : (
          <div className="adm-card bg-white dark:bg-[#1E1528] border border-dashed border-gray-300 dark:border-white/15 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
            <Target className="w-10 h-10 text-[#5D3E85]/40" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Add a card to start building this section.</p>
            <button type="button" onClick={addCard} className="admin-btn-primary">
              <Plus className="w-4 h-4" />
              <span>Add card</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
