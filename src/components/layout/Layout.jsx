import { Link, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import CartDrawer from '../cart/CartDrawer';
import NewsletterPopup from '../home/NewsletterPopup';
import { useBusiness } from '../../context/BusinessContext';

export default function Layout({ children }) {
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
