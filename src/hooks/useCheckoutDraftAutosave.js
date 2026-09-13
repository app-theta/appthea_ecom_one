import { useCallback, useEffect, useRef } from 'react';
import { checkout as checkoutApi } from '../api/endpoints';

const GUEST_ID_KEY = 'guest_id';
const DEBOUNCE_MS = 800;

function getGuestId() {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Silently persists an in-progress guest checkout (contact info + cart
 * snapshot) so the store can follow up on abandoned orders. Skipped entirely
 * for logged-in users, and skipped entirely when the tenant has the
 * `draft_orders` business feature flag turned off. `getCartPayload` should
 * return the same `{ cart, grandTotal }` shape used for the real checkout
 * submit.
 */
export function useCheckoutDraftAutosave({ isLoggedIn, enabled, getCartPayload }) {
  const timerRef = useRef(null);
  const isLoggedInRef = useRef(isLoggedIn);
  const enabledRef = useRef(enabled);
  const getCartPayloadRef = useRef(getCartPayload);

  useEffect(() => { isLoggedInRef.current = isLoggedIn; }, [isLoggedIn]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { getCartPayloadRef.current = getCartPayload; }, [getCartPayload]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const saveDraft = useCallback((formValues) => {
    if (isLoggedInRef.current || !enabledRef.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (isLoggedInRef.current || !enabledRef.current) return;
      const { cart, grandTotal } = getCartPayloadRef.current();
      try {
        await checkoutApi.saveDraft({
          guest_id: getGuestId(),
          full_name: formValues.full_name,
          phone: formValues.phone,
          email: formValues.email,
          address: formValues.address,
          city: formValues.city,
          country: formValues.country,
          cart,
          grand_total: grandTotal,
        });
      } catch (e) {
        console.error('Checkout draft autosave failed', e);
      }
    }, DEBOUNCE_MS);
  }, []);

  return { saveDraft };
}

export default useCheckoutDraftAutosave;
