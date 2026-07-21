import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Printer, Search, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Minus, Plus, ScanBarcode, QrCode, Tag, Package, Settings2, Palette, LayoutGrid, Eye, ChevronDown, Check, Layers } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/* ────────────────────────────────────────────────────────
   CONSTANTS
   ──────────────────────────────────────────────────────── */

const BARCODE_FORMATS = [
  { id: 'CODE128', name: 'Code 128', desc: 'General-purpose retail', icon: '▮▮▯▮▯▮▮' },
  { id: 'EAN13', name: 'EAN-13', desc: 'European retail', icon: '▮▯▮▮▯▮▯' },
  { id: 'UPC', name: 'UPC-A', desc: 'US/Canadian retail', icon: '▯▮▮▯▮▯▮' },
  { id: 'CODE39', name: 'Code 39', desc: 'Industrial / military', icon: '▮▯▮▯▮▮▯' },
  { id: 'ITF14', name: 'ITF-14', desc: 'Shipping cartons', icon: '▮▮▯▯▮▮▯' },
  { id: 'codabar', name: 'Codabar', desc: 'Libraries / blood banks', icon: '▯▮▯▮▮▯▮' },
  { id: 'QR', name: 'QR Code', desc: 'Product data / SKU', icon: '▣' },
  { id: 'QR_URL', name: 'QR (URL)', desc: 'Links to product page', icon: '⬚' },
];

const LABEL_TEMPLATES = [
  { id: 'standard', name: 'Standard Retail', desc: 'Barcode + Name + Price', color: '#2563eb' },
  { id: 'minimal', name: 'Minimal Sticker', desc: 'Barcode only, no text', color: '#6b7280' },
  { id: 'price_tag', name: 'Price Tag', desc: 'Large price, barcode below', color: '#059669' },
  { id: 'jewelry', name: 'Jewelry Tag', desc: 'Narrow, elegant serif font', color: '#d97706' },
  { id: 'shelf_edge', name: 'Shelf Edge', desc: 'Horizontal strip layout', color: '#7c3aed' },
  { id: 'hang_tag', name: 'Hang Tag', desc: 'Portrait card, brand logo', color: '#e11d48' },
  { id: 'warehouse', name: 'Warehouse Bin', desc: 'Large SKU, barcode, location', color: '#0ea5e9' },
  { id: 'qr_card', name: 'QR Product Card', desc: 'QR + product details', color: '#8b5cf6' },
  { id: 'thermal', name: 'Thermal Receipt', desc: '58mm thermal format', color: '#374151' },
  { id: 'asset', name: 'Asset Sticker', desc: 'Small round-corner badge', color: '#f59e0b' },
  { id: 'luxury', name: 'Luxury Ecommerce', desc: 'Gold accent, serif font', color: '#b8860b' },
  { id: 'compact', name: 'Compact Grid', desc: 'Tiny label, max density', color: '#64748b' },
];

const PAPER_STOCKS = [
  { id: 'avery5160', name: 'Avery 5160', desc: '30 labels/sheet (1"×2⅝")', cols: 3, rows: 10, labelW: 66.675, labelH: 25.4, marginTop: 12.7, marginLeft: 4.7625, gapX: 3.175, gapY: 0, unit: 'mm', pageW: 215.9, pageH: 279.4 },
  { id: 'avery5163', name: 'Avery 5163', desc: '10 labels/sheet (2"×4")', cols: 2, rows: 5, labelW: 101.6, labelH: 50.8, marginTop: 12.7, marginLeft: 4.7625, gapX: 3.175, gapY: 0, unit: 'mm', pageW: 215.9, pageH: 279.4 },
  { id: 'avery5167', name: 'Avery 5167', desc: '80 labels/sheet (½"×1¾")', cols: 4, rows: 20, labelW: 44.45, labelH: 12.7, marginTop: 12.7, marginLeft: 7.14, gapX: 7.9375, gapY: 0, unit: 'mm', pageW: 215.9, pageH: 279.4 },
  { id: 'avery5260', name: 'Avery 5260', desc: '30 clear labels/sheet', cols: 3, rows: 10, labelW: 66.675, labelH: 25.4, marginTop: 12.7, marginLeft: 4.7625, gapX: 3.175, gapY: 0, unit: 'mm', pageW: 215.9, pageH: 279.4 },
  { id: 'avery5162', name: 'Avery 5162', desc: '14 labels/sheet (1⅓"×4")', cols: 2, rows: 7, labelW: 101.6, labelH: 33.867, marginTop: 21.717, marginLeft: 4.7625, gapX: 3.175, gapY: 0, unit: 'mm', pageW: 215.9, pageH: 279.4 },
  { id: 'avery5161', name: 'Avery 5161', desc: '20 labels/sheet (1"×4")', cols: 2, rows: 10, labelW: 101.6, labelH: 25.4, marginTop: 12.7, marginLeft: 4.7625, gapX: 3.175, gapY: 0, unit: 'mm', pageW: 215.9, pageH: 279.4 },
  { id: 'thermal_2x1', name: 'Thermal 2×1"', desc: 'Single 50×25mm label', cols: 1, rows: 1, labelW: 50, labelH: 25, marginTop: 0, marginLeft: 0, gapX: 0, gapY: 0, unit: 'mm', pageW: 50, pageH: 25 },
  { id: 'thermal_4x6', name: 'Thermal 4×6"', desc: 'Single shipping label', cols: 1, rows: 1, labelW: 101.6, labelH: 152.4, marginTop: 0, marginLeft: 0, gapX: 0, gapY: 0, unit: 'mm', pageW: 101.6, pageH: 152.4 },
  { id: 'thermal_40x30', name: 'Thermal 40×30mm', desc: 'Small thermal label', cols: 1, rows: 1, labelW: 40, labelH: 30, marginTop: 0, marginLeft: 0, gapX: 0, gapY: 0, unit: 'mm', pageW: 40, pageH: 30 },
  { id: 'a4_custom', name: 'A4 Custom Grid', desc: 'User-defined rows/cols', cols: 3, rows: 8, labelW: 62, labelH: 32, marginTop: 10, marginLeft: 10, gapX: 5, gapY: 5, unit: 'mm', pageW: 210, pageH: 297, custom: true },
  { id: 'letter_custom', name: 'Letter Custom Grid', desc: 'User-defined rows/cols', cols: 3, rows: 8, labelW: 62, labelH: 30, marginTop: 12, marginLeft: 12, gapX: 5, gapY: 5, unit: 'mm', pageW: 215.9, pageH: 279.4, custom: true },
  { id: 'single', name: 'Single Label', desc: 'Full page, 1 label', cols: 1, rows: 1, labelW: 190, labelH: 100, marginTop: 10, marginLeft: 12.95, gapX: 0, gapY: 0, unit: 'mm', pageW: 215.9, pageH: 279.4 },
];

/* ────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────── */

function mm(v) { return v * 3.7795275591; } // mm to px at 96dpi

function generateBarcodeDataURL(value, format, opts = {}) {
  if (!value) return null;
  const isQR = format === 'QR' || format === 'QR_URL';
  if (isQR) return null; // QR handled async
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, {
      format: format === 'EAN13' ? 'EAN13' : format === 'UPC' ? 'UPC' : format === 'ITF14' ? 'ITF14' : format === 'CODE39' ? 'CODE39' : format === 'codabar' ? 'codabar' : 'CODE128',
      width: opts.barWidth || 2,
      height: opts.barHeight || 50,
      displayValue: false,
      margin: 0,
      background: 'transparent',
      lineColor: opts.lineColor || '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

async function generateQRDataURL(value, size = 120) {
  if (!value) return null;
  try {
    return await QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
  } catch {
    return null;
  }
}

/* ────────────────────────────────────────────────────────
   SINGLE LABEL RENDERER
   ──────────────────────────────────────────────────────── */
function LabelContent({ product, template, format, barcodeImg, qrImg, contentOpts, styleOpts, labelW, labelH }) {
  const name = product?.name || 'Product';
  const sku = product?.sku || 'N/A';
  const price = product?.price ? `${product.currencySymbol || '$'}${parseFloat(product.price).toFixed(2)}` : '';
  const category = product?.categories?.[0]?.name || product?.category?.name || '';
  const isQR = format === 'QR' || format === 'QR_URL';
  const img = isQR ? qrImg : barcodeImg;

  const scaledFont = (base) => Math.max(6, Math.min(base, labelH * 0.18));

  const baseLabelStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: contentOpts.textAlign === 'left' ? 'flex-start' : contentOpts.textAlign === 'right' ? 'flex-end' : 'center',
    justifyContent: 'center',
    padding: `${Math.max(2, labelH * 0.06)}px`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: template === 'jewelry' || template === 'luxury' || template === 'hang_tag' ? '"Georgia", "Times New Roman", serif' : '"Inter", "Segoe UI", system-ui, sans-serif',
    border: styleOpts.border === 'thin' ? '0.5px solid #d1d5db' : styleOpts.border === 'dashed' ? '0.5px dashed #9ca3af' : styleOpts.border === 'bold' ? '1px solid #374151' : 'none',
    background: styleOpts.background === 'gray' ? '#f9fafb' : styleOpts.background === 'transparent' ? 'transparent' : '#ffffff',
    borderRadius: template === 'asset' ? '6px' : template === 'jewelry' ? '2px' : '0',
    textAlign: contentOpts.textAlign || 'center',
    position: 'relative',
  };

  const barcodeHeight = styleOpts.barcodeHeight || 40;
  const barcodeWidthPct = Math.min(95, (styleOpts.barcodeWidthMul || 1) * 80);

  // Template-specific renders
  if (template === 'minimal') {
    return (
      <div style={baseLabelStyle}>
        {img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${barcodeHeight}px`, objectFit: 'contain', maxHeight: '90%' }} />}
        {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(8)}px`, color: '#6b7280', marginTop: '2px', letterSpacing: '0.5px' }}>{sku}</div>}
      </div>
    );
  }

  if (template === 'price_tag') {
    return (
      <div style={{ ...baseLabelStyle, justifyContent: 'space-between', padding: `${Math.max(3, labelH * 0.08)}px` }}>
        {contentOpts.showName && <div style={{ fontSize: `${scaledFont(9)}px`, fontWeight: 600, color: '#1f2937', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{name}</div>}
        {contentOpts.showPrice && <div style={{ fontSize: `${scaledFont(16)}px`, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>{price}</div>}
        {img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${Math.max(20, barcodeHeight * 0.6)}px`, objectFit: 'contain' }} />}
        {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(7)}px`, color: '#9ca3af' }}>{sku}</div>}
      </div>
    );
  }

  if (template === 'jewelry') {
    return (
      <div style={{ ...baseLabelStyle, justifyContent: 'center', gap: '2px' }}>
        {contentOpts.showName && <div style={{ fontSize: `${scaledFont(8)}px`, fontWeight: 400, color: '#78716c', letterSpacing: '1.5px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{name}</div>}
        {img && <img src={img} alt="" style={{ width: `${Math.min(barcodeWidthPct, 70)}%`, height: isQR ? 'auto' : `${Math.max(16, barcodeHeight * 0.5)}px`, objectFit: 'contain' }} />}
        {contentOpts.showPrice && <div style={{ fontSize: `${scaledFont(10)}px`, fontWeight: 600, color: '#92400e', letterSpacing: '0.5px' }}>{price}</div>}
        {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(6)}px`, color: '#a8a29e', marginTop: '1px' }}>{sku}</div>}
      </div>
    );
  }

  if (template === 'shelf_edge') {
    return (
      <div style={{ ...baseLabelStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {contentOpts.showName && <div style={{ fontSize: `${scaledFont(8)}px`, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>}
          {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(7)}px`, color: '#9ca3af', fontFamily: 'monospace' }}>{sku}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          {contentOpts.showPrice && <div style={{ fontSize: `${scaledFont(14)}px`, fontWeight: 800, color: '#111827' }}>{price}</div>}
        </div>
      </div>
    );
  }

  if (template === 'hang_tag') {
    return (
      <div style={{ ...baseLabelStyle, justifyContent: 'space-between', gap: '2px' }}>
        <div style={{ width: '100%', textAlign: 'center', borderBottom: '0.5px solid #e5e7eb', paddingBottom: '3px', marginBottom: '2px' }}>
          {contentOpts.showBrandLogo && <div style={{ fontSize: `${scaledFont(7)}px`, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b7280' }}>ECOMMERCE</div>}
        </div>
        {contentOpts.showName && <div style={{ fontSize: `${scaledFont(9)}px`, fontWeight: 500, color: '#374151', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{name}</div>}
        {contentOpts.showPrice && <div style={{ fontSize: `${scaledFont(12)}px`, fontWeight: 700, color: '#111827', textAlign: 'center' }}>{price}</div>}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${Math.max(18, barcodeHeight * 0.5)}px`, objectFit: 'contain' }} />}
        </div>
        {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(6)}px`, color: '#9ca3af', textAlign: 'center' }}>{sku}</div>}
      </div>
    );
  }

  if (template === 'warehouse') {
    return (
      <div style={{ ...baseLabelStyle, justifyContent: 'space-between', alignItems: 'flex-start', background: '#ffffff', border: '1px solid #000000' }}>
        {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(14)}px`, fontWeight: 900, color: '#000000', fontFamily: 'monospace', letterSpacing: '1px', width: '100%' }}>{sku}</div>}
        {contentOpts.showName && <div style={{ fontSize: `${scaledFont(8)}px`, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{name}</div>}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${barcodeHeight}px`, objectFit: 'contain' }} />}
        </div>
        {contentOpts.showCategory && category && <div style={{ fontSize: `${scaledFont(7)}px`, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>LOC: {category}</div>}
      </div>
    );
  }

  if (template === 'qr_card') {
    return (
      <div style={{ ...baseLabelStyle, flexDirection: 'row', gap: '6px', alignItems: 'center' }}>
        <div style={{ flexShrink: 0 }}>
          {img && <img src={img} alt="" style={{ width: `${Math.min(labelH * 0.8, labelW * 0.35)}px`, height: 'auto', objectFit: 'contain' }} />}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {contentOpts.showName && <div style={{ fontSize: `${scaledFont(9)}px`, fontWeight: 700, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>}
          {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(7)}px`, color: '#6b7280', fontFamily: 'monospace' }}>{sku}</div>}
          {contentOpts.showPrice && <div style={{ fontSize: `${scaledFont(11)}px`, fontWeight: 800, color: '#059669' }}>{price}</div>}
          {contentOpts.showCategory && category && <div style={{ fontSize: `${scaledFont(6)}px`, color: '#9ca3af', textTransform: 'uppercase' }}>{category}</div>}
        </div>
      </div>
    );
  }

  if (template === 'thermal') {
    return (
      <div style={{ ...baseLabelStyle, background: '#ffffff', justifyContent: 'center', gap: '2px' }}>
        {contentOpts.showName && <div style={{ fontSize: `${scaledFont(9)}px`, fontWeight: 700, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{name}</div>}
        {img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${barcodeHeight}px`, objectFit: 'contain' }} />}
        {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(8)}px`, color: '#000', fontFamily: 'monospace' }}>{sku}</div>}
        {contentOpts.showPrice && <div style={{ fontSize: `${scaledFont(10)}px`, fontWeight: 800, color: '#000' }}>{price}</div>}
      </div>
    );
  }

  if (template === 'asset') {
    return (
      <div style={{ ...baseLabelStyle, borderRadius: '6px', border: '1px solid #e5e7eb', justifyContent: 'center', gap: '2px' }}>
        <div style={{ fontSize: `${scaledFont(6)}px`, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>ASSET</div>
        {img && <img src={img} alt="" style={{ width: `${Math.min(barcodeWidthPct, 75)}%`, height: isQR ? 'auto' : `${Math.max(18, barcodeHeight * 0.55)}px`, objectFit: 'contain' }} />}
        {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(8)}px`, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{sku}</div>}
        {contentOpts.showName && <div style={{ fontSize: `${scaledFont(7)}px`, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{name}</div>}
      </div>
    );
  }

  if (template === 'luxury') {
    return (
      <div style={{ ...baseLabelStyle, background: '#fffbeb', border: '1.5px solid #b8860b', justifyContent: 'center', gap: '3px' }}>
        {contentOpts.showBrandLogo && <div style={{ fontSize: `${scaledFont(6)}px`, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#b8860b' }}>✦ ECOMMERCE ✦</div>}
        {contentOpts.showName && <div style={{ fontSize: `${scaledFont(9)}px`, fontWeight: 500, color: '#78350f', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{name}</div>}
        {contentOpts.showPrice && <div style={{ fontSize: `${scaledFont(12)}px`, fontWeight: 700, color: '#92400e' }}>{price}</div>}
        {img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${Math.max(18, barcodeHeight * 0.55)}px`, objectFit: 'contain' }} />}
        {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(6)}px`, color: '#a8a29e', letterSpacing: '0.5px' }}>{sku}</div>}
      </div>
    );
  }

  if (template === 'compact') {
    return (
      <div style={{ ...baseLabelStyle, justifyContent: 'center', padding: '1px', gap: '1px' }}>
        {img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${Math.max(14, barcodeHeight * 0.4)}px`, objectFit: 'contain' }} />}
        {contentOpts.showSku && <div style={{ fontSize: `${Math.max(5, scaledFont(6))}px`, color: '#6b7280', fontFamily: 'monospace', lineHeight: 1 }}>{sku}</div>}
      </div>
    );
  }

  // Default: 'standard' template
  return (
    <div style={{ ...baseLabelStyle, justifyContent: 'center', gap: '3px' }}>
      {contentOpts.barcodePosition === 'top' && img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${barcodeHeight}px`, objectFit: 'contain' }} />}
      {contentOpts.showName && <div style={{ fontSize: `${scaledFont(9)}px`, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', lineHeight: 1.2 }}>{name}</div>}
      {contentOpts.showCategory && category && <div style={{ fontSize: `${scaledFont(6)}px`, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{category}</div>}
      {(contentOpts.barcodePosition === 'center' || !contentOpts.barcodePosition) && img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${barcodeHeight}px`, objectFit: 'contain' }} />}
      {contentOpts.showSku && <div style={{ fontSize: `${scaledFont(7)}px`, color: '#6b7280', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{sku}</div>}
      {contentOpts.showPrice && <div style={{ fontSize: `${scaledFont(10)}px`, fontWeight: 700, color: '#111827' }}>{price}</div>}
      {contentOpts.barcodePosition === 'bottom' && img && <img src={img} alt="" style={{ width: `${barcodeWidthPct}%`, height: isQR ? 'auto' : `${barcodeHeight}px`, objectFit: 'contain' }} />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   MAIN MODAL COMPONENT
   ──────────────────────────────────────────────────────── */
export default function BarcodePrintModal({ isOpen, onClose, products = [], currencySymbol = '$' }) {
  // Settings state
  const [format, setFormat] = useState('CODE128');
  const [template, setTemplate] = useState('standard');
  const [paperId, setPaperId] = useState('avery5160');
  const [startPosition, setStartPosition] = useState(1);
  const [zoom, setZoom] = useState(75);
  const [previewPage, setPreviewPage] = useState(0);

  // Content options
  const [contentOpts, setContentOpts] = useState({
    showName: true, showSku: true, showPrice: true, showCategory: false,
    showBrandLogo: true, barcodePosition: 'center', textAlign: 'center',
  });

  // Style options
  const [styleOpts, setStyleOpts] = useState({
    border: 'none', background: 'white', barcodeHeight: 40, barcodeWidthMul: 1,
  });

  // Custom paper settings
  const [customPaper, setCustomPaper] = useState({ cols: 3, rows: 8 });

  // Product selection & quantities
  const [selectedIds, setSelectedIds] = useState(() => new Set(products.map(p => p.id)));
  const [quantities, setQuantities] = useState(() => {
    const q = {};
    products.forEach(p => { q[p.id] = 1; });
    return q;
  });
  const [productSearch, setProductSearch] = useState('');

  // Barcode image cache
  const [barcodeCache, setBarcodeCache] = useState({});

  // Sidebar active section
  const [activeSection, setActiveSection] = useState('format');

  // Open accordion panels
  const [expandedPanels, setExpandedPanels] = useState(new Set(['format']));

  const printFrameRef = useRef(null);

  // Reset selections when products change
  useEffect(() => {
    setSelectedIds(new Set(products.map(p => p.id)));
    const q = {};
    products.forEach(p => { q[p.id] = quantities[p.id] || 1; });
    setQuantities(q);
  }, [products]);

  // Generate barcode images for all selected products
  useEffect(() => {
    const genBarcodes = async () => {
      const cache = {};
      const isQR = format === 'QR' || format === 'QR_URL';
      for (const prod of products) {
        const val = format === 'QR_URL' ? `${window.location.origin}/products/${prod.slug || prod.id}` : (prod.sku || `SKU-${prod.id}`);
        if (isQR) {
          cache[prod.id] = await generateQRDataURL(val, 200);
        } else {
          cache[prod.id] = generateBarcodeDataURL(val, format, { barWidth: 2, barHeight: styleOpts.barcodeHeight || 50 });
        }
      }
      setBarcodeCache(cache);
    };
    genBarcodes();
  }, [products, format, styleOpts.barcodeHeight]);

  // Compute paper config
  const paper = useMemo(() => {
    const base = PAPER_STOCKS.find(p => p.id === paperId) || PAPER_STOCKS[0];
    if (base.custom) {
      return { ...base, cols: customPaper.cols, rows: customPaper.rows };
    }
    return base;
  }, [paperId, customPaper]);

  const labelsPerPage = paper.cols * paper.rows;

  // Build label list: expand quantities
  const labelList = useMemo(() => {
    const list = [];
    products.forEach(prod => {
      if (!selectedIds.has(prod.id)) return;
      const qty = quantities[prod.id] || 1;
      for (let i = 0; i < qty; i++) {
        list.push({ ...prod, currencySymbol });
      }
    });
    return list;
  }, [products, selectedIds, quantities, currencySymbol]);

  const totalLabels = labelList.length;
  const skipSlots = Math.max(0, startPosition - 1);
  const totalSlots = skipSlots + totalLabels;
  const totalPages = Math.max(1, Math.ceil(totalSlots / labelsPerPage));

  // Get labels for current preview page
  const getPageLabels = useCallback((pageIdx) => {
    const result = [];
    const pageStart = pageIdx * labelsPerPage;
    for (let slot = 0; slot < labelsPerPage; slot++) {
      const globalSlot = pageStart + slot;
      const labelIdx = globalSlot - skipSlots;
      if (labelIdx < 0 || labelIdx >= totalLabels) {
        result.push(null); // empty slot
      } else {
        result.push(labelList[labelIdx]);
      }
    }
    return result;
  }, [labelsPerPage, skipSlots, totalLabels, labelList]);

  const currentPageLabels = useMemo(() => getPageLabels(previewPage), [getPageLabels, previewPage]);

  // Filtered products for the right panel
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const q = productSearch.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [products, productSearch]);

  // Toggle all
  const handleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  // Toggle panel
  const togglePanel = (id) => {
    setExpandedPanels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ── PRINT ────────────────────────────── */
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const labelWpx = mm(paper.labelW);
    const labelHpx = mm(paper.labelH);
    const marginTopPx = mm(paper.marginTop);
    const marginLeftPx = mm(paper.marginLeft);
    const gapXpx = mm(paper.gapX);
    const gapYpx = mm(paper.gapY);
    const pageWpx = mm(paper.pageW);
    const pageHpx = mm(paper.pageH);

    // Build all pages
    let pagesHTML = '';
    for (let pg = 0; pg < totalPages; pg++) {
      const labels = getPageLabels(pg);
      let labelsHTML = '';
      labels.forEach((prod, idx) => {
        const col = idx % paper.cols;
        const row = Math.floor(idx / paper.cols);
        const left = marginLeftPx + col * (labelWpx + gapXpx);
        const top = marginTopPx + row * (labelHpx + gapYpx);
        if (prod) {
          const isQR = format === 'QR' || format === 'QR_URL';
          const barcodeImg = barcodeCache[prod.id] || '';
          const name = prod.name || '';
          const sku = prod.sku || '';
          const price = prod.price ? `${currencySymbol}${parseFloat(prod.price).toFixed(2)}` : '';
          const category = prod.category?.name || '';

          // Render label content as HTML string based on template
          let inner = renderTemplatePrintHTML(template, { name, sku, price, category, barcodeImg, isQR, contentOpts, styleOpts, labelWpx, labelHpx });

          labelsHTML += `<div style="position:absolute;left:${left}px;top:${top}px;width:${labelWpx}px;height:${labelHpx}px;overflow:hidden;">${inner}</div>`;
        }
      });

      pagesHTML += `<div class="page" style="position:relative;width:${pageWpx}px;height:${pageHpx}px;page-break-after:always;">${labelsHTML}</div>`;
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Barcode Labels</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @page { size: ${paper.pageW}mm ${paper.pageH}mm; margin: 0; }
        @media print { body { margin:0; } .page { page-break-after:always; } .page:last-child { page-break-after:auto; } }
        body { font-family: 'Inter', sans-serif; }
        img { image-rendering: -webkit-optimize-contrast; }
      </style>
    </head><body>${pagesHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }, [paper, totalPages, getPageLabels, format, barcodeCache, currencySymbol, template, contentOpts, styleOpts]);

  if (!isOpen) return null;

  const sidebarSections = [
    { id: 'format', label: 'Barcode Format', icon: ScanBarcode },
    { id: 'template', label: 'Label Template', icon: Layers },
    { id: 'paper', label: 'Paper / Stock', icon: LayoutGrid },
    { id: 'content', label: 'Content', icon: Eye },
    { id: 'style', label: 'Styling', icon: Palette },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-stretch" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex flex-col w-full h-full bg-gray-50 dark:bg-gray-900 animate-in fade-in duration-200">

        {/* ── HEADER ──────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-md">
              <ScanBarcode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-gray-900 dark:text-white">Barcode Print Studio</h2>
              <p className="text-[10px] text-gray-400">Design, preview & print barcode labels for your products</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{totalLabels} labels</span>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-xs text-gray-500">{totalPages} page{totalPages !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Labels
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── BODY: 3 columns ─────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT SIDEBAR ──────────────────── */}
          <div className="w-72 bg-white dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 overflow-y-auto shrink-0">
            {sidebarSections.map(section => {
              const Icon = section.icon;
              const isExpanded = expandedPanels.has(section.id);
              return (
                <div key={section.id} className="border-b border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => togglePanel(section.id)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1">{section.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                      {section.id === 'format' && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {BARCODE_FORMATS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => setFormat(f.id)}
                              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                format === f.id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                  : 'border-gray-150 hover:border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate">{f.name}</div>
                              <div className="text-[8px] text-gray-400 truncate mt-0.5">{f.desc}</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {section.id === 'template' && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {LABEL_TEMPLATES.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setTemplate(t.id)}
                              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                template === t.id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                  : 'border-gray-150 hover:border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate">{t.name}</span>
                              </div>
                              <div className="text-[8px] text-gray-400 truncate mt-0.5">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {section.id === 'paper' && (
                        <div className="flex flex-col gap-1.5">
                          {PAPER_STOCKS.map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setPaperId(p.id); setPreviewPage(0); }}
                              className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                                paperId === p.id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                  : 'border-gray-150 hover:border-gray-300 dark:border-gray-700'
                              }`}
                            >
                              <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">{p.name}</div>
                              <div className="text-[8px] text-gray-400">{p.desc}</div>
                            </button>
                          ))}
                          {(paperId === 'a4_custom' || paperId === 'letter_custom') && (
                            <div className="mt-2 flex gap-2">
                              <label className="flex-1">
                                <span className="text-[9px] text-gray-500 font-medium">Columns</span>
                                <input type="number" min={1} max={10} value={customPaper.cols} onChange={e => setCustomPaper(p => ({ ...p, cols: Math.max(1, +e.target.value) }))} className="w-full mt-0.5 px-2 py-1.5 border border-gray-200 rounded text-xs text-center dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                              </label>
                              <label className="flex-1">
                                <span className="text-[9px] text-gray-500 font-medium">Rows</span>
                                <input type="number" min={1} max={30} value={customPaper.rows} onChange={e => setCustomPaper(p => ({ ...p, rows: Math.max(1, +e.target.value) }))} className="w-full mt-0.5 px-2 py-1.5 border border-gray-200 rounded text-xs text-center dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                              </label>
                            </div>
                          )}
                        </div>
                      )}

                      {section.id === 'content' && (
                        <div className="flex flex-col gap-2">
                          {[
                            { key: 'showName', label: 'Product Name' },
                            { key: 'showSku', label: 'SKU Text' },
                            { key: 'showPrice', label: 'Price' },
                            { key: 'showCategory', label: 'Category' },
                            { key: 'showBrandLogo', label: 'Brand Logo Text' },
                          ].map(opt => (
                            <label key={opt.key} className="flex items-center justify-between cursor-pointer group">
                              <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900">{opt.label}</span>
                              <div
                                onClick={() => setContentOpts(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                                className={`w-8 h-4.5 rounded-full relative transition-colors cursor-pointer ${contentOpts[opt.key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                              >
                                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${contentOpts[opt.key] ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                              </div>
                            </label>
                          ))}
                          <div className="mt-2">
                            <span className="text-[9px] text-gray-500 font-medium">Barcode Position</span>
                            <div className="flex gap-1 mt-1">
                              {['top', 'center', 'bottom'].map(pos => (
                                <button
                                  key={pos}
                                  onClick={() => setContentOpts(prev => ({ ...prev, barcodePosition: pos }))}
                                  className={`flex-1 py-1.5 rounded text-[9px] font-semibold capitalize transition-all cursor-pointer ${
                                    contentOpts.barcodePosition === pos ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >{pos}</button>
                              ))}
                            </div>
                          </div>
                          <div className="mt-1">
                            <span className="text-[9px] text-gray-500 font-medium">Text Alignment</span>
                            <div className="flex gap-1 mt-1">
                              {['left', 'center', 'right'].map(al => (
                                <button
                                  key={al}
                                  onClick={() => setContentOpts(prev => ({ ...prev, textAlign: al }))}
                                  className={`flex-1 py-1.5 rounded text-[9px] font-semibold capitalize transition-all cursor-pointer ${
                                    contentOpts.textAlign === al ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >{al}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {section.id === 'style' && (
                        <div className="flex flex-col gap-3">
                          <div>
                            <span className="text-[9px] text-gray-500 font-medium">Border</span>
                            <div className="flex gap-1 mt-1">
                              {[{ id: 'none', l: 'None' }, { id: 'thin', l: 'Thin' }, { id: 'dashed', l: 'Dashed' }, { id: 'bold', l: 'Bold' }].map(b => (
                                <button
                                  key={b.id}
                                  onClick={() => setStyleOpts(prev => ({ ...prev, border: b.id }))}
                                  className={`flex-1 py-1.5 rounded text-[9px] font-semibold transition-all cursor-pointer ${
                                    styleOpts.border === b.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >{b.l}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-medium">Background</span>
                            <div className="flex gap-1 mt-1">
                              {[{ id: 'white', l: 'White' }, { id: 'gray', l: 'Light Gray' }, { id: 'transparent', l: 'Clear' }].map(b => (
                                <button
                                  key={b.id}
                                  onClick={() => setStyleOpts(prev => ({ ...prev, background: b.id }))}
                                  className={`flex-1 py-1.5 rounded text-[9px] font-semibold transition-all cursor-pointer ${
                                    styleOpts.background === b.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >{b.l}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-medium">Barcode Height: {styleOpts.barcodeHeight}px</span>
                            <input type="range" min={15} max={80} value={styleOpts.barcodeHeight} onChange={e => setStyleOpts(prev => ({ ...prev, barcodeHeight: +e.target.value }))}
                              className="w-full mt-1 accent-primary" />
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-medium">Barcode Width: ×{styleOpts.barcodeWidthMul}</span>
                            <input type="range" min={0.5} max={3} step={0.1} value={styleOpts.barcodeWidthMul} onChange={e => setStyleOpts(prev => ({ ...prev, barcodeWidthMul: +e.target.value }))}
                              className="w-full mt-1 accent-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Start Position */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <label className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Start Position</span>
                <input type="number" min={1} max={labelsPerPage} value={startPosition} onChange={e => setStartPosition(Math.max(1, +e.target.value))}
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-center dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
              </label>
              <p className="text-[8px] text-gray-400 mt-1">Skip first N-1 slots for partially-used sheets</p>
            </div>
          </div>

          {/* ── CENTER: LIVE PREVIEW ──────────── */}
          <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 min-w-0 overflow-hidden">
            {/* Zoom & page controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-10 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                {[50, 75, 100].map(z => (
                  <button key={z} onClick={() => setZoom(z)}
                    className={`px-2 py-1 rounded text-[9px] font-semibold cursor-pointer ${zoom === z ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}
                  >{z}%</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewPage(p => Math.max(0, p - 1))} disabled={previewPage === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Page {previewPage + 1} / {totalPages}</span>
                <button onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))} disabled={previewPage >= totalPages - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Paper preview */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-6">
              <div
                className="bg-white shadow-2xl rounded-sm relative"
                style={{
                  width: `${mm(paper.pageW) * (zoom / 100)}px`,
                  height: `${mm(paper.pageH) * (zoom / 100)}px`,
                  transform: `scale(1)`,
                  transformOrigin: 'top center',
                }}
              >
                {currentPageLabels.map((prod, idx) => {
                  const col = idx % paper.cols;
                  const row = Math.floor(idx / paper.cols);
                  const left = mm(paper.marginLeft) + col * (mm(paper.labelW) + mm(paper.gapX));
                  const top = mm(paper.marginTop) + row * (mm(paper.labelH) + mm(paper.gapY));
                  const labelWpx = mm(paper.labelW);
                  const labelHpx = mm(paper.labelH);

                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${left * (zoom / 100)}px`,
                        top: `${top * (zoom / 100)}px`,
                        width: `${labelWpx * (zoom / 100)}px`,
                        height: `${labelHpx * (zoom / 100)}px`,
                        overflow: 'hidden',
                        border: prod ? undefined : '0.5px dashed #e5e7eb',
                        background: prod ? undefined : '#fafafa',
                      }}
                    >
                      {prod ? (
                        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', width: `${labelWpx}px`, height: `${labelHpx}px` }}>
                          <LabelContent
                            product={prod}
                            template={template}
                            format={format}
                            barcodeImg={(format !== 'QR' && format !== 'QR_URL') ? barcodeCache[prod.id] : null}
                            qrImg={(format === 'QR' || format === 'QR_URL') ? barcodeCache[prod.id] : null}
                            contentOpts={contentOpts}
                            styleOpts={styleOpts}
                            labelW={labelWpx}
                            labelH={labelHpx}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: `${Math.max(7, 9 * (zoom / 100))}px`, color: '#d1d5db' }}>—</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: PRODUCT SELECTION ── */}
          <div className="w-72 bg-white dark:bg-gray-850 border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Products ({products.length})</span>
                <button onClick={handleSelectAll} className="text-[9px] font-semibold text-primary hover:text-primary-hover cursor-pointer">
                  {selectedIds.size === products.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredProducts.map(prod => {
                const isSelected = selectedIds.has(prod.id);
                const qty = quantities[prod.id] || 1;
                return (
                  <div
                    key={prod.id}
                    className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-50 dark:border-gray-800 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                  >
                    <button
                      onClick={() => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(prod.id)) next.delete(prod.id); else next.add(prod.id);
                          return next;
                        });
                      }}
                      className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">{prod.name}</div>
                      <div className="text-[8px] text-gray-400 font-mono">{prod.sku || `No SKU`}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setQuantities(prev => ({ ...prev, [prod.id]: Math.max(1, (prev[prod.id] || 1) - 1) }))}
                        className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={qty}
                        onChange={e => setQuantities(prev => ({ ...prev, [prod.id]: Math.max(1, +e.target.value || 1) }))}
                        className="w-9 py-0.5 text-center text-[10px] font-bold border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      />
                      <button
                        onClick={() => setQuantities(prev => ({ ...prev, [prod.id]: Math.min(999, (prev[prod.id] || 1) + 1) }))}
                        className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-gray-400 italic">No products match search</div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Selected:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{selectedIds.size} products</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">Total labels:</span>
                <span className="font-bold text-primary">{totalLabels}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   PRINT HTML TEMPLATE RENDERER
   Used to generate static HTML for the print window
   ──────────────────────────────────────────────────────── */
function renderTemplatePrintHTML(template, { name, sku, price, category, barcodeImg, isQR, contentOpts, styleOpts, labelWpx, labelHpx }) {
  const barcodeHeight = styleOpts.barcodeHeight || 40;
  const barcodeWidthPct = Math.min(95, (styleOpts.barcodeWidthMul || 1) * 80);
  const borderStyle = styleOpts.border === 'thin' ? '0.5px solid #d1d5db' : styleOpts.border === 'dashed' ? '0.5px dashed #9ca3af' : styleOpts.border === 'bold' ? '1px solid #374151' : 'none';
  const bgColor = styleOpts.background === 'gray' ? '#f9fafb' : styleOpts.background === 'transparent' ? 'transparent' : '#ffffff';
  const fontFamily = ['jewelry', 'luxury', 'hang_tag'].includes(template) ? "'Playfair Display','Georgia','Times New Roman',serif" : "'Inter','Segoe UI',system-ui,sans-serif";
  const textAlign = contentOpts.textAlign || 'center';
  const borderRadius = template === 'asset' ? '6px' : template === 'jewelry' ? '2px' : '0';

  const scaledFont = (base) => Math.max(6, Math.min(base, labelHpx * 0.18));
  const imgTag = barcodeImg ? `<img src="${barcodeImg}" style="width:${barcodeWidthPct}%;height:${isQR ? 'auto' : barcodeHeight + 'px'};object-fit:contain;max-height:90%;" />` : '';
  const imgTagSmall = barcodeImg ? `<img src="${barcodeImg}" style="width:${Math.min(barcodeWidthPct, 70)}%;height:${isQR ? 'auto' : Math.max(16, barcodeHeight * 0.5) + 'px'};object-fit:contain;" />` : '';

  const baseStyle = `width:100%;height:100%;display:flex;flex-direction:column;align-items:${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};justify-content:center;padding:${Math.max(2, labelHpx * 0.06)}px;box-sizing:border-box;overflow:hidden;font-family:${fontFamily};border:${borderStyle};background:${bgColor};border-radius:${borderRadius};text-align:${textAlign};`;

  const nameHTML = contentOpts.showName ? `<div style="font-size:${scaledFont(9)}px;font-weight:600;color:#1f2937;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;line-height:1.2;">${escHtml(name)}</div>` : '';
  const skuHTML = contentOpts.showSku ? `<div style="font-size:${scaledFont(7)}px;color:#6b7280;font-family:monospace;letter-spacing:0.5px;">${escHtml(sku)}</div>` : '';
  const priceHTML = contentOpts.showPrice ? `<div style="font-size:${scaledFont(10)}px;font-weight:700;color:#111827;">${escHtml(price)}</div>` : '';
  const categoryHTML = contentOpts.showCategory && category ? `<div style="font-size:${scaledFont(6)}px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">${escHtml(category)}</div>` : '';

  switch (template) {
    case 'minimal':
      return `<div style="${baseStyle}">${imgTag}${contentOpts.showSku ? `<div style="font-size:${scaledFont(8)}px;color:#6b7280;margin-top:2px;letter-spacing:0.5px;">${escHtml(sku)}</div>` : ''}</div>`;

    case 'price_tag':
      return `<div style="${baseStyle}justify-content:space-between;padding:${Math.max(3, labelHpx * 0.08)}px;">
        ${contentOpts.showName ? `<div style="font-size:${scaledFont(9)}px;font-weight:600;color:#1f2937;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">${escHtml(name)}</div>` : ''}
        ${contentOpts.showPrice ? `<div style="font-size:${scaledFont(16)}px;font-weight:800;color:#111827;letter-spacing:-0.5px;">${escHtml(price)}</div>` : ''}
        ${barcodeImg ? `<img src="${barcodeImg}" style="width:${barcodeWidthPct}%;height:${isQR ? 'auto' : Math.max(20, barcodeHeight * 0.6) + 'px'};object-fit:contain;" />` : ''}
        ${contentOpts.showSku ? `<div style="font-size:${scaledFont(7)}px;color:#9ca3af;">${escHtml(sku)}</div>` : ''}
      </div>`;

    case 'jewelry':
      return `<div style="${baseStyle}justify-content:center;gap:2px;">
        ${contentOpts.showName ? `<div style="font-size:${scaledFont(8)}px;font-weight:400;color:#78716c;letter-spacing:1.5px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">${escHtml(name)}</div>` : ''}
        ${imgTagSmall}
        ${contentOpts.showPrice ? `<div style="font-size:${scaledFont(10)}px;font-weight:600;color:#92400e;letter-spacing:0.5px;">${escHtml(price)}</div>` : ''}
        ${contentOpts.showSku ? `<div style="font-size:${scaledFont(6)}px;color:#a8a29e;margin-top:1px;">${escHtml(sku)}</div>` : ''}
      </div>`;

    case 'shelf_edge':
      return `<div style="${baseStyle}flex-direction:row;justify-content:space-between;align-items:center;gap:4px;">
        <div style="flex:1;overflow:hidden;">
          ${contentOpts.showName ? `<div style="font-size:${scaledFont(8)}px;font-weight:600;color:#1f2937;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(name)}</div>` : ''}
          ${contentOpts.showSku ? `<div style="font-size:${scaledFont(7)}px;color:#9ca3af;font-family:monospace;">${escHtml(sku)}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
          ${contentOpts.showPrice ? `<div style="font-size:${scaledFont(14)}px;font-weight:800;color:#111827;">${escHtml(price)}</div>` : ''}
        </div>
      </div>`;

    case 'hang_tag':
      return `<div style="${baseStyle}justify-content:space-between;gap:2px;">
        <div style="width:100%;text-align:center;border-bottom:0.5px solid #e5e7eb;padding-bottom:3px;margin-bottom:2px;">
          ${contentOpts.showBrandLogo ? `<div style="font-size:${scaledFont(7)}px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">ECOMMERCE</div>` : ''}
        </div>
        ${contentOpts.showName ? `<div style="font-size:${scaledFont(9)}px;font-weight:500;color:#374151;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">${escHtml(name)}</div>` : ''}
        ${contentOpts.showPrice ? `<div style="font-size:${scaledFont(12)}px;font-weight:700;color:#111827;text-align:center;">${escHtml(price)}</div>` : ''}
        <div style="width:100%;display:flex;justify-content:center;">${barcodeImg ? `<img src="${barcodeImg}" style="width:${barcodeWidthPct}%;height:${isQR ? 'auto' : Math.max(18, barcodeHeight * 0.5) + 'px'};object-fit:contain;" />` : ''}</div>
        ${contentOpts.showSku ? `<div style="font-size:${scaledFont(6)}px;color:#9ca3af;text-align:center;">${escHtml(sku)}</div>` : ''}
      </div>`;

    case 'warehouse':
      return `<div style="${baseStyle}justify-content:space-between;align-items:flex-start;background:#ffffff;border:1px solid #000000;">
        ${contentOpts.showSku ? `<div style="font-size:${scaledFont(14)}px;font-weight:900;color:#000;font-family:monospace;letter-spacing:1px;width:100%;">${escHtml(sku)}</div>` : ''}
        ${contentOpts.showName ? `<div style="font-size:${scaledFont(8)}px;font-weight:500;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">${escHtml(name)}</div>` : ''}
        <div style="width:100%;display:flex;justify-content:center;">${imgTag}</div>
        ${contentOpts.showCategory && category ? `<div style="font-size:${scaledFont(7)}px;color:#6b7280;font-weight:600;text-transform:uppercase;">LOC: ${escHtml(category)}</div>` : ''}
      </div>`;

    case 'qr_card':
      return `<div style="${baseStyle}flex-direction:row;gap:6px;align-items:center;">
        <div style="flex-shrink:0;">${barcodeImg ? `<img src="${barcodeImg}" style="width:${Math.min(labelHpx * 0.8, labelWpx * 0.35)}px;height:auto;object-fit:contain;" />` : ''}</div>
        <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;gap:1px;">
          ${contentOpts.showName ? `<div style="font-size:${scaledFont(9)}px;font-weight:700;color:#1f2937;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(name)}</div>` : ''}
          ${contentOpts.showSku ? `<div style="font-size:${scaledFont(7)}px;color:#6b7280;font-family:monospace;">${escHtml(sku)}</div>` : ''}
          ${contentOpts.showPrice ? `<div style="font-size:${scaledFont(11)}px;font-weight:800;color:#059669;">${escHtml(price)}</div>` : ''}
          ${contentOpts.showCategory && category ? `<div style="font-size:${scaledFont(6)}px;color:#9ca3af;text-transform:uppercase;">${escHtml(category)}</div>` : ''}
        </div>
      </div>`;

    case 'thermal':
      return `<div style="${baseStyle}background:#ffffff;justify-content:center;gap:2px;">
        ${contentOpts.showName ? `<div style="font-size:${scaledFont(9)}px;font-weight:700;color:#000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">${escHtml(name)}</div>` : ''}
        ${imgTag}
        ${contentOpts.showSku ? `<div style="font-size:${scaledFont(8)}px;color:#000;font-family:monospace;">${escHtml(sku)}</div>` : ''}
        ${contentOpts.showPrice ? `<div style="font-size:${scaledFont(10)}px;font-weight:800;color:#000;">${escHtml(price)}</div>` : ''}
      </div>`;

    case 'asset':
      return `<div style="${baseStyle}border-radius:6px;border:1px solid #e5e7eb;justify-content:center;gap:2px;">
        <div style="font-size:${scaledFont(6)}px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">ASSET</div>
        ${barcodeImg ? `<img src="${barcodeImg}" style="width:${Math.min(barcodeWidthPct, 75)}%;height:${isQR ? 'auto' : Math.max(18, barcodeHeight * 0.55) + 'px'};object-fit:contain;" />` : ''}
        ${contentOpts.showSku ? `<div style="font-size:${scaledFont(8)}px;font-weight:700;color:#374151;font-family:monospace;">${escHtml(sku)}</div>` : ''}
        ${contentOpts.showName ? `<div style="font-size:${scaledFont(7)}px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">${escHtml(name)}</div>` : ''}
      </div>`;

    case 'luxury':
      return `<div style="${baseStyle}background:#fffbeb;border:1.5px solid #b8860b;justify-content:center;gap:3px;">
        ${contentOpts.showBrandLogo ? `<div style="font-size:${scaledFont(6)}px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#b8860b;">✦ ECOMMERCE ✦</div>` : ''}
        ${contentOpts.showName ? `<div style="font-size:${scaledFont(9)}px;font-weight:500;color:#78350f;font-style:italic;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;">${escHtml(name)}</div>` : ''}
        ${contentOpts.showPrice ? `<div style="font-size:${scaledFont(12)}px;font-weight:700;color:#92400e;">${escHtml(price)}</div>` : ''}
        ${barcodeImg ? `<img src="${barcodeImg}" style="width:${barcodeWidthPct}%;height:${isQR ? 'auto' : Math.max(18, barcodeHeight * 0.55) + 'px'};object-fit:contain;" />` : ''}
        ${contentOpts.showSku ? `<div style="font-size:${scaledFont(6)}px;color:#a8a29e;letter-spacing:0.5px;">${escHtml(sku)}</div>` : ''}
      </div>`;

    case 'compact':
      return `<div style="${baseStyle}justify-content:center;padding:1px;gap:1px;">
        ${imgTag}
        ${contentOpts.showSku ? `<div style="font-size:${Math.max(5, scaledFont(6))}px;color:#6b7280;font-family:monospace;line-height:1;">${escHtml(sku)}</div>` : ''}
      </div>`;

    default: // standard
      return `<div style="${baseStyle}justify-content:center;gap:3px;">
        ${contentOpts.barcodePosition === 'top' ? imgTag : ''}
        ${nameHTML}
        ${categoryHTML}
        ${(!contentOpts.barcodePosition || contentOpts.barcodePosition === 'center') ? imgTag : ''}
        ${skuHTML}
        ${priceHTML}
        ${contentOpts.barcodePosition === 'bottom' ? imgTag : ''}
      </div>`;
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
