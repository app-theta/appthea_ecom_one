import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { checkout as checkoutApi } from '../api/endpoints';
import { parseApiError } from '../api/errors';
import { useI18n } from '../context/I18nContext';
import { money, dateShort, statusPill } from '../utils/format';

export default function TrackOrder() {
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('order') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const track = async (value) => {
    const unique = (value ?? code).trim();
    if (!unique) return;
    setBusy(true); setError(null); setOrder(null);
    try {
      const data = await checkoutApi.trackOrder(unique);
      setOrder(data?.order || data);
    } catch (e) {
      setError(parseApiError(e, t('order.notFound')).message);
    } finally { setBusy(false); }
  };

  useEffect(() => { if (params.get('order')) track(params.get('order')); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="shell section">
      <div className="mx-auto" style={{ maxWidth: 560 }}>
        <p className="eyebrow">{t('nav.track')}</p>
        <h1 className="display mb-3">{t('order.trackTitle')}</h1>
        <p className="muted">{t('order.trackBody')}</p>

        <form className="d-flex gap-2 mt-4" onSubmit={(e) => { e.preventDefault(); track(); }}>
          <input
            className="form-control"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ORD-000123"
            aria-label={t('order.number')}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? '…' : t('order.trackCta')}
          </button>
        </form>

        {error && <div className="field-error mt-3">{error}</div>}

        {order && (
          <div className="card-plain p-5 mt-5">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <div className="opt-label mb-1">{t('order.number')}</div>
                <strong className="mono" style={{ fontSize: 'var(--fs-18)' }}>
                  {order.unique_code || order.order_code || code}
                </strong>
              </div>
              <span className={`pill ${statusPill(order.status || order.order_status)}`}>
                {order.status || order.order_status || '—'}
              </span>
            </div>

            <div className="summary__row"><span>{t('account.date')}</span><span>{dateShort(order.created_at, lang)}</span></div>
            <div className="summary__row"><span>{t('account.amount')}</span><span className="mono">{money(order.grand_total ?? order.total)}</span></div>
            {order.payment_type && (
              <div className="summary__row"><span>{t('checkout.payment')}</span><span>{order.payment_type}</span></div>
            )}
            {order.shipping_area && (
              <div className="summary__row">
                <span>{t('checkout.shippingArea')}</span>
                <span>{order.shipping_area === 'inside_city' ? t('checkout.insideCity') : t('checkout.outsideCity')}</span>
              </div>
            )}

            {Array.isArray(order.items) && order.items.length > 0 && (
              <ul className="mt-4 mb-0" style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
                {order.items.map((it, i) => (
                  <li key={i} className="d-flex justify-content-between" style={{ fontSize: 'var(--fs-14)' }}>
                    <span>{it.product_name || it.name} <span className="mute">× {it.quantity}</span></span>
                    <span className="mono">{money(it.total_price ?? it.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
