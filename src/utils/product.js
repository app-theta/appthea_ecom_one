import { imageUrl } from './format';

/* Reading the product payload defensively: the Frontend resources are the source
   of truth for field names, and list vs detail resources differ slightly. */

export const isCombo = (p) => String(p?.is_combo ?? 'No') === 'Yes';
export const comboKind = (p) => (isCombo(p) ? String(p?.combo_type || 'Same') : null);
export const isSameCombo = (p) => comboKind(p) === 'Same';
export const isBundle = (p) => comboKind(p) === 'Different';

export function barcodes(p) {
  const list = p?.barcodes || p?.barcode_list || (p?.barcode ? [p.barcode] : []);
  return Array.isArray(list) ? list : [];
}

/** The barcode that drives the headline price. */
export function primaryBarcode(p) {
  if (p?.barcode && typeof p.barcode === 'object') return p.barcode;
  const list = barcodes(p);
  return list.find((b) => inStock(b)) || list[0] || null;
}

export function headlinePrice(p) {
  const b = primaryBarcode(p);
  const now = num(b?.discount_selling_amount ?? b?.selling_amount ?? p?.discount_selling_amount ?? p?.selling_amount);
  const was = num(b?.selling_amount ?? p?.selling_amount);
  return { now, was: was > now ? was : 0 };
}

export function barcodePrice(b) {
  const now = num(b?.discount_selling_amount ?? b?.selling_amount);
  const was = num(b?.selling_amount);
  return { now, was: was > now ? was : 0 };
}

export function stockOf(b) {
  return num(b?.stock_qty ?? b?.stock ?? b?.available_stock ?? b?.quantity ?? 0);
}
export function inStock(b) {
  return stockOf(b) > 0 || String(b?.stock_status || '').toLowerCase() === 'in stock';
}
export function productInStock(p) {
  if (p?.total_stock_qty !== undefined && p?.total_stock_qty !== null) {
    return num(p.total_stock_qty) > 0;
  }
  const list = barcodes(p);
  if (!list.length) return num(p?.stock ?? 1) > 0;
  return list.some(inStock);
}

/** Human label for a barcode: "Black · M" from whichever attribute fields exist. */
export function variantLabel(b) {
  const bits = [
    b?.colour?.name || b?.color?.name || b?.colour_name || b?.color,
    b?.size?.name || b?.size_name || b?.size,
    b?.weight?.name || b?.weight_name,
    b?.type?.name || b?.variant_name,
  ].filter((x) => typeof x === 'string' && x.trim());
  if (bits.length) return bits.join(' · ');
  return b?.name || b?.sku || b?.barcode || `#${b?.id ?? ''}`;
}

export function swatchColour(b) {
  return b?.colour?.code || b?.colour?.hex || b?.color?.code || null;
}

export function productImages(p) {
  const many = p?.images || p?.gallery || p?.product_images;
  const list = (Array.isArray(many) ? many : []).map(imageUrl).filter(Boolean);
  const first = imageUrl(p?.thumbnail || p?.image || p?.primary_image);
  const all = [first, ...list].filter(Boolean);
  return [...new Set(all)];
}

export function thumbOf(p) {
  return productImages(p)[0] || null;
}

export function ratingOf(p) {
  return {
    value: num(p?.average_rating ?? p?.rating ?? p?.reviews_avg_rating ?? 0),
    count: num(p?.total_reviews ?? p?.reviews_count ?? 0),
  };
}

export const comboTiers = (p) => (Array.isArray(p?.combo_tiers) ? p.combo_tiers : []);
export const bundlesOf = (p) => (Array.isArray(p?.bundles) ? p.bundles : []);

export function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** paginated list responses arrive either bare or wrapped. */
export function paginated(payload) {
  if (!payload) return { rows: [], page: 1, lastPage: 1, total: 0 };
  const rows = Array.isArray(payload) ? payload : payload.data ?? payload.products ?? [];
  const meta = payload.meta ?? payload;
  return {
    rows: Array.isArray(rows) ? rows : [],
    page: num(meta.current_page ?? 1) || 1,
    lastPage: num(meta.last_page ?? 1) || 1,
    total: num(meta.total ?? (Array.isArray(rows) ? rows.length : 0)),
  };
}
