import { Link, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import CartDrawer from '../cart/CartDrawer';
import NewsletterPopup from '../home/NewsletterPopup';
import { useBusiness } from '../../context/BusinessContext';
import { useI18n } from '../../context/I18nContext';

export default function Layout({ children }) {
  const { closed } = useBusiness();
  const { t } = useI18n();

  // the API answered 423 - the shop is switched off or its subscription ended
  if (closed) {
    return (
      <main id="main" className="shell section">
        <div className="empty">
          <i className="bi bi-shop" style={{ fontSize: 40 }} aria-hidden="true" />
          <h1 className="display m-0">{t('store.closedTitle')}</h1>
          <p className="muted m-0">{t('store.closedBody')}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileNav />
      <CartDrawer />
      <NewsletterPopup />
    </>
  );
}

/** Breadcrumbs render only when the tenant enabled them (features.show_breedcrumb). */
export function Crumbs({ trail = [] }) {
  const { features } = useBusiness();
  const { pathname } = useLocation();
  if (!features.show_breedcrumb || pathname === '/') return null;
  return (
    <nav className="shell" aria-label="Breadcrumb">
      <div className="crumbs">
        <Link to="/">Home</Link>
        {trail.map((c, i) => (
          <span key={`${c.label}-${i}`} className="d-inline-flex align-items-center gap-2">
            <i className="bi bi-chevron-right" aria-hidden="true" />
            {c.to && i < trail.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
          </span>
        ))}
      </div>
    </nav>
  );
}
