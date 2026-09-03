import axios from 'axios';

export const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api`;
export const PUBLIC_KEY = import.meta.env.VITE_APPTHETA_PUBLIC_KEY || '';
export const TOKEN_KEY = 'apptheta.token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || null; } catch { return null; }
}
export function setToken(token) {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

/* Every storefront request carries the business public key; the bearer token is
   attached when present (checkout / cart-price treat it as optional). */
api.interceptors.request.use((config) => {
  config.headers['apptheta_public-key'] = PUBLIC_KEY;
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && getToken()) {
      setToken(null);
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  },
);

/** Unwraps the `{status, message, data, code}` envelope. */
export async function request(config) {
  const res = await api.request(config);
  const body = res.data;
  if (body && typeof body === 'object' && 'status' in body) {
    if (body.status === false) throw { __envelope: true, response: { data: body, status: body.code } };
    return body.data;
  }
  return body;
}

export const get = (url, params, config = {}) => request({ method: 'get', url, params, ...config });
export const post = (url, data, config = {}) => request({ method: 'post', url, data, ...config });
export const del = (url, config = {}) => request({ method: 'delete', url, ...config });

/** Full envelope, for endpoints where `message` matters (checkout, coupon). */
export async function postRaw(url, data) {
  const res = await api.post(url, data);
  return res.data;
}

export default api;
