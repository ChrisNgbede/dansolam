import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

/**
 * Searchable multi-select: chosen items show as removable chips; the list filters
 * as you type. Options are [{ value, label, hint? }].
 */
export default function MultiSearchSelect({ options = [], value = [], onChange, placeholder = 'Search…', emptyText = 'Nothing found', id }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = useMemo(() => new Set(value.map(String)), [value]);
  const byValue = useMemo(() => new Map(options.map((o) => [String(o.value), o])), [options]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => !q || o.label.toLowerCase().includes(q) || (o.hint || '').toLowerCase().includes(q)).slice(0, 200);
  }, [options, query]);

  const toggle = (v) => {
    const key = String(v);
    const next = selected.has(key) ? value.filter((x) => String(x) !== key) : [...value, v];
    onChange(next);
  };

  return (
    <div ref={boxRef} className="relative">
      <div
        className="min-h-[38px] w-full rounded-lg border border-gray-300 bg-white dark:bg-[#1f2937] dark:border-[#4b5563] px-2 py-1.5 flex flex-wrap items-center gap-1.5 cursor-text"
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {value.map((v) => {
          const opt = byValue.get(String(v));
          return (
            <span key={String(v)} className="inline-flex items-center gap-1 rounded-full bg-[#5D3E85]/10 text-[#5D3E85] dark:bg-[#EC268F]/20 dark:text-[#F9A8D4] px-2 py-0.5 text-[11px] font-semibold">
              {opt ? opt.label : `#${v}`}
              <button type="button" onClick={(e) => { e.stopPropagation(); toggle(v); }} className="p-0 m-0 bg-transparent border-0 shadow-none min-h-0 hover:text-rose-600 cursor-pointer" aria-label={`Remove ${opt?.label || v}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        <div className="flex flex-1 min-w-[120px] items-center gap-1">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            id={id}
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); if (filtered[0]) toggle(filtered[0].value); setQuery(''); }
              if (e.key === 'Backspace' && !query && value.length) toggle(value[value.length - 1]);
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder={value.length ? '' : placeholder}
            className="flex-1 min-w-0 bg-transparent! text-xs text-gray-800 dark:text-gray-100 outline-none border-0! shadow-none! p-0! focus:ring-0"
            data-plain-input
            role="combobox"
            aria-expanded={open}
          />
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </div>
      </div>

      {open && (
        <ul role="listbox" aria-multiselectable="true" className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white dark:bg-[#1f2937] dark:border-[#374151] shadow-lg py-1">
          {filtered.length === 0 && <li className="px-3 py-2 text-xs text-gray-400">{emptyText}</li>}
          {filtered.map((o) => {
            const isOn = selected.has(String(o.value));
            return (
              <li
                key={String(o.value)}
                role="option"
                aria-selected={isOn}
                onMouseDown={(e) => { e.preventDefault(); toggle(o.value); }}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer ${isOn ? 'bg-[#5D3E85]/5 text-[#5D3E85] dark:bg-[#EC268F]/15 dark:text-[#F9A8D4] font-semibold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <span className="min-w-0 truncate">{o.label}{o.hint && <span className="ml-1.5 text-gray-400 font-normal">{o.hint}</span>}</span>
                {isOn && <Check className="w-3.5 h-3.5 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
