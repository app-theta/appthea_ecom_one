import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

/** Landing page for both COD success and gateway return: /order/success?order=CODE&message=… */
export default function OrderSuccess() {
  const [params] = useSearchParams();
  const { t } = useI18n();
  const { clear, items } = useCart();
  const { isAuthed } = useAuth();
  const code = params.get('order') || '';
  const message = params.get('message') || '';

  /* A gateway return means the order went through — the local cart is stale. */
  useEffect(() => { if (items.length) clear(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="shell section">
      <div className="mx-auto text-center" style={{ maxWidth: 520 }}>
        <div
          className="mx-auto mb-4"
          style={{
            width: 64, height: 64, display: 'grid', placeItems: 'center', borderRadius: '50%',
            background: 'var(--bgTint)', color: 'var(--wine)', fontSize: 'var(--fs-28)',
          }}
        >
          <i className="bi bi-check2" aria-hidden="true" />
        </div>
        <h1 className="display mb-3">{t('order.successTitle')}</h1>
        <p className="muted">{message || t('order.successBody')}</p>

        {code && (
          <div className="card-plain p-4 my-4 d-flex align-items-center justify-content-between">
            <span className="opt-label mb-0">{t('order.number')}</span>
            <strong className="mono" style={{ fontSize: 'var(--fs-18)' }}>{code}</strong>
          </div>
        )}

        <div className="d-grid gap-2 d-sm-flex justify-content-center mt-4">
          {isAuthed
            ? <Link to="/account/orders" className="btn btn-primary btn-cta">{t('order.viewOrders')}</Link>
            : <Link to={`/track${code ? `?order=${encodeURIComponent(code)}` : ''}`} className="btn btn-primary btn-cta">{t('order.trackCta')}</Link>}
          <Link to="/products" className="btn btn-outline-secondary btn-cta">{t('cart.keepShopping')}</Link>
        </div>
      </div>
    </div>
  );
}
