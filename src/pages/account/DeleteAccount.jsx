import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { account } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';

/** Closes the customer's account for good - the password and an "I understand" tick are both required. */
export default function DeleteAccount() {
  const { t } = useI18n();
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      await account.deleteAccount({ password, agree });
      toast.success(t('account.deleted'));
      // leave the account pages first, then drop the (already revoked) session
      navigate('/', { replace: true });
      logout();
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);
      if (!Object.keys(parsed.fields).length) toast.error(parsed.message);
      setBusy(false);
    }
  };

  return (
    <section style={{ maxWidth: 620 }}>
      <h2 className="offcanvas-title mb-3">{t('account.deleteTitle')}</h2>
      <p className="muted">{t('account.deleteIntro')}</p>
      <ul className="muted mb-4">
        <li>{t('account.deleteWhat1')}</li>
        <li>{t('account.deleteWhat2')}</li>
        <li>{t('account.deleteWhat3')}</li>
        <li>{t('account.deleteWhat4')}</li>
      </ul>

      <form onSubmit={submit} className="row g-3">
        <div className="col-md-8">
          <label className="opt-label" htmlFor="delete-password">{t('auth.password')}</label>
          <input
            id="delete-password"
            type="password"
            autoComplete="current-password"
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errors.password && <div className="field-error">{errors.password}</div>}
          <small className="muted d-block mt-2">
            {t('account.deleteSocial')} <Link to="/forgot-password">{t('auth.forgot')}</Link>
          </small>
        </div>
        <div className="col-12">
          <div className="form-check">
            <input id="delete-agree" type="checkbox" className={`form-check-input ${errors.agree ? 'is-invalid' : ''}`}
                   checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <label className="form-check-label" htmlFor="delete-agree">{t('account.deleteAgree')}</label>
          </div>
          {errors.agree && <div className="field-error">{errors.agree}</div>}
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-danger" disabled={busy || !agree || !password}>
            {busy ? '…' : t('account.deleteConfirm')}
          </button>
        </div>
      </form>
    </section>
  );
}
