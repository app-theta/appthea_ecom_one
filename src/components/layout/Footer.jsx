import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useBusiness } from '../../context/BusinessContext';

export default function Footer() {
  const { t } = useI18n();
  const { info, categories } = useBusiness();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const policies = Array.isArray(info?.policy_pages) ? info.policy_pages : [];
  const socials = normalizeSocials(info?.social_links || info?.socials);

  return (
    <footer className="footer">
      <div className="shell section">
        <div className="row g-5">
          <div className="col-12 col-lg-4">
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
              {policies.map((p) => (
                <li key={p.slug || p.id}><Link to={`/page/${p.slug}`}>{p.title || p.name}</Link></li>
              ))}
            </ul>
          </div>

          <div className="col-12 col-lg-4">
            <h4>{t('home.newsletterCta')}</h4>
            <p className="mb-3" style={{ maxWidth: '34ch' }}>{t('home.newsletterBody')}</p>
            {done ? (
              <p className="mb-0" style={{ color: '#fff' }}>{t('home.subscribed')}</p>
            ) : (
              <form
                className="d-flex gap-2"
                onSubmit={(e) => { e.preventDefault(); if (email.includes('@')) setDone(true); }}
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
                <button type="submit" className="btn btn-primary">{t('home.newsletterCta')}</button>
              </form>
            )}
          </div>
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

const ICONS = {
  facebook: 'bi-facebook', instagram: 'bi-instagram', youtube: 'bi-youtube',
  twitter: 'bi-twitter-x', x: 'bi-twitter-x', tiktok: 'bi-tiktok',
  linkedin: 'bi-linkedin', whatsapp: 'bi-whatsapp', pinterest: 'bi-pinterest',
};

function normalizeSocials(source) {
  if (!source) return [];
  const entries = Array.isArray(source)
    ? source.map((s) => [s.name || s.type || s.platform, s.url || s.link])
    : Object.entries(source);
  return entries
    .filter(([, url]) => typeof url === 'string' && url.startsWith('http'))
    .map(([name, url]) => ({
      name: String(name),
      url,
      icon: ICONS[String(name).toLowerCase().replace(/_link|_url/g, '')] || 'bi-link-45deg',
    }));
}
