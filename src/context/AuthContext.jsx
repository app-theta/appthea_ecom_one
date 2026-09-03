import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth as authApi } from '../api/endpoints';
import { getToken, setToken } from '../api/client';
import { parseApiError } from '../api/errors';

const AuthContext = createContext(null);
const CUSTOMER_KEY = 'apptheta.customer';

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null'); } catch { return null; }
  });
  const [booting, setBooting] = useState(Boolean(getToken()));

  const persist = useCallback((c) => {
    setCustomer(c);
    try {
      c ? localStorage.setItem(CUSTOMER_KEY, JSON.stringify(c)) : localStorage.removeItem(CUSTOMER_KEY);
    } catch { /* ignore */ }
  }, []);

  /* Re-validate a stored token once on boot. */
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    authApi.profile()
      .then((data) => { if (alive) persist(data?.customer || data || null); })
      .catch(() => { if (alive) { setToken(null); persist(null); } })
      .finally(() => { if (alive) setBooting(false); });
    return () => { alive = false; };
  }, [persist]);

  /* client.js fires this when a request comes back 401. */
  useEffect(() => {
    const onExpired = () => persist(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [persist]);

  const login = useCallback(async (payload) => {
    const data = await authApi.login(payload);
    setToken(data?.token || null);
    persist(data?.customer || null);
    return data;
  }, [persist]);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setToken(data?.token || null);
    persist(data?.customer || null);
    return data;
  }, [persist]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* token may already be dead */ }
    setToken(null);
    persist(null);
  }, [persist]);

  const refresh = useCallback(async () => {
    const data = await authApi.profile();
    persist(data?.customer || data || null);
    return data;
  }, [persist]);

  const value = useMemo(() => ({
    customer,
    isAuthed: Boolean(customer && getToken()),
    booting,
    login,
    register,
    logout,
    refresh,
    setCustomer: persist,
    parseApiError,
  }), [customer, booting, login, register, logout, refresh, persist]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
