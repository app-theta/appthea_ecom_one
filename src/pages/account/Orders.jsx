import { Link } from 'react-router-dom';
import { account } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { Sk, ErrorState, Empty } from '../../components/ui/Ui';
import { money, dateShort, statusPill } from '../../utils/format';

export default function Orders() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => account.orders({ per_page: 20 }), []);
  const rows = Array.isArray(data) ? data : (data?.data ?? []);

  const download = async (id) => {
    try {
      const res = await account.orderDownload(id);
      const url = res?.download_url || res?.url;
      if (url) window.location.href = url;   // public URL, no auth header needed
      else toast.error(t('common.somethingWrong'));
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  const remove = async (id) => {
    if (!window.confirm(t('account.confirmDelete'))) return;
    try {
      await account.deleteOrder(id);
      toast.success(t('common.remove'));
      reload();
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  if (loading) return <Sk h={280} />;
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
                  <Link to={`/account/orders/${o.id}`}>{o.unique_code || o.order_code || `#${o.id}`}</Link>
                  {o.items_count != null && <div className="mute" style={{ fontSize: 'var(--fs-12)' }}>{o.items_count} {t('account.items')}</div>}
                </td>
                <td>{dateShort(o.created_at, lang)}</td>
                <td><span className={`pill ${statusPill(o.status || o.order_status)}`}>{o.status || o.order_status || '—'}</span></td>
                <td className="text-end mono">{money(o.grand_total ?? o.total)}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => download(o.id)}>
                      <i className="bi bi-download" aria-hidden="true" />
                      <span className="visually-hidden">{t('common.download')}</span>
                    </button>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => remove(o.id)}>
                      <i className="bi bi-trash3" aria-hidden="true" />
                      <span className="visually-hidden">{t('account.deleteOrder')}</span>
                    </button>
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
