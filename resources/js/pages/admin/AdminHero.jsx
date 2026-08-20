import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Edit3, Eye, EyeOff, Image as ImageIcon, Plus, Save, Trash2, X } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import ImageUploadField from '../../components/ui/ImageUploadField';
import { toast as systemToast } from '../../components/ui/ToastProvider';

const emptySlide = {
  eyebrow: 'New Season Drops',
  title: 'Step Into Your',
  accent_title: 'Signature Style',
  subtitle: '',
  image_url: '',
  link_url: '/shop',
  primary_cta_label: 'Explore Shop',
  secondary_cta_label: 'WhatsApp Order',
  secondary_cta_url: '',
  top_kicker: '4.9',
  top_text: '2,400 reviews',
  bottom_kicker: 'PRISM Glow Serum',
  bottom_text: 'Bestseller',
  layout_mode: 'default', // 'default' (split hero layout) or 'full' (full-bleed hero banner)
  is_active: true,
  sort_order: 0,
};

async function jsonRequest(url, options = {}) {
  const response = await apiFetch(url, options);
  const data = await response.json();
  if (!response.ok || !data.success) {
    const errors = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    throw new Error(errors || data.message || 'Unable to complete the request.');
  }
  return data;
}

export default function AdminHero() {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [form, setForm] = useState(emptySlide);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-hero-banners'],
    queryFn: () => jsonRequest('/api/admin/hero-banners'),
  });
  const slides = data?.data || [];

  const saveMutation = useMutation({
    mutationFn: (payload) => editingId
      ? jsonRequest(`/api/admin/hero-banners/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : jsonRequest('/api/admin/hero-banners', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      systemToast.success(result.message);
      closeEditor();
    },
    onError: (error) => systemToast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => jsonRequest(`/api/admin/hero-banners/${id}`, { method: 'DELETE' }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      systemToast.success(result.message);
    },
    onError: (error) => systemToast.error(error.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => jsonRequest(`/api/admin/hero-banners/${id}/duplicate`, { method: 'POST' }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-banners'] });
      systemToast.success(result.message);
    },
    onError: (error) => systemToast.error(error.message),
  });

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptySlide, sort_order: slides.length });
    setShowEditor(true);
  };

  const openEdit = (slide) => {
    setEditingId(slide.id);
    setForm({ ...emptySlide, ...slide, is_active: Boolean(slide.is_active) });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingId(null);
    setForm(emptySlide);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveMutation.mutate({ ...form, sort_order: Number(form.sort_order) || 0 });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ImageIcon className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">CMS / Hero</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Homepage Hero</h1>
          <p className="text-xs text-gray-450 mt-1">Manage every slide, message, action and overlay displayed in the storefront hero.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-full text-xs font-bold shadow-md cursor-pointer">
          <Plus className="w-4 h-4" /> New Hero Slide
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-sm text-gray-400">Loading hero slides…</div>
      ) : slides.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-14 text-center">
          <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <h2 className="font-serif text-xl font-bold text-gray-800">No hero slides yet</h2>
          <p className="text-xs text-gray-400 mt-1 mb-5">Create the first storefront campaign slide.</p>
          <button onClick={openCreate} className="px-5 py-2.5 bg-primary text-white rounded-full text-xs font-bold cursor-pointer">Create Slide</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {slides.map((slide) => (
            <article key={slide.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
              <div className="relative aspect-[16/7] bg-gray-100 overflow-hidden">
                <img loading="lazy" decoding="async" src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="flex items-center gap-2 absolute top-4 right-4">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${slide.layout_mode === 'full' ? 'bg-[#5D3E85] text-white shadow-xs' : 'bg-white/90 text-[#221B2B] backdrop-blur-md'}`}>
                    {slide.layout_mode === 'full' ? 'Full Bleed' : 'Default Split'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${slide.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-800/80 text-white'}`}>
                    {slide.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="absolute left-5 right-5 bottom-5 text-white">
                  <p className="text-[9px] uppercase tracking-widest opacity-75">{slide.eyebrow}</p>
                  <h2 className="font-serif text-2xl font-bold leading-tight">{slide.title} <span className="text-amber-300">{slide.accent_title}</span></h2>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{slide.subtitle || 'No description supplied'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-gray-400">Display order: {slide.sort_order}</p>
                    <span className="text-gray-300 text-[10px]">•</span>
                    <p className="text-[10px] font-semibold text-primary">{slide.layout_mode === 'full' ? 'Fill entire hero section' : 'Section split layout'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(slide)} className="p-2.5 rounded-full border border-gray-200 text-gray-600 hover:text-primary cursor-pointer" title="Edit slide"><Edit3 className="w-4 h-4" /></button>
                  <button
                    onClick={() => duplicateMutation.mutate(slide.id)}
                    disabled={duplicateMutation.isPending}
                    className="p-2.5 rounded-full border border-gray-200 text-gray-600 hover:text-primary hover:border-primary/30 disabled:opacity-50 cursor-pointer"
                    title="Duplicate slide"
                  ><Copy className="w-4 h-4" /></button>
                  <button
                    onClick={() => {
                      if (confirmingDeleteId === slide.id) {
                        deleteMutation.mutate(slide.id);
                        setConfirmingDeleteId(null);
                      } else {
                        setConfirmingDeleteId(slide.id);
                        systemToast.info('Click delete again to confirm removal.');
                      }
                    }}
                    className={`p-2.5 rounded-full border cursor-pointer ${confirmingDeleteId === slide.id ? 'bg-red-500 border-red-500 text-white' : 'border-red-100 text-red-500 hover:bg-red-50'}`}
                    title={confirmingDeleteId === slide.id ? 'Click again to confirm' : 'Delete slide'}
                  ><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-[100] bg-gray-950/60 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900">{editingId ? 'Edit Hero Slide' : 'Create Hero Slide'}</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">All changes become available to the storefront after saving.</p>
              </div>
              <button type="button" onClick={closeEditor} className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-7">
              <div className="space-y-5">
                <SectionTitle>Hero Layout Style</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col gap-1.5 ${form.layout_mode !== 'full' ? 'border-[#5D3E85] bg-[#5D3E85]/5 shadow-xs' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Default Split</span>
                      <input
                        type="radio"
                        name="layout_mode"
                        value="default"
                        checked={form.layout_mode !== 'full'}
                        onChange={() => updateField('layout_mode', 'default')}
                        className="accent-[#5D3E85] w-4 h-4"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">Text on left, borderless image on right (clean & balanced default).</p>
                  </label>
                  <label className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col gap-1.5 ${form.layout_mode === 'full' ? 'border-[#5D3E85] bg-[#5D3E85]/5 shadow-xs' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Full Bleed Hero</span>
                      <input
                        type="radio"
                        name="layout_mode"
                        value="full"
                        checked={form.layout_mode === 'full'}
                        onChange={() => updateField('layout_mode', 'full')}
                        className="accent-[#5D3E85] w-4 h-4"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">Image fills entire heading hero section with text & CTAs overlaid.</p>
                  </label>
                </div>

                <SectionTitle>Campaign content</SectionTitle>
                <Field label="Eyebrow / badge" value={form.eyebrow} onChange={(v) => updateField('eyebrow', v)} placeholder="New Season Drops" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field required label="Main heading" value={form.title} onChange={(v) => updateField('title', v)} placeholder="A quieter kind of luxury for" />
                  <Field label="Accent / highlight line" value={form.accent_title} onChange={(v) => updateField('accent_title', v)} placeholder="your skin." />
                </div>
                <label className="block">
                  <span className="admin-field-label">Description</span>
                  <textarea value={form.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} rows="4" maxLength="500" className="admin-field-input resize-none" placeholder="Describe this campaign…" />
                </label>
                <ImageUploadField required label="Hero campaign image" value={form.image_url} onChange={(v) => updateField('image_url', v)} aspect="video" hint="High-resolution image recommended (appears without borders/shadows)" />
              </div>

              <div className="space-y-5">
                <SectionTitle>Buttons and destinations</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Primary button label" value={form.primary_cta_label} onChange={(v) => updateField('primary_cta_label', v)} placeholder="Shop new arrivals" />
                  <Field label="Primary button URL" value={form.link_url} onChange={(v) => updateField('link_url', v)} placeholder="/shop" />
                  <Field label="Secondary button label" value={form.secondary_cta_label} onChange={(v) => updateField('secondary_cta_label', v)} placeholder="Book a consultation" />
                  <Field label="Secondary button URL" value={form.secondary_cta_url} onChange={(v) => updateField('secondary_cta_url', v)} placeholder="/pages/about-us" />
                </div>

                <SectionTitle>Floating Highlights & Stats</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Rating / Stat 1 value" value={form.top_kicker} onChange={(v) => updateField('top_kicker', v)} placeholder="4.9" />
                  <Field label="Rating / Stat 1 label" value={form.top_text} onChange={(v) => updateField('top_text', v)} placeholder="2,400 reviews" />
                  <Field label="Card badge / Title" value={form.bottom_kicker} onChange={(v) => updateField('bottom_kicker', v)} placeholder="PRISM Glow Serum" />
                  <Field label="Card subtitle / Category" value={form.bottom_text} onChange={(v) => updateField('bottom_text', v)} placeholder="Bestseller" />
                </div>

                <SectionTitle>Publishing</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <Field type="number" label="Display order" value={form.sort_order} onChange={(v) => updateField('sort_order', v)} min="0" />
                  <label className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border cursor-pointer ${form.is_active ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-700">{form.is_active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />} Show on storefront</span>
                    <input type="checkbox" checked={form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button type="button" onClick={closeEditor} className="px-5 py-2.5 rounded-full border border-gray-200 text-xs font-bold cursor-pointer">Cancel</button>
              <button disabled={saveMutation.isPending} className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">
                <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving…' : 'Save Hero Slide'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="font-serif font-bold text-lg text-gray-850 border-b border-gray-100 pb-2">{children}</h3>;
}

function Field({ label, value, onChange, required = false, type = 'text', ...props }) {
  return (
    <label className="block">
      <span className="admin-field-label">{label}{required && <span className="text-red-500"> *</span>}</span>
      <input required={required} type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="admin-field-input" {...props} />
    </label>
  );
}
