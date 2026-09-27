import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../api/errors';
import SocialLogin from '../components/auth/SocialLogin';

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      await login(form);
      navigate(location.state?.from || '/account', { replace: true });
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
          <h1 className="display mb-2">{t('auth.welcome')}</h1>
          <p className="muted mb-5">{t('auth.welcomeNote')}</p>

          <form onSubmit={submit} className="d-grid gap-4">
            <div>
              <label className="opt-label" htmlFor="email">{t('checkout.email')}</label>
              <input
                id="email" type="email" autoComplete="email" required
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div>
              <div className="d-flex justify-content-between align-items-baseline">
                <label className="opt-label" htmlFor="password">{t('auth.password')}</label>
                <Link to="/forgot-password" style={{ fontSize: 'var(--fs-12)' }}>{t('auth.forgot')}</Link>
              </div>
              <input
                id="password" type="password" autoComplete="current-password" required
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary btn-cta" disabled={busy}>
              {busy ? `${t('common.loading')}…` : t('auth.signIn')}
            </button>
          </form>

          <SocialLogin onDone={() => navigate(location.state?.from || '/account', { replace: true })} />

          <p className="mute mt-5 mb-0" style={{ fontSize: 'var(--fs-14)' }}>
            {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
