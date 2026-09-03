import { Link, useParams } from 'react-router-dom';
import { account } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { Sk, ErrorState, Img } from '../../components/ui/Ui';
import { money, dateShort, statusPill } from '../../utils/format';
import { imageUrl } from '../../utils/format';

export default function OrderDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => account.orderDetails(id), [id]);

  if (loading) return <Sk h={340} />;
  if (error) return <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />;

  const o = data?.order || data || {};
  const items = Array.isArray(o.items) ? o.items : (o.order_items ?? []);

  const download = async () => {
    try {
      const res = await account.orderDownload(o.id ?? id);
      const url = res?.download_url || res?.url;
      if (url) window.location.href = url;
      else toast.error(t('common.somethingWrong'));
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <Link to="/account/orders" className="link-quiet">← {t('account.orders')}</Link>
          <h2 className="display mt-2 mb-1" style={{ fontSize: 'var(--fs-24)' }}>
            {o.unique_code || o.order_code || `#${o.id ?? id}`}
          </h2>
          <p className="mute mb-0" style={{ fontSize: 'var(--fs-13)' }}>{dateShort(o.created_at, lang)}</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className={`pill ${statusPill(o.status || o.order_status)}`}>{o.status || o.order_status || '—'}</span>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={download}>
            <i className="bi bi-download me-2" aria-hidden="true" />{t('account.invoice')}
          </button>
        </div>
      </div>

      <div className="row g-5">
        <div className="col-lg-7">
          {items.map((it, i) => (
            <div className="cart-line" key={i}>
              <div className="cart-line__media">
                <Img src={imageUrl(it.image || it.product?.thumbnail)} alt="" label="img" />
              </div>
              <div>
                <div style={{ fontSize: 'var(--fs-14)' }}>{it.product_name || it.name || it.product?.name}</div>
                <ul className="cart-line__sub">
                  {it.variant && <li>{it.variant}</li>}
                  {it.type && it.type !== 'simple' && <li>{it.type === 'bundle' ? t('cart.bundle') : t('cart.combo')}</li>}
                  <li>× {it.quantity ?? it.bundle_quantity ?? 1}</li>
                </ul>
              </div>
              <div className="mono" style={{ fontSize: 'var(--fs-14)' }}>{money(it.total_price ?? it.price)}</div>
            </div>
          ))}
        </div>

        <div className="col-lg-5">
          <div className="summary">
            <h3 className="offcanvas-title mb-4">{t('checkout.summary')}</h3>
            <div className="summary__row"><span>{t('cart.subtotal')}</span><span className="mono">{money(o.sub_total ?? o.subtotal)}</span></div>
            <div className="summary__row"><span>{t('cart.shipping')}</span><span className="mono">{money(o.shipping_charge)}</span></div>
            {Number(o.discount_amount) > 0 && (
              <div className="summary__row summary__row--save"><span>{t('cart.discount')}</span><span className="mono">− {money(o.discount_amount)}</span></div>
            )}
            <div className="summary__row summary__row--total"><span>{t('cart.total')}</span><span className="mono">{money(o.grand_total ?? o.total)}</span></div>

            <hr className="rule" style={{ marginBlock: 'var(--sp-5)' }} />

            <div className="opt-label">{t('checkout.contact')}</div>
            <p className="mb-1" style={{ fontSize: 'var(--fs-14)' }}>{o.full_name || o.customer_name}</p>
            <p className="mute mb-1" style={{ fontSize: 'var(--fs-13)' }}>{o.phone}</p>
            <p className="mute mb-3" style={{ fontSize: 'var(--fs-13)' }}>
              {[o.address, o.city, o.zip_code, o.country].filter(Boolean).join(', ')}
            </p>
            {o.payment_type && (
              <>
                <div className="opt-label">{t('checkout.payment')}</div>
                <p className="mb-0" style={{ fontSize: 'var(--fs-14)' }}>{o.payment_type}</p>
              </>
            )}
            {o.order_note && (
              <>
                <div className="opt-label mt-3">{t('checkout.note')}</div>
                <p className="mute mb-0" style={{ fontSize: 'var(--fs-13)' }}>{o.order_note}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
