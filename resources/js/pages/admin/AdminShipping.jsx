import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Loader2, Truck, Store, Star } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { getCurrencySymbol } from '../../utils/currency';
import SearchableSelect from '../../components/ui/SearchableSelect';

/**
 * Shipping methods, set up the way the old store had them: each method is a
 * fixed charge that applies to a zone (UK / International / everywhere) and a
 * range of item quantities. Customers choose one of the methods that apply to
 * their order; checkout re-checks the choice and charges this amount.
 */

const ZONES = [
  { value: 'uk', label: 'UK (United Kingdom only)' },
  { value: 'international', label: 'International (all other countries)' },
  { value: 'all', label: 'Everywhere' },
];
const ZONE_LABEL = { uk: 'UK', international: 'International', all: 'Everywhere' };

const EMPTY = {
  name: '',
  rate: '0',
  zone: 'uk',
  min_quantity: '1',
  max_quantity: '',
  description: '',
  is_default: false,
  is_pickup: false,
  is_active: true,
  sort_order: '0',
};

function quantityText(min, max) {
  const lo = min ?? null;
  const hi = max ?? null;
  if (lo !== null && hi !== null) return lo === hi ? `${lo} item${lo === 1 ? '' : 's'}` : `${lo}–${hi} items`;
  if (lo !== null) return `${lo}+ items`;
  if (hi !== null) return `up to ${hi} items`;
  return 'Any quantity';
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
      min_quantity: f.min_quantity === '' ? null : Number(f.min_quantity),
      max_quantity: f.max_quantity === '' ? null : Number(f.max_quantity),
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
            Each method is a fixed charge for a zone and a range of item quantities. At checkout, customers see only the
            methods that match their country and number of items, and choose one.
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
                <td className="px-4 py-3 text-gray-700">{quantityText(m.min_quantity, m.max_quantity)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {parseFloat(m.rate) === 0 ? 'Free' : `${currency}${parseFloat(m.rate).toFixed(2)}`}
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
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl flex flex-col">
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
                  <label className={labelClass}>Shipping charge ({currency}) *</label>
                  <input required type="number" min="0" step="0.01" value={form.rate} onChange={set('rate')} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Zone *</label>
                  <SearchableSelect value={form.zone} onChange={set('zone')} className={inputClass}>
                    {ZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                  </SearchableSelect>
                </div>
              </div>

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
              <p className="text-[11px] text-gray-500 -mt-2">
                Applies to: <strong>{quantityText(form.min_quantity === '' ? null : Number(form.min_quantity), form.max_quantity === '' ? null : Number(form.max_quantity))}</strong>
                {' '}in <strong>{ZONE_LABEL[form.zone]}</strong>.
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
