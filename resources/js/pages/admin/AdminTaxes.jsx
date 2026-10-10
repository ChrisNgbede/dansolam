import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle, Receipt, Power, PowerOff, Globe, MapPin } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import LocationMultiSelect from '../../components/ui/LocationMultiSelect';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function AdminTaxes() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);

  const [form, setForm] = useState({
    name: '', rate: '', type: 'exclusive', applicable_areas: [], sales_channel: 'both', is_active: true,
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Settings to get dynamic Domicile/Domestic country
  const { data: settingsRes } = useQuery({
    queryKey: ['admin-settings-panel'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json())
  });
  const settings = settingsRes?.data?.settings || {};
  const domesticCountry = settings.system_domestic_country || 'United Kingdom';

  const { data: taxesRes, isLoading } = useQuery({
    queryKey: ['admin-taxes'],
    queryFn: () => apiFetch('/api/admin/taxes').then(r => r.json())
  });

  const taxes = taxesRes?.data || [];

  const table = useTableState({
    data: taxes,
    defaultPageSize: 10,
    defaultSortField: 'created_at',
    defaultSortOrder: 'desc',
    searchKeys: ['name', 'type'],
  });

  const createMutation = useMutation({
    mutationFn: (payload) => apiFetch('/api/admin/taxes', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()),
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg(data.message);
        queryClient.invalidateQueries(['admin-taxes']);
        setTimeout(() => { setShowModal(false); resetForm(); }, 1200);
      } else { setErrorMsg(data.message || 'Error creating tax.'); }
    },
    onError: () => { setActionLoading(false); setErrorMsg('Network error.'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiFetch(`/api/admin/taxes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(r => r.json()),
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg(data.message);
        queryClient.invalidateQueries(['admin-taxes']);
        setTimeout(() => { setShowModal(false); resetForm(); }, 1200);
      } else { setErrorMsg(data.message || 'Error updating tax.'); }
    },
    onError: () => { setActionLoading(false); setErrorMsg('Network error.'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/admin/taxes/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: (data) => { if (data.success) queryClient.invalidateQueries(['admin-taxes']); }
  });

  const resetForm = () => {
    setForm({ name: '', rate: '', type: 'exclusive', applicable_areas: [], sales_channel: 'both', is_active: true });
    setEditingTax(null);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (t) => {
    resetForm();
    setEditingTax(t);
    
    let areas = [];
    if (t.applicable_areas && t.applicable_areas !== 'all') {
      try {
        const parsed = JSON.parse(t.applicable_areas);
        if (Array.isArray(parsed)) {
          areas = parsed;
        }
      } catch (e) {
        areas = [t.applicable_areas];
      }
    }

    setForm({
      name: t.name || '',
      rate: t.rate || '',
      type: t.type || 'exclusive',
      applicable_areas: areas,
      sales_channel: t.sales_channel || 'both',
      is_active: t.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setActionLoading(true);
    
    const payload = { 
      ...form, 
      rate: parseFloat(form.rate) || 0,
      applicable_areas: form.applicable_areas.length > 0 ? JSON.stringify(form.applicable_areas) : 'all'
    };
    
    if (editingTax) {
      updateMutation.mutate({ id: editingTax.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => { if (confirm('Delete this tax rule?')) deleteMutation.mutate(id); };

  const parseAreas = (areas) => {
    if (!areas || areas === 'all') return 'All Regions';
    try {
      const parsed = JSON.parse(areas);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch { }
    return areas;
  };

  if (isLoading) return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Tax Rules</h2>
          <p className="text-xs text-gray-400 mt-1">Configure inclusive/exclusive tax rates and define applicable regions.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Add Tax Rule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Receipt className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Rules</p>
            <p className="text-lg font-bold text-gray-900">{taxes.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Power className="w-5 h-5 text-green-600" /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Active</p>
            <p className="text-lg font-bold text-gray-900">{taxes.filter(t => t.is_active).length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Globe className="w-5 h-5 text-amber-600" /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Exclusive Taxes</p>
            <p className="text-lg font-bold text-gray-900">{taxes.filter(t => t.type === 'exclusive').length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search tax rules..."
          value={table.searchQuery}
          onChange={e => table.setSearchQuery(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150">
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-800" onClick={() => table.requestSort('name')}>
                  Name {table.sortField === 'name' && (table.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-800" onClick={() => table.requestSort('rate')}>
                  Rate {table.sortField === 'rate' && (table.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Applicable Areas</th>
                <th className="text-center px-4 py-3 font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.paginatedData.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No tax rules configured.</td></tr>
              ) : table.paginatedData.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800">{t.name}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{parseFloat(t.rate)}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${t.type === 'exclusive' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'}`}>
                      {t.type === 'exclusive' ? 'Exclusive (added on top)' : 'Inclusive (built into price)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {parseAreas(t.applicable_areas)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.is_active ? (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full"><Power className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full"><PowerOff className="w-3 h-3" /> Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePaginationControls
          currentPage={table.currentPage}
          pageSize={table.pageSize}
          totalPages={table.totalPages}
          totalCount={table.totalCount}
          filteredCount={table.filteredCount}
          onPageChange={table.setCurrentPage}
          onPageSizeChange={table.setPageSize}
          onJumpToPage={table.jumpToPage}
        />
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">{editingTax ? 'Edit Tax Rule' : 'Add Tax Rule'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && <div className="bg-red-50 border border-red-150 text-red-500 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
            {successMsg && <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5"><CheckCircle className="w-4 h-4 shrink-0" />{successMsg}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Tax Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" placeholder="e.g. VAT, Sales Tax, GST" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Rate (%) *</label>
                  <input type="number" required step="0.01" min="0" max="100" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" placeholder="7.5" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Type *</label>
                  <SearchableSelect value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white">
                    <option value="exclusive">Exclusive (added on top of price)</option>
                    <option value="inclusive">Inclusive (already in price)</option>
                  </SearchableSelect>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Applicable Areas</label>
                <LocationMultiSelect
                  selected={form.applicable_areas}
                  onChange={val => setForm({ ...form, applicable_areas: val })}
                  domesticCountry={domesticCountry}
                  placeholder="Select applicable states or countries (leave empty for all regions)"
                />
                <label className="text-[10px] text-gray-550 font-bold uppercase mt-3">Sales channel</label>
                <SearchableSelect value={form.sales_channel} onChange={e => setForm({ ...form, sales_channel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs">
                  <option value="storefront">Storefront only</option>
                  <option value="pos">POS only</option>
                  <option value="both">Storefront and POS</option>
                </SearchableSelect>
                <span className="text-[9px] text-gray-400">Leave empty to apply everywhere. Select specific states or countries to restrict this tax.</span>
              </div>

              <label className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-150 rounded-lg cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <span className="text-xs font-semibold text-gray-800">Tax rule is active</span>
              </label>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4 mt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
                  {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (editingTax ? 'Update Tax Rule' : 'Create Tax Rule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
