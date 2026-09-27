import { useEffect, useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useBusiness } from '../../context/BusinessContext';
import { useSubscribe } from '../../hooks/useSubscribe';

const SEEN_KEY = 'apptheta.newsletter.seen';

export default function NewsletterPopup() {
  const { t } = useI18n();
  const { features, info } = useBusiness();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const newsletter = useSubscribe();

  useEffect(() => {
    if (!features.newsletter_popup) return;
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch { /* ignore */ }
    if (seen) return;
    const id = window.setTimeout(() => setOpen(true), 6000);
    return () => window.clearTimeout(id);
  }, [features.newsletter_popup]);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('home.newsletterTitle')}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1080, display: 'grid', placeItems: 'center',
        background: 'rgba(18,32,60,.5)', padding: 'var(--sp-5)',
      }}
    >
      <div
        style={{
          width: info?.logo ? 'min(760px, 100%)' : 'min(460px, 100%)', display: 'grid',
          gridTemplateColumns: info?.logo ? '1fr 1fr' : '1fr',
          background: 'var(--bg)', borderRadius: 'var(--radiusLg)', overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {info?.logo && (
          <div className="d-none d-md-grid" style={{ minHeight: 340, placeItems: 'center', background: 'var(--bgTint)', padding: 'var(--sp-8)' }}>
            <img src={info.logo} alt={info?.name || ''} style={{ maxWidth: '80%', maxHeight: 160, objectFit: 'contain' }} />
          </div>
        )}
        <div style={{ padding: 'var(--sp-10)' }}>
          <button
            type="button"
            className="btn-close float-end"
            onClick={close}
            aria-label={t('common.close')}
          />
          <p className="eyebrow">{info?.name || 'Atelier'}</p>
          <h3 className="display mb-3" style={{ fontSize: 'var(--fs-28)' }}>{t('home.newsletterTitle')}</h3>
          <p className="muted">{t('home.newsletterBody')}</p>
          {newsletter.done ? (
            <p className="mb-0" style={{ color: 'var(--pink)' }}>{t('home.subscribed')}</p>
          ) : (
            <form
              className="d-grid gap-2 mt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await newsletter.subscribe(email)) {
                  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
                }
              }}
            >
              <input
                type="email"
                className="form-control"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('home.emailPlaceholder')}
                aria-label={t('home.emailPlaceholder')}
              />
              <button type="submit" className="btn btn-primary btn-cta" disabled={newsletter.busy}>{t('home.newsletterCta')}</button>
              {newsletter.error && <div className="field-error">{newsletter.error}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
