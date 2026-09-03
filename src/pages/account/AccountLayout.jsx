import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useBusiness } from '../../context/BusinessContext';
import { useToast } from '../../context/ToastContext';
import { Crumbs } from '../../components/layout/Layout';

export default function AccountLayout() {
  const { t } = useI18n();
  const { customer, logout } = useAuth();
  const { features } = useBusiness();
  const toast = useToast();
  const navigate = useNavigate();
  const cls = ({ isActive }) => (isActive ? 'is-active' : '');

  const signOut = async () => {
    await logout();
    toast.info(t('auth.loggedOut'));
    navigate('/');
  };

  return (
    <>
      <Crumbs trail={[{ label: t('nav.account') }]} />
      <div className="shell" style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
        <header className="mb-5">
          <p className="eyebrow">{t('nav.account')}</p>
          <h1 className="display">
            {t('account.hello')}, {customer?.first_name || customer?.name || ''}
          </h1>
        </header>

        <div className="account">
          <nav className="account-nav" aria-label={t('nav.account')}>
            <NavLink to="/account" end className={cls}><i className="bi bi-grid" />{t('account.dashboard')}</NavLink>
            <NavLink to="/account/orders" className={cls}><i className="bi bi-box-seam" />{t('account.orders')}</NavLink>
            {features.user_wishlist && (
              <NavLink to="/account/wishlist" className={cls}><i className="bi bi-heart" />{t('account.wishlist')}</NavLink>
            )}
            <NavLink to="/account/reviews" className={cls}><i className="bi bi-chat-square-text" />{t('account.reviews')}</NavLink>
            <NavLink to="/account/profile" className={cls}><i className="bi bi-person-gear" />{t('account.profile')}</NavLink>
            <button type="button" className="account-nav-signout btn btn-link text-start p-0 mt-3" onClick={signOut}
                    style={{ color: 'var(--inkMute)', fontSize: 'var(--fs-13)', textDecoration: 'none', paddingLeft: 'var(--sp-4)' }}>
              <i className="bi bi-box-arrow-right me-2" />{t('auth.signOut')}
            </button>
          </nav>

          <div><Outlet /></div>
        </div>
      </div>
    </>
  );
}
