import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import ImageUploadField from '../ui/ImageUploadField';

const inputClass = 'px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 w-full';
const labelClass = 'text-[10px] text-gray-500 font-bold uppercase';

export const ABOUT_SLUGS = ['about-us', 'about'];

export const EMPTY_ABOUT_SECTIONS = {
  eyebrow: '',
  image_url: '',
  features_heading: 'Features of our products',
  features: [],
  highlights_heading: '',
  highlights: [],
  show_faqs: true,
};

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function move(list, index, delta) {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function RowActions({ index, length, onMove, onRemove }) {
  const btn = 'p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 cursor-pointer';
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
      <button type="button" className={btn} disabled={index === length - 1} onClick={() => onMove(1)} aria-label="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
      <button type="button" className={`${btn} hover:text-red-600`} onClick={onRemove} aria-label="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}

/**
 * Page-level fields shared by every CMS page (subtitle, banner, SEO).
 */
export function PageMetaFields({ values, onChange }) {
  const set = (key) => (e) => onChange({ ...values, [key]: e.target.value });
  return (
    <div className="flex flex-col gap-4">
      <Field label="Subtitle / Intro line">
        <input type="text" maxLength={500} value={values.subtitle || ''} onChange={set('subtitle')} className={inputClass} placeholder="Short line shown under the page title" />
      </Field>
      <ImageUploadField
        label="Banner image (optional)"
        hint="Wide image shown behind the page title. Uploads are converted to WebP automatically."
        aspect="banner"
        value={values.hero_image_url || ''}
        onChange={(url) => onChange({ ...values, hero_image_url: url })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="SEO title">
          <input type="text" maxLength={255} value={values.meta_title || ''} onChange={set('meta_title')} className={inputClass} />
        </Field>
        <Field label="SEO description">
          <input type="text" maxLength={500} value={values.meta_description || ''} onChange={set('meta_description')} className={inputClass} />
        </Field>
      </div>
    </div>
  );
}

/**
 * Structured blocks for the About page: side image, product feature list and
 * shopping highlights. Everything here renders on /pages/about-us.
 */
export default function AboutSectionsEditor({ sections, onChange }) {
  const s = { ...EMPTY_ABOUT_SECTIONS, ...(sections || {}) };
  const update = (patch) => onChange({ ...s, ...patch });

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <h4 className="text-xs font-bold text-gray-700">About page sections</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Eyebrow label">
          <input type="text" value={s.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} className={inputClass} placeholder="e.g. Helping You Look Good" />
        </Field>
        <ImageUploadField label="Story image" value={s.image_url} onChange={(url) => update({ image_url: url })} />
      </div>

      <div className="flex flex-col gap-2">
        <Field label="Product features heading">
          <input type="text" value={s.features_heading} onChange={(e) => update({ features_heading: e.target.value })} className={inputClass} />
        </Field>
        {s.features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={feature}
              onChange={(e) => update({ features: s.features.map((f, j) => (j === i ? e.target.value : f)) })}
              className={inputClass}
            />
            <RowActions
              index={i}
              length={s.features.length}
              onMove={(d) => update({ features: move(s.features, i, d) })}
              onRemove={() => update({ features: s.features.filter((_, j) => j !== i) })}
            />
          </div>
        ))}
        <button type="button" onClick={() => update({ features: [...s.features, ''] })} className="self-start inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add feature
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <Field label="Highlights heading">
          <input type="text" value={s.highlights_heading} onChange={(e) => update({ highlights_heading: e.target.value })} className={inputClass} />
        </Field>
        {s.highlights.map((item, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg bg-white border border-gray-100 p-2">
            <div className="flex-1 flex flex-col gap-1.5">
              <input
                type="text"
                value={item.title}
                placeholder="Title"
                onChange={(e) => update({ highlights: s.highlights.map((h, j) => (j === i ? { ...h, title: e.target.value } : h)) })}
                className={inputClass}
              />
              <input
                type="text"
                value={item.text}
                placeholder="Description"
                onChange={(e) => update({ highlights: s.highlights.map((h, j) => (j === i ? { ...h, text: e.target.value } : h)) })}
                className={inputClass}
              />
            </div>
            <RowActions
              index={i}
              length={s.highlights.length}
              onMove={(d) => update({ highlights: move(s.highlights, i, d) })}
              onRemove={() => update({ highlights: s.highlights.filter((_, j) => j !== i) })}
            />
          </div>
        ))}
        <button type="button" onClick={() => update({ highlights: [...s.highlights, { title: '', text: '' }] })} className="self-start inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add highlight
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
        <input type="checkbox" checked={!!s.show_faqs} onChange={(e) => update({ show_faqs: e.target.checked })} />
        Show the FAQ section (managed under the FAQs tab)
      </label>
    </div>
  );
}
