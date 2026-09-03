import { Link } from 'react-router-dom';
import { account } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../context/I18nContext';
import { useBusiness } from '../../context/BusinessContext';
import { Sk, ErrorState, Empty } from '../../components/ui/Ui';
import { money, dateShort, statusPill } from '../../utils/format';

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { features } = useBusiness();
  const { data, loading, error, reload } = useAsync(() => account.dashboard(), []);
  const orders = useAsync(() => account.orders({ per_page: 5 }), []);

  if (loading) {
    return (
      <div className="row g-3">
        {[0, 1, 2, 3].map((i) => <div className="col-6 col-lg-3" key={i}><Sk h={96} /></div>)}
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />;

  const d = data || {};
  const stats = [
    { k: t('account.totalOrders'), v: d.total_orders ?? 0 },
    { k: t('account.totalSpent'), v: money(d.total_spent ?? 0) },
    { k: t('account.totalReviews'), v: d.total_reviews ?? 0 },
    features.user_wishlist && { k: t('account.totalWishlist'), v: d.total_wishlist ?? 0 },
    features.enable_customer_point_commission && { k: t('account.points'), v: d.point_balance ?? 0 },
  ].filter(Boolean);

  const rows = Array.isArray(orders.data) ? orders.data : (orders.data?.data ?? []);

  return (
    <>
      <div className="row g-3">
        {stats.map((s) => (
          <div className="col-6 col-lg-3" key={s.k}>
            <div className="stat">
              <div className="stat__v">{s.v}</div>
              <div className="stat__k">{s.k}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-5">
        <div className="d-flex align-items-baseline justify-content-between mb-3">
          <h2 className="offcanvas-title m-0">{t('account.recentOrders')}</h2>
          <Link to="/account/orders" style={{ fontSize: 'var(--fs-13)' }}>{t('common.viewAll')}</Link>
        </div>

        {orders.loading ? <Sk h={160} />
          : rows.length === 0 ? <Empty icon="bi-box-seam" title={t('account.noOrders')} action={<Link to="/products" className="btn btn-primary btn-sm mt-2">{t('cart.keepShopping')}</Link>} />
          : (
            <div className="table-responsive">
              <table className="otable">
                <thead>
                  <tr>
                    <th>{t('account.orderId')}</th>
                    <th>{t('account.date')}</th>
                    <th>{t('account.status')}</th>
                    <th className="text-end">{t('account.amount')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id}>
                      <td className="mono">{o.unique_code || o.order_code || `#${o.id}`}</td>
                      <td>{dateShort(o.created_at, lang)}</td>
                      <td><span className={`pill ${statusPill(o.status || o.order_status)}`}>{o.status || o.order_status || '—'}</span></td>
                      <td className="text-end mono">{money(o.grand_total ?? o.total)}</td>
                      <td className="text-end">
                        <Link to={`/account/orders/${o.id}`} style={{ fontSize: 'var(--fs-13)' }}>{t('common.details')}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </>
  );
}
