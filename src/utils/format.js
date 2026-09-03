/** Money — "Tk 1,093". Digits stay Latin in both languages for scannability. */
export function money(value, { withSymbol = true } = {}) {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  const s = safe.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(safe) ? 0 : 2,
  });
  return withSymbol ? `Tk ${s}` : s;
}

export function percentOff(was, now) {
  const a = Number(was || 0);
  const b = Number(now || 0);
  if (!a || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

export function dateShort(value, lang = 'en') {
  if (!value) return '—';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function truncate(text, max = 90) {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Strips HTML from a description for meta/short blurbs. */
export function plain(html) {
  return String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function initials(name) {
  return String(name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('');
}

export function statusPill(status) {
  const s = String(status ?? '').toLowerCase();
  if (['delivered', 'completed', 'paid', 'success', 'approved'].some((k) => s.includes(k))) return 'pill--ok';
  if (['cancel', 'reject', 'fail', 'return'].some((k) => s.includes(k))) return 'pill--fail';
  return 'pill--pending';
}

/** First usable image URL out of the many shapes the API may return. */
export function imageUrl(source) {
  if (!source) return null;
  if (typeof source === 'string') return source;
  if (Array.isArray(source)) return imageUrl(source[0]);
  return source.image || source.url || source.path || source.thumbnail || source.full_url || null;
}
