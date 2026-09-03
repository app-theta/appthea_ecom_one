import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { basic } from '../api/endpoints';

const BusinessContext = createContext(null);

/** Feature flags default to false so the UI never shows something the tenant disabled. */
const EMPTY_FEATURES = {
  is_coupon: false,
  enable_customer_point_commission: false,
  email_verification: false,
  phone_verification: false,
  newsletter_popup: false,
  open_cart: false,
  show_breedcrumb: false,
  user_wishlist: false,
  facebook_status: false,
  google_status: false,
  live_notification: false,
  enable_meta_seo: false,
  facebook_pixel_status: false,
};

export function BusinessProvider({ children }) {
  const [info, setInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colours, setColours] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const bundle = await basic.all(undefined, { signal: controller.signal });
        if (!alive) return;
        // a failed sub-call degrades to [] server-side (still truthy) - only a
        // real business record has an id, so that's what "success" means here
        const businessInfo = bundle?.business?.id ? bundle.business : null;
        setInfo(businessInfo);
        setCategories(asList(bundle?.categoryLists));
        setBrands(asList(bundle?.brandLists));
        setColours(asList(bundle?.colourLists));
        setSliders(asList(bundle?.sliderLists));
        setError(businessInfo ? null : 'business/info unavailable');
      } catch {
        if (alive) setError('business/info unavailable');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; controller.abort(); };
  }, []);

  useEffect(() => {
    if (info?.name) document.title = info.name;
  }, [info?.name]);

  const value = useMemo(() => {
    const features = { ...EMPTY_FEATURES, ...(info?.features || {}) };
    const shipping = info?.shipping || {};
    const paymentMethods = info?.payment_methods || {};
    return {
      info,
      features,
      shipping: {
        inside: Number(shipping.inside_city_charge_amount ?? 0),
        outside: Number(shipping.outside_city_charge_amount ?? 0),
        freeAbove: Number(shipping.max_shipping_charge_free_amount ?? 0),
      },
      paymentMethods,
      enabledPayments: Object.entries(PAYMENT_MAP)
        .filter(([flag]) => truthy(paymentMethods[flag]))
        .map(([, type]) => type),
      categories,
      brands,
      colours,
      sliders,
      loading,
      error,
    };
  }, [info, categories, brands, colours, sliders, loading, error]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

/** business/info flag → the `payment_type` string the checkout endpoint expects. */
export const PAYMENT_MAP = {
  cash_on_delivery: 'Cash On Delivery',
  bkash_status: 'Bkash',
  nagad_status: 'Nagad',
  sslcommerz_status: 'SSL',
  aamarpay_status: 'AamarPay',
  stripe_status: 'Stripe',
  paypal_status: 'Paypal',
};

function truthy(v) {
  return v === true || v === 1 || v === '1' || v === 'Yes' || v === 'active';
}

function asList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used inside BusinessProvider');
  return ctx;
}
