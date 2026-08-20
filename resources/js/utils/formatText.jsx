import React from 'react';

/**
 * Clean raw text by replacing literal backslash-n sequences, unescaping quotes,
 * and normalizing multi-line spacing.
 */
export function cleanRawText(text) {
  if (!text) return '';
  return String(text)
    // Replace literal '\n' or '\\n' or '\r' with actual newlines
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    // Remove unescaped surrounding double quotes from raw CSV export
    .replace(/^"+|"+$/g, '')
    // Replace 3+ consecutive newlines with clean double newline
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * React Component to render multi-paragraph, bullet-pointed formatted text cleanly
 * without any raw \n\n or JSON string artifacts.
 */
export function FormattedText({ text, className = '' }) {
  const cleaned = cleanRawText(text);
  if (!cleaned) return null;

  // Split into paragraphs by double newlines
  const paragraphs = cleaned.split(/\n\n+/);

  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((para, idx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');

        if (lines.length > 1) {
          return (
            <div key={idx} className="space-y-1">
              {lines.map((line, lIdx) => {
                const rawLine = line.trim();
                if (!rawLine) return null;

                const isBullet = rawLine.startsWith('*') || rawLine.startsWith('-') || rawLine.startsWith('•');
                const lineContent = isBullet ? rawLine.replace(/^[\*\-\•]\s*/, '') : rawLine;

                return isBullet ? (
                  <div key={lIdx} className="flex items-start gap-2 text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="text-[#5D3E85] dark:text-purple-400 font-bold text-sm leading-none mt-0.5">•</span>
                    <span>{lineContent}</span>
                  </div>
                ) : (
                  <p key={lIdx} className="text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {lineContent}
                  </p>
                );
              })}
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
