import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, AlertCircle, RefreshCw, Check, Search } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';

export default function AdminInventory() {
  const queryClient = useQueryClient();

  // Adjustment states
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('correction');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState(false);

  // Fetch Inventory Logs
  const { data: logsRes, isLoading } = useQuery({
    queryKey: ['admin-inventory-logs'],
    queryFn: () => apiFetch('/api/admin/inventory-logs').then(res => res.json())
  });

  // Fetch Products catalog for adjustment select dropdown
  const { data: productsRes } = useQuery({
    queryKey: ['admin-products-inventory-select'],
    queryFn: () => apiFetch('/api/admin/products').then(res => res.json())
  });

  const logs = logsRes?.data || [];
  const products = productsRes?.data || [];

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
    data: logs,
    defaultPageSize: 10,
    defaultSortField: 'id',
    defaultSortOrder: 'desc',
    searchKeys: ['product.name', 'reason', 'user.name', 'change_amount']
  });

  // Find active product variants for selected product
  const activeProduct = products.find(p => p.id === parseInt(selectedProductId));
  const activeVariants = activeProduct?.variants || [];

  // Submit Adjustment mutation
  const adjustMutation = useMutation({
    mutationFn: ({ variantId, payload }) => {
      // Calls update stock override on variants
      return apiFetch(`/api/admin/variants/${variantId}/stock`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        setAdjustSuccess(true);
        queryClient.invalidateQueries(['admin-inventory-logs', 'admin-products']);
        setSelectedProductId('');
        setSelectedVariantId('');
        setAdjustAmount('');
        setTimeout(() => setAdjustSuccess(false), 4000);
      } else {
        systemToast.error(data.message || 'Stock adjustment failed');
      }
      setAdjustLoading(false);
    }
  });

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!selectedVariantId || !adjustAmount) {
      systemToast.error('Please select variant and quantity adjustment amount.');
      return;
    }

    setAdjustLoading(true);
    // Find current stock of the variant to calculate new quantity
    const variant = activeVariants.find(v => v.id === parseInt(selectedVariantId));
    if (!variant) return;

    const changeVal = parseInt(adjustAmount); // e.g. -2 or 5
    const newQty = variant.stock_quantity + changeVal;

    adjustMutation.mutate({
      variantId: selectedVariantId,
      payload: {
        stock_quantity: newQty,
        change_amount: changeVal,
        reason: adjustReason
      }
    });
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Inventory Logs & Adjustments</h2>
          <p className="text-xs text-gray-400 mt-1">Audit stock movements and perform manual catalog adjustments.</p>
        </div>

        <button
          onClick={() => setShowAdjustForm(!showAdjustForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Adjust Stock Levels
        </button>
      </div>

      {/* ADJUSTMENT FORM */}
      {showAdjustForm && (
        <form onSubmit={handleAdjustSubmit} className="bg-white border border-gray-250 p-5 rounded-xl flex flex-col gap-4 max-w-2xl shadow-sm animate-fade-in">
          <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-primary" />
            Perform Manual Stock Adjustment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Select Product</label>
              <select
                value={selectedProductId}
                onChange={e => { setSelectedProductId(e.target.value); setSelectedVariantId(''); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-700"
                required
              >
                <option value="">Choose item...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Select Size/Color Variant</label>
              <select
                value={selectedVariantId}
                onChange={e => setSelectedVariantId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-700"
                required
                disabled={!selectedProductId}
              >
                <option value="">Choose variant...</option>
                {activeVariants.map(v => (
                  <option key={v.id} value={v.id}>Size: {v.size} | Color: {v.color} (Current stock: {v.stock_quantity})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Change Qty (+ for addition, - for reduction)</label>
              <input
                type="number"
                placeholder="e.g. 5 or -2"
                required
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Reason</label>
              <select
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none"
              >
                <option value="new_stock">New Incoming Stock Arrival</option>
                <option value="offline_sale">Offline Shop Walk-in Sale</option>
                <option value="damaged">Damaged ecommerce item</option>
                <option value="returned">Customer returned item restock</option>
                <option value="correction">Inventory correction/Count fix</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowAdjustForm(false)} className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Cancel</button>
            <button type="submit" disabled={adjustLoading} className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm">
              {adjustLoading ? 'Updating Stock...' : 'Save Stock change'}
            </button>
          </div>
        </form>
      )}

      {adjustSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          Stock quantity levels updated and inventory audit logs recorded.
        </div>
      )}

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
        <div className="flex-1 max-w-sm relative">
          <input
            type="text"
            placeholder="Search logs (product name, reason, author...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
        </div>
        <span className="text-[10px] text-gray-400 font-bold uppercase">
          👑 {filteredCount} log records
        </span>
      </div>

      {/* LOGS AUDIT TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none">
                <th onClick={() => requestSort('product.name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Product / Variant {sortField === 'product.name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('old_quantity')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Old Stock {sortField === 'old_quantity' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('new_quantity')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  New Stock {sortField === 'new_quantity' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('change_amount')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Adjustment {sortField === 'change_amount' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('reason')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Reason {sortField === 'reason' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('user.name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Author {sortField === 'user.name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('created_at')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Timestamp {sortField === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((log) => {
                  const isPositive = log.change_amount > 0;

                  return (
                    <tr key={log.id} className="hover:bg-gray-55/20">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800 block">
                          {log.product ? log.product.name : 'Unknown Product'}
                        </span>
                        {log.variant && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Size: {log.variant.size} | Color: {log.variant.color}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{log.old_quantity} units</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{log.new_quantity} units</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                          {isPositive ? `+${log.change_amount}` : log.change_amount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          log.reason === 'new_stock' ? 'bg-green-50 text-green-600' :
                          log.reason === 'offline_sale' ? 'bg-blue-50 text-blue-600' :
                          log.reason === 'online_order' ? 'bg-purple-50 text-purple-650' :
                          log.reason === 'damaged' ? 'bg-red-50 text-red-500' : 'bg-gray-150 text-gray-600'
                        }`}>
                          {(log.reason || 'manual_adjustment').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{log.user?.name || 'Automated System'}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(log.created_at || log.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">No inventory logs found matching query.</td>
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
