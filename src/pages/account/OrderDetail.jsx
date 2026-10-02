import { Link, useParams } from 'react-router-dom';
import { account } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { useChat } from '../../context/ChatContext';
import { Sk, ErrorState, Img } from '../../components/ui/Ui';
import OrderReturns from '../../components/account/OrderReturns';
import { money, dateShort, statusPill } from '../../utils/format';
import { orderView } from '../../utils/order';

export default function OrderDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { enabled: chatEnabled, openChat } = useChat();
  const { data, loading, error, reload } = useAsync(() => account.orderDetails(id), [id]);

  // reloads (after cancel / a return) keep the page on screen
  if (loading && !data) return <Sk h={340} />;
  if (error) return <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />;

  const o = orderView(data);

  const download = async () => {
    try {
      const res = await account.orderDownload(o.id ?? id);
      const url = res?.download_url || res?.url;
      if (url) window.location.href = url;
      else toast.error(t('common.somethingWrong'));
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  const cancel = async () => {
    if (!window.confirm(t('account.confirmCancel'))) return;
    try {
      await account.cancelOrder(o.id);
      toast.success(t('account.orderCancelled'));
      reload();
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  const row = (label, value, cls = '') => (
    <div className={`summary__row ${cls}`}><span>{label}</span><span className="mono">{value}</span></div>
  );

  return (
    <>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <Link to="/account/orders" className="link-quiet">← {t('account.orders')}</Link>
          <h2 className="display mt-2 mb-1" style={{ fontSize: 'var(--fs-24)' }}>{o.number}</h2>
          <p className="mute mb-0" style={{ fontSize: 'var(--fs-13)' }}>{dateShort(o.date, lang)}</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className={`pill ${statusPill(o.status)}`}>{o.status || '—'}</span>
          {o.paidStatus && <span className={`pill ${statusPill(o.paidStatus)}`}>{o.paidStatus}</span>}
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={download}>
            <i className="bi bi-download me-2" aria-hidden="true" />{t('account.invoice')}
          </button>
          {o.canCancel && (
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancel}>
              <i className="bi bi-x-circle me-2" aria-hidden="true" />{t('account.cancelOrder')}
            </button>
          )}
          {chatEnabled && (
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => openChat({ order: { id: o.id, invoice_no: o.number } })}>
              <i className="bi bi-chat-dots me-2" aria-hidden="true" />{t('chat.helpOrder')}
            </button>
          )}
        </div>
      </div>

      <div className="row g-5">
        <div className="col-lg-7">
          {o.items.map((it) => (
            <div className="cart-line" key={it.id}>
              <div className="cart-line__media">
                <Img src={it.image} alt="" label="img" />
              </div>
              <div>
                <div style={{ fontSize: 'var(--fs-14)' }}>
                  {it.slug ? <Link to={`/product/${it.slug}`}>{it.name}</Link> : it.name}
                </div>
                <ul className="cart-line__sub">
                  {it.variant && <li>{it.variant}</li>}
                  <li>{money(it.unitPrice)} × {it.quantity}</li>
                </ul>
              </div>
              <div className="mono" style={{ fontSize: 'var(--fs-14)' }}>{money(it.total)}</div>
            </div>
          ))}

          {(o.canRequestReturn || o.returned > 0) && <OrderReturns orderId={o.id} onChanged={reload} />}

          {o.activities.length > 0 && (
            <section className="mt-5">
              <h3 className="offcanvas-title mb-3">{t('account.timeline')}</h3>
              <ul className="list-unstyled m-0">
                {o.activities.map((a, i) => (
                  <li key={`${a.status}-${i}`} className="d-flex gap-3 py-2" style={{ borderBottom: '1px solid var(--lineSoft)' }}>
                    <span className={`pill ${statusPill(a.status)}`} style={{ minWidth: 92, textAlign: 'center' }}>{a.status}</span>
                    <span className="mute" style={{ fontSize: 'var(--fs-13)' }}>
                      {dateShort(a.date_time, lang)}{a.note && ` · ${a.note}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="col-lg-5">
          <div className="summary">
            <h3 className="offcanvas-title mb-4">{t('checkout.summary')}</h3>
            {row(t('cart.subtotal'), money(o.subTotal))}
            {row(t('cart.shipping'), money(o.shipping))}
            {o.discount > 0 && row(t('cart.discount'), `− ${money(o.discount)}`, 'summary__row--save')}
            {o.couponDiscount > 0 && row(t('cart.coupon'), `− ${money(o.couponDiscount)}`, 'summary__row--save')}
            {row(t('cart.total'), money(o.total), 'summary__row--total')}
            {o.returned > 0 && row(t('account.returned'), `− ${money(o.returned)}`)}
            {row(t('account.paid'), money(o.paid))}
            {o.due > 0 && row(t('account.due'), money(o.due))}

            <hr className="rule" style={{ marginBlock: 'var(--sp-5)' }} />

            <div className="opt-label">{t('checkout.contact')}</div>
            <p className="mb-1" style={{ fontSize: 'var(--fs-14)' }}>{o.address.name}</p>
            <p className="mute mb-1" style={{ fontSize: 'var(--fs-13)' }}>{o.address.phone}</p>
            <p className="mute mb-3" style={{ fontSize: 'var(--fs-13)' }}>{o.address.line}</p>
            {o.paymentType && (
              <>
                <div className="opt-label">{t('checkout.payment')}</div>
                <p className="mb-0" style={{ fontSize: 'var(--fs-14)' }}>{o.paymentType}</p>
              </>
            )}
            {o.note && (
              <>
                <div className="opt-label mt-3">{t('checkout.note')}</div>
                <p className="mute mb-0" style={{ fontSize: 'var(--fs-13)' }}>{o.note}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
