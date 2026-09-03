import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';
import { useBusiness } from '../../context/BusinessContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const { info, categories, features } = useBusiness();
  const { count, openDrawer } = useCart();
  const { isAuthed, customer } = useAuth();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/products?keyword=${encodeURIComponent(q.trim())}` : '/products');
  };

  const topCategories = categories.slice(0, 7);

  return (
    <>
      <div className="topbar">
        <div className="shell">
          <span>{info?.address || info?.tagline || ''}</span>
          <div className="d-flex align-items-center gap-3">
            <Link to="/track">{t('nav.track')}</Link>
            <div className="lang-toggle" role="group" aria-label="Language">
              <button type="button" aria-pressed={lang === 'bn'} onClick={() => setLang('bn')}>বাংলা</button>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>
        </div>
      </div>

      <header className="header">
        <div className="shell">
          <div className="header__row">
            <Link to="/" className="logo">
              {info?.logo ? <img src={info.logo} alt={info?.name || 'Home'} /> : (info?.name || 'Atelier')}
            </Link>

            <form className="search d-none d-md-block" onSubmit={submit} role="search">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('nav.search')}
                aria-label={t('nav.search')}
              />
              <button type="submit" aria-label={t('nav.search')}>
                <i className="bi bi-search" aria-hidden="true" />
              </button>
            </form>

            <div className="header__tools">
              <Link to="/products" className="icon-btn d-md-none" aria-label={t('nav.search')}>
                <i className="bi bi-search" aria-hidden="true" />
              </Link>

              {features.user_wishlist && (
                <Link to="/account/wishlist" className="icon-btn d-none d-md-grid" aria-label={t('nav.wishlist')}>
                  <i className="bi bi-heart" aria-hidden="true" />
                  {wishlist.count > 0 && <span className="icon-btn__count">{wishlist.count}</span>}
                </Link>
              )}

              <div className="position-relative d-none d-md-block" ref={menuRef}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={t('nav.account')}
                  aria-expanded={menuOpen}
                >
                  <i className="bi bi-person" aria-hidden="true" />
                </button>
                {menuOpen && (
                  <div
                    className="position-absolute end-0 mt-1 p-2"
                    style={{
                      minWidth: 210, background: 'var(--bg)', border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', zIndex: 20,
                    }}
                  >
                    {isAuthed ? (
                      <div className="account-nav" onClick={() => setMenuOpen(false)}>
                        <div className="px-3 pt-2 pb-3" style={{ fontSize: 'var(--fs-13)' }}>
                          <div className="mute">{t('account.hello')}</div>
                          <div>{customer?.first_name || customer?.name || ''}</div>
                        </div>
                        <Link to="/account"><i className="bi bi-grid" />{t('account.dashboard')}</Link>
                        <Link to="/account/orders"><i className="bi bi-box-seam" />{t('account.orders')}</Link>
                        <Link to="/account/reviews"><i className="bi bi-chat-square-text" />{t('account.reviews')}</Link>
                        <Link to="/account/profile"><i className="bi bi-person-gear" />{t('account.profile')}</Link>
                      </div>
                    ) : (
                      <div className="p-2 d-grid gap-2">
                        <Link to="/login" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                          {t('auth.signIn')}
                        </Link>
                        <Link to="/register" className="btn btn-outline-secondary btn-sm" onClick={() => setMenuOpen(false)}>
                          {t('auth.register')}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button type="button" className="icon-btn" onClick={openDrawer} aria-label={t('nav.cart')}>
                <i className="bi bi-bag" aria-hidden="true" />
                {count > 0 && <span className="icon-btn__count">{count}</span>}
              </button>
            </div>
          </div>
        </div>

        <nav className="nav-main d-none d-lg-block" aria-label={t('nav.menu')}>
          <div className="shell">
            <ul>
              <li><NavLink to="/" className={({ isActive }) => (isActive ? 'is-active' : '')} end>{t('nav.home')}</NavLink></li>
              <li><NavLink to="/products" className={({ isActive }) => (isActive ? 'is-active' : '')}>{t('nav.shop')}</NavLink></li>
              {topCategories.map((c) => (
                <li key={c.id}>
                  <NavLink to={`/products?category_id=${c.id}`}>{c.name}</NavLink>
                </li>
              ))}
              <li><NavLink to="/reels" className={({ isActive }) => (isActive ? 'is-active' : '')}>{t('nav.reels')}</NavLink></li>
            </ul>
          </div>
        </nav>
      </header>
    </>
  );
}
