import { getCurrencySymbol } from '../../utils/currency';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Landmark, ShoppingCart, Clock, AlertTriangle, ArrowRight, TrendingUp,
  DollarSign, ListOrdered, MoreVertical, Award, ArrowUpRight, Monitor,
  ReceiptText, PackageCheck, WalletCards, Plus, Sparkles, MessageSquare,
  Calendar, Check, ShieldCheck, Heart, Star, ExternalLink, Package
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';

const currencySymbol = getCurrencySymbol();

const MonthlySalesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-gray-400 italic">No sales trend data available.</div>;
  }

  let chartData = [...data];
  if (chartData.length === 1) {
    chartData = [{ month: 'Start', total: 0 }, ...chartData];
  }

  const height = 190;
  const width = 540;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...chartData.map(d => d.total), 1000);
  const minVal = 0;

  const points = chartData.map((d, i) => {
    const x = paddingLeft + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.total - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, label: d.month, value: d.total };
  });

  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaD = pathD + ` L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  const formatShort = (val) => {
    if (val >= 1000000) return `${currencySymbol}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(0)}k`;
    return `${currencySymbol}${Math.round(val)}`;
  };

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <div className="flex justify-between items-center mb-1">
        <div>
          <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">6-Month Revenue Growth</span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Verified store sales & order transactions</span>
        </div>
        <span className="text-xs text-white font-bold font-mono bg-[#5D3E85] px-3 py-1 rounded-full shadow-xs">
          Max: {currencySymbol}{maxVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
      <div className="relative w-full mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="salesGradDansolam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5D3E85" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#5D3E85" stopOpacity="0.0" />
            </linearGradient>
            <filter id="shadowGlow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#5D3E85" floodOpacity="0.3" />
            </filter>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + ratio * chartHeight;
            const gridVal = maxVal - ratio * (maxVal - minVal);
            return (
              <g key={ratio} className="opacity-40">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[8px] fill-gray-500 dark:fill-gray-400 font-bold font-mono">{formatShort(gridVal)}</text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#salesGradDansolam)" />}
          {pathD && <path d={pathD} fill="none" stroke="#5D3E85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadowGlow)" />}

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#5D3E85" strokeWidth="2" className="drop-shadow-xs" />
              <text x={p.x} y={height - 6} textAnchor="middle" className="text-[9px] fill-gray-600 dark:fill-gray-300 font-bold">{p.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

const CategorySalesSplit = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-400 italic py-8 text-center">No category sales logged yet.</div>;
  }

  const maxVal = Math.max(...data.map(d => d.total_sales), 1);

  const colors = [
    '#5D3E85', // Royal Plum
    '#EC268F', // Electric Fuchsia
    '#E5C158', // Warm Champagne Gold
    '#9B51E0', // Lavender Violet
    '#10B981', // Emerald Green
  ];

  return (
    <div className="flex flex-col gap-3.5 w-full text-left">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Sales by Category</span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Top Formulas</span>
      </div>
      <div className="flex flex-col gap-3.5">
        {data.slice(0, 5).map((cat, idx) => {
          const percent = (cat.total_sales / maxVal) * 100;
          return (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-medium text-gray-800 dark:text-gray-200">
                <span className="truncate max-w-[150px] font-bold">{cat.category_name}</span>
                <span className="font-extrabold text-gray-900 dark:text-white font-mono">{currencySymbol}{parseFloat(cat.total_sales).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
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
    return <div className="text-xs text-gray-400 italic py-4 text-center">No payment gateway details.</div>;
  }

  const totalSales = data.reduce((sum, d) => sum + d.total, 0) || 1;

  const getGatewayBadge = (method) => {
    const key = method.toLowerCase();
    if (key.includes('paystack')) return 'bg-emerald-600 text-white';
    if (key.includes('stripe')) return 'bg-indigo-600 text-white';
    if (key.includes('paypal')) return 'bg-blue-600 text-white';
    return 'bg-purple-600 text-white';
  };

  return (
    <div className="flex flex-col gap-2.5 text-left">
      {data.map((gate, idx) => {
        const pct = ((gate.total / totalSales) * 100).toFixed(1);
        return (
          <div key={idx} className="flex items-center justify-between text-xs p-3.5 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs hover:border-[#5D3E85] transition-all">
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-extrabold uppercase text-gray-900 dark:text-white tracking-wider text-[11px]">
                {gate.payment_method === 'cod' ? 'Cash on Delivery' : gate.payment_method}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{gate.count} transactions</span>
            </div>
            <div className="text-right flex flex-col items-end gap-1 shrink-0">
              <span className="font-extrabold block text-gray-900 dark:text-white font-mono text-sm">{currencySymbol}{parseFloat(gate.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs ${getGatewayBadge(gate.payment_method)}`}>
                {pct}% share
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
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
    recent_orders: [],
    recent_consultations: [],
    recent_reviews: [],
    total_products_count: 0,
    total_customers_count: 0
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1E1528] p-6 rounded-3xl border border-gray-200 dark:border-white/10 h-32 shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-[#1E1528] border border-gray-200 dark:border-white/10 rounded-3xl h-80 shadow-sm" />
          <div className="bg-white dark:bg-[#1E1528] border border-gray-200 dark:border-white/10 rounded-3xl h-80 shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-none text-left">

      {/* ─── 1. DASHBOARD HEADER & SOLID ACTION BUTTONS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-left border-b border-gray-200 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white leading-tight">
              Dashboard Overview
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-semibold">
            Real-time skincare sales metrics, VIP spa consultations queue, and inventory alerts.
          </p>
        </div>

        {/* Solid Visible Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/products"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5D3E85] hover:bg-[#4d326f] text-white text-xs font-extrabold rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer btn-spring"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Product</span>
          </Link>

          <Link
            to="/admin/fitting-sessions"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#EC268F] hover:bg-[#c9166f] text-white text-xs font-extrabold rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer btn-spring"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>Spa Consultations</span>
          </Link>

          <Link
            to="/admin/pos"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#181120] hover:bg-black text-white text-xs font-black rounded-full transition-all shadow-md hover:scale-105 active:scale-95 border border-white/15 cursor-pointer btn-spring"
          >
            <Monitor className="w-4 h-4 text-amber-300" />
            <span>Launch POS Terminal</span>
          </Link>


        </div>
      </div>

      {/* ─── 2. SOLID WHITE & HIGH-CONTRAST PRIMARY METRIC CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">

        {/* Card 1: Total Revenue */}
        <Link to="/admin/reports" className="!bg-white bg-white dark:!bg-[#1E1528] border border-gray-200/90 dark:border-white/15 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all duration-200 flex relative items-start gap-4 group">
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-md group-hover:scale-110 transition-transform">
            <Landmark className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[11px] text-gray-600 dark:text-gray-300 font-extrabold uppercase tracking-wider block group-hover:text-emerald-600 transition-colors truncate">
              Total Revenue
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mt-0.5 truncate">
              Overall aggregate sales
            </span>
            <strong className="text-3xl font-black text-gray-950 dark:text-white mt-1.5 block leading-none font-mono tracking-tight">
              {currencySymbol}{parseFloat(metrics.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
          <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white shrink-0" />
        </Link>

        {/* Card 2: Today's Orders */}
        <Link to="/admin/orders" className="!bg-white bg-white dark:!bg-[#1E1528] border border-gray-200/90 dark:border-white/15 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-200 flex relative items-start gap-4 group">
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-blue-600 text-white shadow-md group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[11px] text-gray-600 dark:text-gray-300 font-extrabold uppercase tracking-wider block group-hover:text-blue-600 transition-colors truncate">
              Today's Orders
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mt-0.5 truncate">
              Purchases logged today
            </span>
            <strong className="text-3xl font-black text-gray-950 dark:text-white mt-1.5 block leading-none font-mono tracking-tight">
              {metrics.today_orders}
            </strong>
          </div>
          <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white shrink-0" />
        </Link>

        {/* Card 3: Pending Orders */}
        <Link to="/admin/orders" className="!bg-white bg-white dark:!bg-[#1E1528] border border-gray-200/90 dark:border-white/15 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:border-amber-500 transition-all duration-200 flex relative items-start gap-4 group">
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-amber-500 text-white shadow-md group-hover:scale-110 transition-transform">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[11px] text-gray-600 dark:text-gray-300 font-extrabold uppercase tracking-wider block group-hover:text-amber-600 transition-colors truncate">
              Pending Orders
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mt-0.5 truncate">
              Awaiting fulfillment
            </span>
            <strong className="text-3xl font-black text-gray-950 dark:text-white mt-1.5 block leading-none font-mono tracking-tight">
              {metrics.pending_orders}
            </strong>
          </div>
          <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white shrink-0" />
        </Link>

        {/* Card 4: Low Stock Warnings */}
        <Link to="/admin/inventory" className="!bg-white bg-white dark:!bg-[#1E1528] border border-gray-200/90 dark:border-white/15 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:border-rose-500 transition-all duration-200 flex relative items-start gap-4 group">
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-rose-600 text-white shadow-md group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[11px] text-gray-600 dark:text-gray-300 font-extrabold uppercase tracking-wider block group-hover:text-rose-600 transition-colors truncate">
              Low Stock Items
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block mt-0.5 truncate">
              Needs restock soon
            </span>
            <strong className="text-3xl font-black text-gray-950 dark:text-white mt-1.5 block leading-none font-mono tracking-tight">
              {metrics.low_stock?.length || 0}
            </strong>
          </div>
          <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white shrink-0" />
        </Link>

      </div>

      {/* ─── 3. SECONDARY KPI SUMMARY ROW (Solid White Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* AOV */}
        <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 px-5 py-4 rounded-2xl flex items-center justify-between shadow-xs hover:border-[#5D3E85] transition-all">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase tracking-wider">Average Order Value</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white font-mono mt-0.5">
              {currencySymbol}{parseFloat(metrics.kpis?.aov || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Order Volume */}
        <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 px-5 py-4 rounded-2xl flex items-center justify-between shadow-xs hover:border-[#5D3E85] transition-all">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase tracking-wider">Total Order Volume</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white font-mono mt-0.5">
              {metrics.kpis?.total_volume || 0} orders
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
            <ListOrdered className="w-5 h-5" />
          </div>
        </div>

        {/* Fulfillments */}
        <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 px-5 py-4 rounded-2xl flex items-center justify-between shadow-xs hover:border-[#5D3E85] transition-all">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase tracking-wider">Fulfillments Rate</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white font-mono mt-0.5">
              {metrics.kpis?.paid_orders_count || 0} orders paid
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Catalog Scale */}
        <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 px-5 py-4 rounded-2xl flex items-center justify-between shadow-xs hover:border-[#5D3E85] transition-all">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase tracking-wider">Skincare Catalog</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white font-mono mt-0.5">
              {metrics.total_products_count || 37} active formulas
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[#EC268F] text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ─── 4. CHARTS SECTION (Revenue Growth + Category Splits) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sales Trend Line Chart Card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-2">
          <MonthlySalesChart data={metrics.monthly_sales} />
        </div>

        {/* Category breakdown bar chart Card */}
        <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-2 justify-between">
          <CategorySalesSplit data={metrics.category_splits} />

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
            <span>Fastest selling: <strong className="text-gray-900 dark:text-white">Body & Face Creams</strong></span>
            <Link to="/admin/collections" className="text-[#5D3E85] dark:text-[#EC268F] font-extrabold hover:underline">Manage Collections</Link>
          </div>
        </div>
      </div>

      {/* ─── 5. CORE OPERATIONAL GRID: RECENT ORDERS + SIDE PANELS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT 2 COLS: Recent Orders + Upcoming Spa Consultations */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Recent Orders Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 text-left">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#5D3E85] text-white">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Recent Orders</h3>
              </div>
              <Link to="/admin/orders" className="text-xs text-white font-bold bg-[#5D3E85] hover:bg-[#EC268F] px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-xs btn-spring">
                <span>All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 uppercase font-black text-[10px] tracking-wider">
                    <th className="py-3 font-extrabold">Order #</th>
                    <th className="py-3 font-extrabold">Customer</th>
                    <th className="py-3 font-extrabold">Payment</th>
                    <th className="py-3 font-extrabold">Total</th>
                    <th className="py-3 text-right font-extrabold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {metrics.recent_orders?.length > 0 ? (
                    metrics.recent_orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 font-bold">
                          <Link
                            to={`/admin/orders/${ord.id}`}
                            className="text-[#5D3E85] dark:text-[#EC268F] hover:underline font-mono text-xs"
                          >
                            #{ord.order_number}
                          </Link>
                        </td>
                        <td className="py-3.5 text-gray-900 dark:text-gray-100 font-semibold">{ord.customer_name}</td>
                        <td className="py-3.5 text-left">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${ord.payment_status === 'paid'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 text-white'
                            }`}>
                            {(ord.payment_status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 font-black text-gray-950 dark:text-white font-mono text-sm">{currencySymbol}{parseFloat(ord.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-3.5 text-right">
                          <Link to={`/admin/orders/${ord.id}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-[10px] font-extrabold transition-all shadow-xs">
                            <span>Fulfill</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 italic font-semibold">No orders placed recently.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skincare & VIP Spa Consultations Queue Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 text-left">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EC268F] text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Spa & Skin Consultation Requests</h3>
              </div>
              <Link to="/admin/fitting-sessions" className="text-xs text-white font-bold bg-[#EC268F] hover:bg-[#c9166f] px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-xs btn-spring">
                <span>View Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
              {metrics.recent_consultations?.length > 0 ? (
                metrics.recent_consultations.map((sess) => (
                  <div key={sess.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <strong className="font-black text-gray-950 dark:text-white text-sm">{sess.name}</strong>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#5D3E85] text-white shadow-xs">
                          {sess.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-1 font-medium">
                        <strong>Goal:</strong> {sess.notes || 'Facial Consultation & Skin Glow Routine'}
                      </p>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">
                        Scheduled: {sess.preferred_date ? new Date(sess.preferred_date).toLocaleDateString() : 'Flexible'} · {sess.preferred_time || 'Morning'}
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/${sess.phone ? sess.phone.replace(/[^0-9]/g, '') : ''}?text=Hello%20${encodeURIComponent(sess.name)}%2C%20regarding%20your%20consultation%20with%20Dansolam...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shrink-0 btn-spring"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                      <span>WhatsApp Consult</span>
                    </a>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-gray-400 text-xs italic font-semibold">
                  No pending spa or skin consultations at the moment.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT 1 COL: Low Stock, Best Sellers, Gateway Shares & Latest Reviews */}
        <div className="flex flex-col gap-6">

          {/* 1. Low Stock details Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 text-left">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">Low Stock Alerts</h3>
              <Link to="/admin/inventory" className="text-[10px] text-white bg-rose-600 hover:bg-rose-700 font-extrabold px-3 py-1 rounded-full shadow-xs">Restock</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {metrics.low_stock?.length > 0 ? (
                metrics.low_stock.map((variant) => (
                  <div key={variant.id} className="flex justify-between items-center text-xs p-3 bg-white dark:bg-white/5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs">
                    <div className="text-left">
                      <span className="font-bold text-gray-950 dark:text-white block">{variant.product?.name}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">Vol / Variant: {variant.size || variant.color || 'Standard'}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] shadow-xs shrink-0">
                      {variant.stock_quantity} left
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center font-medium">All skincare formula stocks are healthy.</p>
              )}
            </div>
          </div>

          {/* 2. Best Sellers Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm border-b border-gray-200 dark:border-white/10 pb-3 flex items-center gap-2 text-left">
              <Award className="w-4 h-4 text-amber-500" />
              Best Selling Formulas
            </h3>
            <div className="flex flex-col gap-2.5">
              {metrics.best_sellers?.length > 0 ? (
                metrics.best_sellers.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs">
                    <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[170px] text-left">{item.product_name}</span>
                    <span className="text-white font-extrabold bg-[#5D3E85] px-3 py-1 rounded-full shadow-xs shrink-0 font-mono text-[10px]">
                      {item.total_sold} sold
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center font-medium">Sales data will aggregate here.</p>
              )}
            </div>
          </div>

          {/* 3. Payment Gateways Shares Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm border-b border-gray-200 dark:border-white/10 pb-3 text-left">
              Payment Gateway Shares
            </h3>
            <PaymentGatewaySplits data={metrics.payment_splits} />
          </div>

          {/* 4. Live Client Feedback & Reviews Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 text-left">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Latest Client Reviews
              </h3>
              <Link to="/admin/reviews" className="text-[10px] text-white bg-[#5D3E85] hover:bg-[#EC268F] font-bold px-3 py-1 rounded-full shadow-xs">All Reviews</Link>
            </div>
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
              {metrics.recent_reviews?.length > 0 ? (
                metrics.recent_reviews.map((rev) => (
                  <div key={rev.id} className="py-3 flex flex-col gap-1 text-xs text-left">
                    <div className="flex items-center justify-between">
                      <strong className="font-extrabold text-gray-900 dark:text-white text-xs">{rev.customer_name}</strong>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 italic font-medium">
                      "{rev.comment}"
                    </p>
                    {rev.product?.name && (
                      <span className="text-[10px] text-[#5D3E85] dark:text-[#EC268F] font-extrabold">
                        {rev.product.name}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center font-medium">No reviews logged yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
