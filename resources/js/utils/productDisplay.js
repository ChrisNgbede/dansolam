// Normalises raw catalogue names for display without changing the stored data.
//   "Foot cream Solution (New)50g"         -> Foot Cream Solution · 50g · New
//   "Glowing Black Soap(New Formula) 250g" -> Glowing Black Soap · 250g · "New formula" · New
//   "3 SET (Discoloration Oil,  Whitening Body Polish Soap and Scrub)"
//                                          -> 3-Piece Set · "Discoloration Oil, Whitening Body Polish Soap & Scrub" · Set
//   "3 Set of Essential Oil 250g Each"     -> Set of 3 · 3 × 250g · "Essential Oil" · Set

const SIZE = /(\d+(?:\.\d+)?)\s?(g|kg|ml|l|cl|oz)\b/i;
const SMALL_WORDS = new Set(['and', 'or', 'of', 'the', 'with', 'for', 'a', 'an', 'in', 'on', '&']);

const tidy = (text) => text
  .replace(/\s*\(\s*/g, ' (')
  .replace(/\s*\)\s*/g, ') ')
  .replace(/\s+,/g, ',')
  .replace(/\s{2,}/g, ' ')
  .trim();

function titleCase(text) {
  return text.split(' ').map((word, i) => {
    if (!word) return word;
    const lower = word.toLowerCase();
    if (i > 0 && SMALL_WORDS.has(lower)) return lower;
    // Keep deliberate inner capitals (HerbaGlow, SPF).
    if (/[A-Z]/.test(word.slice(1)) && word !== word.toUpperCase()) return word;
    if (word.length <= 3 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word; // SPF
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

const sentence = (text) => {
  const t = text.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
};

export function formatProductName(rawName = '') {
  let raw = String(rawName);
  // In set names a double space stands in for a missing comma between items.
  if (/^\s*\d+\s*set\b/i.test(raw)) {
    raw = raw.replace(/\s{2,}(?=\S)/g, ', ').replace(/,\s*,/g, ',');
  }
  let isNew = false;
  let badge = null;
  const notes = [];

  if (/\bfast[\s-]*selling\b/i.test(raw)) {
    badge = 'Bestseller';
    raw = raw.replace(/\(?\s*fast[\s-]*selling\s*\)?/ig, ' ');
  }
  if (/\(\s*new formula\s*\)/i.test(raw)) {
    isNew = true;
    notes.push('New formula');
    raw = raw.replace(/\(\s*new formula\s*\)/ig, ' ');
  }
  if (/\(\s*new\s*\)|\bnew\s*$/i.test(raw)) {
    isNew = true;
    raw = raw.replace(/\(\s*new\s*\)/ig, ' ').replace(/\bnew\s*$/i, ' ');
  }

  raw = tidy(raw);

  // "3 Set of Essential Oil 250g Each"
  const setOf = raw.match(/^(\d+)\s*set\s+of\s+(.+?)\s+(\d+(?:\.\d+)?\s?(?:g|kg|ml|l|cl|oz))\s*each$/i);
  if (setOf) {
    return {
      name: `Set of ${setOf[1]}`,
      subline: titleCase(setOf[2]),
      size: `${setOf[1]} × ${setOf[3].replace(/\s/g, '')}`,
      badge: 'Set',
      isNew,
    };
  }

  // "3 SET (A, B and C)" or "2 SET A & B (note)"
  const set = raw.match(/^(\d+)\s*set\b\s*(.*)$/i);
  if (set) {
    let rest = set[2].trim();
    const parenFirst = rest.match(/^\((.*)\)\s*(.*)$/);
    let contents = parenFirst ? parenFirst[1] : rest.replace(/\s*\(.*\)\s*$/, '');
    const trailingNote = parenFirst ? parenFirst[2] : (rest.match(/\(([^)]*)\)\s*$/)?.[1] || '');
    contents = contents.replace(/\s+and\s+/ig, ' & ').replace(/\s*,\s*/g, ', ').trim();
    return {
      name: `${set[1]}-Piece Set`,
      subline: sentence([contents, trailingNote].filter(Boolean).join(' · ')),
      size: '',
      badge: 'Set',
      isNew,
    };
  }

  // Size: prefer one in brackets "(10g)", else a loose "500g".
  let size = '';
  const bracketSize = raw.match(/\(\s*(\d+(?:\.\d+)?\s?(?:g|kg|ml|l|cl|oz))\s*\)/i);
  if (bracketSize) {
    size = bracketSize[1];
    raw = raw.replace(bracketSize[0], ' ');
  } else {
    const loose = raw.match(SIZE);
    if (loose) {
      size = loose[0];
      raw = raw.replace(loose[0], ' ');
    }
  }
  size = size.replace(/\s/g, '');

  // Remaining brackets describe the product -> sub-line.
  raw.replace(/\(([^)]*)\)/g, (_, inner) => {
    if (inner.trim()) notes.push(sentence(inner.replace(/\s{2,}/g, ' ')));
    return '';
  });
  raw = tidy(raw.replace(/\([^)]*\)/g, ' '));

  return {
    name: titleCase(raw),
    subline: notes.join(' · '),
    size,
    badge: badge || (isNew ? 'New' : null),
    isNew,
  };
}
