import { getCurrencySymbol } from '../../utils/currency';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Landmark, ShoppingCart, Clock, AlertTriangle, ArrowRight, TrendingUp, 
  DollarSign, ListOrdered, MoreVertical, Award, ArrowUpRight, Monitor,
  ReceiptText, PackageCheck, WalletCards
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';

const currencySymbol = getCurrencySymbol();

const MonthlySalesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-gray-400 italic">No sales trend data available.</div>;
  }

  // Prepend a start zero point if there's only 1 item to ensure a trend line draws beautifully!
  let chartData = [...data];
  if (chartData.length === 1) {
    chartData = [{ month: 'Start', total: 0 }, ...chartData];
  }

  const height = 180;
  const width = 500;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...chartData.map(d => d.total), 1000);
  const minVal = 0;

  // Generate coordinates
  const points = chartData.map((d, i) => {
    const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.total - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, label: d.month, value: d.total };
  });

  // Create path description
  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaD = pathD + ` L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // format currency
  const formatShort = (val) => {
    if (val >= 1000000) return `${currencySymbol}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(0)}k`;
    return `${currencySymbol}${val}`;
  };

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">6-Month Revenue Growth</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-505 font-semibold font-mono">Max: {currencySymbol}{maxVal.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
      </div>
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C5A880" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C5A880" stopOpacity="0.0" />
            </linearGradient>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#C5A880" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + ratio * chartHeight;
            const gridVal = maxVal - ratio * (maxVal - minVal);
            return (
              <g key={ratio} className="opacity-40">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[8px] fill-gray-405 dark:fill-gray-500 font-bold font-mono">{formatShort(gridVal)}</text>
              </g>
            );
          })}

          {/* Area under the line */}
          {areaD && <path d={areaD} fill="url(#salesGrad)" />}
          
          {/* Line Path */}
          {pathD && <path d={pathD} fill="none" stroke="#C5A880" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)" />}

          {/* Points & Labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#C5A880" strokeWidth="1.5" />
              <text x={p.x} y={height - 4} textAnchor="middle" className="text-[8px] fill-gray-400 dark:fill-gray-500 font-bold">{p.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

const CategorySalesSplit = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-450 italic py-6 text-center">No category sales logged.</div>;
  }

  const maxVal = Math.max(...data.map(d => d.total_sales), 1);

  // Cohesive brand shades list
  const colors = [
    '#C5A880', // Primary Gold Accent
    '#8C7355', // Deep Earth Bronze
    '#E5C158', // Bright Champagne
    '#B3986D', // Soft Muted Ochre
    '#D4AF37', // Bright Metallic Gold
  ];

  return (
    <div className="flex flex-col gap-4 w-full text-left">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 dark:text-gray-400">Sales by Category</span>
      <div className="flex flex-col gap-3.5">
        {data.slice(0, 5).map((cat, idx) => {
          const percent = (cat.total_sales / maxVal) * 100;
          return (
            <div key={idx} className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-medium text-gray-700 dark:text-gray-300">
                <span className="truncate w-36 font-semibold">{cat.category_name}</span>
                <span className="font-bold text-gray-900 dark:text-white">{currencySymbol}{parseFloat(cat.total_sales).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-750 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, backgroundColor: colors[idx % colors.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PaymentGatewaySplits = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-455 italic py-4 text-center">No payment gateway details.</div>;
  }

  const totalSales = data.reduce((sum, d) => sum + d.total, 0) || 1;

  const getGatewayColor = (method) => {
    const key = method.toLowerCase();
    if (key.includes('paystack')) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30';
    if (key.includes('stripe')) return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30';
    if (key.includes('paypal')) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30';
    if (key.includes('flutterwave')) return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/30';
    return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30';
  };

  return (
    <div className="flex flex-col gap-3 text-left">
      {data.map((gate, idx) => {
        const pct = ((gate.total / totalSales) * 100).toFixed(1);
        return (
          <div key={idx} className="flex items-center justify-between text-xs p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-750 transition-all">
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-bold uppercase text-gray-750 dark:text-gray-305 tracking-wider text-[10px]">
                {gate.payment_method === 'cod' ? 'Cash on Delivery' : gate.payment_method}
              </span>
              <span className="text-[9px] text-gray-400 font-semibold">{gate.count} transactions</span>
            </div>
            <div className="text-right flex flex-col items-end gap-1 shrink-0">
              <span className="font-bold block text-gray-900 dark:text-white">{currencySymbol}{parseFloat(gate.total).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getGatewayColor(gate.payment_method)}`}>
                {pct}% share
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FinancialTrendChart = ({ data, showExpenses, showPurchases }) => {
  const rows = data || [];
  if (!rows.length) return <div className="py-16 text-center text-xs italic text-gray-400">No financial trend data available.</div>;

  const series = [
    { key: 'revenue', label: 'Revenue', color: '#10B981' },
    { key: 'net_profit', label: 'Net profit', color: '#C5A880' },
    ...(showExpenses ? [{ key: 'expenses', label: 'Expenses', color: '#F43F5E' }] : []),
    ...(showPurchases ? [{ key: 'purchases', label: 'Purchases', color: '#6366F1' }] : []),
  ];
  const width = 660, height = 230, left = 52, right = 18, top = 20, bottom = 30;
  const values = rows.flatMap(row => series.map(item => Number(row[item.key] || 0)));
  const min = Math.min(0, ...values), max = Math.max(1, ...values);
  const range = max - min || 1;
  const x = index => left + (index / Math.max(rows.length - 1, 1)) * (width - left - right);
  const y = value => top + (max - value) / range * (height - top - bottom);
  const short = value => `${currencySymbol}${Math.abs(value) >= 1000000 ? `${(value / 1000000).toFixed(1)}m` : Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.round(value)}`;

  return <div className="w-full">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Financial performance</h3><p className="mt-0.5 text-[10px] text-gray-400">Revenue, profit and enabled module outflows over six months</p></div>
      <div className="flex flex-wrap gap-3">{series.map(item => <span key={item.key} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-gray-500"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
      {[0, .25, .5, .75, 1].map(ratio => { const value = max - ratio * range; const py = y(value); return <g key={ratio}><line x1={left} x2={width-right} y1={py} y2={py} stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeDasharray="3 4"/><text x={left-8} y={py+3} textAnchor="end" className="fill-gray-400 text-[8px] font-semibold">{short(value)}</text></g>; })}
      {min < 0 && <line x1={left} x2={width-right} y1={y(0)} y2={y(0)} stroke="#94A3B8" />}
      {series.map(item => <path key={item.key} d={rows.map((row,index) => `${index ? 'L' : 'M'} ${x(index)} ${y(Number(row[item.key] || 0))}`).join(' ')} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />)}
      {rows.map((row,index) => <text key={row.month+index} x={x(index)} y={height-7} textAnchor="middle" className="fill-gray-400 text-[9px] font-bold">{row.month}</text>)}
    </svg>
  </div>;
};

const FinancialBreakdown = ({ title, subtitle, data, color }) => {
  const rows = data || [];
  const max = Math.max(1, ...rows.map(row => Number(row.total || 0)));
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</h3><p className="mb-4 mt-0.5 text-[10px] text-gray-400">{subtitle}</p>
    {rows.length ? <div className="space-y-3">{rows.map(row => <div key={row.label}><div className="mb-1.5 flex justify-between gap-3 text-[10px]"><span className="truncate font-semibold text-gray-600 dark:text-gray-300">{row.label}</span><b className="text-gray-900 dark:text-white">{currencySymbol}{Number(row.total).toLocaleString(undefined,{maximumFractionDigits:0})}</b></div><div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full" style={{width:`${Number(row.total)/max*100}%`,backgroundColor:color}} /></div></div>)}</div> : <p className="py-8 text-center text-xs italic text-gray-400">No recorded data yet.</p>}
  </div>;
};

export default function AdminDashboard() {
  const currencySymbol = getCurrencySymbol();
  
  // Fetch dashboard metrics
  const { data: metricsRes, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => apiFetch('/api/admin/metrics').then(res => res.json())
  });

  const metrics = metricsRes?.data || {
    total_sales: 0,
    today_orders: 0,
    pending_orders: 0,
    paid_orders: 0,
    low_stock: [],
    best_sellers: [],
    recent_orders: []
  };
  const financials = metrics.financials || { modules: {} };
  const showFinancials = financials.modules?.expenses || financials.modules?.purchases;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl h-72" />
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-none text-left">
      {/* Page Header (Spacious with supporting description) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-gray-900 dark:text-white leading-tight">Dashboard Overview</h2>
          <p className="text-xs text-gray-400 mt-1.5 font-medium">Real-time metrics, low-stock warnings, and order fulfillments.</p>
        </div>
        
        {/* Quick action wrapper */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase rounded-full hover:bg-primary/95 transition-all shadow-sm"
          >
            <Monitor className="w-3.5 h-3.5" /> Launch POS Terminal
          </Link>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
            Live Feed Active
          </span>
        </div>
      </div>

      {/* Main Metrics Cards Grid (Redesigned with Premium rounded UI, circular icon container, and menu) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        
        {/* 1. Total Sales (Success treatment) */}
        <Link to="/admin/reports" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex relative items-start gap-4 group">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100/30 dark:border-emerald-900/30 group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[10px] text-gray-450 dark:text-gray-500 font-bold uppercase tracking-wider block group-hover:text-primary transition-colors truncate">Total Revenue</span>
            <span className="text-[9px] text-gray-400 dark:text-gray-450 font-semibold block mt-0.5 truncate">Overall aggregate sales</span>
            <strong className="text-2xl font-bold text-gray-905 dark:text-white mt-1.5 block leading-none">{currencySymbol}{parseFloat(metrics.total_sales).toLocaleString()}</strong>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </button>
        </Link>

        {/* 2. Today's Orders (Info/Blue treatment) */}
        <Link to="/admin/orders" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex relative items-start gap-4 group">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/30 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[10px] text-gray-455 dark:text-gray-500 font-bold uppercase tracking-wider block group-hover:text-primary transition-colors truncate">Today's Orders</span>
            <span className="text-[9px] text-gray-400 dark:text-gray-450 font-semibold block mt-0.5 truncate">Purchases logged today</span>
            <strong className="text-2xl font-bold text-gray-905 dark:text-white mt-1.5 block leading-none">{metrics.today_orders}</strong>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </button>
        </Link>

        {/* 3. Pending Orders (Warning/Yellow treatment) */}
        <Link to="/admin/orders" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex relative items-start gap-4 group">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-500 border border-amber-100/30 dark:border-amber-900/30 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[10px] text-gray-455 dark:text-gray-500 font-bold uppercase tracking-wider block group-hover:text-primary transition-colors truncate">Pending Orders</span>
            <span className="text-[9px] text-gray-400 dark:text-gray-455 font-semibold block mt-0.5 truncate">Awaiting fulfillment</span>
            <strong className="text-2xl font-bold text-gray-905 dark:text-white mt-1.5 block leading-none">{metrics.pending_orders}</strong>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </button>
        </Link>

        {/* 4. Low Stock Alerts (Danger/Red treatment) */}
        <Link to="/admin/inventory" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex relative items-start gap-4 group">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100/30 dark:border-rose-900/30 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[10px] text-gray-455 dark:text-gray-500 font-bold uppercase tracking-wider block group-hover:text-primary transition-colors truncate">Low Stock Items</span>
            <span className="text-[9px] text-gray-400 dark:text-gray-455 font-semibold block mt-0.5 truncate">Needs restock soon</span>
            <strong className="text-2xl font-bold text-gray-905 dark:text-white mt-1.5 block leading-none">{metrics.low_stock?.length || 0}</strong>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* KPI secondary indicators (Averages row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
        {/* Average Order Value (AOV) */}
        <Link to="/admin/reports" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-5 py-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Average Order Value</span>
            <strong className="text-lg font-bold text-gray-805 dark:text-gray-200">
              {currencySymbol}{parseFloat(metrics.kpis?.aov || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-100/20 dark:border-amber-900/30">
            <DollarSign className="w-4 h-4" />
          </div>
        </Link>

        {/* Total Order Volume */}
        <Link to="/admin/orders" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-5 py-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Total Order Volume</span>
            <strong className="text-lg font-bold text-gray-855 dark:text-gray-200">
              {metrics.kpis?.total_volume || 0} orders
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50/50 text-purple-650 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100/20 dark:border-purple-900/30">
            <ListOrdered className="w-4 h-4" />
          </div>
        </Link>

        {/* Paid orders count */}
        <Link to="/admin/orders" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-5 py-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Fulfillments Rate</span>
            <strong className="text-lg font-bold text-gray-855 dark:text-gray-200">
              {metrics.kpis?.paid_orders_count || 0} orders paid
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-50/50 text-teal-650 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100/20 dark:border-teal-900/30">
            <TrendingUp className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {showFinancials && <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-bold text-gray-900 dark:text-white">Profit & cash intelligence</h2><p className="mt-1 text-[11px] text-gray-400">Paid expenses affect net profit; purchases are tracked separately as inventory investment.</p></div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">Live accounting view</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/10"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-gray-900"><TrendingUp className="h-4 w-4"/></div><span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Gross profit</span><strong className="mt-1 block text-xl text-gray-900 dark:text-white">{currencySymbol}{Number(financials.gross_profit||0).toLocaleString()}</strong><small className="text-[9px] text-emerald-600">{Number(financials.gross_margin||0).toFixed(1)}% margin after COGS</small></div>
          {financials.modules?.expenses && <><Link to="/admin/expenses" className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 transition hover:shadow-md dark:border-rose-900/30 dark:bg-rose-950/10"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm dark:bg-gray-900"><ReceiptText className="h-4 w-4"/></div><span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Paid expenses</span><strong className="mt-1 block text-xl text-gray-900 dark:text-white">{currencySymbol}{Number(financials.operating_expenses||0).toLocaleString()}</strong><small className="text-[9px] text-gray-400">Operating costs recorded</small></Link><div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/10"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-gray-900"><WalletCards className="h-4 w-4"/></div><span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Net profit</span><strong className={`mt-1 block text-xl ${Number(financials.net_profit||0)<0?'text-rose-600':'text-gray-900 dark:text-white'}`}>{currencySymbol}{Number(financials.net_profit||0).toLocaleString()}</strong><small className="text-[9px] text-gray-400">Gross profit less expenses</small></div></>}
          {financials.modules?.purchases && <><Link to="/admin/purchases" className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 transition hover:shadow-md dark:border-indigo-900/30 dark:bg-indigo-950/10"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-gray-900"><PackageCheck className="h-4 w-4"/></div><span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Purchase spend</span><strong className="mt-1 block text-xl text-gray-900 dark:text-white">{currencySymbol}{Number(financials.purchase_spend||0).toLocaleString()}</strong><small className="text-[9px] text-gray-400">Paid inventory investment</small></Link><div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 dark:border-sky-900/30 dark:bg-sky-950/10"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm dark:bg-gray-900"><Landmark className="h-4 w-4"/></div><span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Cash after outflows</span><strong className={`mt-1 block text-xl ${Number(financials.cash_position||0)<0?'text-rose-600':'text-gray-900 dark:text-white'}`}>{currencySymbol}{Number(financials.cash_position||0).toLocaleString()}</strong><small className="text-[9px] text-gray-400">Revenue less paid modules</small></div></>}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:col-span-2"><FinancialTrendChart data={financials.trend} showExpenses={financials.modules?.expenses} showPurchases={financials.modules?.purchases}/></div>
          <div className="grid gap-5">{financials.modules?.expenses && <FinancialBreakdown title="Expense mix" subtitle="Top paid expense categories" data={financials.expense_categories} color="#F43F5E"/>}{financials.modules?.purchases && <FinancialBreakdown title="Purchase pipeline" subtitle="Purchase value by status" data={financials.purchase_statuses} color="#6366F1"/>}</div>
        </div>
      </section>}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Line Chart Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-2">
          <MonthlySalesChart data={metrics.monthly_sales} />
        </div>

        {/* Category breakdown bar chart Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-2">
          <CategorySalesSplit data={metrics.category_splits} />
        </div>
      </div>

      {/* Main Table area and right column info panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table Card (Redesigned matching table layout in prompt) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3.5 text-left">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 font-semibold transition-colors">
              All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-450 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-2.5 font-bold">Order #</th>
                  <th className="py-2.5 font-bold">Customer</th>
                  <th className="py-2.5 font-bold">Payment</th>
                  <th className="py-2.5 font-bold">Total</th>
                  <th className="py-2.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {metrics.recent_orders?.length > 0 ? (
                  metrics.recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-55/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 font-semibold">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="text-primary hover:underline font-bold cursor-pointer"
                          title="View Order Details"
                        >
                          #{ord.order_number}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-650 dark:text-gray-300 font-medium">{ord.customer_name}</td>
                      <td className="py-3 text-left">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          ord.payment_status === 'paid' 
                            ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-450 border border-emerald-100/20 dark:border-emerald-900/30' 
                            : 'bg-orange-50 text-orange-500 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-100/20 dark:border-orange-900/30'
                        }`}>
                          {(ord.payment_status || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-gray-900 dark:text-white">{currencySymbol}{parseFloat(ord.total_amount).toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <Link to={`/admin/orders/${ord.id}`} className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-bold transition-colors">
                          Fulfill <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400 italic">No orders placed recently.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side Panels: Stock, Best Sellers, Gateway shares */}
        <div className="flex flex-col gap-6">
          
          {/* 1. Low Stock details Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-gray-800 pb-2 text-left">Low Stock Alerts</h3>
            <div className="flex flex-col gap-3">
              {metrics.low_stock?.length > 0 ? (
                metrics.low_stock.map((variant) => (
                  <div key={variant.id} className="flex justify-between items-center text-xs p-1">
                    <div className="text-left">
                      <span className="font-semibold text-gray-800 dark:text-gray-205 block">{variant.product?.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">Size: {variant.size} | Color: {variant.color}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-bold border border-red-150/20 dark:border-red-900/30 shrink-0">
                      {variant.stock_quantity} left
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center">All catalog stock levels are healthy.</p>
              )}
            </div>
          </div>

          {/* 2. Best Sellers Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-1.5 text-left">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Best Sellers
            </h3>
            <div className="flex flex-col gap-3">
              {metrics.best_sellers?.length > 0 ? (
                metrics.best_sellers.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate w-40 text-left">{item.product_name}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-bold bg-gray-50 dark:bg-gray-850 px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-800 shrink-0">
                      {item.total_sold} sold
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center">Sales aggregates will display here.</p>
              )}
            </div>
          </div>

          {/* 3. Payment Gateways Shares Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-gray-800 pb-2 text-left">
              Payment Gateway Shares
            </h3>
            <PaymentGatewaySplits data={metrics.payment_splits} />
          </div>

        </div>

      </div>
    </div>
  );
}
