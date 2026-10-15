import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Globe2, MapPinned, Store } from 'lucide-react';

/**
 * Shipping & Delivery page body, built only from the shipping methods configured in
 * Admin → Shipping (the same /api/shipping-rates data checkout uses). Nothing here is
 * typed in by hand, so the page always matches what customers are charged.
 */

const ZONES = [
  { key: 'uk', title: 'United Kingdom', note: 'Deliveries within the United Kingdom.', Icon: Truck },
  { key: 'international', title: 'International', note: 'Every country outside the United Kingdom, including Jersey, Guernsey and the Isle of Man.', Icon: Globe2 },
  { key: 'all', title: 'All destinations', note: 'Available wherever you are.', Icon: MapPinned },
];

const items = (n) => `${n} item${Number(n) === 1 ? '' : 's'}`;

// Plain-English version of the quantity rule the checkout applies.
function quantityText(m) {
  const v = m.quantity_value;
  switch (m.quantity_condition || 'between') {
    case 'lt': return v == null ? null : `Fewer than ${items(v)}`;
    case 'lte': return v == null ? null : `Up to ${items(v)}`;
    case 'gt': return v == null ? null : `More than ${items(v)}`;
    case 'gte': return v == null ? null : `${items(v)} or more`;
    case 'eq': return v == null ? null : `Exactly ${items(v)}`;
    default: {
      const min = m.min_quantity == null ? null : Number(m.min_quantity);
      const max = m.max_quantity == null ? null : Number(m.max_quantity);
      if (min != null && max != null) return min === max ? `Exactly ${items(min)}` : `${min}–${items(max)}`;
      if (max != null) return `Up to ${items(max)}`;
      if (min != null && min > 1) return `${items(min)} or more`;
      return null;
    }
  }
}

function targetText(m) {
  const names = [...(m.applies_to?.categories || []), ...(m.applies_to?.products || [])];
  if (!names.length) return null;
  const list = names.join(', ');
  return m.target_match === 'all' ? `When every item in your bag is from: ${list}` : `For orders containing: ${list}`;
}

function conditions(m) {
  const lines = [];
  const target = targetText(m);
  if (target) lines.push(target);
  const qty = quantityText(m);
  if (qty) lines.push(target && m.quantity_basis === 'matching' ? `${qty} of those products` : `${qty} in your bag`);
  if (m.overrides_others && target) lines.push('Replaces the standard options when it applies');
  return lines;
}

function MethodRow({ method, money }) {
  const rate = parseFloat(method.rate || 0);
  const price = rate === 0 ? 'Free' : money(rate);
  return (
    <li className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-6 py-4 border-b border-gray-100 dark:border-white/10 last:border-0">
      <div className="min-w-0">
        <p className="font-bold text-sm text-[#221B2B] dark:text-[#F3EFF6]">{method.name}</p>
        {conditions(method).map((line) => (
          <p key={line} className="text-xs text-gray-500 dark:text-[#9B8EA9] mt-1 leading-relaxed">{line}</p>
        ))}
        {method.description && <p className="text-xs text-gray-600 dark:text-[#C9BED4] mt-1 leading-relaxed">{method.description}</p>}
      </div>
      <p className="shrink-0 text-sm font-extrabold text-[#221B2B] dark:text-[#F3EFF6] sm:text-right">
        {price}
        {rate > 0 && <span className="block text-[11px] font-semibold text-gray-500 dark:text-[#9B8EA9]">{method.charge_per_item ? 'per item' : 'per order'}</span>}
      </p>
    </li>
  );
}

function Group({ title, note, Icon, methods, money }) {
  return (
    <section className="bg-white dark:bg-[#1E1528] rounded-3xl border border-[#EADBEE] dark:border-white/10 p-6 sm:p-8 shadow-sm">
      <div className="flex items-start gap-3 mb-2">
        <span className="w-10 h-10 rounded-2xl bg-[#5D3E85]/10 dark:bg-[#EC268F]/15 text-[#5D3E85] dark:text-[#EC268F] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-extrabold text-lg text-[#221B2B] dark:text-[#F3EFF6]">{title}</h2>
          <p className="text-xs text-gray-500 dark:text-[#9B8EA9] mt-0.5">{note}</p>
        </div>
      </div>
      <ul>
        {methods.map((m) => <MethodRow key={m.id} method={m} money={money} />)}
      </ul>
    </section>
  );
}

export default function ShippingRatesContent({ settings = {} }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-shipping-rates'],
    queryFn: () => fetch('/api/shipping-rates').then((res) => res.json()),
  });

  const symbol = settings.system_currency_symbol || '£';
  const money = (n) => symbol + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20" role="status" aria-label="Loading shipping options">
        <span className="page-spinner" aria-hidden="true" />
      </div>
    );
  }

  const methods = (data?.data || []).filter((m) => m.is_active !== false);
  const pickup = methods.filter((m) => m.is_pickup);
  const delivery = methods.filter((m) => !m.is_pickup);
  const groups = ZONES
    .map((z) => ({ ...z, methods: delivery.filter((m) => (m.zone || 'all') === z.key) }))
    .filter((g) => g.methods.length);

  if (isError || (!groups.length && !pickup.length)) {
    return (
      <p className="bg-white dark:bg-[#1E1528] rounded-3xl border border-[#EADBEE] dark:border-white/10 p-8 text-sm text-gray-600 dark:text-[#C9BED4]">
        {isError ? "We couldn't load shipping options. Please refresh the page." : 'Shipping options are shown at checkout once you enter your delivery country.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-600 dark:text-[#C9BED4] leading-relaxed">
        At checkout you choose from the options below that match your delivery country and the items in your bag. Charges are in {settings.system_currency_code || 'GBP'}.
      </p>
      {groups.map((g) => <Group key={g.key} {...g} money={money} />)}
      {pickup.length > 0 && (
        <Group title="Collection" note="Collect your order from us instead of having it delivered." Icon={Store} methods={pickup} money={money} />
      )}
    </div>
  );
}
