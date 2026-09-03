import { NavLink } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';
import { useCart } from '../../context/CartContext';
import { useBusiness } from '../../context/BusinessContext';
import { useWishlist } from '../../context/WishlistContext';

export default function MobileNav() {
  const { t } = useI18n();
  const { count, openDrawer } = useCart();
  const { features } = useBusiness();
  const wishlist = useWishlist();
  const cls = ({ isActive }) => (isActive ? 'is-active' : '');

  return (
    <nav className="bottom-nav" aria-label={t('nav.menu')}>
      <NavLink to="/" className={cls} end>
        <i className="bi bi-house" aria-hidden="true" />
        <span>{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/products" className={cls}>
        <i className="bi bi-grid" aria-hidden="true" />
        <span>{t('nav.shop')}</span>
      </NavLink>
      <NavLink to="/reels" className={cls}>
        <i className="bi bi-play-btn" aria-hidden="true" />
        <span>{t('nav.reels')}</span>
      </NavLink>
      {features.user_wishlist ? (
        <NavLink to="/account/wishlist" className={cls}>
          <i className="bi bi-heart" aria-hidden="true" />
          {wishlist.count > 0 && <span className="icon-btn__count">{wishlist.count}</span>}
          <span>{t('nav.wishlist')}</span>
        </NavLink>
      ) : (
        <NavLink to="/account" className={cls}>
          <i className="bi bi-person" aria-hidden="true" />
          <span>{t('nav.account')}</span>
        </NavLink>
      )}
      <button type="button" onClick={openDrawer}>
        <i className="bi bi-bag" aria-hidden="true" />
        {count > 0 && <span className="icon-btn__count">{count}</span>}
        <span>{t('nav.cart')}</span>
      </button>
    </nav>
  );
}
