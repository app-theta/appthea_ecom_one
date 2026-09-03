import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { auth as authApi } from '../api/endpoints';
import { parseApiError } from '../api/errors';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';

/** Both forgot-password and reset-password live here; a `token` query param
    switches to the reset form (the mailed link carries token + email). */
export default function ForgotPassword() {
  const { t } = useI18n();
  const toast = useToast();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      if (token) {
        await authApi.resetPassword({ token, email, password, password_confirmation: confirm });
        toast.success(t('account.saved'));
        setSent(true);
      } else {
        await authApi.forgotPassword({ email });
        setSent(true);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);
      toast.error(parsed.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="shell section">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <p className="eyebrow">{t('nav.account')}</p>
          <h1 className="display mb-4">{token ? t('auth.resetTitle') : t('auth.forgot')}</h1>

          {sent && !token ? (
            <>
              <p className="muted">{t('auth.resetSent')}</p>
              <Link to="/login" className="btn btn-outline-secondary mt-2">{t('auth.signIn')}</Link>
            </>
          ) : sent && token ? (
            <>
              <p className="muted">{t('account.saved')}</p>
              <Link to="/login" className="btn btn-primary mt-2">{t('auth.signIn')}</Link>
            </>
          ) : (
            <form onSubmit={submit} className="d-grid gap-4">
              <div>
                <label className="opt-label" htmlFor="email">{t('checkout.email')}</label>
                <input
                  id="email" type="email" required autoComplete="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>

              {token && (
                <>
                  <div>
                    <label className="opt-label" htmlFor="password">{t('account.newPassword')}</label>
                    <input
                      id="password" type="password" required autoComplete="new-password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {errors.password && <div className="field-error">{errors.password}</div>}
                  </div>
                  <div>
                    <label className="opt-label" htmlFor="confirm">{t('auth.passwordConfirm')}</label>
                    <input
                      id="confirm" type="password" required autoComplete="new-password"
                      className="form-control"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary btn-cta" disabled={busy}>
                {busy ? `${t('common.loading')}…` : token ? t('auth.resetTitle') : t('common.continue')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
