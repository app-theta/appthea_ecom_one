import { defaultTheme } from './defaultTheme';

/**
 * Writes a theme object onto :root as CSS custom properties.
 * Every component styles itself with var(--pink), var(--sp-4) etc.,
 * so swapping the theme object re-skins the whole site with no CSS edits.
 *
 * Future: when the backend exposes GET /api/ecom-frontend/business/theme,
 * merge the response over defaultTheme and call applyTheme again.
 */
export function applyTheme(theme = defaultTheme) {
  const t = mergeTheme(theme);
  const root = document.documentElement.style;

  Object.entries(t.colors).forEach(([k, v]) => root.setProperty(`--${k}`, v));
  root.setProperty('--font-body', t.fonts.body);
  root.setProperty('--font-logo', t.fonts.logo);
  Object.entries(t.fontSizes).forEach(([k, v]) => root.setProperty(`--fs-${k}`, v));
  Object.entries(t.spacing).forEach(([k, v]) => root.setProperty(`--sp-${k}`, v));
  Object.entries(t.layout).forEach(([k, v]) => root.setProperty(`--${k}`, v));
  root.setProperty('--shadow-sm', t.shadow.sm);
  root.setProperty('--shadow', t.shadow.md);
  root.setProperty('--shadow-lg', t.shadow.lg);
  root.setProperty('--t', t.transition);

  // Keep Bootstrap's own runtime variables in sync with the theme.
  root.setProperty('--bs-primary', t.colors.pink);
  root.setProperty('--bs-primary-rgb', hexToRgb(t.colors.pink));
  root.setProperty('--bs-body-color', t.colors.ink);
  root.setProperty('--bs-body-bg', t.colors.bg);
  root.setProperty('--bs-body-font-family', t.fonts.body);
  root.setProperty('--bs-border-color', t.colors.line);
  root.setProperty('--bs-border-radius', t.layout.radius);
  root.setProperty('--bs-link-color', t.colors.pink);
  root.setProperty('--bs-link-hover-color', t.colors.pinkDark);
}

/** Deep-ish merge so a partial theme payload only overrides what it names. */
export function mergeTheme(partial = {}) {
  const out = { ...defaultTheme };
  for (const key of Object.keys(defaultTheme)) {
    const base = defaultTheme[key];
    const next = partial[key];
    out[key] = base && typeof base === 'object' && next && typeof next === 'object'
      ? { ...base, ...next }
      : (next ?? base);
  }
  return out;
}

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ');
}

export default applyTheme;
