import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useBusiness } from '../../context/BusinessContext';
import { useSubscribe } from '../../hooks/useSubscribe';

export default function Footer() {
  const { t } = useI18n();
  const { info, categories, features } = useBusiness();
  const [email, setEmail] = useState('');
  const newsletter = useSubscribe();

  const socials = normalizeSocials(info);

  return (
    <footer className="footer">
      <div className="shell section">
        <div className="row g-5">
          <div className="col-12 col-lg-3">
            <div className="footer__logo">{info?.name || 'Atelier'}</div>
            {info?.address && <p className="mt-3 mb-2" style={{ maxWidth: '32ch' }}>{info.address}</p>}
            {info?.phone && <p className="mb-1"><a href={`tel:${info.phone}`}>{info.phone}</a></p>}
            {info?.email && <p className="mb-4"><a href={`mailto:${info.email}`}>{info.email}</a></p>}
            {socials.length > 0 && (
              <div className="social">
                {socials.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer" aria-label={s.name}>
                    <i className={`bi ${s.icon}`} aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="col-6 col-lg-2">
            <h4>{t('nav.categories')}</h4>
            <ul>
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}><Link to={`/products?category_id=${c.id}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-lg-2">
            <h4>{t('nav.account')}</h4>
            <ul>
              <li><Link to="/account">{t('account.dashboard')}</Link></li>
              <li><Link to="/account/orders">{t('account.orders')}</Link></li>
              <li><Link to="/track">{t('nav.track')}</Link></li>
              <li><Link to="/privacy">{t('legal.privacy')}</Link></li>
              <li><Link to="/terms">{t('legal.terms')}</Link></li>
              <li><Link to="/shipping-policy">{t('legal.shipping')}</Link></li>
              <li><Link to="/refund-policy">{t('legal.refund')}</Link></li>
              <li><Link to="/return-policy">{t('legal.return')}</Link></li>
            </ul>
          </div>

          <div className="col-6 col-lg-2">
            <h4>{t('nav.help')}</h4>
            <ul>
              <li><Link to="/blog">{t('blog.title')}</Link></li>
              <li><Link to="/faq">{t('faq.title')}</Link></li>
              <li><Link to="/contact">{t('contact.title')}</Link></li>
            </ul>
          </div>

          {features.is_subscribe_newsletter && (
            <div className="col-12 col-lg-3">
              <h4>{t('home.newsletterCta')}</h4>
              <p className="mb-3" style={{ maxWidth: '34ch' }}>{t('home.newsletterBody')}</p>
              {newsletter.done ? (
                <p className="mb-0" style={{ color: 'var(--footerText)' }}>{t('home.subscribed')}</p>
              ) : (
                <form
                  className="d-flex gap-2"
                  onSubmit={(e) => { e.preventDefault(); newsletter.subscribe(email); }}
                >
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('home.emailPlaceholder')}
                    aria-label={t('home.emailPlaceholder')}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={newsletter.busy}>{t('home.newsletterCta')}</button>
                </form>
              )}
              {newsletter.error && <div className="field-error mt-2">{newsletter.error}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="shell">
        <div className="footer__bar">
          <span>© {new Date().getFullYear()} {info?.name || 'Atelier'}</span>
          <span>{t('nav.shop')} · {t('nav.reels')} · {t('nav.track')}</span>
        </div>
      </div>
    </footer>
  );
}

// business/info has one field per network (facebook_link, x_link, ...)
const NETWORKS = [
  ['facebook_link', 'Facebook', 'bi-facebook'],
  ['instagram_link', 'Instagram', 'bi-instagram'],
  ['youtube_link', 'YouTube', 'bi-youtube'],
  ['x_link', 'X', 'bi-twitter-x'],
  ['linkedin_link', 'LinkedIn', 'bi-linkedin'],
];

function normalizeSocials(info) {
  return NETWORKS
    .filter(([field]) => typeof info?.[field] === 'string' && info[field].startsWith('http'))
    .map(([field, name, icon]) => ({ name, url: info[field], icon }));
}
