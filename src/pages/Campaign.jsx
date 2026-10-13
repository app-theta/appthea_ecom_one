import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import CampaignHero from '../components/home/CampaignHero';
import { Crumbs } from '../components/layout/Layout';
import { GridSkeleton, ErrorState, Empty, Pager, Sk } from '../components/ui/Ui';
import { useI18n } from '../context/I18nContext';
import { useAsync } from '../hooks/useAsync';
import { deals } from '../api/endpoints';
import { paginated } from '../utils/product';

/** /campaign/:slug - one running campaign and all its products at the campaign price. */
export default function Campaign() {
  const { slug } = useParams();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || 1);

  const { data, loading, error, reload } = useAsync(() => deals.campaign(slug, { page, per_page: 24 }), [slug, page]);
  const campaign = data?.campaign;
  const { rows, lastPage } = paginated(data?.products);

  useEffect(() => {
    if (campaign?.title) document.title = campaign.title;
  }, [campaign?.title]);

  // 404 = not running any more (ended, not started yet, or taken down)
  const ended = error?.status === 404;

  return (
    <>
      <Crumbs trail={[{ label: t('nav.shop'), to: '/products' }, { label: campaign?.title || t('deal.campaign') }]} />

      <div className="shell" style={{ paddingBlock: 'var(--sp-8) var(--sp-16)' }}>
        {loading && !data ? (
          <>
            <Sk h={240} r="var(--radiusLg)" className="mb-5" />
            <GridSkeleton count={8} />
          </>
        ) : ended ? (
          <Empty
            icon="bi-hourglass-bottom"
            title={t('deal.endedTitle')}
            body={t('deal.endedBody')}
            action={<Link to="/products" className="btn btn-primary btn-sm mt-2">{t('deal.keepShopping')}</Link>}
          />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />
        ) : campaign && (
          <>
            <CampaignHero campaign={campaign} linked={false} as="h1" onEnd={reload} />

            {rows.length ? (
              <div className="row g-4 mt-2">
                {rows.map((p) => (
                  <div className="col-6 col-md-4 col-lg-3" key={p.id}><ProductCard product={p} /></div>
                ))}
              </div>
            ) : (
              <Empty icon="bi-bag" title={t('deal.noProducts')} />
            )}

            <Pager
              page={page}
              lastPage={lastPage}
              onPage={(p) => {
                const next = new URLSearchParams(params);
                next.set('page', String(p));
                setParams(next);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
