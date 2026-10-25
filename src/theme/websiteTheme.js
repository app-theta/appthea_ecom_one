import { applyTheme } from './applyTheme';

/**
 * The business's own website colours (admin: Website Manage > Website Theme), laid over this
 * template's design. business/info sends only the colours the business picked, by meaning -
 * { primary, text, text_muted, border, background, topbar_bg, topbar_text, footer_bg, footer_text } -
 * and each one lands on this template's variables below, with the shades it needs (hover, soft
 * line, button text) worked out from it. A colour not picked keeps defaultTheme's, so a business
 * that picked nothing looks exactly like the template.
 *
 * The last theme is kept in the browser, so the next visit paints the business's colours before
 * the API answers instead of flashing the template's.
 */
const STORE_KEY = `website-theme:${import.meta.env.VITE_APPTHETA_PUBLIC_KEY || ''}`;

const MAP = {
  primary: (c) => ({ pink: c, pinkDark: mix(c, '#000000', 0.14), pinkContrast: contrastText(c) }),
  text: (c) => ({ ink: c }),
  text_muted: (c) => ({ inkSoft: c, inkMute: mix(c, '#ffffff', 0.3) }),
  border: (c) => ({ line: c, lineSoft: mix(c, '#ffffff', 0.45) }),
  background: (c) => ({ bgAlt: c }),
  topbar_bg: (c) => ({ topbarBg: c }),
  topbar_text: (c) => ({ topbarText: c, topbarMuted: alpha(c, 0.78) }),
  footer_bg: (c) => ({ footerBg: c }),
  footer_text: (c) => ({ footerText: c, footerMuted: alpha(c, 0.72), footerLine: alpha(c, 0.12), footerLineStrong: alpha(c, 0.18) }),
};

/** Paints the business's colours; an empty / missing theme puts the template's own back. */
export function applyWebsiteTheme(theme) {
  const colors = {};
  Object.entries(MAP).forEach(([key, toColors]) => {
    if (isHex(theme?.[key])) Object.assign(colors, toColors(theme[key].toLowerCase()));
  });
  applyTheme({ colors });
}

export function rememberWebsiteTheme(theme) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(theme && typeof theme === 'object' ? theme : {}));
  } catch {
    // private window / storage blocked: the colours just arrive with the API
  }
}

/** The last visit's colours, before the first paint. */
export function restoreWebsiteTheme() {
  try {
    const theme = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (theme) applyWebsiteTheme(theme);
  } catch {
    // nothing kept, or unreadable: the template's colours until the API answers
  }
}

function isHex(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

function toRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `weight` of the way from `a` to `b` (0 = a, 1 = b). */
function mix(a, b, weight) {
  const x = toRgb(a);
  const y = toRgb(b);
  return '#' + x.map((c, i) => Math.round(c + (y[i] - c) * weight).toString(16).padStart(2, '0')).join('');
}

function alpha(hex, a) {
  return `rgba(${toRgb(hex).join(', ')}, ${a})`;
}

/** Dark text on a light colour, white on the rest - the same rule as the admin preview. */
function contrastText(hex) {
  const [r, g, b] = toRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 160 ? '#111111' : '#ffffff';
}
