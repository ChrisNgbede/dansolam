import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * BarcodeLabel — renders a single barcode or QR code image.
 *
 * Supports 1D barcode formats (CODE128, EAN13, UPC, CODE39, ITF14, codabar)
 * via JsBarcode, and 2D QR codes (QR, QR_URL) via the qrcode library.
 *
 * @param {string}  value        — the data to encode (SKU, URL, etc.)
 * @param {string}  format       — barcode format (default 'CODE128')
 * @param {number}  width        — bar width multiplier (default 2)
 * @param {number}  height       — barcode height in px (default 50)
 * @param {boolean} displayValue — show text below barcode (default true)
 * @param {number}  fontSize     — text font size (default 12)
 * @param {string}  textAlign    — 'left' | 'center' | 'right' (default 'center')
 * @param {string}  background   — background color (default '#ffffff')
 * @param {string}  lineColor    — barcode line color (default '#000000')
 * @param {number}  margin       — margin around barcode in px (default 10)
 * @param {number}  qrSize       — QR code size in px (default 120)
 */

/** 1D barcode formats handled by JsBarcode */
const BARCODE_1D_FORMATS = ['CODE128', 'EAN13', 'UPC', 'CODE39', 'ITF14', 'codabar'];

/** QR code formats */
const QR_FORMATS = ['QR', 'QR_URL'];

function BarcodeLabel({
    value = '',
    format = 'CODE128',
    width = 2,
    height = 50,
    displayValue = true,
    fontSize = 12,
    textAlign = 'center',
    background = '#ffffff',
    lineColor = '#000000',
    margin = 10,
    qrSize = 120,
}) {
    const svgRef = useRef(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [error, setError] = useState(null);

    const isQR = QR_FORMATS.includes(format);
    const is1D = BARCODE_1D_FORMATS.includes(format);

    // ── 1D barcode rendering ────────────────────────────────────────────
    useEffect(() => {
        if (!is1D) return;

        // Reset previous errors
        setError(null);

        if (!value) {
            setError('No value provided');
            return;
        }

        try {
            JsBarcode(svgRef.current, value, {
                format,
                width,
                height,
                displayValue,
                fontSize,
                textAlign,
                background,
                lineColor,
                margin,
            });
        } catch (err) {
            setError(err.message || 'Invalid barcode value for the selected format');
        }
    }, [value, format, width, height, displayValue, fontSize, textAlign, background, lineColor, margin, is1D]);

    // ── QR code rendering ───────────────────────────────────────────────
    useEffect(() => {
        if (!isQR) return;

        // Reset previous state
        setError(null);
        setQrDataUrl(null);

        if (!value) {
            setError('No value provided');
            return;
        }

        QRCode.toDataURL(value, {
            width: qrSize,
            margin: Math.round(margin / 4),
            color: {
                dark: lineColor,
                light: background,
            },
        })
            .then((url) => setQrDataUrl(url))
            .catch((err) => {
                setError(err.message || 'Failed to generate QR code');
            });
    }, [value, qrSize, margin, lineColor, background, isQR]);

    // ── Empty value placeholder ─────────────────────────────────────────
    if (!value) {
        return (
            <div className="flex items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-400">
                No barcode value
            </div>
        );
    }

    // ── Error state ─────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-1 rounded border border-red-200 bg-red-50 p-3 text-center">
                <span className="text-xs font-medium text-red-600">Barcode Error</span>
                <span className="text-[11px] text-red-500">{error}</span>
            </div>
        );
    }

    // ── QR code output ──────────────────────────────────────────────────
    if (isQR) {
        return (
            <div className="inline-flex flex-col items-center gap-1">
                {qrDataUrl ? (
                    <img
                        src={qrDataUrl}
                        alt={`QR code for ${value}`}
                        width={qrSize}
                        height={qrSize}
                        className="block"
                    />
                ) : (
                    <div
                        className="flex items-center justify-center rounded bg-gray-100 text-xs text-gray-400"
                        style={{ width: qrSize, height: qrSize }}
                    >
                        Generating…
                    </div>
                )}
                {displayValue && (
                    <span
                        className="max-w-full truncate text-gray-700"
                        style={{ fontSize, textAlign }}
                    >
                        {value}
                    </span>
                )}
            </div>
        );
    }

    // ── 1D barcode output ───────────────────────────────────────────────
    if (is1D) {
        return (
            <div className="inline-flex items-center justify-center">
                <svg ref={svgRef} />
            </div>
        );
    }

    // ── Unsupported format fallback ─────────────────────────────────────
    return (
        <div className="flex items-center justify-center rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
            Unsupported format: {format}
        </div>
    );
}

export default BarcodeLabel;
