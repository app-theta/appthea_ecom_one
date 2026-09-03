import { Link } from 'react-router-dom';
import { reviews as reviewsApi } from '../../api/endpoints';
import { parseApiError } from '../../api/errors';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { Sk, ErrorState, Empty, Stars } from '../../components/ui/Ui';
import { dateShort } from '../../utils/format';

export default function MyReviews() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => reviewsApi.mine(), []);
  const rows = Array.isArray(data) ? data : (data?.data ?? []);

  const remove = async (id) => {
    if (!window.confirm(t('account.confirmDelete'))) return;
    try {
      await reviewsApi.removeMine(id);
      toast.success(t('common.remove'));
      reload();
    } catch (e) { toast.error(parseApiError(e).message); }
  };

  if (loading) return <Sk h={220} />;
  if (error) return <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />;
  if (!rows.length) {
    return (
      <Empty
        icon="bi-chat-square-text"
        title={t('account.noReviews')}
        action={<Link to="/products" className="btn btn-primary btn-sm mt-2">{t('cart.keepShopping')}</Link>}
      />
    );
  }

  return (
    <>
      <h2 className="offcanvas-title mb-4">{t('account.reviews')}</h2>
      {rows.map((r) => (
        <article className="review" key={r.id}>
          <header className="review__head">
            <div className="flex-grow-1">
              {r.product?.slug ? (
                <Link to={`/product/${r.product.slug}`} style={{ color: 'var(--ink)' }}>{r.product.name}</Link>
              ) : (
                <span>{r.product?.name || r.product_name || '—'}</span>
              )}
              <div className="mute" style={{ fontSize: 'var(--fs-12)' }}>{dateShort(r.created_at, lang)}</div>
            </div>
            <Stars value={r.rating} />
          </header>
          <p className="muted mb-2">{r.comment || r.review}</p>
          <button type="button" className="link-quiet" onClick={() => remove(r.id)}>{t('review.deleteMine')}</button>
        </article>
      ))}
    </>
  );
}
