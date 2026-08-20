import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Check, X, Loader2, DollarSign, Settings, Layers, Box, Globe, Weight, ShieldAlert, Scale, MapPin } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { COUNTRIES } from '../../utils/geoData';
import LocationMultiSelect from '../../components/ui/LocationMultiSelect';

export default function AdminShipping() {
  const queryClient = useQueryClient();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('flat'); // flat, per_item
  const [rate, setRate] = useState('0');
  const [applicability, setApplicability] = useState('global'); // global, products, categories
  const [salesChannel, setSalesChannel] = useState('both');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [calculationMethod, setCalculationMethod] = useState('flat');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [maxVolume, setMaxVolume] = useState('');
  const [onlyFragile, setOnlyFragile] = useState(false);
  const [shippingZoneType, setShippingZoneType] = useState('all');
  const [shippingCountries, setShippingCountries] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Shipping Rates
  const { data: ratesRes, isLoading: ratesLoading } = useQuery({
    queryKey: ['admin-shipping-rates'],
    queryFn: () => apiFetch('/api/admin/shipping-rates').then(res => res.json())
  });

  // Fetch Settings to get dynamic Domicile/Domestic country
  const { data: settingsRes } = useQuery({
    queryKey: ['admin-settings-panel'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json())
  });
  const settings = settingsRes?.data?.settings || {};
  const domesticCountry = settings.system_domestic_country || 'Nigeria';
  const rates = ratesRes?.data || [];

  // Fetch Products for selection
  const { data: productsRes } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiFetch('/api/admin/products').then(res => res.json())
  });
  const products = productsRes?.data || [];

  // Fetch Categories for selection
  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => apiFetch('/api/admin/categories').then(res => res.json())
  });
  const categories = categoriesRes?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/shipping-rates', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        queryClient.invalidateQueries(['admin-shipping-rates']);
        closeForm();
      } else {
        setErrorMsg(data.message || 'Creation failed');
      }
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/shipping-rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        queryClient.invalidateQueries(['admin-shipping-rates']);
        closeForm();
      } else {
        setErrorMsg(data.message || 'Update failed');
      }
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/shipping-rates/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-shipping-rates']);
      } else {
        systemToast.error(data.message || 'Delete failed');
      }
    }
  });

  const closeForm = () => {
    setShowFormModal(false);
    setEditingRate(null);
    setName('');
    setType('flat');
    setRate('0');
    setApplicability('global');
    setSalesChannel('both');
    setSelectedProductIds([]);
    setSelectedCategoryIds([]);
    setIsActive(true);
    setCalculationMethod('flat');
    setMinWeight('');
    setMaxWeight('');
    setMinVolume('');
    setMaxVolume('');
    setOnlyFragile(false);
    setShippingZoneType('all');
    setShippingCountries([]);
    setErrorMsg('');
  };

  const handleEdit = (r) => {
    setEditingRate(r);
    setName(r.name);
    setType(r.type);
    setRate(r.rate);
    setApplicability(r.applicability);
    setSalesChannel(r.sales_channel || 'both');
    setSelectedProductIds(r.products ? r.products.map(p => p.id) : []);
    setSelectedCategoryIds(r.categories ? r.categories.map(c => c.id) : []);
    setIsActive(!!r.is_active);
    setCalculationMethod(r.calculation_method || 'flat');
    setMinWeight(r.min_weight || '');
    setMaxWeight(r.max_weight || '');
    setMinVolume(r.min_volume || '');
    setMaxVolume(r.max_volume || '');
    setOnlyFragile(!!r.only_fragile);
    setShippingZoneType(r.shipping_zone_type || 'all');
    setShippingCountries(r.shipping_countries || []);
    setShowFormModal(true);
  };

  const handleDelete = (id, rName) => {
    if (confirm(`Are you sure you want to delete shipping configuration "${rName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionLoading(true);

    const payload = {
      name,
      type,
      rate: parseFloat(rate) || 0,
      applicability,
      sales_channel: salesChannel,
      product_ids: selectedProductIds,
      category_ids: selectedCategoryIds,
      is_active: isActive,
      calculation_method: calculationMethod,
      min_weight: minWeight ? parseFloat(minWeight) : null,
      max_weight: maxWeight ? parseFloat(maxWeight) : null,
      min_volume: minVolume ? parseFloat(minVolume) : null,
      max_volume: maxVolume ? parseFloat(maxVolume) : null,
      only_fragile: onlyFragile,
      shipping_zone_type: shippingZoneType,
      shipping_countries: shippingCountries,
    };

    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleProductToggle = (prodId) => {
    if (selectedProductIds.includes(prodId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== prodId));
    } else {
      setSelectedProductIds([...selectedProductIds, prodId]);
    }
  };

  const handleCategoryToggle = (catId) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  if (ratesLoading) {
    return <div className="animate-pulse bg-white border border-gray-250 rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-serif font-bold text-gray-900 text-2xl">Advanced Shipping configurations</h1>
          <p className="text-xs text-gray-450 mt-1">Configure global, product-specific, or category-specific shipping and handling fees. Multiple fees apply concurrently.</p>
        </div>
        <button
          onClick={() => { closeForm(); setShowFormModal(true); }}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-primary-hover shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Shipping Rate
        </button>
      </div>

      {/* Main Rates Grid */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none">
                <th className="px-6 py-3.5">Rate Details</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Rate / Fee</th>
                <th className="px-6 py-3.5">Applicability</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.length > 0 ? (
                rates.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-55/30">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900 block">{r.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold uppercase text-[9px]">
                        {r.type === 'flat' ? 'Flat Amount' : 'Per Item'}
                      </span>
                      {r.calculation_method && r.calculation_method !== 'flat' && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold uppercase text-[9px] ml-1">
                          {r.calculation_method === 'per_kg' ? 'Per KG' : r.calculation_method === 'per_volume' ? 'Per Vol' : r.calculation_method === 'per_item' ? 'Per Item' : 'Flat'}
                        </span>
                      )}
                      {r.only_fragile && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-bold text-[9px] ml-1 inline-flex items-center gap-0.5">
                          <ShieldAlert className="w-2.5 h-2.5" /> Fragile Only
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ₦{parseFloat(r.rate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {r.applicability === 'global' && (
                          <span className="inline-flex items-center gap-1 text-gray-650 bg-blue-50/50 text-blue-600 px-2 py-0.5 rounded font-medium">
                            <Globe className="w-3 h-3" /> Global Order
                          </span>
                        )}
                        {r.applicability === 'products' && (
                          <span className="inline-flex items-center gap-1 text-gray-650 bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-medium">
                            <Box className="w-3 h-3" /> {r.products?.length || 0} Products
                          </span>
                        )}
                        {r.applicability === 'categories' && (
                          <span className="inline-flex items-center gap-1 text-gray-650 bg-purple-55 bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-medium">
                            <Layers className="w-3 h-3" /> {r.categories?.length || 0} Categories
                          </span>
                        )}
                        {r.shipping_zone_type && r.shipping_zone_type !== 'all' && (
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium ml-1">
                            <MapPin className="w-3 h-3" /> {r.shipping_zone_type === 'domestic' ? `Domestic Only (${domesticCountry})` : r.shipping_zone_type === 'international' ? `Intl Only (Non-${domesticCountry})` : `${r.shipping_countries?.length || 0} Locations`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        r.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-all cursor-pointer"
                          title="Edit Rate"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          className="p-1.5 text-gray-500 hover:text-red-655 hover:bg-red-50 rounded transition-all cursor-pointer"
                          title="Delete Rate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">No custom shipping rates defined. Standard default settings apply.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM DIALOG MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">
                {editingRate ? 'Edit Shipping configuration' : 'Add Shipping configuration'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-150 text-red-500 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Rate Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g., Express Priority Courier"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full h-8.5 cursor-pointer"
                  >
                    <option value="flat">Flat Surcharge (once per order)</option>
                    <option value="per_item">Per Item (multiplied by qty)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Rate Amount (₦) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Applicability *</label>
                  <select
                    value={applicability}
                    onChange={e => setApplicability(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full h-8.5 cursor-pointer"
                  >
                    <option value="global">Global (applies to all orders)</option>
                    <option value="products">Selected Products</option>
                    <option value="categories">Selected Categories</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Sales channel *</label>
                  <select value={salesChannel} onChange={e => setSalesChannel(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs h-8.5">
                    <option value="storefront">Storefront only</option>
                    <option value="pos">POS only</option>
                    <option value="both">Storefront and POS</option>
                  </select>
                </div>
              </div>
              {/* Shipping Destinations Location scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-gray-100 pt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Location Scope *</label>
                  <select
                    value={shippingZoneType}
                    onChange={e => {
                      setShippingZoneType(e.target.value);
                      if (e.target.value !== 'specific_countries') {
                        setShippingCountries([]);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full h-8.5 cursor-pointer"
                  >
                    <option value="all">All Locations (Global / Domestic / International)</option>
                    <option value="domestic">Domestic Only ({domesticCountry})</option>
                    <option value="international">International Only (Non-{domesticCountry})</option>
                    <option value="specific_countries">Specific Countries & States</option>
                  </select>
                </div>
              </div>

              {shippingZoneType === 'specific_countries' && (
                <div className="flex flex-col gap-1.5 border border-gray-150 rounded-lg p-3 bg-gray-55">
                  <label className="text-[10px] text-gray-555 font-bold uppercase block">Select Applicable Locations</label>
                  <LocationMultiSelect
                    selected={shippingCountries}
                    onChange={val => setShippingCountries(val)}
                    domesticCountry={domesticCountry}
                    placeholder="Select countries or domestic states..."
                  />
                </div>
              )}


              {/* Products selector if selected */}
              {applicability === 'products' && (
                <div className="flex flex-col gap-1.5 border border-gray-150 rounded-lg p-3 bg-gray-50">
                  <label className="text-[10px] text-gray-500 font-bold uppercase block">Select Applicable Products</label>
                  <div className="max-h-48 overflow-y-auto custom-sidebar-scroll flex flex-col gap-1 mt-1 pr-1">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-xs text-gray-750 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => handleProductToggle(p.id)}
                          className="rounded text-primary focus:ring-primary w-4 h-4"
                        />
                        <span>{p.name} (₦{parseFloat(p.price).toLocaleString()})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories selector if selected */}
              {applicability === 'categories' && (
                <div className="flex flex-col gap-1.5 border border-gray-150 rounded-lg p-3 bg-gray-50">
                  <label className="text-[10px] text-gray-500 font-bold uppercase block">Select Applicable Categories</label>
                  <div className="max-h-48 overflow-y-auto custom-sidebar-scroll flex flex-col gap-1 mt-1 pr-1">
                    {categories.map(c => (
                      <label key={c.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-xs text-gray-750 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(c.id)}
                          onChange={() => handleCategoryToggle(c.id)}
                          className="rounded text-primary focus:ring-primary w-4 h-4"
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-150 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5"
                />
                <span className="text-xs font-semibold text-gray-800">Configuration is active</span>
              </label>

              {/* Advanced Shipping Rules */}
              <div className="border-t border-gray-150 pt-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] text-gray-555 font-bold uppercase">Advanced Rules (Optional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-555 font-bold uppercase">Calculation Method</label>
                    <select
                      value={calculationMethod}
                      onChange={e => setCalculationMethod(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 cursor-pointer"
                    >
                      <option value="flat">Flat Rate (once per order)</option>
                      <option value="per_item">Per Item (× quantity)</option>
                      <option value="per_kg">Per Kilogram (× total weight)</option>
                      <option value="per_volume">Per Volume Unit (× total cm³/1000)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors w-full">
                      <input
                        type="checkbox"
                        checked={onlyFragile}
                        onChange={e => setOnlyFragile(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600 w-4 h-4"
                      />
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700">Apply only to fragile items</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Min Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={minWeight}
                      onChange={e => setMinWeight(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="Any"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Max Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={maxWeight}
                      onChange={e => setMaxWeight(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="Any"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Min Volume (cm³)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={minVolume}
                      onChange={e => setMinVolume(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="Any"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Max Volume (cm³)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={maxVolume}
                      onChange={e => setMaxVolume(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="Any"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-gray-250 hover:bg-gray-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingRate ? 'Update Configuration' : 'Create Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
