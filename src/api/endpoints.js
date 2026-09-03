import { get, post, del, postRaw, API_BASE } from './client';

const F = '/ecom-frontend';
const C = '/customer';

/* ── Customer auth ─────────────────────────────────────────────────────────── */
export const auth = {
  register: (payload) => post(`${C}/register`, payload),
  login: (payload) => post(`${C}/login`, payload),
  forgotPassword: (payload) => post(`${C}/forgot/password`, payload),
  resetPassword: (payload) => post(`${C}/reset/password`, payload),
  profile: () => get(`${C}/profile/info`),
  updateProfile: (payload) => post(`${C}/profile/update`, payload),
  changePassword: (payload) => post(`${C}/profile/change-password`, payload),
  sendOtp: (type) => get(`${C}/profile/send/otp`, { type }),
  changeContact: (payload) => post(`${C}/profile/change-contact`, payload),
  logout: () => post(`${C}/logout`),
};

/* ── Business & basic data ────────────────────────────────────────────────── */
export const business = {
  info: () => get(`${F}/business/info`),
  seoMeta: () => get(`${F}/basic/seo-meta`),
};

export const basic = {
  categories: () => get(`${F}/basic/category`),
  brands: () => get(`${F}/basic/brand`),
  colours: () => get(`${F}/basic/colour`),
  sliders: () => get(`${F}/basic/slider`),
  /** Bundles business info + category/brand/colour/slider/seo-meta into one call. */
  all: (params, config) => get(`${F}/basic/all/list`, params, config),
};

/* ── Catalogue ────────────────────────────────────────────────────────────── */
export const catalog = {
  /** params: keyword, category_id, sub_category_id, brand_id, is_featured,
   *          min_price, max_price, sort, per_page, page */
  products: (params) => get(`${F}/products`, params),
  product: (slug) => get(`${F}/products/${slug}`),
};

/** Bundles the homepage's featured/latest/reels product queries into one call. */
export const home = {
  summary: (params, config) => get(`${F}/home/summary`, params, config),
};

/* ── Reviews ──────────────────────────────────────────────────────────────── */
export const reviews = {
  list: (productId, params) => get(`${F}/product-review/list/${productId}`, params),
  store: (payload) => post(`${F}/product-review/store`, payload),
  reply: (payload) => post(`${F}/product-review/reply`, payload),
  reaction: (payload) => post(`${F}/product-review/reaction`, payload),
  mine: () => get(`${F}/reviews`),
  removeMine: (id) => del(`${F}/reviews/delete/${id}`),
};

/* ── Reels ────────────────────────────────────────────────────────────────── */
export const reels = {
  list: (params) => get(`${F}/reels`, params),
  detail: (slug) => get(`${F}/reels/${slug}`),
  view: (id) => post(`${F}/reels/${id}/view`),
  like: (id) => post(`${F}/reels/${id}/like`),
};

/* ── Cart pricing, coupon, checkout ───────────────────────────────────────── */
export const checkout = {
  price: (cart) => post(`${F}/cart/price`, { cart }),
  applyCoupon: (payload) => post(`${F}/coupon/apply`, payload),
  sendOtp: (phone) => post(`${F}/checkout/otp/send`, { phone }),
  verifyOtp: (payload) => post(`${F}/checkout/otp/verify`, payload),
  /** Raw envelope: needs `message` + `data.payment_url` together. */
  place: (payload) => postRaw(`${F}/checkout`, payload),
  trackOrder: (uniqueCode) => post(`${F}/orders/track`, { unique_code: uniqueCode }),
};

/* ── Customer area ────────────────────────────────────────────────────────── */
export const account = {
  dashboard: () => get(`${F}/dashboard`),
  orders: (params) => get(`${F}/orders`, params),
  orderDetails: (id) => get(`${F}/orders/details/${id}`),
  deleteOrder: (id) => del(`${F}/orders/delete/${id}`),
  /** Returns { download_url } — an unauthenticated, directly linkable URL. */
  orderDownload: (id) => get(`${F}/orders/download/${id}`),
  wishlist: () => get(`${F}/wishlist`),
  addWishlist: (productId) => post(`${F}/wishlist/store`, { product_id: productId }),
  removeWishlist: (id) => del(`${F}/wishlist/delete/${id}`),
};

export { API_BASE };
