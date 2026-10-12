import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Loader2, Truck, Store, Star } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { getCurrencySymbol } from '../../utils/currency';
import SearchableSelect from '../../components/ui/SearchableSelect';
import MultiSearchSelect from '../../components/ui/MultiSearchSelect';

/**
 * Shipping methods: each is a fixed charge for a zone (UK / International /
 * everywhere). A method can also target products and/or categories, and set a
 * quantity condition (between, less than, at most, more than, at least, exactly)
 * on every item in the bag or just the targeted ones. Customers choose one of the
 * methods that apply to their order; checkout re-checks the choice and charges
 * this amount.
 */

const ZONES = [
  { value: 'uk', label: 'UK (United Kingdom only)' },
  { value: 'international', label: 'International (all other countries)' },
  { value: 'all', label: 'Everywhere' },
];
const ZONE_LABEL = { uk: 'UK', international: 'International', all: 'Everywhere' };

const CONDITIONS = [
  { value: 'between', label: 'Between (range)', symbol: '' },
  { value: 'lt', label: 'Less than', symbol: '<' },
  { value: 'lte', label: 'At most (≤)', symbol: '≤' },
  { value: 'gt', label: 'More than', symbol: '>' },
  { value: 'gte', label: 'At least (≥)', symbol: '≥' },
  { value: 'eq', label: 'Exactly', symbol: '=' },
];
const CONDITION_WORDS = { lt: 'fewer than', lte: 'at most', gt: 'more than', gte: 'at least', eq: 'exactly' };

const EMPTY = {
  name: '',
  rate: '0',
  zone: 'uk',
  min_quantity: '1',
  max_quantity: '',
  product_ids: [],
  category_ids: [],
  target_match: 'any',
  quantity_basis: 'bag',
  quantity_condition: 'between',
  quantity_value: '',
  overrides_others: false,
  charge_per_item: false,
  description: '',
  is_default: false,
  is_pickup: false,
  is_active: true,
  sort_order: '0',
};

function quantityText(min, max, noun = 'items') {
  const lo = min ?? null;
  const hi = max ?? null;
  if (lo !== null && hi !== null) return lo === hi ? `${lo} ${noun}` : `${lo}–${hi} ${noun}`;
  if (lo !== null) return `${lo}+ ${noun}`;
  if (hi !== null) return `up to ${hi} ${noun}`;
  return `any number of ${noun}`;
}

/** Plain-English summary of when a method applies. */
function describeRule(m, productNames = {}, categoryNames = {}) {
  const products = (m.product_ids || []).map((id) => productNames[id] || `product #${id}`);
  const categories = (m.category_ids || []).map((id) => categoryNames[id] || `category #${id}`);
  const targeted = products.length + categories.length > 0;
  const noun = targeted && m.quantity_basis === 'matching' ? 'of those items' : 'items in the bag';
  const condition = m.quantity_condition || 'between';
  const qty = condition === 'between'
    ? quantityText(m.min_quantity ?? null, m.max_quantity ?? null, noun)
    : `${CONDITION_WORDS[condition]} ${m.quantity_value ?? '?'} ${noun}`;
  if (!targeted) return qty.charAt(0).toUpperCase() + qty.slice(1);
  const list = [...categories.map((c) => `${c} (category)`), ...products].join(', ');
  const when = m.target_match === 'all' ? `Only ${list} in the bag` : `Bag contains ${list}`;
  return `${when} · ${qty}${m.overrides_others ? ' · replaces general methods' : ''}`;
}

const inputClass = 'px-3 py-2 rounded-lg border text-xs bg-white text-gray-800 w-full focus:outline-none';
const labelClass = 'text-[11px] text-gray-600 font-semibold';

export default function AdminShipping() {
  const queryClient = useQueryClient();
  const currency = getCurrencySymbol();
  const [form, setForm] = useState(null); // null = closed
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shipping-rates'],
    queryFn: () => apiFetch('/api/admin/shipping-rates').then((res) => res.json()),
  });
  const methods = data?.data || [];

  const { data: productsRes } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiFetch('/api/admin/products').then((res) => res.json()),
    staleTime: 60_000,
  });
  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiFetch('/api/admin/categories').then((res) => res.json()),
    staleTime: 60_000,
  });
  const productList = Array.isArray(productsRes?.data) ? productsRes.data : (productsRes?.data?.data || []);
  const categoryList = categoriesRes?.data || [];
  const productNames = Object.fromEntries(productList.map((p) => [p.id, p.name]));
  const categoryNames = Object.fromEntries(categoryList.map((c) => [c.id, c.name]));
  const productOptions = productList.map((p) => ({ value: p.id, label: p.name, hint: p.sku || '' }));
  const categoryOptions = categoryList.map((c) => ({ value: c.id, label: c.name, hint: c.parent?.name ? `in ${c.parent.name}` : '' }));

  const save = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch(editingId ? `/api/admin/shipping-rates/${editingId}` : '/api/admin/shipping-rates', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        const firstError = json.errors ? Object.values(json.errors)[0]?.[0] : null;
        throw new Error(firstError || json.message || 'Could not save the shipping method.');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-rates'] });
      setForm(null);
    },
    onError: (e) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id) => apiFetch(`/api/admin/shipping-rates/${id}`, { method: 'DELETE' }).then((res) => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-shipping-rates'] }),
  });

  const toggleActive = useMutation({
    mutationFn: (method) => apiFetch(`/api/admin/shipping-rates/${method.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...toPayload(toForm(method)), is_active: !method.is_active }),
    }).then((res) => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-shipping-rates'] }),
  });

  function toForm(method) {
    return {
      name: method.name || '',
      rate: String(method.rate ?? '0'),
      zone: method.zone || 'all',
      min_quantity: method.min_quantity == null ? '' : String(method.min_quantity),
      max_quantity: method.max_quantity == null ? '' : String(method.max_quantity),
      product_ids: method.product_ids || [],
      category_ids: method.category_ids || [],
      target_match: method.target_match || 'any',
      quantity_basis: method.quantity_basis || 'bag',
      quantity_condition: method.quantity_condition || 'between',
      quantity_value: method.quantity_value == null ? '' : String(method.quantity_value),
      overrides_others: !!method.overrides_others,
      charge_per_item: !!method.charge_per_item,
      description: method.description || '',
      is_default: !!method.is_default,
      is_pickup: !!method.is_pickup,
      is_active: method.is_active !== false,
      sort_order: String(method.sort_order ?? 0),
    };
  }

  function toPayload(f) {
    return {
      name: f.name.trim(),
      rate: Number(f.rate || 0),
      zone: f.zone,
      min_quantity: f.quantity_condition !== 'between' || f.min_quantity === '' ? null : Number(f.min_quantity),
      max_quantity: f.quantity_condition !== 'between' || f.max_quantity === '' ? null : Number(f.max_quantity),
      product_ids: f.product_ids.map(Number),
      category_ids: f.category_ids.map(Number),
      target_match: f.target_match,
      quantity_basis: f.quantity_basis,
      quantity_condition: f.quantity_condition,
      quantity_value: f.quantity_condition === 'between' || f.quantity_value === '' ? null : Number(f.quantity_value),
      overrides_others: f.overrides_others,
      charge_per_item: f.charge_per_item,
      description: f.description.trim() || null,
      is_default: f.is_default,
      is_pickup: f.is_pickup,
      is_active: f.is_active,
      sort_order: Number(f.sort_order || 0),
    };
  }

  const openCreate = () => { setEditingId(null); setError(''); setForm({ ...EMPTY, sort_order: String(methods.length + 1) }); };
  const openEdit = (method) => { setEditingId(method.id); setError(''); setForm(toForm(method)); };
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    save.mutate(toPayload(form));
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-gray-900 text-2xl">Shipping methods</h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Each method is a fixed charge for a zone. It can also target products or categories and set a quantity
            condition. At checkout, customers see only the methods that match their country and bag, and choose one.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="admin-btn-primary self-start sm:self-auto inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add shipping method
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Method</th>
              <th className="text-left font-semibold px-4 py-3">Zone</th>
              <th className="text-left font-semibold px-4 py-3">Applies to</th>
              <th className="text-right font-semibold px-4 py-3">Charge</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400"><Loader2 className="w-4 h-4 animate-spin inline" /> Loading…</td></tr>
            )}
            {!isLoading && methods.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No shipping methods yet.</td></tr>
            )}
            {methods.map((m) => (
              <tr key={m.id} className={`border-t border-gray-100 ${m.is_active ? '' : 'opacity-50'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    {m.is_pickup ? <Store className="w-3.5 h-3.5 text-gray-400" /> : <Truck className="w-3.5 h-3.5 text-gray-400" />}
                    {m.name}
                    {m.is_default && <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded"><Star className="w-3 h-3" /> Default</span>}
                  </div>
                  {m.description && <div className="text-gray-500 mt-0.5">{m.description}</div>}
                </td>
                <td className="px-4 py-3 text-gray-700">{ZONE_LABEL[m.zone] || 'Everywhere'}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs">{describeRule(m, productNames, categoryNames)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {parseFloat(m.rate) === 0 ? 'Free' : `${currency}${parseFloat(m.rate).toFixed(2)}`}
                  {m.charge_per_item && parseFloat(m.rate) > 0 && <span className="block text-[10px] font-semibold text-gray-500">per item</span>}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive.mutate(m)}
                    className={`px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer ${m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {m.is_active ? 'On' : 'Off'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-gray-500 hover:text-[#5D3E85] hover:bg-gray-50 cursor-pointer" aria-label={`Edit ${m.name}`}><Edit className="w-4 h-4" /></button>
                    <button
                      type="button"
                      onClick={() => { if (window.confirm(`Delete "${m.name}"?`)) remove.mutate(m.id); }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      aria-label={`Delete ${m.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92dvh] shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-gray-900 text-lg">{editingId ? 'Edit shipping method' : 'Add shipping method'}</h3>
              <button type="button" onClick={() => setForm(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={submit} className="p-5 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Method name *</label>
                <input required value={form.name} onChange={set('name')} className={inputClass} placeholder="e.g. Uk Shipping (1-3 Items)" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>{form.charge_per_item ? `Charge per item (${currency}) *` : `Shipping charge (${currency}) *`}</label>
                  <input required type="number" min="0" step="0.01" value={form.rate} onChange={set('rate')} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Zone *</label>
                  <SearchableSelect value={form.zone} onChange={set('zone')} className={inputClass}>
                    {ZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                  </SearchableSelect>
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 p-3.5 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.charge_per_item} onChange={set('charge_per_item')} className="w-4 h-4 mt-0.5 accent-[#5D3E85]" />
                <span>
                  <strong className="block text-gray-900">Charge per item</strong>
                  Multiply the charge by the number of items this method covers: the selected products/categories, or every item in the bag when none are selected.
                  {form.charge_per_item && Number(form.rate) > 0 && (
                    <span className="block mt-1 text-[#5D3E85] font-semibold">e.g. 3 items × {currency}{Number(form.rate).toFixed(2)} = {currency}{(3 * Number(form.rate)).toFixed(2)}</span>
                  )}
                </span>
              </label>

              {/* Products & categories */}
              <fieldset className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
                <legend className="px-1 text-[11px] font-bold text-gray-700">Products & categories (optional)</legend>
                <p className="text-[11px] text-gray-500 -mt-1">Leave both empty for a general method that applies to any bag.</p>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor="ship-categories">Categories</label>
                  <MultiSearchSelect id="ship-categories" options={categoryOptions} value={form.category_ids} onChange={(v) => setForm((f) => ({ ...f, category_ids: v }))} placeholder="Search categories…" />
                  <span className="text-[10px] text-gray-400">A category includes its sub-categories.</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor="ship-products">Products</label>
                  <MultiSearchSelect id="ship-products" options={productOptions} value={form.product_ids} onChange={(v) => setForm((f) => ({ ...f, product_ids: v }))} placeholder="Search products…" />
                </div>
                {(form.product_ids.length + form.category_ids.length) > 0 && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className={labelClass}>Applies when</span>
                      {[
                        ['any', 'The bag contains any of these'],
                        ['all', 'Every item in the bag is one of these'],
                      ].map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input type="radio" name="target_match" value={value} checked={form.target_match === value} onChange={set('target_match')} className="w-4 h-4 accent-[#5D3E85]" />
                          {label}
                        </label>
                      ))}
                    </div>
                    <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={form.overrides_others} onChange={set('overrides_others')} className="w-4 h-4 mt-0.5 accent-[#5D3E85]" />
                      <span>Replace general methods: when this method applies, hide methods that don't target products or categories.</span>
                    </label>
                  </>
                )}
              </fieldset>

              {/* Quantity condition */}
              <fieldset className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
                <legend className="px-1 text-[11px] font-bold text-gray-700">Quantity condition</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Condition</label>
                    <SearchableSelect value={form.quantity_condition} onChange={set('quantity_condition')} className={inputClass}>
                      {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </SearchableSelect>
                  </div>
                  {(form.product_ids.length + form.category_ids.length) > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Count</label>
                      <SearchableSelect value={form.quantity_basis} onChange={set('quantity_basis')} className={inputClass}>
                        <option value="bag">Every item in the bag</option>
                        <option value="matching">Only the selected products/categories</option>
                      </SearchableSelect>
                    </div>
                  )}
                </div>
                {form.quantity_condition === 'between' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Minimum items</label>
                      <input type="number" min="0" value={form.min_quantity} onChange={set('min_quantity')} className={inputClass} placeholder="No minimum" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Maximum items</label>
                      <input type="number" min="0" value={form.max_quantity} onChange={set('max_quantity')} className={inputClass} placeholder="No maximum" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 sm:w-1/2">
                    <label className={labelClass}>Number of items *</label>
                    <input required type="number" min="0" value={form.quantity_value} onChange={set('quantity_value')} className={inputClass} placeholder="e.g. 3" />
                  </div>
                )}
              </fieldset>
              <p className="text-[11px] text-gray-500 -mt-2">
                Applies in <strong>{ZONE_LABEL[form.zone]}</strong> when: <strong>{describeRule({
                  ...form,
                  min_quantity: form.min_quantity === '' ? null : Number(form.min_quantity),
                  max_quantity: form.max_quantity === '' ? null : Number(form.max_quantity),
                  quantity_value: form.quantity_value === '' ? null : Number(form.quantity_value),
                }, productNames, categoryNames)}</strong>.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Tooltip / description</label>
                <input value={form.description} onChange={set('description')} className={inputClass} placeholder="Shown under the method at checkout" maxLength={500} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  ['is_active', 'Enabled'],
                  ['is_default', 'Default selection'],
                  ['is_pickup', 'Customer collects (pick up)'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form[key]} onChange={set(key)} className="w-4 h-4 accent-[#5D3E85]" />
                    {label}
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 sm:w-40">
                <label className={labelClass}>Display order</label>
                <input type="number" min="0" value={form.sort_order} onChange={set('sort_order')} className={inputClass} />
              </div>

              {error && <p className="text-xs text-rose-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setForm(null)} className="admin-btn-secondary">Cancel</button>
                <button type="submit" disabled={save.isPending} className="admin-btn-primary inline-flex items-center gap-1.5">
                  {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save changes' : 'Create method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
