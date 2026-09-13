import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { checkout as checkoutApi } from '../api/endpoints';
import { Img } from '../components/ui/Ui';
import { money, imageUrl } from '../utils/format';

/** Landing page for both COD success and gateway return: /order/success?order=CODE&message=… */
export default function OrderSuccess() {
  const [params, setParams] = useSearchParams();
  const { t } = useI18n();
  const { clear, items } = useCart();
  const { isAuthed } = useAuth();
  const toast = useToast();
  const code = params.get('order') || '';
  // Captured once on mount - the URL's `message` param is stripped right
  // after (see below) so the address bar stays a clean `?order=...`.
  const [message] = useState(() => params.get('message') || '');

  /* Full order info (items, totals, shipping address) isn't available here
     via router state - COD and gateway returns both land on this page with
     only `order` + `message` in the URL, so it's fetched from the API. */
  const { data: orderData, loading: orderLoading } = useAsync(
    () => checkoutApi.trackOrder(code),
    [code],
    { skip: !code },
  );
  const order = orderData?.order || null;
  const orderItems = Array.isArray(order?.products) ? order.products : [];
  const address = order?.shipping_address || {};

  /* A gateway return means the order went through — the local cart is stale. */
  useEffect(() => { if (items.length) clear(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Drop the noisy `message` query param from the visible URL. */
  useEffect(() => {
    if (params.get('message')) setParams(code ? { order: code } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('order.numberCopied'));
    } catch {
      toast.error(t('common.copyFailed'));
    }
  };

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
      </div>

      {code && (
        <button
          type="button"
          className="card-plain p-4 d-flex align-items-center justify-content-between mx-auto"
          onClick={copyCode}
          title={t('common.copyHint')}
          style={{
            margin: 'var(--sp-5) auto 0', maxWidth: 640, width: '100%', gap: 'var(--sp-4)',
            cursor: 'pointer', font: 'inherit', textAlign: 'left', color: 'inherit',
          }}
        >
          <span className="opt-label mb-0" style={{ flex: 'none' }}>{t('order.number')}</span>
          <strong className="mono" style={{ fontSize: 'var(--fs-18)', wordBreak: 'break-all', textAlign: 'right' }}>{code}</strong>
        </button>
      )}

      {orderLoading ? (
        <p className="text-center mt-5">{t('common.loading')}…</p>
      ) : order && (
        <div className="row g-5 mx-auto mt-5" style={{ maxWidth: 900 }}>
          <div className="col-lg-7">
            {orderItems.map((it) => (
              <div className="cart-line" key={it.id}>
                <div className="cart-line__media">
                  <Img src={imageUrl(it.product?.thumbnail)} alt="" label="img" />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--fs-14)' }}>{it.product?.name}</div>
                  <ul className="cart-line__sub">
                    <li>× {it.quantity}</li>
                  </ul>
                </div>
                <div className="mono" style={{ fontSize: 'var(--fs-14)' }}>{money(it.subtotal_price)}</div>
              </div>
            ))}
          </div>

          <div className="col-lg-5">
            <div className="summary">
              <h3 className="offcanvas-title mb-4">{t('checkout.summary')}</h3>
              <div className="summary__row"><span>{t('cart.subtotal')}</span><span className="mono">{money(order.sub_total)}</span></div>
              <div className="summary__row"><span>{t('cart.shipping')}</span><span className="mono">{money(order.shipping_charge)}</span></div>
              {Number(order.discount_amount) > 0 && (
                <div className="summary__row summary__row--save"><span>{t('cart.discount')}</span><span className="mono">− {money(order.discount_amount)}</span></div>
              )}
              <div className="summary__row summary__row--total"><span>{t('cart.total')}</span><span className="mono">{money(order.total_amount)}</span></div>

              <hr className="rule" style={{ marginBlock: 'var(--sp-5)' }} />

              <div className="opt-label">{t('checkout.contact')}</div>
              <p className="mb-1" style={{ fontSize: 'var(--fs-14)' }}>{address.name}</p>
              <p className="mute mb-1" style={{ fontSize: 'var(--fs-13)' }}>{address.phone}</p>
              <p className="mute mb-3" style={{ fontSize: 'var(--fs-13)' }}>
                {[address.address, address.city, address.zip_code, address.country].filter(Boolean).join(', ')}
              </p>
              {order.payment_type && (
                <>
                  <div className="opt-label">{t('checkout.payment')}</div>
                  <p className="mb-0" style={{ fontSize: 'var(--fs-14)' }}>{order.payment_type}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="d-grid gap-2 d-sm-flex justify-content-center mx-auto mt-5" style={{ maxWidth: 520 }}>
        {isAuthed
          ? <Link to="/account/orders" className="btn btn-primary btn-cta">{t('order.viewOrders')}</Link>
          : <Link to={`/track${code ? `?order=${encodeURIComponent(code)}` : ''}`} className="btn btn-primary btn-cta">{t('order.trackCta')}</Link>}
        <Link to="/products" className="btn btn-outline-secondary btn-cta">{t('cart.keepShopping')}</Link>
      </div>
    </div>
  );
}
