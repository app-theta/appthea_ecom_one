import { useState } from 'react';
import { content } from '../api/endpoints';
import { parseApiError } from '../api/errors';

/** Newsletter sign-up (footer, popup). Subscribing an address twice is not an error server-side. */
export function useSubscribe() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const subscribe = async (email) => {
    setBusy(true);
    setError('');
    try {
      await content.subscribe(email);
      setDone(true);
      return true;
    } catch (e) {
      const parsed = parseApiError(e);
      setError(parsed.fields?.email || parsed.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { subscribe, busy, done, error };
}
