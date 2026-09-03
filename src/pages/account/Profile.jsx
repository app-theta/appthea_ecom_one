import { useEffect, useState } from 'react';
import { auth as authApi } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useBusiness } from '../../context/BusinessContext';
import { useToast } from '../../context/ToastContext';

export default function Profile() {
  const { t } = useI18n();
  const { customer, refresh } = useAuth();
  const { features } = useBusiness();
  const toast = useToast();

  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', address: '', city: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  const [contactType, setContactType] = useState('email');
  const [contactValue, setContactValue] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
    });
  }, [customer]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      await authApi.updateProfile(form);
      await refresh();
      toast.success(t('account.saved'));
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);
      toast.error(parsed.message);
    } finally { setBusy(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwBusy(true); setPwErrors({});
    try {
      await authApi.changePassword(pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      toast.success(t('account.saved'));
    } catch (err) {
      const parsed = parseApiError(err);
      setPwErrors(parsed.fields);
      toast.error(parsed.message);
    } finally { setPwBusy(false); }
  };

  const sendContactOtp = async () => {
    try {
      await authApi.sendOtp(contactType);
      setOtpSent(true);
      toast.info(t('checkout.otpSend'));
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  const confirmContact = async (e) => {
    e.preventDefault();
    try {
      await authApi.changeContact({ type: contactType, otp_code: otp, [contactType]: contactValue });
      await refresh();
      setOtp(''); setOtpSent(false); setContactValue('');
      toast.success(t('account.saved'));
    } catch (err) { toast.error(parseApiError(err).message); }
  };

  const showContact = features.email_verification || features.phone_verification;

  return (
    <div className="d-grid gap-5" style={{ maxWidth: 620 }}>
      <section>
        <h2 className="offcanvas-title mb-4">{t('account.profile')}</h2>
        <form onSubmit={save} className="row g-3">
          {[
            ['first_name', t('auth.firstName'), 'col-md-6'],
            ['last_name', t('auth.lastName'), 'col-md-6'],
            ['phone', t('checkout.phone'), 'col-md-6'],
            ['city', t('checkout.city'), 'col-md-6'],
            ['address', t('checkout.address'), 'col-12'],
          ].map(([key, label, col]) => (
            <div className={col} key={key}>
              <label className="opt-label" htmlFor={key}>{label}</label>
              <input
                id={key}
                className={`form-control ${errors[key] ? 'is-invalid' : ''}`}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
              {errors[key] && <div className="field-error">{errors[key]}</div>}
            </div>
          ))}
          <div className="col-12">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? '…' : t('common.save')}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="offcanvas-title mb-4">{t('account.changePassword')}</h2>
        <form onSubmit={changePassword} className="row g-3">
          {[
            ['current_password', t('account.currentPassword')],
            ['password', t('account.newPassword')],
            ['password_confirmation', t('auth.passwordConfirm')],
          ].map(([key, label]) => (
            <div className="col-md-6" key={key}>
              <label className="opt-label" htmlFor={key}>{label}</label>
              <input
                id={key}
                type="password"
                autoComplete={key === 'current_password' ? 'current-password' : 'new-password'}
                className={`form-control ${pwErrors[key] ? 'is-invalid' : ''}`}
                value={pw[key]}
                onChange={(e) => setPw({ ...pw, [key]: e.target.value })}
              />
              {pwErrors[key] && <div className="field-error">{pwErrors[key]}</div>}
            </div>
          ))}
          <div className="col-12">
            <button type="submit" className="btn btn-outline-primary" disabled={pwBusy}>
              {pwBusy ? '…' : t('account.changePassword')}
            </button>
          </div>
        </form>
      </section>

      {showContact && (
        <section>
          <h2 className="offcanvas-title mb-4">
            {contactType === 'email' ? t('checkout.email') : t('checkout.phone')}
          </h2>
          <div className="chip-row mb-3">
            {features.email_verification && (
              <button type="button" className="chip" aria-pressed={contactType === 'email'} onClick={() => setContactType('email')}>
                {t('checkout.email')}
              </button>
            )}
            {features.phone_verification && (
              <button type="button" className="chip" aria-pressed={contactType === 'phone'} onClick={() => setContactType('phone')}>
                {t('checkout.phone')}
              </button>
            )}
          </div>

          <form onSubmit={confirmContact} className="row g-3">
            <div className="col-md-6">
              <label className="opt-label" htmlFor="contact-new">
                {contactType === 'email' ? t('checkout.email') : t('checkout.phone')}
              </label>
              <input
                id="contact-new"
                className="form-control"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                type={contactType === 'email' ? 'email' : 'tel'}
              />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button type="button" className="btn btn-outline-secondary w-100" onClick={sendContactOtp}>
                {t('checkout.otpSend')}
              </button>
            </div>
            {otpSent && (
              <>
                <div className="col-md-6">
                  <label className="opt-label" htmlFor="contact-otp">OTP</label>
                  <input
                    id="contact-otp"
                    className="form-control mono"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                  />
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary w-100">{t('checkout.otpVerify')}</button>
                </div>
              </>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
