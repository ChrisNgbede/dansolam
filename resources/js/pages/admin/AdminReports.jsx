import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart3, TrendingUp, Users, ShoppingBag, Loader2, Search, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { getAdminToken } from '../../components/auth/RequireAdminAuth';

const REPORT_TYPES = [
  { key: 'sales', label: 'Sales', icon: TrendingUp, title: 'Daily sales', desc: 'Revenue, orders and discounts per day' },
  { key: 'products', label: 'Products', icon: ShoppingBag, title: 'Product performance', desc: 'Units sold and revenue per product' },
  { key: 'customers', label: 'Customers', icon: Users, title: 'Customers', desc: 'Spending and order frequency per customer' },
  { key: 'orders', label: 'Orders', icon: BarChart3, title: 'Orders log', desc: 'Every order with its status and payment' },
];

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash_on_delivery', label: 'Cash on delivery' },
  { value: 'POS Checkout', label: 'In-store (POS)' },
];

const ORDER_STATUSES = [
  { value: 'pending_payment', label: 'Awaiting payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'ready_for_pickup', label: 'Ready for pickup' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_TONE = {
  delivered: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  cancelled: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  pending_payment: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
};

const labelFrom = (list, value) => list.find((o) => o.value === value)?.label || String(value || '').replace(/_/g, ' ');

// Local yyyy-mm-dd, so presets match the dates the user sees.
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const parseDay = (s) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };

const PRESETS = [
  { key: '7d', label: '7 days', range: () => [daysAgo(6), iso(new Date())] },
  { key: '30d', label: '30 days', range: () => [daysAgo(29), iso(new Date())] },
  { key: '90d', label: '90 days', range: () => [daysAgo(89), iso(new Date())] },
  { key: 'year', label: 'This year', range: () => [`${new Date().getFullYear()}-01-01`, iso(new Date())] },
  { key: 'all', label: 'All time', range: () => ['', ''] },
];

const formatDay = (s, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  s ? parseDay(s).toLocaleDateString('en-GB', opts) : '';

const compact = (n) => new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** Revenue per day (or per month for long ranges): one series, so no legend; hover any column for its figures. */
function RevenueChart({ rows, from, to, formatCurrency }) {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Every day in the range gets a slot, so gaps with no sales show as gaps.
  const buckets = useMemo(() => {
    if (!rows.length) return [];
    const byDay = Object.fromEntries(rows.map((r) => [r.date.slice(0, 10), r]));
    const days = rows.map((r) => r.date.slice(0, 10)).sort();
    const start = parseDay(from || days[0]);
    const end = parseDay(to || days[days.length - 1]);
    const span = Math.round((end - start) / 86400000) + 1;
    const monthly = span > 92;
    const out = [];
    const index = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = iso(d);
      const key = monthly ? day.slice(0, 7) : day;
      if (!(key in index)) {
        index[key] = out.length;
        out.push({ key, label: monthly ? formatDay(`${key}-01`, { month: 'short', year: 'numeric' }) : formatDay(day), revenue: 0, orders: 0 });
      }
      const r = byDay[day];
      if (r) {
        out[index[key]].revenue += parseFloat(r.revenue || 0);
        out[index[key]].orders += parseInt(r.order_count || 0, 10);
      }
    }
    return out;
  }, [rows, from, to]);

  if (buckets.length < 2) return null;

  const H = 220, PAD_L = 48, PAD_B = 28, PAD_T = 12;
  const plotW = Math.max(0, width - PAD_L);
  const plotH = H - PAD_B - PAD_T;
  const max = Math.max(...buckets.map((b) => b.revenue), 1);
  const step = 10 ** Math.floor(Math.log10(max / 4));
  const tick = [1, 2, 2.5, 5, 10].map((m) => m * step).find((t) => max / t <= 4) || step * 10;
  const top = Math.ceil(max / tick) * tick;
  const ticks = Array.from({ length: Math.round(top / tick) + 1 }, (_, i) => i * tick);
  const slot = plotW / buckets.length;
  const barW = Math.max(2, Math.min(24, slot - 2));
  const y = (v) => PAD_T + plotH - (v / top) * plotH;
  const labelEvery = Math.ceil(buckets.length / Math.max(1, Math.floor(plotW / 72)));

  return (
    <div ref={boxRef} className="relative w-full select-none" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label="Revenue over time">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_L} x2={width} y1={y(t)} y2={y(t)} className="stroke-[#E4DDEE] dark:stroke-[#2E2537]" strokeWidth="1" />
              <text x={PAD_L - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[#5F566B] dark:fill-[#B8AEC4]" fontSize="11">
                {t === 0 ? '0' : compact(t)}
              </text>
            </g>
          ))}
          {buckets.map((b, i) => {
            const x = PAD_L + i * slot + (slot - barW) / 2;
            const h = Math.max(0, y(0) - y(b.revenue));
            const r = Math.min(4, barW / 2, h);
            const active = hover === i;
            return (
              <g key={b.key}>
                {h > 0 && (
                  <path
                    d={`M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + barW - r} Q${x + barW},${y(0) - h} ${x + barW},${y(0) - h + r} V${y(0)} Z`}
                    className={`fill-[#5D3E85] dark:fill-[#9466D4] transition-opacity ${hover !== null && !active ? 'opacity-40' : ''}`}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={PAD_L + i * slot + slot / 2} y={H - 8} textAnchor="middle" className="fill-[#5F566B] dark:fill-[#B8AEC4]" fontSize="11">
                    {b.label.replace(/^\w+,?\s/, '').replace(/\s\d{4}$/, '')}
                  </text>
                )}
                {/* Full-height hit area, wider than the bar */}
                <rect x={PAD_L + i * slot} y={PAD_T} width={slot} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-[#17101F] dark:bg-white text-white dark:text-[#17101F] px-3 py-2 text-xs shadow-lg whitespace-nowrap"
          style={{
            left: Math.min(Math.max(PAD_L + hover * slot + slot / 2, 80), width - 80),
            top: Math.max(y(buckets[hover].revenue) - 8, 40),
          }}
        >
          <div className="font-semibold">{buckets[hover].label}</div>
          <div className="tabular-nums opacity-80">{formatCurrency(buckets[hover].revenue)} · {buckets[hover].orders} {buckets[hover].orders === 1 ? 'order' : 'orders'}</div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, sub }) {
  return (
    <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/10 rounded-2xl px-5 py-4 min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1 truncate tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

export default function AdminReports() {
  const [reportType, setReportType] = useState('sales');
  const [preset, setPreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-all-reports'],
    queryFn: () => apiFetch('/api/categories').then(res => res.json())
  });
  const categories = categoriesRes?.data || [];

  // Category only applies to the product report.
  useEffect(() => { if (reportType !== 'products') setCategoryId(''); }, [reportType]);

  const applyPreset = (key) => {
    const [from, to] = PRESETS.find((p) => p.key === key).range();
    setPreset(key);
    setDateFrom(from);
    setDateTo(to);
  };

  const queryParams = new URLSearchParams({ report_type: reportType });
  if (dateFrom) queryParams.set('date_from', dateFrom);
  if (dateTo) queryParams.set('date_to', dateTo);
  const usesOrderFilters = reportType !== 'customers';
  if (paymentMethod && usesOrderFilters) queryParams.set('payment_method', paymentMethod);
  if (orderStatus && usesOrderFilters) queryParams.set('order_status', orderStatus);
  if (categoryId) queryParams.set('category_id', categoryId);

  const { data: reportRes, isLoading, isFetching } = useQuery({
    queryKey: ['admin-reports', queryParams.toString()],
    queryFn: () => apiFetch(`/api/admin/reports?${queryParams.toString()}`).then(r => r.json()),
    placeholderData: (prev) => prev,
  });

  const reportData = reportRes?.data || [];
  const meta = REPORT_TYPES.find((r) => r.key === reportType);

  const searchKeys = useMemo(() => {
    if (reportType === 'sales') return ['date'];
    if (reportType === 'products') return ['product_name'];
    if (reportType === 'customers') return ['customer_name', 'customer_email'];
    return ['order_number', 'customer_name', 'customer_email'];
  }, [reportType]);

  const table = useTableState({ data: reportData, defaultPageSize: 25, searchKeys });
  useEffect(() => { table.setSearchQuery(''); }, [reportType]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatCurrency = (val) => getCurrencySymbol() + parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sum = (key) => reportData.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0);

  const tiles = useMemo(() => {
    if (reportType === 'sales') {
      const revenue = sum('revenue'), orders = sum('order_count'), discounts = sum('discounts');
      const best = [...reportData].sort((a, b) => b.revenue - a.revenue)[0];
      return [
        { label: 'Revenue', value: formatCurrency(revenue), sub: best ? `Best day ${formatDay(best.date, { day: 'numeric', month: 'short' })}` : null },
        { label: 'Orders', value: orders.toLocaleString(), sub: `${reportData.length} ${reportData.length === 1 ? 'day' : 'days'} with sales` },
        { label: 'Average order', value: formatCurrency(orders ? revenue / orders : 0) },
        { label: 'Discounts given', value: formatCurrency(discounts), sub: revenue ? `${((discounts / (revenue + discounts)) * 100).toFixed(1)}% of gross` : null },
      ];
    }
    if (reportType === 'products') {
      const top = reportData[0];
      return [
        { label: 'Units sold', value: sum('total_sold').toLocaleString() },
        { label: 'Revenue', value: formatCurrency(sum('revenue')) },
        { label: 'Products sold', value: reportData.length.toLocaleString() },
        { label: 'Top seller', value: top?.product_name || '—', sub: top ? formatCurrency(top.revenue) : null },
      ];
    }
    if (reportType === 'customers') {
      const spend = sum('total_spend');
      const repeat = reportData.filter((r) => parseInt(r.order_count, 10) > 1).length;
      return [
        { label: 'Customers', value: reportData.length.toLocaleString() },
        { label: 'Total spend', value: formatCurrency(spend) },
        { label: 'Average per customer', value: formatCurrency(reportData.length ? spend / reportData.length : 0) },
        { label: 'Repeat customers', value: repeat.toLocaleString(), sub: reportData.length ? `${Math.round((repeat / reportData.length) * 100)}% ordered more than once` : null },
      ];
    }
    const total = sum('total_amount');
    const delivered = reportData.filter((r) => r.order_status === 'delivered').length;
    return [
      { label: 'Orders', value: reportData.length.toLocaleString() },
      { label: 'Order value', value: formatCurrency(total) },
      { label: 'Average order', value: formatCurrency(reportData.length ? total / reportData.length : 0) },
      { label: 'Delivered', value: delivered.toLocaleString(), sub: reportData.length ? `${Math.round((delivered / reportData.length) * 100)}% of orders` : null },
    ];
  }, [reportType, reportData]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/reports/csv?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report${dateFrom ? `_${dateFrom}` : ''}${dateTo ? `_to_${dateTo}` : ''}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { systemToast.error('Export failed.'); }
    setExporting(false);
  };

  const handleExportPdf = () => {
    const token = getAdminToken();
    window.open(`/api/admin/reports/pdf?${queryParams.toString()}&token=${token}`, '_blank');
  };

  const hasFilters = (usesOrderFilters && (paymentMethod || orderStatus)) || categoryId;
  const clearFilters = () => { setPaymentMethod(''); setOrderStatus(''); setCategoryId(''); };

  const rangeText = dateFrom || dateTo
    ? `${dateFrom ? formatDay(dateFrom, { day: 'numeric', month: 'short', year: 'numeric' }) : 'the start'} – ${dateTo ? formatDay(dateTo, { day: 'numeric', month: 'short', year: 'numeric' }) : 'today'}`
    : 'All time';

  // Sortable header: shows which column is sorted and which way.
  const Th = ({ field, children, align = 'left' }) => {
    const sorted = table.sortField === field;
    const Icon = !sorted ? ArrowUpDown : table.sortOrder === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th className={`text-${align}`} aria-sort={sorted ? (table.sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}>
        {field ? (
          <span
            role="button"
            tabIndex={0}
            onClick={() => table.requestSort(field)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); table.requestSort(field); } }}
            className={`inline-flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-white ${align === 'right' ? 'flex-row-reverse' : ''}`}
          >
            {children}
            <Icon className={`w-3 h-3 ${sorted ? '' : 'opacity-40'}`} />
          </span>
        ) : children}
      </th>
    );
  };

  const zeroMuted = (v) => (parseFloat(v) ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400');

  return (
    <div className="flex flex-col gap-6 font-sans text-gray-700 dark:text-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white">Reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">See how the shop is doing and export the figures as CSV or PDF.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleExportCsv} disabled={exporting || reportData.length === 0} className="admin-btn-secondary">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={handleExportPdf} disabled={reportData.length === 0} className="admin-btn-primary">
            <FileText className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Report, period and filters */}
      <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-full" role="tablist" aria-label="Report">
            {REPORT_TYPES.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" role="tab" aria-selected={reportType === key} onClick={() => setReportType(key)} className={reportType === key ? 'bg-white' : ''}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="inline-flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-full" role="tablist" aria-label="Period">
            {PRESETS.map((p) => (
              <button key={p.key} type="button" role="tab" aria-selected={preset === p.key} onClick={() => applyPreset(p.key)} className={preset === p.key ? 'bg-white' : ''}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
          <div className="flex flex-col">
            <label htmlFor="rep-from" className="block">From</label>
            <input id="rep-from" type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => { setDateFrom(e.target.value); setPreset('custom'); }} className="w-40 [color-scheme:light] dark:[color-scheme:dark]" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="rep-to" className="block">To</label>
            <input id="rep-to" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => { setDateTo(e.target.value); setPreset('custom'); }} className="w-40 [color-scheme:light] dark:[color-scheme:dark]" />
          </div>
          {usesOrderFilters && (
            <>
              <div className="flex flex-col w-44">
                <label className="block">Payment</label>
                <SearchableSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full">
                  <option value="">All payments</option>
                  {PAYMENT_METHODS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SearchableSelect>
              </div>
              <div className="flex flex-col w-44">
                <label className="block">Order status</label>
                <SearchableSelect value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="w-full">
                  <option value="">All statuses</option>
                  {ORDER_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </SearchableSelect>
              </div>
            </>
          )}
          {reportType === 'products' && (
            <div className="flex flex-col w-48">
              <label className="block">Category</label>
              <SearchableSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full">
                <option value="">All categories</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </SearchableSelect>
            </div>
          )}
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="bg-white">
              <X className="w-4 h-4" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Headline figures */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
        {tiles.map((t) => <StatTile key={t.label} {...t} />)}
      </div>

      {reportType === 'sales' && reportData.length > 1 && (
        <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 flex flex-col gap-3">
          <div>
            <h3>Revenue</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{rangeText}</p>
          </div>
          <RevenueChart rows={reportData} from={dateFrom} to={dateTo} formatCurrency={formatCurrency} />
        </div>
      )}

      {/* Table */}
      <div className="adm-card bg-white dark:bg-[#1E1528] border border-gray-200/80 dark:border-white/10 rounded-3xl overflow-hidden relative">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="min-w-0">
            <h3>{meta.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{meta.desc} · {rangeText}</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder={reportType === 'sales' ? 'Find a date (2026-08)…' : reportType === 'products' ? 'Find a product…' : reportType === 'customers' ? 'Find a customer…' : 'Find an order or customer…'}
              aria-label="Filter the table"
              value={table.searchQuery}
              onChange={(e) => table.setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/40 z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#5D3E85] animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {reportType === 'sales' && (<>
                  <Th field="date">Date</Th>
                  <Th field="order_count" align="right">Orders</Th>
                  <Th field="revenue" align="right">Revenue</Th>
                  <Th field="discounts" align="right">Discounts</Th>
                </>)}
                {reportType === 'products' && (<>
                  <Th field="product_name">Product</Th>
                  <Th field="total_sold" align="right">Units sold</Th>
                  <Th field="revenue" align="right">Revenue</Th>
                </>)}
                {reportType === 'customers' && (<>
                  <Th field="customer_name">Customer</Th>
                  <Th>Email</Th>
                  <Th field="order_count" align="right">Orders</Th>
                  <Th field="total_spend" align="right">Total spend</Th>
                </>)}
                {reportType === 'orders' && (<>
                  <Th field="order_number">Order</Th>
                  <Th field="customer_name">Customer</Th>
                  <Th field="total_amount" align="right">Total</Th>
                  <Th>Payment</Th>
                  <Th field="order_status">Status</Th>
                  <Th field="items_count" align="right">Items</Th>
                  <Th field="created_at">Date</Th>
                </>)}
              </tr>
            </thead>
            <tbody>
              {table.paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center !py-12 text-gray-500">
                    {table.searchQuery ? `Nothing matches "${table.searchQuery}".` : 'No results for this period and these filters.'}
                  </td>
                </tr>
              ) : table.paginatedData.map((row, idx) => (
                <tr key={row.date || row.product_id || row.customer_email || row.order_number || idx}>
                  {reportType === 'sales' && (<>
                    <td className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{formatDay(row.date)}</td>
                    <td className="text-right tabular-nums">{row.order_count}</td>
                    <td className="text-right tabular-nums font-semibold text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</td>
                    <td className={`text-right tabular-nums ${zeroMuted(row.discounts)}`}>{formatCurrency(row.discounts)}</td>
                  </>)}
                  {reportType === 'products' && (<>
                    <td className="font-medium text-gray-900 dark:text-white">{row.product_name}</td>
                    <td className="text-right tabular-nums">{row.total_sold}</td>
                    <td className="text-right tabular-nums font-semibold text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</td>
                  </>)}
                  {reportType === 'customers' && (<>
                    <td className="font-medium text-gray-900 dark:text-white">{row.customer_name}</td>
                    <td className="text-gray-500 dark:text-gray-400">{row.customer_email}</td>
                    <td className="text-right tabular-nums">{row.order_count}</td>
                    <td className="text-right tabular-nums font-semibold text-gray-900 dark:text-white">{formatCurrency(row.total_spend)}</td>
                  </>)}
                  {reportType === 'orders' && (<>
                    <td className="font-mono font-medium text-gray-900 dark:text-white">{row.order_number}</td>
                    <td>{row.customer_name}</td>
                    <td className="text-right tabular-nums font-semibold text-gray-900 dark:text-white">{formatCurrency(row.total_amount)}</td>
                    <td className="whitespace-nowrap">{labelFrom(PAYMENT_METHODS, row.payment_method)}</td>
                    <td>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_TONE[row.order_status] || 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200'}`}>
                        {labelFrom(ORDER_STATUSES, row.order_status)}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{row.items_count}</td>
                    <td className="whitespace-nowrap text-gray-500 dark:text-gray-400">{formatDay(String(row.created_at), { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </>)}
                </tr>
              ))}
            </tbody>
            {reportData.length > 1 && !table.searchQuery && (reportType === 'sales' || reportType === 'products') && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-white/10 font-semibold text-gray-900 dark:text-white">
                  <td>Total</td>
                  {reportType === 'sales' && (<>
                    <td className="text-right tabular-nums">{sum('order_count').toLocaleString()}</td>
                    <td className="text-right tabular-nums">{formatCurrency(sum('revenue'))}</td>
                    <td className="text-right tabular-nums">{formatCurrency(sum('discounts'))}</td>
                  </>)}
                  {reportType === 'products' && (<>
                    <td className="text-right tabular-nums">{sum('total_sold').toLocaleString()}</td>
                    <td className="text-right tabular-nums">{formatCurrency(sum('revenue'))}</td>
                  </>)}
                </tr>
              </tfoot>
            )}
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
