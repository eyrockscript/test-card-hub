/**
 * Finds card numbers in text (source code, fixtures, logs) that may be REAL cards:
 * Luhn-valid, a known brand, and not a published sandbox number.
 * Full numbers never leave this module: findings are masked to first 6 + last 4
 * (last 4 only when fewer than 16 digits, so most of a short number is never shown).
 */
import { CARD_LIMITS, detectBrand, isKnownTestNumber, isLuhnValid, normalizeCardNumber } from '../../core/domain/index.js';

export const SCAN_LIMITS = Object.freeze({ maxChars: 200_000, maxFindings: 50 });

// A run of digit groups joined by single spaces or dashes ("4912 3456 7890 1230 123").
const DIGIT_RUN = /\d+(?:[ -]\d+)*/g;
const GROUP = /\d+/g;

const MIN_DIGITS_FOR_BIN = 16;

/** @param {string} digits @returns {string} e.g. 491234******1230, or ********0002 for short numbers */
export function maskCardNumber(digits) {
  if (digits.length < MIN_DIGITS_FOR_BIN) return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
  return `${digits.slice(0, 6)}${'*'.repeat(digits.length - 10)}${digits.slice(-4)}`;
}

/** Tracks line and column with one forward pass, since matches arrive in text order. */
function createPositionTracker(text) {
  let cursor = 0;
  let line = 1;
  let lineStart = 0;
  return (index) => {
    for (let nl = text.indexOf('\n', cursor); nl !== -1 && nl < index; nl = text.indexOf('\n', nl + 1)) {
      line += 1;
      lineStart = nl + 1;
    }
    cursor = Math.max(cursor, lineStart);
    return { line, column: index - lineStart + 1 };
  };
}

function classify(digits, sets) {
  const lengthOk = digits.length >= CARD_LIMITS.minDigits && digits.length <= CARD_LIMITS.maxDigits;
  if (!lengthOk || !isLuhnValid(digits)) return 'ignored';
  if (isKnownTestNumber(digits, sets.knownNumbers)) return 'known';
  if (sets.environmentNumbers.has(digits)) return 'environment';
  return detectBrand(digits) === 'unknown' ? 'ignored' : 'suspect';
}

/** Spans of consecutive groups from `start` that classify as a card, longest first. */
function spansFrom(groups, start, sets) {
  const spans = [];
  let digits = '';
  for (let end = start; end < groups.length && digits.length < CARD_LIMITS.maxDigits; end += 1) {
    digits += groups[end].text;
    const kind = classify(digits, sets);
    if (kind !== 'ignored') spans.unshift({ digits, end, kind });
  }
  return spans;
}

/**
 * Splits a run of digit groups into card candidates. From each group, takes the longest
 * span of consecutive groups that is a card, so a card followed by its CVV or expiry is
 * still found. A published test number wins over a longer merge with its CVV; a merge
 * that is not a card (e.g. a quantity before the number) is skipped, not reported.
 * @returns {{ digits: string, offset: number, kind: string }[]}
 */
function candidatesInRun(run, sets) {
  const groups = [...run.matchAll(GROUP)].map((m) => ({ text: m[0], offset: m.index }));
  const found = [];
  let start = 0;
  while (start < groups.length) {
    const spans = spansFrom(groups, start, sets);
    const best = spans.find((s) => s.kind !== 'suspect') ?? spans[0];
    if (!best) { start += 1; continue; }
    found.push({ digits: best.digits, offset: groups[start].offset, kind: best.kind });
    start = best.end + 1;
  }
  return found;
}

/**
 * @param {string} text
 * @param {{ knownNumbers: Set<string>, environmentNumbers: Set<string> }} sets
 */
export function scanForRealCards(text, sets) {
  const counts = { known: 0, environment: 0, suspect: 0 };
  const findings = [];
  const positionOf = createPositionTracker(text);
  for (const run of text.matchAll(DIGIT_RUN)) {
    for (const { digits, offset, kind } of candidatesInRun(run[0], sets)) {
      counts[kind] += 1;
      if (kind !== 'suspect' || findings.length >= SCAN_LIMITS.maxFindings) continue;
      const position = positionOf(run.index + offset);
      findings.push({ ...position, masked: maskCardNumber(digits), brand: detectBrand(digits), digits: digits.length });
    }
  }
  return {
    verdict: counts.suspect > 0 ? 'possibly_real_cards_found' : 'clean',
    totalFindings: counts.suspect,
    findings,
    knownTestNumbers: counts.known,
    userEnvironmentNumbers: counts.environment,
    ...(counts.suspect > findings.length
      ? { notice: `Showing ${findings.length} of ${counts.suspect} findings. Fix these and scan again.` }
      : {}),
  };
}
