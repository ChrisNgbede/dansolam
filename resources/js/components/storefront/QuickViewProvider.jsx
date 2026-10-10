import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import QuickViewModal from './QuickViewModal';

const QuickViewContext = createContext(null);

/**
 * One Quick View modal for the whole storefront, so any product card can open it
 * without each page wiring its own copy.
 */
export function QuickViewProvider({ children }) {
  const [product, setProduct] = useState(null);

  const value = useMemo(() => ({
    openQuickView: (item) => item && setProduct(item),
    closeQuickView: () => setProduct(null),
  }), []);

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <QuickViewModal isOpen={!!product} product={product} onClose={value.closeQuickView} />
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  // No provider (e.g. inside admin) simply means Quick View is unavailable.
  return useContext(QuickViewContext) || { openQuickView: () => {}, closeQuickView: () => {} };
}

// Buttons and form controls keep their own behaviour; product links inside a card
// are taken over so clicking anywhere on the card opens Quick View instead.
const INTERACTIVE = 'button, input, select, textarea, label, [role="button"], [data-no-quickview]';
const PRODUCT_LINK = /^\/products?\//;

/**
 * Props for a product card so clicking anywhere on it opens Quick View, while
 * buttons, links and text selection keep working.
 *
 * @param {object} product
 * @param {{ onOpen?: (product) => void, label?: string }} [options] onOpen overrides the shared modal.
 */
export function useCardQuickView(product, options = {}) {
  const { openQuickView } = useQuickView();
  const open = options.onOpen || openQuickView;

  const handle = useCallback((event) => {
    if (!product || event.defaultPrevented) return;
    // The card itself carries role="button", so only inner controls should block.
    const blocker = event.target.closest?.(INTERACTIVE);
    if (blocker && blocker !== event.currentTarget) return;
    const link = event.target.closest?.('a');
    // Links out of the card (category pages, Instagram, …) still navigate.
    if (link && !PRODUCT_LINK.test(link.getAttribute('href') || '')) return;
    // Don't fire when the visitor was selecting text.
    if (window.getSelection?.().toString()) return;
    // Capture phase: stop the router link before it navigates.
    event.preventDefault();
    event.stopPropagation();
    open(product);
  }, [product, open]);

  const name = product?.name || 'product';

  return {
    onClickCapture: handle,
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(product);
      }
    },
    'data-quickview-card': '',
    role: 'button',
    tabIndex: 0,
    'aria-haspopup': 'dialog',
    'aria-label': options.label || `Quick view ${name}`,
  };
}
