import { Link } from 'react-router-dom';
import { account } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { Sk, ErrorState, Empty } from '../../components/ui/Ui';
import { money, dateShort, statusPill } from '../../utils/format';
import { orderView } from '../../utils/order';

export default function Orders() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => account.orders({ per_page: 20 }), []);
  const rows = (Array.isArray(data) ? data : (data?.data ?? [])).map(orderView);

  const download = async (id) => {
    try {
      const res = await account.orderDownload(id);
      const url = res?.download_url || res?.url;
      if (url) window.location.href = url;   // public URL, no auth header needed
      else toast.error(t('common.somethingWrong'));
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  const cancel = async (id) => {
    if (!window.confirm(t('account.confirmCancel'))) return;
    try {
      await account.cancelOrder(id);
      toast.success(t('account.orderCancelled'));
      reload();
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  if (loading && !data) return <Sk h={280} />;
  if (error) return <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />;
  if (!rows.length) {
    return (
      <Empty
        icon="bi-box-seam"
        title={t('account.noOrders')}
        action={<Link to="/products" className="btn btn-primary btn-sm mt-2">{t('cart.keepShopping')}</Link>}
      />
    );
  }

  return (
    <>
      <h2 className="offcanvas-title mb-4">{t('account.orders')}</h2>
      <div className="table-responsive">
        <table className="otable">
          <thead>
            <tr>
              <th>{t('account.orderId')}</th>
              <th>{t('account.date')}</th>
              <th>{t('account.status')}</th>
              <th className="text-end">{t('account.amount')}</th>
              <th className="text-end">{t('common.details')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="mono">
                  <Link to={`/account/orders/${o.id}`}>{o.number}</Link>
                </td>
                <td>{dateShort(o.date, lang)}</td>
                <td><span className={`pill ${statusPill(o.status)}`}>{o.status || '—'}</span></td>
                <td className="text-end mono">
                  {money(o.total)}
                  {o.due > 0 && o.due < o.total && (
                    <div className="mute" style={{ fontSize: 'var(--fs-12)' }}>{t('account.due')} {money(o.due)}</div>
                  )}
                </td>
                <td className="text-end">
                  <div className="d-inline-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => download(o.id)}>
                      <i className="bi bi-download" aria-hidden="true" />
                      <span className="visually-hidden">{t('common.download')}</span>
                    </button>
                    {o.canCancel && (
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => cancel(o.id)}>
                        <i className="bi bi-x-circle" aria-hidden="true" />
                        <span className="visually-hidden">{t('account.cancelOrder')}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
