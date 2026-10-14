import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, Loader2, Target } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import CollectionsManager from '../../components/admin/CollectionsManager';
import ConcernStudio from '../../components/admin/ConcernStudio';

export default function AdminCollections() {
  const [activeTab, setActiveTab] = useState('collections'); // 'collections' | 'concerns'

  const { data: collectionsRes, isLoading } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: () => apiFetch('/api/admin/collections').then(res => res.json())
  });

  const { data: productsRes } = useQuery({
    queryKey: ['admin-products-list-sync'],
    queryFn: () => apiFetch('/api/admin/products').then(res => res.json())
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories-list-sync'],
    queryFn: () => apiFetch('/api/admin/categories').then(res => res.json())
  });

  // Mega menu promo banners and the shop-by-concern section live in settings.
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-admin-collections'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json())
  });

  const collections = collectionsRes?.data || [];
  const products = productsRes?.data || [];
  const categories = categoriesRes?.data || [];
  const settings = settingsRes?.data?.settings || {};

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#5D3E85]" />
        <span>Loading collections…</span>
      </div>
    );
  }

  const tabs = [
    { key: 'collections', label: `Collections (${collections.length})`, icon: Layers },
    { key: 'concerns', label: 'Shop by Concern', icon: Target },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-none text-left">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white leading-tight">
            Collections
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Group products for the storefront and Shop menu, and curate the homepage "Shop by concern" section.
          </p>
        </div>

        <div className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-full" role="tablist">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={activeTab === key ? 'bg-white' : ''}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'collections' && (
        <CollectionsManager collections={collections} products={products} categories={categories} settings={settings} />
      )}

      {activeTab === 'concerns' && (
        <ConcernStudio settingsRes={settingsRes} categories={categories} collections={collections} products={products} />
      )}
    </div>
  );
}
