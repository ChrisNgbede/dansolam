import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

/**
 * Drop-in replacement for a native <select> that can be searched.
 *
 * Keeps the same markup and API as the select it replaces — children stay plain
 * <option>/<optgroup> elements and onChange still receives { target: { value, name } } —
 * so existing screens work unchanged.
 */

function flatten(children, group = null, out = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === 'optgroup') {
      flatten(child.props.children, child.props.label, out);
      return;
    }
    if (child.type !== 'option') return;
    const label = typeof child.props.children === 'string'
      ? child.props.children
      : React.Children.toArray(child.props.children).filter((c) => typeof c === 'string').join(' ').trim();
    out.push({
      value: child.props.value !== undefined ? String(child.props.value) : label,
      label: label || String(child.props.value ?? ''),
      disabled: !!child.props.disabled,
      group,
    });
  });
  return out;
}

export default function SearchableSelect({
  value,
  onChange,
  children,
  className = '',
  disabled = false,
  required = false,
  name,
  id,
  placeholder = 'Select…',
  'aria-label': ariaLabel,
  ...rest
}) {
  const options = useMemo(() => flatten(children), [children]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const listId = useId();

  const current = options.find((option) => option.value === String(value ?? ''));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((option) => option.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Long lists are the ones worth searching.
  const showSearch = options.length >= 6;

  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;
    const height = Math.min(320, Math.max(below, rect.top) - 16);
    const dropUp = below < 220 && rect.top > below;
    setPosition({
      left: rect.left,
      width: rect.width,
      top: dropUp ? undefined : rect.bottom + 6,
      bottom: dropUp ? window.innerHeight - rect.top + 6 : undefined,
      maxHeight: height,
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    place();
    const close = (event) => {
      if (buttonRef.current?.contains(event.target) || listRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    const timer = setTimeout(() => searchRef.current?.focus(), 10);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      clearTimeout(timer);
    };
  }, [open]);

  const pick = (option) => {
    if (option.disabled) return;
    onChange?.({ target: { value: option.value, name } });
    setOpen(false);
    setQuery('');
    buttonRef.current?.focus();
  };

  const onKeyDown = (event) => {
    if (!open && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (event.key === 'Enter') { event.preventDefault(); if (filtered[active]) pick(filtered[active]); }
  };

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        data-searchable-select=""
        className={`${className} text-left flex items-center justify-between gap-2 cursor-pointer disabled:text-[#5F566B] dark:text-[#B8AEC4] disabled:cursor-not-allowed`}
        {...rest}
      >
        <span className={`truncate ${current ? '' : 'text-[#5F566B] dark:text-[#B8AEC4]'}`}>{current?.label || placeholder}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#5F566B] dark:text-[#B8AEC4] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {/* Keeps native form validation and any FormData reads working. */}
      <input type="hidden" name={name} value={value ?? ''} required={required} />

      {open && position && createPortal(
        <div
          ref={listRef}
          className="fixed z-[300] rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col"
          style={{ left: position.left, top: position.top, bottom: position.bottom, width: position.width, maxHeight: position.maxHeight }}
        >
          {showSearch && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0">
              <Search className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search…"
                aria-label="Search options"
                className="w-full text-xs outline-none bg-transparent border-0 p-0"
              />
            </div>
          )}
          <ul id={listId} role="listbox" className="overflow-y-auto py-1 text-xs">
            {filtered.length === 0 && <li className="px-3 py-2 text-gray-400">No matches</li>}
            {filtered.map((option, index) => {
              const selected = option.value === String(value ?? '');
              return (
                <li key={`${option.value}-${index}`} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick(option)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 cursor-pointer disabled:opacity-40 ${
                      index === active ? 'bg-[#5D3E85]/10 text-[#5D3E85]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">
                      {option.group && <span className="text-[10px] text-gray-400 mr-1.5">{option.group}</span>}
                      {option.label}
                    </span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}
