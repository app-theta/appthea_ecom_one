import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { checkout as checkoutApi } from '../api/endpoints';

const CART_KEY = 'apptheta.cart';
const CartContext = createContext(null);

/**
 * Cart lives entirely on the client — the backend keeps no cart state.
 * An entry is one of three shapes (plus a local-only `meta` for display,
 * which is stripped before anything is sent to the API):
 *
 *  simple        { type, product_id, barcode_id, quantity, total_price }
 *  combo_product { type, product_id, barcode_id, quantity, free_selections[], total_price }
 *  bundle        { type, bundle_id, bundle_quantity, selections[], total_price }
 *
 * `total_price` is the price of the WHOLE entry. The backend recalculates it and
 * rejects checkout on any mismatch, so call syncPrices() right before checkout.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pricing, setPricing] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* quota */ }
  }, [items]);

  const add = useCallback((entry, { openDrawer = false } = {}) => {
    const key = entry.key || lineKey(entry);
    setItems((list) => {
      const i = list.findIndex((x) => x.key === key);
      if (i === -1) return [...list, { ...entry, key }];
      const next = [...list];
      const found = next[i];
      const unit = unitPrice(found);
      const qty = qtyOf(found) + qtyOf(entry);
      next[i] = withQty(found, qty, unit);
      return next;
    });
    if (openDrawer) setDrawerOpen(true);
  }, []);

  const setQty = useCallback((key, qty) => {
    setItems((list) => list.map((x) => (x.key === key ? withQty(x, Math.max(1, qty), unitPrice(x)) : x)));
  }, []);

  const remove = useCallback((key) => setItems((list) => list.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  /** POST cart/price — preview only. Rewrites total_price per line when it drifted. */
  const syncPrices = useCallback(async () => {
    if (!items.length) return { changed: false, data: null };
    setPricing(true);
    try {
      const data = await checkoutApi.price(toApiCart(items));
      const lines = Array.isArray(data?.cart) ? data.cart : Array.isArray(data?.items) ? data.items : null;
      if (!lines) return { changed: false, data };

      /* Diff synchronously so the caller gets a truthful `changed` flag. */
      const next = items.map((line, idx) => {
        const server = lines[idx];
        const fresh = Number(server?.total_price ?? server?.price ?? line.total_price);
        return Number.isFinite(fresh) && Math.abs(fresh - Number(line.total_price)) > 0.009
          ? { ...line, total_price: fresh }
          : line;
      });
      const changed = next.some((line, i) => line !== items[i]);
      if (changed) setItems(next);
      return { changed, data };
    } finally {
      setPricing(false);
    }
  }, [items]);

  const count = useMemo(() => items.reduce((n, x) => n + qtyOf(x), 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((n, x) => n + Number(x.total_price || 0), 0),
    [items],
  );

  const value = useMemo(() => ({
    items, count, subtotal, pricing,
    add, setQty, remove, clear, syncPrices,
    apiCart: () => toApiCart(items),
    drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
  }), [items, count, subtotal, pricing, add, setQty, remove, clear, syncPrices, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

export function qtyOf(entry) {
  return Number(entry.type === 'bundle' ? entry.bundle_quantity : entry.quantity) || 1;
}

function withQty(entry, qty, unit) {
  const total = round2(unit * qty);
  return entry.type === 'bundle'
    ? { ...entry, bundle_quantity: qty, total_price: total }
    : { ...entry, quantity: qty, total_price: total };
}

/** Per-unit price derived from the stored entry total (combo tiers included). */
function unitPrice(entry) {
  const q = qtyOf(entry);
  if (entry.meta?.unit_price) return Number(entry.meta.unit_price);
  return q > 0 ? Number(entry.total_price || 0) / q : Number(entry.total_price || 0);
}

const round2 = (n) => Math.round(Number(n) * 100) / 100;

/** Stable identity so re-adding the same configuration merges instead of duplicating. */
export function lineKey(entry) {
  if (entry.type === 'bundle') {
    const sel = (entry.selections || []).map((s) => `${s.product_id}:${s.barcode_id}`).join('|');
    return `bundle-${entry.bundle_id}-${sel}`;
  }
  if (entry.type === 'combo_product') {
    const free = (entry.free_selections || []).map((s) => `${s.product_id}:${s.barcode_id}`).join('|');
    return `combo-${entry.product_id}-${entry.barcode_id}-${free}-${entry.meta?.tier_qty ?? ''}`;
  }
  return `simple-${entry.product_id}-${entry.barcode_id}`;
}

/** Strips local display metadata — this is exactly what the API receives. */
export function toApiCart(items) {
  return items.map((x) => {
    if (x.type === 'bundle') {
      return {
        type: 'bundle',
        bundle_id: x.bundle_id,
        bundle_quantity: Number(x.bundle_quantity) || 1,
        selections: (x.selections || []).map((s) => ({ product_id: s.product_id, barcode_id: s.barcode_id })),
        total_price: Number(x.total_price) || 0,
      };
    }
    if (x.type === 'combo_product') {
      return {
        type: 'combo_product',
        product_id: x.product_id,
        barcode_id: x.barcode_id,
        quantity: Number(x.quantity) || 1,
        free_selections: (x.free_selections || []).map((s) => ({ product_id: s.product_id, barcode_id: s.barcode_id })),
        total_price: Number(x.total_price) || 0,
      };
    }
    return {
      type: 'simple',
      product_id: x.product_id,
      barcode_id: x.barcode_id,
      quantity: Number(x.quantity) || 1,
      total_price: Number(x.total_price) || 0,
    };
  });
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
