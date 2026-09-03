import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { account } from '../api/endpoints';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthed } = useAuth();
  const { features } = useBusiness();
  const enabled = features.user_wishlist;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !isAuthed) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await account.wishlist();
      setRows(Array.isArray(data) ? data : (data?.data ?? []));
    } catch { setRows([]); } finally { setLoading(false); }
  }, [enabled, isAuthed]);

  useEffect(() => { load(); }, [load]);

  const idsByProduct = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const pid = r.product_id ?? r.product?.id;
      if (pid != null) map.set(Number(pid), r.id);
    }
    return map;
  }, [rows]);

  const has = useCallback((productId) => idsByProduct.has(Number(productId)), [idsByProduct]);

  /** Adds or removes; returns 'added' | 'removed'. */
  const toggle = useCallback(async (productId) => {
    const existing = idsByProduct.get(Number(productId));
    if (existing) {
      await account.removeWishlist(existing);
      await load();
      return 'removed';
    }
    await account.addWishlist(productId);
    await load();
    return 'added';
  }, [idsByProduct, load]);

  const value = useMemo(
    () => ({ enabled, rows, loading, has, toggle, reload: load, count: rows.length }),
    [enabled, rows, loading, has, toggle, load],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
