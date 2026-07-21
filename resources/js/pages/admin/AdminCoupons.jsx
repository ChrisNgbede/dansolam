import { getCurrencySymbol } from '../../utils/currency';
import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Save, X, Ticket, Search } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';

export default function AdminCoupons() {
  const currencySymbol = getCurrencySymbol();
  const queryClient = useQueryClient();

  // Create form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minSpend, setMinSpend] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState('percentage');
  const [editValue, setEditValue] = useState('');
  const [editMinSpend, setEditMinSpend] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editUsageLimit, setEditUsageLimit] = useState('');

  // Fetch Coupons
  const { data: couponsRes, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => apiFetch('/api/admin/coupons').then(res => res.json())
  });

  const coupons = couponsRes?.data || [];

  // Table state management
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
    data: coupons,
    defaultPageSize: 10,
    defaultSortField: 'code',
    defaultSortOrder: 'asc',
    searchKeys: ['code', 'type', 'value', 'min_spend']
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newCoupon) => {
      return apiFetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(newCoupon)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-coupons']);
        setShowCreateForm(false);
        setCode('');
        setValue('');
        setMinSpend('0');
        setStartDate('');
        setEndDate('');
        setUsageLimit('');
      } else {
        systemToast.error(data.message || 'Creation failed');
      }
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-coupons']);
        setEditingId(null);
      } else {
        systemToast.error(data.message || 'Update failed');
      }
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-coupons']);
      }
    }
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      code: code.toUpperCase().trim(),
      type,
      value: parseFloat(value),
      min_spend: parseFloat(minSpend),
      start_date: startDate || null,
      end_date: endDate || null,
      usage_limit: usageLimit ? parseInt(usageLimit) : null
    });
  };

  const handleEditClick = (c) => {
    setEditingId(c.id);
    setEditCode(c.code);
    setEditType(c.type);
    setEditValue(c.value.toString());
    setEditMinSpend(c.min_spend.toString());
    setEditStartDate(c.start_date || '');
    setEditEndDate(c.end_date || '');
    setEditUsageLimit(c.usage_limit ? c.usage_limit.toString() : '');
  };

  const handleUpdateSubmit = (id) => {
    updateMutation.mutate({
      id,
      payload: {
        code: editCode.toUpperCase().trim(),
        type: editType,
        value: parseFloat(editValue),
        min_spend: parseFloat(editMinSpend),
        start_date: editStartDate || null,
        end_date: editEndDate || null,
        usage_limit: editUsageLimit ? parseInt(editUsageLimit) : null
      }
    });
  };

  const handleDelete = (id, label) => {
    if (confirm(`Delete discount coupon "${label}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Discount Coupons</h2>
          <p className="text-xs text-gray-400 mt-1">Configure weekly promo codes, minimum spend limits, and free delivery thresholds.</p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* CREATE FORM */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} className="bg-white border border-gray-250 p-5 rounded-xl flex flex-col gap-4 max-w-2xl shadow-sm">
          <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-primary" />
            Add New Discount Code
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Coupon Code</label>
              <input
                type="text"
                required
                placeholder="e.g. QUEEN20"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white uppercase font-bold text-gray-800 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Discount Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount ({currencySymbol})</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Value</label>
              <input
                type="number"
                required
                placeholder="e.g. 15 or 5000"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Min Spend ({currencySymbol})</label>
              <input
                type="number"
                value={minSpend}
                onChange={e => setMinSpend(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Usage Limit</label>
              <input
                type="number"
                placeholder="Total count"
                value={usageLimit}
                onChange={e => setUsageLimit(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm">Save Coupon</button>
          </div>
        </form>
      )}

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
        <div className="flex-1 max-w-sm relative">
          <input
            type="text"
            placeholder="Search coupons (code, type...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
        </div>
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          👑 {filteredCount} coupons
        </span>
      </div>

      {/* COUPONS TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none">
                <th onClick={() => requestSort('code')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Code {sortField === 'code' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('type')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Type {sortField === 'type' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('value')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Value {sortField === 'value' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('min_spend')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Min Spend {sortField === 'min_spend' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">
                  Usage / Limit
                </th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((c) => {
                  const isEditing = c.id === editingId;

                  return (
                    <tr key={c.id} className="hover:bg-gray-55/30">
                      {isEditing ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editCode}
                              onChange={e => setEditCode(e.target.value)}
                              className="px-2 py-1 border rounded w-24 text-xs font-bold text-gray-800 uppercase"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editType}
                              onChange={e => setEditType(e.target.value)}
                              className="px-2 py-1 border rounded w-28 text-xs text-gray-755"
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="fixed_amount">Fixed Amount ({currencySymbol})</option>
                              <option value="free_delivery">Free Delivery</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="px-2 py-1 border rounded w-16 text-xs"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editMinSpend}
                              onChange={e => setEditMinSpend(e.target.value)}
                              className="px-2 py-1 border rounded w-20 text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 flex gap-1">
                            <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className="p-1 border rounded text-[10px]" />
                            <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="p-1 border rounded text-[10px]" />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editUsageLimit}
                              onChange={e => setEditUsageLimit(e.target.value)}
                              className="px-2 py-1 border rounded w-16 text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => handleUpdateSubmit(c.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-bold text-gray-900 tracking-wider">🏷️ {c.code}</td>
                          <td className="px-6 py-4 capitalize text-gray-650">{(c.type || 'fixed_amount').replace('_', ' ')}</td>
                          <td className="px-6 py-4 font-semibold">
                            {c.type === 'percentage' ? `${c.value}%` : c.type === 'free_delivery' ? 'Free' : `${currencySymbol}${parseFloat(c.value).toLocaleString()}`}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{currencySymbol}{parseFloat(c.min_spend).toLocaleString()}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {c.start_date && c.end_date
                              ? `${new Date(c.start_date).toLocaleDateString()} - ${new Date(c.end_date).toLocaleDateString()}`
                              : 'Forever Active'}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">
                            <span className="font-bold text-gray-900">{c.orders_count || 0}</span>
                            <span className="text-gray-400"> / {c.usage_limit ? `${c.usage_limit} max` : '∞'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditClick(c)}
                                className="p-1 text-gray-500 hover:text-primary hover:bg-gray-50 rounded"
                                title="Edit Coupon"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id, c.code)}
                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic font-medium">
                    No coupons found matching search parameters.
                  </td>
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
    </div>
  );
}
