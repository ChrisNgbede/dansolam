import { getCurrencySymbol } from '../../utils/currency';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Landmark, ShoppingCart, Clock, AlertTriangle, ArrowRight, TrendingUp,
  DollarSign, ListOrdered, MoreVertical, Award, ArrowUpRight, Monitor,
  ReceiptText, PackageCheck, WalletCards, Plus, MessageSquare,
  Calendar, Check, ShieldCheck, Heart, Star, ExternalLink, Package, Users
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { KpiTile, Panel, Donut, RevenueBars, RecentOrders, CHART_COLORS } from '../../components/admin/DashboardWidgets';

const PAYMENT_LABELS = { paypal: 'PayPal', stripe: 'Stripe', paystack: 'Paystack', flutterwave: 'Flutterwave', bank_transfer: 'Bank transfer', cash_on_delivery: 'Cash on delivery', pos: 'In store', manual: 'Manual' };

const currencySymbol = getCurrencySymbol();

export default function AdminDashboard() {
  const currencySymbol = getCurrencySymbol();

  // Fetch dashboard metrics
  const { data: metricsRes, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => apiFetch('/api/admin/metrics').then(res => res.json())
  });
  const updatedText = dataUpdatedAt ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';

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
            <div key={i} className="bg-[var(--adm-surface)] rounded-[22px] border border-[var(--adm-border)] h-40" />
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

      {/* Header: title and quick actions */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white leading-tight">Dashboard</h2>
          <p className="mt-1.5 text-[14px] text-[var(--adm-muted)]">Sales, orders, customers and stock at a glance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/admin/products/new" className="admin-btn-primary gap-2"><Plus className="w-4 h-4" /> New product</Link>
          <Link to="/admin/fitting-sessions" className="admin-btn-secondary gap-2"><Calendar className="w-4 h-4" /> Consultations</Link>
          <Link to="/admin/pos" className="admin-btn-secondary gap-2"><Monitor className="w-4 h-4" /> Point of sale</Link>
        </div>
      </div>

      {/* KPI tiles with 14-day sparklines */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        <KpiTile to="/admin/reports" icon={Landmark} color={CHART_COLORS.green} series={metrics.sparklines?.revenue}
          value={`${currencySymbol}${Number(metrics.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} label="Total revenue" />
        <KpiTile to="/admin/orders" icon={ShoppingCart} color={CHART_COLORS.plum} series={metrics.sparklines?.orders}
          value={Number(metrics.kpis?.paid_orders_count || 0).toLocaleString()} label="Paid orders" />
        <KpiTile to="/admin/customers" icon={Users} color={CHART_COLORS.fuchsia} series={metrics.sparklines?.customers}
          value={Number(metrics.total_customers_count || 0).toLocaleString()} label="Customers" />
        <KpiTile to="/admin/products" icon={Package} color={CHART_COLORS.gold} series={metrics.sparklines?.units}
          value={Number(metrics.units_sold || 0).toLocaleString()} label="Products sold" />
      </div>

      {/* Charts: revenue by payment method + monthly revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] gap-4 md:gap-5">
        <Panel title="Sales by payment method" subtitle={updatedText} onRefresh={() => refetch()} refreshing={isFetching}>
          <Donut
            symbol={currencySymbol}
            slices={(metrics.payment_splits || []).map((p, i) => ({
              label: PAYMENT_LABELS[p.payment_method] || String(p.payment_method || 'Other').replace(/_/g, ' '),
              value: Number(p.total) || 0,
              color: [CHART_COLORS.plum, CHART_COLORS.lilac, CHART_COLORS.fuchsia, CHART_COLORS.sand, CHART_COLORS.green][i % 5],
            }))}
          />
        </Panel>
        <Panel title="Revenue analytics" subtitle={updatedText} onRefresh={() => refetch()} refreshing={isFetching}>
          <RevenueBars months={metrics.monthly_revenue || []} symbol={currencySymbol} />
        </Panel>
      </div>

      {/* Recent orders */}
      <RecentOrders orders={metrics.recent_orders || []} symbol={currencySymbol} />

      {/* Operations: consultations, best sellers, low stock, reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-stretch">
          {/* Skincare & VIP Spa Consultations Queue Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-sm h-full hover:shadow-md transition-all duration-200 flex flex-col gap-4">
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

          {/* 2. Best Sellers Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm h-full hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
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

          {/* 1. Low Stock details Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm h-full hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
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

          {/* 4. Live Client Feedback & Reviews Card */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm h-full hover:shadow-md transition-all duration-200 flex flex-col gap-3.5">
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
  );
}
