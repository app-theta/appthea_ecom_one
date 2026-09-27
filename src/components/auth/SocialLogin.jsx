import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../api/errors';
import { loadScript } from '../../utils/loadScript';

/**
 * "Continue with Google / Facebook". The provider's own browser SDK signs the shopper in and
 * hands us a token; the backend checks that token was issued to this shop's app, then answers
 * like a normal login. business/info.social_login carries the public ids (null = switched off).
 */
export default function SocialLogin({ onDone }) {
  const { info } = useBusiness();
  const { socialLogin } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const googleBox = useRef(null);
  const [busy, setBusy] = useState(false);
  const googleId = info?.social_login?.google_client_id;
  const facebookId = info?.social_login?.facebook_app_id;

  // the SDK callbacks outlive renders - always call the latest version
  const finish = useRef();
  finish.current = async (provider, token) => {
    if (!token) return;
    setBusy(true);
    try {
      await socialLogin(provider, token);
      onDone?.();
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!googleId) return undefined;
    let alive = true;
    loadScript('https://accounts.google.com/gsi/client')
      .then(() => {
        const gsi = window.google?.accounts?.id;
        if (!alive || !gsi || !googleBox.current) return;
        gsi.initialize({ client_id: googleId, callback: (res) => finish.current('google', res.credential) });
        gsi.renderButton(googleBox.current, {
          theme: 'outline', size: 'large', text: 'continue_with', width: Math.min(googleBox.current.offsetWidth || 320, 400),
        });
      })
      .catch(() => { if (alive) toast.error(t('auth.socialUnavailable')); });
    return () => { alive = false; };
  }, [googleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!facebookId) return;
    loadScript('https://connect.facebook.net/en_US/sdk.js')
      .then(() => window.FB?.init({ appId: facebookId, cookie: false, xfbml: false, version: 'v19.0' }))
      .catch(() => {});
  }, [facebookId]);

  const facebook = () => {
    if (!window.FB) {
      toast.error(t('auth.socialUnavailable'));
      return;
    }
    window.FB.login((res) => finish.current('facebook', res?.authResponse?.accessToken), { scope: 'email,public_profile' });
  };

  if (!googleId && !facebookId) return null;

  return (
    <div className="mt-5" aria-busy={busy}>
      <div className="text-center mute mb-3" style={{ fontSize: 'var(--fs-12)' }}>{t('common.or')}</div>
      <div className="d-grid gap-2">
        {googleId && <div ref={googleBox} className="d-flex justify-content-center" style={{ minHeight: 44 }} />}
        {facebookId && (
          <button type="button" className="btn btn-outline-secondary" onClick={facebook} disabled={busy}>
            <i className="bi bi-facebook me-2" aria-hidden="true" />{t('auth.continueFacebook')}
          </button>
        )}
      </div>
    </div>
  );
}
