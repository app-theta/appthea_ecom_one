import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart, qtyOf } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';
import { useBusiness } from '../../context/BusinessContext';
import { money } from '../../utils/format';
import { Img, Stepper, Empty } from '../ui/Ui';

export default function CartDrawer() {
  const { items, subtotal, drawerOpen, closeDrawer, setQty, remove } = useCart();
  const { t } = useI18n();
  const { shipping } = useBusiness();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [drawerOpen, closeDrawer]);

  const remaining = Math.max(0, shipping.freeAbove - subtotal);
  const progress = shipping.freeAbove > 0 ? Math.min(100, (subtotal / shipping.freeAbove) * 100) : 0;

  return (
    <>
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          background: 'rgba(18,32,60,.42)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity .25s ease',
        }}
      />
      <aside
        aria-label={t('cart.title')}
        aria-hidden={!drawerOpen}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1060,
          width: 'min(420px, 100vw)', display: 'flex', flexDirection: 'column',
          background: 'var(--bg)', boxShadow: 'var(--shadow-lg)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <header
          className="d-flex align-items-center justify-content-between"
          style={{ padding: 'var(--sp-5)', borderBottom: '1px solid var(--line)' }}
        >
          <h2 className="offcanvas-title m-0">{t('cart.title')}</h2>
          <button type="button" className="btn-close" onClick={closeDrawer} aria-label={t('common.close')} />
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--sp-5)' }}>
          {items.length === 0 ? (
            <Empty
              icon="bi-bag"
              title={t('cart.empty')}
              action={<Link to="/products" className="btn btn-primary btn-sm mt-2" onClick={closeDrawer}>{t('cart.keepShopping')}</Link>}
            />
          ) : (
            items.map((line) => (
              <div className="cart-line" key={line.key}>
                <div className="cart-line__media">
                  <Img src={line.meta?.image} alt={line.meta?.name || ''} label="image" />
                </div>
                <div>
                  <Link to={line.meta?.slug ? `/product/${line.meta.slug}` : '#'} onClick={closeDrawer}
                        style={{ color: 'var(--ink)', fontSize: 'var(--fs-14)' }}>
                    {line.meta?.name || `#${line.product_id ?? line.bundle_id}`}
                  </Link>
                  <LineDetail line={line} />
                  <div className="d-flex align-items-center gap-3 mt-2">
                    <Stepper value={qtyOf(line)} onChange={(q) => setQty(line.key, q)} />
                    <button type="button" className="link-quiet" onClick={() => remove(line.key)}>
                      {t('common.remove')}
                    </button>
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 'var(--fs-14)' }}>{money(line.total_price)}</div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-foot">
            {shipping.freeAbove > 0 && (
              <div className="mb-3">
                <div className="freeship-bar"><span style={{ width: `${progress}%` }} /></div>
                <small className="mute">
                  {remaining > 0 ? `${money(remaining)} ${t('cart.freeShipRemaining')}` : t('cart.freeShipEarned')}
                </small>
              </div>
            )}
            <div className="d-flex justify-content-between mb-3">
              <span className="muted">{t('cart.subtotal')}</span>
              <strong className="mono">{money(subtotal)}</strong>
            </div>
            <div className="d-grid gap-2">
              <Link to="/checkout" className="btn btn-primary btn-cta" onClick={closeDrawer}>{t('cart.checkout')}</Link>
              <Link to="/cart" className="btn btn-outline-secondary" onClick={closeDrawer}>{t('cart.viewCart')}</Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function LineDetail({ line }) {
  const { t } = useI18n();
  if (line.type === 'bundle') {
    return (
      <ul className="cart-line__sub">
        <li>{t('cart.bundle')}</li>
        {(line.meta?.items || []).map((i, n) => <li key={n}>{i}</li>)}
      </ul>
    );
  }
  if (line.type === 'combo_product') {
    return (
      <ul className="cart-line__sub">
        <li>{line.meta?.variant || t('cart.combo')}</li>
        {(line.meta?.free_items || []).map((i, n) => (
          <li key={n}>{t('cart.freeItem')}: {i}</li>
        ))}
      </ul>
    );
  }
  return line.meta?.variant ? <ul className="cart-line__sub"><li>{line.meta.variant}</li></ul> : null;
}
