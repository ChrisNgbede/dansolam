import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, Search, ArrowUpDown, SlidersHorizontal, ChevronDown } from 'lucide-react';

/*
 * Dashboard pieces in the admin reference style: KPI tiles with sparklines, a
 * donut, a rounded-bar revenue chart and a recent-orders table. Colours come
 * from the Dansolam palette and meet 3:1 contrast for chart marks on white.
 */

export const CHART_COLORS = {
  plum: '#7A4DB3',     // 5.9:1 on white
  fuchsia: '#D01B79',  // 4.9:1
  gold: '#A16207',     // 4.9:1 (gold dark enough for a line)
  green: '#15803D',    // 5.0:1
  lilac: '#B79BE0',    // decorative fills only
  sand: '#F2D98A',     // decorative fills only
};

const compactMoney = (symbol, value) => {
  const n = Number(value) || 0;
  if (n >= 1000) return `${symbol}${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${symbol}${n.toFixed(0)}`;
};

/** Small area sparkline. */
export function Sparkline({ values = [], color = CHART_COLORS.plum, label }) {
  const id = useId().replace(/:/g, '');
  const w = 120, h = 44, pad = 3;
  const data = values.length > 1 ? values : [0, 0];
  const max = Math.max(...data, 1);
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2 - 6)]);
  // Smooth path through the points.
  const line = pts.reduce((d, [x, y], i, arr) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = arr[i - 1];
    const cx = (px + x) / 2;
    return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-28 h-11 shrink-0" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** KPI tile: icon ring, sparkline, big value, label. */
export function KpiTile({ icon: Icon, value, label, series, color, to }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="w-11 h-11 rounded-full grid place-items-center border border-[var(--adm-border)] text-[var(--adm-text)] shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <Sparkline values={series} color={color} label={`${label}, last 14 days`} />
      </div>
      <div className="mt-4">
        <strong className="block text-[28px] leading-none font-bold tracking-tight text-[var(--adm-text)] tabular-nums">{value}</strong>
        <span className="block mt-2 text-[14px] font-medium text-[var(--adm-muted)]">{label}</span>
      </div>
    </>
  );
  const cls = 'adm-card block p-5 rounded-[22px] bg-[var(--adm-surface)] border border-[var(--adm-border)] hover:-translate-y-0.5 transition-transform';
  return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Card with a title, subtitle and optional refresh button. */
export function Panel({ title, subtitle, onRefresh, refreshing, actions, children, className = '' }) {
  return (
    <section className={`adm-card rounded-[22px] bg-[var(--adm-surface)] border border-[var(--adm-border)] p-5 sm:p-6 flex flex-col gap-5 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[19px] font-bold text-[var(--adm-text)] leading-tight">{title}</h3>
          {subtitle && <p className="mt-1 text-[13px] text-[var(--adm-muted)]">{subtitle}</p>}
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${actions ? 'w-full sm:w-auto' : ''}`}>
          {actions}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label={`Refresh ${title}`}
              className="adm-round w-11 h-11 shrink-0 rounded-full grid! place-items-center transition-colors"
            >
              <RotateCw className={`w-[18px] h-[18px] shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

/** Donut with a legend; the largest slice is called out like the reference tooltip. */
export function Donut({ slices = [], symbol = '£', emptyText = 'No paid orders yet.' }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const [active, setActive] = useState(null);
  if (!total) {
    return <p className="py-16 text-center text-[13px] text-[var(--adm-muted)]">{emptyText}</p>;
  }
  const r = 70, c = 2 * Math.PI * r, gap = 6;
  let offset = 0;
  const arcs = slices.map((s) => {
    const len = (s.value / total) * c;
    const arc = { ...s, dash: Math.max(len - gap, 1), offset };
    offset += len;
    return arc;
  });
  const shown = active ?? arcs.reduce((a, b) => (b.value > a.value ? b : a), arcs[0]);
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-56 h-56">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90" role="img" aria-label={`Revenue split: ${slices.map((s) => `${s.label} ${symbol}${s.value.toFixed(2)}`).join(', ')}`}>
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx="100" cy="100" r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={active?.label === a.label ? 30 : 26}
              strokeLinecap="round"
              strokeDasharray={`${a.dash} ${c}`}
              strokeDashoffset={-a.offset}
              className="transition-[stroke-width] duration-200 cursor-pointer"
              onMouseEnter={() => setActive(a)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
          <div>
            <span className="block text-[22px] font-bold text-[var(--adm-text)] tabular-nums">{symbol}{shown.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="block text-[12px] text-[var(--adm-muted)]">{shown.label} · {Math.round((shown.value / total) * 100)}%</span>
          </div>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-[14px] text-[var(--adm-text-2)]">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Rounded bar chart with hatched tracks (reference style). */
export function RevenueBars({ months = [], symbol = '£' }) {
  const max = Math.max(...months.map((m) => m.total), 0);
  // Round the axis up to a tidy value (e.g. 2,486 -> 2,500 in steps of 500).
  const top = (() => {
    if (max <= 0) return 5;
    const raw = max / 5;
    const mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map((x) => x * mag).find((step) => step >= raw) * 5;
  })();
  const ticks = [5, 4, 3, 2, 1].map((i) => (top / 5) * i);
  const [hover, setHover] = useState(null);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between h-60 pb-9 text-[12px] text-[var(--adm-muted)] tabular-nums text-right w-12 shrink-0" aria-hidden="true">
        {ticks.map((t) => <span key={t}>{compactMoney(symbol, t)}</span>)}
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="absolute inset-x-0 top-0 h-[calc(15rem-2.25rem)] flex flex-col justify-between pointer-events-none" aria-hidden="true">
          {ticks.map((t) => <span key={t} className="border-t border-dashed border-[var(--adm-border)]" />)}
        </div>
        <ul className="relative flex items-end justify-between gap-1 sm:gap-4 h-60" aria-label="Revenue by month">
          {months.map((m, i) => {
            const pct = top ? Math.max((m.total / top) * 100, m.total > 0 ? 6 : 0) : 0;
            return (
              <li key={`${m.month}-${m.year}`} className="flex-1 min-w-0 flex flex-col items-center gap-3 h-full">
                <button
                  type="button"
                  className="relative w-full max-w-[56px] flex-1 rounded-full adm-hatch overflow-hidden focus-visible:outline-2"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`${m.month} ${m.year}: ${symbol}${m.total.toFixed(2)}`}
                >
                  <span className="absolute inset-x-0 bottom-0 rounded-full bg-[var(--adm-accent)] transition-[height] duration-500" style={{ height: `${pct}%` }} />
                  {hover === i && (
                    <span className="absolute left-1/2 -translate-x-1/2 -top-1 -translate-y-full whitespace-nowrap rounded-xl bg-[#17101F] text-white text-[12px] font-semibold px-2.5 py-1.5 shadow-lg z-10">
                      {symbol}{m.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </button>
                <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[var(--adm-border)] text-[11px] sm:text-[12px] text-[var(--adm-text-2)] whitespace-nowrap">{m.month}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const GOOD = 'text-[#15803D] border-[#15803D]/45 dark:text-[#4ADE80] dark:border-[#4ADE80]/45';
const WAIT = 'text-[#A15C07] border-[#A15C07]/45 dark:text-[#FBBF24] dark:border-[#FBBF24]/45';
const MOVE = 'text-[#1D4ED8] border-[#1D4ED8]/45 dark:text-[#93C5FD] dark:border-[#93C5FD]/45';
const STOP = 'text-[#B91C1C] border-[#B91C1C]/45 dark:text-[#FCA5A5] dark:border-[#FCA5A5]/45';
const BACK = 'text-[#5B21B6] border-[#5B21B6]/45 dark:text-[#C4B5FD] dark:border-[#C4B5FD]/45';
const STATUS_STYLES = {
  paid: GOOD, delivered: GOOD, completed: GOOD, authorized: GOOD,
  pending: WAIT, pending_payment: WAIT, packed: MOVE,
  processing: MOVE, shipped: MOVE, ready_for_pickup: MOVE,
  cancelled: STOP, failed: STOP, voided: STOP,
  refunded: BACK, partially_refunded: BACK,
};
export const StatusPill = ({ value }) => (
  <span className={`adm-pill inline-flex items-center px-3 py-1 rounded-full border text-[12px] font-semibold capitalize whitespace-nowrap ${STATUS_STYLES[value] || 'text-[var(--adm-text-2)] border-[var(--adm-border)]'}`}>
    {String(value || 'pending').replace(/_/g, ' ')}
  </span>
);

/** Recent orders with search, sort and a status filter (reference layout). */
export function RecentOrders({ orders = [], symbol = '£' }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [status, setStatus] = useState('all');
  const statuses = useMemo(() => [...new Set(orders.map((o) => o.order_status).filter(Boolean))], [orders]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => status === 'all' || o.order_status === status)
      .filter((o) => !q || [o.order_number, o.customer_name, o.customer_email].some((v) => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort === 'total') return Number(b.total_amount) - Number(a.total_amount);
        if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [orders, query, sort, status]);

  const control = 'border border-[var(--adm-field-border)] bg-[var(--adm-surface)] text-[var(--adm-text-2)]';
  return (
    <Panel
      title="Recent orders"
      actions={
        <>
          <label className="relative w-full sm:w-auto">
            <span className="sr-only">Search recent orders</span>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--adm-muted)] pointer-events-none" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className={`${control} w-full sm:w-56 pl-10! pr-4!`} />
          </label>
          <label className="relative flex-1 sm:flex-none">
            <span className="sr-only">Sort by</span>
            <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--adm-muted)] pointer-events-none" aria-hidden="true" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${control} w-full appearance-none pl-10! pr-9! cursor-pointer`}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="total">Highest total</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--adm-muted)] pointer-events-none" aria-hidden="true" />
          </label>
          <label className="relative flex-1 sm:flex-none">
            <span className="sr-only">Filter by status</span>
            <SlidersHorizontal className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--adm-muted)] pointer-events-none" aria-hidden="true" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${control} w-full appearance-none pl-10! pr-9! cursor-pointer capitalize`}>
              <option value="all">All statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--adm-muted)] pointer-events-none" aria-hidden="true" />
          </label>
        </>
      }
    >
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Date</th>
              <th scope="col">Customer</th>
              <th scope="col">Payment</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-right!">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center! py-10!">No orders match.</td></tr>
            ) : rows.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap"><Link to={`/admin/orders/${o.id}`} className="font-semibold text-[var(--adm-primary)] dark:text-[#C4A4F0] hover:underline">#{o.order_number}</Link></td>
                <td className="whitespace-nowrap">{new Date(o.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="truncate max-w-[180px]">{o.customer_name}</td>
                <td><StatusPill value={o.payment_status} /></td>
                <td><StatusPill value={o.order_status} /></td>
                <td className="text-right! font-semibold tabular-nums whitespace-nowrap">{symbol}{Number(o.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Link to="/admin/orders" className="admin-btn-secondary">View all orders</Link>
      </div>
    </Panel>
  );
}
