import { getCurrencySymbol } from '../../utils/currency';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle, Percent, DollarSign, Gift, Calendar, Tag, Power, PowerOff } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function AdminDiscounts() {
  const currencySymbol = getCurrencySymbol();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: '', type: 'percentage', value: '', min_qty_requirement: '', free_qty_reward: '',
    start_date: '', end_date: '', apply_to: 'all', product_ids: [], category_ids: [], is_active: true,
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data
  const { data: discountsRes, isLoading } = useQuery({
    queryKey: ['admin-discounts'],
    queryFn: () => apiFetch('/api/admin/discounts').then(r => r.json())
  });

  const { data: productsRes } = useQuery({
    queryKey: ['admin-products-list'],
    queryFn: () => apiFetch('/api/admin/products').then(r => r.json())
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => apiFetch('/api/admin/categories').then(r => r.json())
  });

  const discounts = discountsRes?.data || [];
  const products = productsRes?.data || [];
  const categories = categoriesRes?.data || [];

  // Table state
  const table = useTableState({
    data: discounts,
    defaultPageSize: 10,
    defaultSortField: 'created_at',
    defaultSortOrder: 'desc',
    searchKeys: ['name', 'type'],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => apiFetch('/api/admin/discounts', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()),
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg(data.message);
        queryClient.invalidateQueries(['admin-discounts']);
        setTimeout(() => { setShowModal(false); resetForm(); }, 1200);
      } else { setErrorMsg(data.message || 'Error creating discount.'); }
    },
    onError: () => { setActionLoading(false); setErrorMsg('Network error.'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiFetch(`/api/admin/discounts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(r => r.json()),
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg(data.message);
        queryClient.invalidateQueries(['admin-discounts']);
        setTimeout(() => { setShowModal(false); resetForm(); }, 1200);
      } else { setErrorMsg(data.message || 'Error updating discount.'); }
    },
    onError: () => { setActionLoading(false); setErrorMsg('Network error.'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/admin/discounts/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: (data) => { if (data.success) queryClient.invalidateQueries(['admin-discounts']); }
  });

  const resetForm = () => {
    setForm({ name: '', type: 'percentage', value: '', min_qty_requirement: '', free_qty_reward: '', start_date: '', end_date: '', apply_to: 'all', product_ids: [], category_ids: [], is_active: true });
    setEditingDiscount(null);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (d) => {
    resetForm();
    setEditingDiscount(d);
    setForm({
      name: d.name || '', type: d.type || 'percentage', value: d.value || '',
      min_qty_requirement: d.min_qty_requirement || '', free_qty_reward: d.free_qty_reward || '',
      start_date: d.start_date ? d.start_date.substring(0, 10) : '', end_date: d.end_date ? d.end_date.substring(0, 10) : '',
      apply_to: d.apply_to || 'all',
      product_ids: (d.products || []).map(p => p.id),
      category_ids: (d.categories || []).map(c => c.id),
      is_active: d.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setActionLoading(true);
    const payload = { ...form, value: parseFloat(form.value) || 0, min_qty_requirement: parseInt(form.min_qty_requirement) || null, free_qty_reward: parseInt(form.free_qty_reward) || null };
    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => { if (confirm('Delete this discount rule?')) deleteMutation.mutate(id); };

  const toggleMultiSelect = (arr, setArr, id) => {
    if (arr.includes(id)) setArr(arr.filter(x => x !== id));
    else setArr([...arr, id]);
  };

  const typeIcons = { percentage: Percent, fixed_amount: DollarSign, bogo: Gift };
  const typeLabels = { percentage: 'Percentage', fixed_amount: 'Fixed Amount', bogo: 'Buy X Get Y' };

  // Filter by type
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredDiscounts = discounts.filter(d => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (filterStatus === 'active' && !d.is_active) return false;
    if (filterStatus === 'inactive' && d.is_active) return false;
    return true;
  });

  const tableFiltered = useTableState({
    data: filteredDiscounts,
    defaultPageSize: 10,
    searchKeys: ['name', 'type'],
  });

  if (isLoading) return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Discounts & Promotions</h2>
          <p className="text-xs text-gray-400 mt-1">Create automatic discounts, seasonal promotions, and BOGO offers.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> New Discount
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-gray-500 font-bold uppercase">Type:</label>
          <SearchableSelect value={filterType} onChange={e => setFilterType(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-primary">
            <option value="all">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed_amount">Fixed Amount</option>
            <option value="bogo">BOGO</option>
          </SearchableSelect>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-gray-500 font-bold uppercase">Status:</label>
          <SearchableSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-primary">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SearchableSelect>
        </div>
        <input
          type="text"
          placeholder="Search discounts..."
          value={tableFiltered.searchQuery}
          onChange={e => tableFiltered.setSearchQuery(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white ml-auto w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150">
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-800" onClick={() => tableFiltered.requestSort('name')}>
                  Name {tableFiltered.sortField === 'name' && (tableFiltered.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Value</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Applies To</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Usage</th>
                <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Period</th>
                <th className="text-center px-4 py-3 font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableFiltered.paginatedData.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No discount rules found.</td></tr>
              ) : tableFiltered.paginatedData.map(d => {
                const Icon = typeIcons[d.type] || Tag;
                return (
                  <tr key={d.id} className="border-b border-gray-55 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-800">{d.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Icon className="w-3 h-3" /> {typeLabels[d.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-semibold">
                      {d.type === 'percentage' ? `${d.value}%` : d.type === 'bogo' ? `Buy ${d.min_qty_requirement || 2} Get ${d.free_qty_reward || 1}` : `${currencySymbol}${parseFloat(d.value).toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {d.apply_to === 'all' ? 'All Products' : d.apply_to === 'products' ? `${(d.products || []).length} Products` : `${(d.categories || []).length} Categories`}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">
                      {d.orders_count || 0} times
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {d.start_date || d.end_date ? (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {d.start_date?.substring(0, 10) || '∞'} – {d.end_date?.substring(0, 10) || '∞'}</span>
                      ) : <span className="text-gray-300">Always</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.is_active ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full"><Power className="w-3 h-3" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full"><PowerOff className="w-3 h-3" /> Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePaginationControls
          currentPage={tableFiltered.currentPage}
          pageSize={tableFiltered.pageSize}
          totalPages={tableFiltered.totalPages}
          totalCount={tableFiltered.totalCount}
          filteredCount={tableFiltered.filteredCount}
          onPageChange={tableFiltered.setCurrentPage}
          onPageSizeChange={tableFiltered.setPageSize}
          onJumpToPage={tableFiltered.jumpToPage}
        />
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">{editingDiscount ? 'Edit Discount' : 'Create Discount'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && <div className="bg-red-50 border border-red-150 text-red-500 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
            {successMsg && <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5"><CheckCircle className="w-4 h-4 shrink-0" />{successMsg}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" placeholder="e.g. Summer Sale 20% Off" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Type *</label>
                  <SearchableSelect value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white">
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed_amount">Fixed Amount Off</option>
                    <option value="bogo">Buy X Get Y Free (BOGO)</option>
                  </SearchableSelect>
                </div>
                {form.type !== 'bogo' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-550 font-bold uppercase">Value {form.type === 'percentage' ? '(%)' : '({currencySymbol})'}</label>
                    <input type="number" step="0.01" min="0" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" placeholder={form.type === 'percentage' ? '10' : '500'} />
                  </div>
                )}
              </div>

              {form.type === 'bogo' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-550 font-bold uppercase">Buy Quantity</label>
                    <input type="number" min="1" value={form.min_qty_requirement} onChange={e => setForm({ ...form, min_qty_requirement: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" placeholder="2" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-550 font-bold uppercase">Get Free Quantity</label>
                    <input type="number" min="1" value={form.free_qty_reward} onChange={e => setForm({ ...form, free_qty_reward: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" placeholder="1" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-550 font-bold uppercase">Apply To *</label>
                <SearchableSelect value={form.apply_to} onChange={e => setForm({ ...form, apply_to: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white">
                  <option value="all">All Products</option>
                  <option value="products">Specific Products</option>
                  <option value="categories">Specific Categories</option>
                </SearchableSelect>
              </div>

              {form.apply_to === 'products' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Select Products</label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 flex flex-col gap-1">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                        <input type="checkbox" checked={form.product_ids.includes(p.id)} onChange={() => { const ids = form.product_ids.includes(p.id) ? form.product_ids.filter(x => x !== p.id) : [...form.product_ids, p.id]; setForm({ ...form, product_ids: ids }); }} className="rounded text-primary" />
                        {p.name}
                      </label>
                    ))}
                    {products.length === 0 && <p className="text-gray-400 text-xs">No products available.</p>}
                  </div>
                </div>
              )}

              {form.apply_to === 'categories' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Select Categories</label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 flex flex-col gap-1">
                    {categories.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                        <input type="checkbox" checked={form.category_ids.includes(c.id)} onChange={() => { const ids = form.category_ids.includes(c.id) ? form.category_ids.filter(x => x !== c.id) : [...form.category_ids, c.id]; setForm({ ...form, category_ids: ids }); }} className="rounded text-primary" />
                        {c.name}
                      </label>
                    ))}
                    {categories.length === 0 && <p className="text-gray-400 text-xs">No categories available.</p>}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-150 rounded-lg cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <span className="text-xs font-semibold text-gray-800">Discount is active</span>
              </label>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4 mt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
                  {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (editingDiscount ? 'Update Discount' : 'Create Discount')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
