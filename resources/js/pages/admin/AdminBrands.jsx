import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, Trash2, Edit, ExternalLink, Search, Globe, ToggleLeft, ToggleRight, Sparkles, Upload, Loader2, X } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';

export default function AdminBrands() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // Loading/Uploading states
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Brands
  const { data: brandsRes, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => apiFetch('/api/admin/brands').then(res => res.json())
  });
  const brands = brandsRes?.data || [];

  // Create Brand Mutation
  const createMutation = useMutation({
    mutationFn: (newBrand) => {
      return apiFetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBrand)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-brands']);
        setSuccessMsg('Brand created successfully!');
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to create brand.');
      }
    },
    onError: () => setErrorMsg('Network error.')
  });

  // Update Brand Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updatedData }) => {
      return apiFetch(`/api/admin/brands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-brands']);
        setSuccessMsg('Brand updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to update brand.');
      }
    },
    onError: () => setErrorMsg('Network error.')
  });

  // Delete Brand Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/brands/${id}`, {
        method: 'DELETE'
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-brands']);
      }
    }
  });

  const resetForm = () => {
    setName('');
    setWebsiteUrl('');
    setLogoPath('');
    setIsFeatured(true);
    setSortOrder(0);
    setErrorMsg('');
    setSuccessMsg('');
    setUploading(false);
    setSelectedBrand(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (brand) => {
    resetForm();
    setSelectedBrand(brand);
    setName(brand.name || '');
    setWebsiteUrl(brand.website_url || '');
    setLogoPath(brand.logo_path || '');
    setIsFeatured(brand.is_featured === 1 || brand.is_featured === true || brand.is_featured === '1');
    setSortOrder(brand.sort_order || 0);
    setShowEditModal(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiFetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setLogoPath(data.url);
      } else {
        setErrorMsg(data.message || 'Upload failed.');
      }
    } catch {
      setErrorMsg('Failed to upload logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name) { setErrorMsg('Brand Name is required.'); return; }
    createMutation.mutate({
      name,
      website_url: websiteUrl,
      logo_path: logoPath,
      is_featured: isFeatured,
      sort_order: sortOrder
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!name) { setErrorMsg('Brand Name is required.'); return; }
    updateMutation.mutate({
      id: selectedBrand.id,
      updatedData: {
        name,
        website_url: websiteUrl,
        logo_path: logoPath,
        is_featured: isFeatured,
        sort_order: sortOrder
      }
    });
  };

  const handleDelete = (id, bName) => {
    if (window.confirm(`Are you sure you want to delete the brand "${bName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header Block */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-rose-500" />
            Featured Brands
          </h2>
          <p className="text-xs text-gray-450 mt-1">Manage partner brands display marquee for the storefront landing page.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-lg focus:outline-none bg-gray-55/40 text-gray-800"
          />
        </div>
        <div className="text-xs text-gray-400 font-medium">
          Total: <span className="text-gray-700 font-bold">{filteredBrands.length} brands</span>
        </div>
      </div>

      {/* Brands Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white border border-gray-150/60 rounded-2xl p-16 text-center shadow-sm">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-gray-700">No Brands Managed</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Add brand logos and URLs to display them inside the storefront brands scroll.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                  <th className="py-4 px-6">Logo</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Website URL</th>
                  <th className="py-4 px-6">Featured</th>
                  <th className="py-4 px-6">Sort Order</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      {brand.logo_path ? (
                        <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center p-1 overflow-hidden">
                          <img loading="lazy" decoding="async" src={brand.logo_path} alt={brand.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-300 font-bold">
                          No Logo
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800">{brand.name}</td>
                    <td className="py-4 px-6">
                      {brand.website_url ? (
                        <a
                          href={brand.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-medium"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          Visit Site
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {brand.is_featured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">
                          <Sparkles className="w-3 h-3 fill-current" />
                          Featured
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-600">{brand.sort_order}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(brand)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
                          title="Edit Brand"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id, brand.name)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all cursor-pointer"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE BRAND MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-serif font-bold text-gray-800 text-base">Add New Brand</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 flex flex-col gap-4">
              {errorMsg && <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg">⚠️ {errorMsg}</div>}
              {successMsg && <div className="text-xs text-green-600 bg-green-50 p-2.5 rounded-lg">✅ {successMsg}</div>}

              {/* Logo Upload Block */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600">Brand Logo</label>
                <div className="flex items-center gap-4">
                  {logoPath ? (
                    <div className="w-16 h-16 rounded-xl border border-gray-100 bg-gray-50 p-1 relative overflow-hidden group shrink-0">
                      <img loading="lazy" decoding="async" src={logoPath} alt="Preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogoPath('')}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center text-[10px] text-gray-450 cursor-pointer transition-colors group shrink-0">
                      {uploading ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mb-0.5 text-gray-400 group-hover:text-primary transition-colors" />
                          <span>Upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                    </label>
                  )}
                  <div className="text-[10px] text-gray-400 leading-normal">
                    Upload an image file (PNG, JPG, WEBP). Logo will be automatically centered and displayed in the brands scroll.
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Gucci, Chanel, Nike"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-250 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              {/* Website URL */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full border border-gray-250 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Sort Order */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-250 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-gray-600">Featured / Visible</span>
                  <span className="text-[10px] text-gray-400">Display this brand in the storefront marquee scroll.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className="text-primary focus:outline-none cursor-pointer"
                >
                  {isFeatured ? (
                    <ToggleRight className="w-8 h-8 text-primary" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 mt-4 border-t border-gray-50 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-lg text-gray-650"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || uploading}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRAND MODAL */}
      {showEditModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-serif font-bold text-gray-800 text-base">Edit Brand: {selectedBrand.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              {errorMsg && <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg">⚠️ {errorMsg}</div>}
              {successMsg && <div className="text-xs text-green-600 bg-green-50 p-2.5 rounded-lg">✅ {successMsg}</div>}

              {/* Logo Upload Block */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600">Brand Logo</label>
                <div className="flex items-center gap-4">
                  {logoPath ? (
                    <div className="w-16 h-16 rounded-xl border border-gray-100 bg-gray-50 p-1 relative overflow-hidden group shrink-0">
                      <img loading="lazy" decoding="async" src={logoPath} alt="Preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogoPath('')}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center text-[10px] text-gray-455 cursor-pointer transition-colors group shrink-0">
                      {uploading ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mb-0.5 text-gray-400 group-hover:text-primary transition-colors" />
                          <span>Upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                    </label>
                  )}
                  <div className="text-[10px] text-gray-400 leading-normal">
                    Upload an image file (PNG, JPG, WEBP). Logo will be automatically centered and displayed in the brands scroll.
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Brand Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-250 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              {/* Website URL */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Website URL (Optional)</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full border border-gray-250 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Sort Order */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-250 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-gray-600">Featured / Visible</span>
                  <span className="text-[10px] text-gray-400">Display this brand in the storefront marquee scroll.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className="text-primary focus:outline-none cursor-pointer"
                >
                  {isFeatured ? (
                    <ToggleRight className="w-8 h-8 text-primary" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 mt-4 border-t border-gray-50 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-lg text-gray-650"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isLoading || uploading}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
