import { Link } from 'react-router-dom';
import { useCart, qtyOf } from '../context/CartContext';
import { useI18n } from '../context/I18nContext';
import { useBusiness } from '../context/BusinessContext';
import { Img, Stepper, Empty } from '../components/ui/Ui';
import { LineDetail } from '../components/cart/CartDrawer';
import { Crumbs } from '../components/layout/Layout';
import { money } from '../utils/format';

export default function Cart() {
  const { items, subtotal, setQty, remove } = useCart();
  const { t } = useI18n();
  const { shipping } = useBusiness();

  if (!items.length) {
    return (
      <div className="shell section">
        <Empty
          icon="bi-bag"
          title={t('cart.empty')}
          action={<Link to="/products" className="btn btn-primary mt-2">{t('cart.keepShopping')}</Link>}
        />
      </div>
    );
  }

  const remaining = Math.max(0, shipping.freeAbove - subtotal);

  return (
    <>
      <Crumbs trail={[{ label: t('cart.title') }]} />
      <div className="shell" style={{ paddingBlock: 'var(--sp-6) var(--sp-16)' }}>
        <h1 className="display mb-5">{t('cart.title')}</h1>

        <div className="row g-5">
          <div className="col-lg-8">
            {items.map((line) => (
              <div className="cart-line" key={line.key} style={{ gridTemplateColumns: '110px 1fr auto' }}>
                <div className="cart-line__media">
                  <Img src={line.meta?.image} alt={line.meta?.name || ''} label="image" />
                </div>
                <div>
                  <Link
                    to={line.meta?.slug ? `/product/${line.meta.slug}` : '#'}
                    style={{ color: 'var(--ink)', fontSize: 'var(--fs-16)' }}
                  >
                    {line.meta?.name || `#${line.product_id ?? line.bundle_id}`}
                  </Link>
                  <LineDetail line={line} />
                  <div className="d-flex align-items-center gap-4 mt-3">
                    <Stepper value={qtyOf(line)} onChange={(q) => setQty(line.key, q)} />
                    <button type="button" className="link-quiet" onClick={() => remove(line.key)}>
                      {t('common.remove')}
                    </button>
                  </div>
                </div>
                <div className="text-end">
                  <div className="mono" style={{ fontSize: 'var(--fs-16)' }}>{money(line.total_price)}</div>
                  {qtyOf(line) > 1 && (
                    <small className="mute mono">{money(Number(line.total_price) / qtyOf(line))} ea.</small>
                  )}
                </div>
              </div>
            ))}

            <Link to="/products" className="btn btn-outline-secondary btn-sm mt-4">
              <i className="bi bi-arrow-left me-2" aria-hidden="true" />{t('cart.keepShopping')}
            </Link>
          </div>

          <div className="col-lg-4">
            <div className="summary">
              <h2 className="offcanvas-title mb-4">{t('checkout.summary')}</h2>
              <div className="summary__row">
                <span>{t('cart.subtotal')}</span>
                <span className="mono">{money(subtotal)}</span>
              </div>
              <div className="summary__row">
                <span>{t('cart.shipping')}</span>
                <span className="mono">
                  {remaining === 0 && shipping.freeAbove > 0 ? t('common.free') : `${t('checkout.insideCity')} ${money(shipping.inside)}`}
                </span>
              </div>
              <div className="summary__row summary__row--total">
                <span>{t('cart.total')}</span>
                <span className="mono">{money(subtotal)}</span>
              </div>
              <p className="mute mt-2 mb-4" style={{ fontSize: 'var(--fs-12)' }}>
                {t('cart.shipping')} — {t('checkout.shippingArea')} @ {t('checkout.title')}
              </p>
              <Link to="/checkout" className="btn btn-primary btn-cta w-100">{t('cart.checkout')}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
