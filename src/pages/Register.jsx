import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../api/errors';

const BLANK = {
  first_name: '', last_name: '', phone: '', email: '', password: '', password_confirmation: '',
};

export default function Register() {
  const { t } = useI18n();
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      await register(form);
      navigate('/account', { replace: true });
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);
      toast.error(parsed.message);
    } finally { setBusy(false); }
  };

  const fields = [
    ['first_name', t('auth.firstName'), 'text', 'given-name', 'col-md-6'],
    ['last_name', t('auth.lastName'), 'text', 'family-name', 'col-md-6'],
    ['phone', t('checkout.phone'), 'tel', 'tel', 'col-md-6'],
    ['email', t('checkout.email'), 'email', 'email', 'col-md-6'],
    ['password', t('auth.password'), 'password', 'new-password', 'col-md-6'],
    ['password_confirmation', t('auth.passwordConfirm'), 'password', 'new-password', 'col-md-6'],
  ];

  return (
    <div className="shell section">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <p className="eyebrow">{t('nav.account')}</p>
          <h1 className="display mb-2">{t('auth.register')}</h1>
          <p className="muted mb-5">{t('auth.joinNote')}</p>

          <form onSubmit={submit}>
            <div className="row g-3">
              {fields.map(([key, label, type, ac, col]) => (
                <div className={col} key={key}>
                  <label className="opt-label" htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type={type}
                    autoComplete={ac}
                    required
                    className={`form-control ${errors[key] ? 'is-invalid' : ''}`}
                    value={form[key]}
                    onChange={set(key)}
                  />
                  {errors[key] && <div className="field-error">{errors[key]}</div>}
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary btn-cta w-100 mt-4" disabled={busy}>
              {busy ? `${t('common.loading')}…` : t('auth.register')}
            </button>
          </form>

          <p className="mute mt-5 mb-0" style={{ fontSize: 'var(--fs-14)' }}>
            {t('auth.haveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
