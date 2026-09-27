import { useState } from 'react';
import { content } from '../api/endpoints';
import { parseApiError } from '../api/errors';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useBusiness } from '../context/BusinessContext';
import { Crumbs } from '../components/layout/Layout';

const BLANK = { name: '', email: '', phone: '', subject: '', message: '', website: '' };

export default function Contact() {
  const { t } = useI18n();
  const toast = useToast();
  const { info } = useBusiness();
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await content.contact(form);
      setSent(true);
      setForm(BLANK);
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);
      toast.error(parsed.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div>
      <label className="opt-label" htmlFor={`c-${name}`}>{label}</label>
      <input
        id={`c-${name}`}
        className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
        value={form[name]}
        onChange={set(name)}
        {...props}
      />
      {errors[name] && <div className="field-error">{errors[name]}</div>}
    </div>
  );

  return (
    <>
      <Crumbs trail={[{ label: t('contact.title') }]} />
      <div className="shell section">
        <div className="row g-5">
          <div className="col-lg-5">
            <h1 className="display mb-3">{t('contact.title')}</h1>
            <p className="muted mb-5">{t('contact.intro')}</p>
            {info?.address && (
              <p className="mb-2"><i className="bi bi-geo-alt me-2" aria-hidden="true" />{[info.address, info.area, info.city].filter(Boolean).join(', ')}</p>
            )}
            {info?.phone && (
              <p className="mb-2"><i className="bi bi-telephone me-2" aria-hidden="true" /><a href={`tel:${info.phone}`}>{info.phone}</a></p>
            )}
            {info?.email && (
              <p className="mb-2"><i className="bi bi-envelope me-2" aria-hidden="true" /><a href={`mailto:${info.email}`}>{info.email}</a></p>
            )}
          </div>

          <div className="col-lg-7">
            {sent ? (
              <div className="card-plain p-5 text-center">
                <i className="bi bi-check2-circle" style={{ fontSize: 40, color: 'var(--pink)' }} aria-hidden="true" />
                <h2 className="offcanvas-title mt-3">{t('contact.sentTitle')}</h2>
                <p className="muted mb-4">{t('contact.sentBody')}</p>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSent(false)}>{t('contact.another')}</button>
              </div>
            ) : (
              <form onSubmit={submit} className="d-grid gap-4" noValidate>
                <div className="row g-4">
                  <div className="col-md-6">{field('name', t('contact.name'), { required: true, maxLength: 191, autoComplete: 'name' })}</div>
                  <div className="col-md-6">{field('email', t('checkout.email'), { type: 'email', required: true, maxLength: 191, autoComplete: 'email' })}</div>
                  <div className="col-md-6">{field('phone', t('contact.phone'), { type: 'tel', maxLength: 30, autoComplete: 'tel' })}</div>
                  <div className="col-md-6">{field('subject', t('contact.subject'), { maxLength: 191 })}</div>
                </div>
                <div>
                  <label className="opt-label" htmlFor="c-message">{t('contact.message')}</label>
                  <textarea
                    id="c-message" rows={6} required maxLength={2000}
                    className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                    value={form.message}
                    onChange={set('message')}
                  />
                  {errors.message && <div className="field-error">{errors.message}</div>}
                </div>
                {/* honeypot: people never see or fill it, bots do - the API then refuses the message */}
                <input className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={form.website} onChange={set('website')} />
                <div>
                  <button type="submit" className="btn btn-primary btn-cta" disabled={busy}>
                    {busy ? `${t('common.loading')}…` : t('contact.send')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
