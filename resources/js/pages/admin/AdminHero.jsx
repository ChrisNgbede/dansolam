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
  show_eyebrow: true,
  show_highlights: true,
  image_url: '',
  gallery: [],
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

  const updateGalleryItem = (index, patch) => setForm((prev) => ({
    ...prev,
    gallery: (prev.gallery || []).map((item, i) => (i === index ? { ...item, ...patch } : item)),
  }));
  const addGalleryItem = () => setForm((prev) => ({ ...prev, gallery: [...(prev.gallery || []), { image_url: '', link_url: '', label: '' }] }));
  const removeGalleryItem = (index) => setForm((prev) => ({ ...prev, gallery: (prev.gallery || []).filter((_, i) => i !== index) }));

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

  const visibleCount = slides.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ImageIcon className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">CMS / Hero</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Homepage Hero</h1>
          <p className="text-sm text-gray-500 mt-1">Manage every slide, message, action and overlay displayed in the storefront hero.</p>
        </div>
        <button onClick={openCreate} className="admin-btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-bold cursor-pointer">
          <Plus className="w-4 h-4" /> New Hero Slide
        </button>
      </div>

      {slides.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="adm-stat-chip"><strong>{slides.length}</strong> {slides.length === 1 ? 'slide' : 'slides'}</span>
          <span className="adm-stat-chip adm-stat-chip--ok"><Eye className="w-3.5 h-3.5" /><strong>{visibleCount}</strong> visible</span>
          {slides.length - visibleCount > 0 && (
            <span className="adm-stat-chip"><EyeOff className="w-3.5 h-3.5" /><strong>{slides.length - visibleCount}</strong> hidden</span>
          )}
          <span className="text-gray-500 ml-1">Slides play in display order, lowest first.</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden">
              <div className="aspect-[16/8] adm-skeleton" />
              <div className="p-5 space-y-2"><div className="h-3 w-3/4 rounded adm-skeleton" /><div className="h-3 w-1/3 rounded adm-skeleton" /></div>
            </div>
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-14 text-center">
          <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <h2 className="font-serif text-xl font-bold text-gray-800">No hero slides yet</h2>
          <p className="text-sm text-gray-500 mt-1 mb-5">Create the first storefront campaign slide.</p>
          <button onClick={openCreate} className="admin-btn-primary px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer">Create Slide</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {slides.map((slide, index) => {
            const confirming = confirmingDeleteId === slide.id;
            const full = slide.layout_mode === 'full';
            return (
              <article key={slide.id} className={`adm-slide bg-white rounded-3xl overflow-hidden ${slide.is_active ? '' : 'adm-slide--hidden'}`}>
                <div className="adm-media relative aspect-[16/8] bg-gray-100 overflow-hidden">
                  <img loading="lazy" decoding="async" src={slide.image_url} alt="" className="adm-slide-img w-full h-full object-cover" />
                  <div className="adm-media-scrim absolute inset-0" />

                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                    <span className="adm-media-chip adm-media-chip--order" title={`Display order ${slide.sort_order}`}>
                      Slide {index + 1}
                    </span>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="adm-media-chip">{full ? 'Full bleed' : 'Split layout'}</span>
                      <span className={`adm-media-chip ${slide.is_active ? 'adm-media-chip--live' : 'adm-media-chip--off'}`}>
                        <span className="adm-media-dot" aria-hidden="true" />
                        {slide.is_active ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  <div className="absolute left-5 right-5 bottom-5">
                    {slide.show_eyebrow !== false && slide.eyebrow && <p className="adm-media-eyebrow">{slide.eyebrow}</p>}
                    <h3 className="adm-media-title">
                      {slide.title} {slide.accent_title && <span className="adm-media-accent">{slide.accent_title}</span>}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className={`text-sm leading-relaxed line-clamp-2 ${slide.subtitle ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                    {slide.subtitle || 'No description yet.'}
                  </p>

                  <dl className="adm-slide-meta">
                    <div><dt>Order</dt><dd>{slide.sort_order}</dd></div>
                    <div><dt>Layout</dt><dd>{full ? 'Fills the hero' : 'Text left, image right'}</dd></div>
                    {slide.primary_cta_label && (
                      <div className="min-w-0"><dt>Button</dt><dd className="truncate" title={slide.link_url}>{slide.primary_cta_label} → {slide.link_url || '/'}</dd></div>
                    )}
                    {(slide.gallery || []).length > 0 && <div><dt>Ring</dt><dd>{slide.gallery.length} images</dd></div>}
                  </dl>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    {confirming ? (
                      <div className="flex flex-wrap items-center gap-2 w-full" role="alert">
                        <span className="text-sm font-semibold text-gray-800 mr-auto">Delete this slide? This can't be undone.</span>
                        <button type="button" onClick={() => setConfirmingDeleteId(null)} className="admin-btn-secondary px-4 py-2 rounded-full text-xs font-bold cursor-pointer">Keep</button>
                        <button
                          type="button"
                          onClick={() => { deleteMutation.mutate(slide.id); setConfirmingDeleteId(null); }}
                          className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer"
                        >Delete</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => openEdit(slide)} className="admin-btn-secondary inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold cursor-pointer">
                          <Edit3 className="w-4 h-4" /> Edit slide
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => duplicateMutation.mutate(slide.id)}
                            disabled={duplicateMutation.isPending}
                            className="text-gray-600 cursor-pointer"
                            title="Duplicate slide"
                            aria-label={`Duplicate slide ${index + 1}`}
                          ><Copy className="w-4 h-4" /></button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(slide.id)}
                            className="text-red-600 cursor-pointer"
                            title="Delete slide"
                            aria-label={`Delete slide ${index + 1}`}
                          ><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
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

                <label className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border cursor-pointer ${form.show_eyebrow ? 'border-[#5D3E85]/40 bg-[#5D3E85]/5' : 'border-gray-200'}`}>
                  <span className="text-xs font-bold text-gray-700">{form.show_eyebrow ? 'Eyebrow badge shown' : 'Eyebrow badge hidden'}</span>
                  <input type="checkbox" checked={form.show_eyebrow} onChange={(e) => updateField('show_eyebrow', e.target.checked)} className="w-5 h-5 accent-[#5D3E85] cursor-pointer" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field required label="Main heading" value={form.title} onChange={(v) => updateField('title', v)} placeholder="A quieter kind of luxury for" />
                  <Field label="Accent / highlight line" value={form.accent_title} onChange={(v) => updateField('accent_title', v)} placeholder="your skin." />
                </div>
                <label className="block">
                  <span className="admin-field-label">Description</span>
                  <textarea value={form.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} rows="4" maxLength="500" className="admin-field-input resize-none" placeholder="Describe this campaign…" />
                </label>
                <ImageUploadField required label="Hero campaign image" value={form.image_url} onChange={(v) => updateField('image_url', v)} aspect="video" hint="High-resolution image recommended (appears without borders/shadows)" />

                <SectionTitle>Hero image ring (optional)</SectionTitle>
                <p className="text-[11px] text-gray-500 -mt-2">
                  Add more images and they fan out into a ring of cards around the hero. Each card can link anywhere; leave a link empty to use the primary button URL.
                </p>
                <div className="space-y-3">
                  {(form.gallery || []).map((item, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-3 items-start p-3 rounded-xl border border-gray-200">
                      <ImageUploadField
                        label={`Image ${index + 1}`}
                        value={item.image_url || ''}
                        onChange={(v) => updateGalleryItem(index, { image_url: v })}
                      />
                      <div className="grid gap-3">
                        <Field label="Links to" value={item.link_url || ''} onChange={(v) => updateGalleryItem(index, { link_url: v })} placeholder="/shop?category=creams" />
                        <Field label="Label (for screen readers)" value={item.label || ''} onChange={(v) => updateGalleryItem(index, { label: v })} placeholder="Whitening cream" />
                      </div>
                      <button type="button" onClick={() => removeGalleryItem(index)} className="px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                        Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addGalleryItem} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">
                    + Add image
                  </button>
                </div>
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

                <label className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border cursor-pointer ${form.show_highlights ? 'border-[#5D3E85]/40 bg-[#5D3E85]/5' : 'border-gray-200'}`}>
                  <span className="text-xs font-bold text-gray-700">{form.show_highlights ? 'Highlights & stats shown' : 'Highlights & stats hidden'}</span>
                  <input type="checkbox" checked={form.show_highlights} onChange={(e) => updateField('show_highlights', e.target.checked)} className="w-5 h-5 accent-[#5D3E85] cursor-pointer" />
                </label>

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
