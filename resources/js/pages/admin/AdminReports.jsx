import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useMemo } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart3, TrendingUp, Users, ShoppingBag, Calendar, Filter, Loader2 } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';

const REPORT_TYPES = [
  { key: 'sales', label: 'Sales Report', icon: TrendingUp, desc: 'Revenue, order counts, and discounts by date' },
  { key: 'products', label: 'Product Performance', icon: ShoppingBag, desc: 'Units sold and revenue per product' },
  { key: 'customers', label: 'Customer Analysis', icon: Users, desc: 'Spending and order frequency by customer' },
  { key: 'orders', label: 'Orders Log', icon: BarChart3, desc: 'Detailed order listing with status and payment' },
];

export default function AdminReports() {
  const currencySymbol = getCurrencySymbol();
  const [reportType, setReportType] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [exporting, setExporting] = useState(false);

  // Fetch categories for product performance category filter
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-all-reports'],
    queryFn: () => apiFetch('/api/categories').then(res => res.json())
  });
  const categories = categoriesRes?.data || [];

  // Reset filters when report type changes
  React.useEffect(() => {
    setPaymentMethod('');
    setOrderStatus('');
    setCategoryId('');
  }, [reportType]);

  const queryParams = new URLSearchParams({ report_type: reportType });
  if (dateFrom) queryParams.set('date_from', dateFrom);
  if (dateTo) queryParams.set('date_to', dateTo);
  if (paymentMethod) queryParams.set('payment_method', paymentMethod);
  if (orderStatus) queryParams.set('order_status', orderStatus);
  if (categoryId) queryParams.set('category_id', categoryId);

  const { data: reportRes, isLoading, isFetching } = useQuery({
    queryKey: ['admin-reports', reportType, dateFrom, dateTo, paymentMethod, orderStatus, categoryId],
    queryFn: () => apiFetch(`/api/admin/reports?${queryParams.toString()}`).then(r => r.json()),
    keepPreviousData: true,
  });

  const reportData = reportRes?.data || [];

  // Determine search keys based on report type
  const searchKeys = useMemo(() => {
    if (reportType === 'sales') return ['date'];
    if (reportType === 'products') return ['product_name'];
    if (reportType === 'customers') return ['customer_name', 'customer_email'];
    return ['order_number', 'customer_name', 'customer_email'];
  }, [reportType]);

  const table = useTableState({
    data: reportData,
    defaultPageSize: 15,
    searchKeys,
  });

  // Summary metrics
  const totals = useMemo(() => {
    if (reportType === 'sales') {
      return {
        totalRevenue: reportData.reduce((s, r) => s + parseFloat(r.revenue || 0), 0),
        totalOrders: reportData.reduce((s, r) => s + parseInt(r.order_count || 0), 0),
        totalDiscounts: reportData.reduce((s, r) => s + parseFloat(r.discounts || 0), 0),
      };
    }
    if (reportType === 'products') {
      return {
        totalSold: reportData.reduce((s, r) => s + parseInt(r.total_sold || 0), 0),
        totalRevenue: reportData.reduce((s, r) => s + parseFloat(r.revenue || 0), 0),
      };
    }
    if (reportType === 'customers') {
      return {
        totalCustomers: reportData.length,
        totalSpend: reportData.reduce((s, r) => s + parseFloat(r.total_spend || 0), 0),
      };
    }
    return { totalOrders: reportData.length };
  }, [reportType, reportData]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('dansolam_admin_token');
      const res = await fetch(`/api/admin/reports/csv?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { systemToast.error('Export failed.'); }
    setExporting(false);
  };

  const handleExportPdf = () => {
    const token = localStorage.getItem('dansolam_admin_token');
    window.open(`/api/admin/reports/pdf?${queryParams.toString()}&token=${token}`, '_blank');
  };

  const formatCurrency = (val) => getCurrencySymbol() + parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Reports & Analytics</h2>
          <p className="text-xs text-gray-400 mt-1">Generate insights and export data as CSV or printable PDF.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCsv} disabled={exporting || reportData.length === 0} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export CSV
          </button>
          <button onClick={handleExportPdf} disabled={reportData.length === 0} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50">
            <FileText className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          const isSelected = reportType === rt.key;
          return (
            <button
              key={rt.key}
              onClick={() => setReportType(rt.key)}
              style={{ backgroundColor: '#FFFFFF' }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                isSelected ? 'border-[#5D3E85] ring-2 ring-[#5D3E85]/20' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${isSelected ? 'bg-[#5D3E85]/10' : 'bg-gray-100'}`}>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#5D3E85]' : 'text-gray-500'}`} />
              </div>
              <p className={`text-xs font-bold ${isSelected ? 'text-[#5D3E85]' : 'text-gray-800'}`}>{rt.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{rt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Date & Additional Filters */}
      <div style={{ backgroundColor: '#FFFFFF' }} className="flex flex-wrap items-end gap-4 border border-gray-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-600">Filters:</span>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-bold uppercase">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-bold uppercase">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white" />
        </div>

        {/* Payment Method Filter */}
        {(reportType === 'sales' || reportType === 'orders' || reportType === 'products') && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-36"
            >
              <option value="">All Payments</option>
              <option value="cod">Cash on Delivery</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="stripe">Stripe</option>
              <option value="paystack">Paystack</option>
              <option value="paypal">PayPal</option>
              <option value="flutterwave">Flutterwave</option>
            </select>
          </div>
        )}

        {/* Order Status Filter */}
        {(reportType === 'sales' || reportType === 'orders' || reportType === 'products') && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase">Order Status</label>
            <select
              value={orderStatus}
              onChange={e => setOrderStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-36"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {/* Category Filter */}
        {reportType === 'products' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-36"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}

        {(dateFrom || dateTo || paymentMethod || orderStatus || categoryId) && (
          <button 
            onClick={() => { 
              setDateFrom(''); 
              setDateTo(''); 
              setPaymentMethod('');
              setOrderStatus('');
              setCategoryId('');
            }} 
            className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        )}
        <input
          type="text"
          placeholder="Search in results..."
          value={table.searchQuery}
          onChange={e => table.setSearchQuery(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white ml-auto w-48"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {reportType === 'sales' && (
          <>
            <SummaryCard label="Total Revenue" value={formatCurrency(totals.totalRevenue)} color="green" />
            <SummaryCard label="Total Orders" value={totals.totalOrders} color="blue" />
            <SummaryCard label="Total Discounts" value={formatCurrency(totals.totalDiscounts)} color="amber" />
            <SummaryCard label="Date Range" value={`${reportData.length} days`} color="purple" />
          </>
        )}
        {reportType === 'products' && (
          <>
            <SummaryCard label="Total Units Sold" value={totals.totalSold} color="blue" />
            <SummaryCard label="Total Revenue" value={formatCurrency(totals.totalRevenue)} color="green" />
            <SummaryCard label="Products" value={reportData.length} color="purple" />
          </>
        )}
        {reportType === 'customers' && (
          <>
            <SummaryCard label="Unique Customers" value={totals.totalCustomers} color="blue" />
            <SummaryCard label="Total Spend" value={formatCurrency(totals.totalSpend)} color="green" />
          </>
        )}
        {reportType === 'orders' && (
          <SummaryCard label="Total Orders" value={totals.totalOrders} color="blue" />
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150">
                {reportType === 'sales' && (
                  <>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('date')}>Date</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('order_count')}>Orders</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('revenue')}>Revenue</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('discounts')}>Discounts</th>
                  </>
                )}
                {reportType === 'products' && (
                  <>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('product_name')}>Product</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('total_sold')}>Units Sold</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('revenue')}>Revenue</th>
                  </>
                )}
                {reportType === 'customers' && (
                  <>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('customer_name')}>Customer</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Email</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('order_count')}>Orders</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('total_spend')}>Total Spend</th>
                  </>
                )}
                {reportType === 'orders' && (
                  <>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Order #</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Customer</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('total_amount')}>Total</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Payment</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase">Items</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase cursor-pointer" onClick={() => table.requestSort('created_at')}>Date</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {table.paginatedData.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">No data for selected criteria.</td></tr>
              ) : table.paginatedData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {reportType === 'sales' && (
                    <>
                      <td className="px-4 py-3 font-semibold text-gray-800">{row.date}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{row.order_count}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(row.revenue)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(row.discounts)}</td>
                    </>
                  )}
                  {reportType === 'products' && (
                    <>
                      <td className="px-4 py-3 font-semibold text-gray-800">{row.product_name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{row.total_sold}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(row.revenue)}</td>
                    </>
                  )}
                  {reportType === 'customers' && (
                    <>
                      <td className="px-4 py-3 font-semibold text-gray-800">{row.customer_name}</td>
                      <td className="px-4 py-3 text-gray-500">{row.customer_email}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{row.order_count}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(row.total_spend)}</td>
                    </>
                  )}
                  {reportType === 'orders' && (
                    <>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-800">{row.order_number}</td>
                      <td className="px-4 py-3 text-gray-600">{row.customer_name}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(row.total_amount)}</td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{row.payment_method}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          row.order_status === 'delivered' ? 'bg-green-50 text-green-700' :
                          row.order_status === 'processing' ? 'bg-blue-50 text-blue-700' :
                          row.order_status === 'shipped' ? 'bg-purple-50 text-purple-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{row.order_status}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.items_count}</td>
                      <td className="px-4 py-3 text-gray-500">{row.created_at}</td>
                    </>
                  )}
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
    </div>
  );
}

function SummaryCard({ label, value, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="border border-gray-200 rounded-xl p-4 shadow-xs">
      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorMap[color]?.split(' ')[1] || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
