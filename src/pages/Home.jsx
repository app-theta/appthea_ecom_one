import { Link } from 'react-router-dom';
import HeroSlider from '../components/home/HeroSlider';
import ProductCard from '../components/product/ProductCard';
import { SectionHead, GridSkeleton, ErrorState, Img } from '../components/ui/Ui';
import { useI18n } from '../context/I18nContext';
import { useBusiness } from '../context/BusinessContext';
import { useAsync } from '../hooks/useAsync';
import { home } from '../api/endpoints';
import { paginated } from '../utils/product';
import { imageUrl } from '../utils/format';

export default function Home() {
  const { t } = useI18n();
  const { categories } = useBusiness();

  const summary = useAsync((signal) => home.summary({ per_page: 8 }, { signal }), []);

  const featuredRows = paginated(summary.data?.featured).rows;
  const latestRows = paginated(summary.data?.latest).rows;
  const reelRows = paginated(summary.data?.reels).rows;

  return (
    <>
      <HeroSlider />

      {categories.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead
              eyebrow={t('nav.categories')}
              title={t('home.shopCategory')}
              action={<Link to="/products" className="btn btn-outline-secondary btn-sm">{t('common.viewAll')}</Link>}
            />
            <div className="row g-4">
              {categories.slice(0, 4).map((c) => (
                <div className="col-6 col-lg-3" key={c.id}>
                  <Link to={`/products?category_id=${c.id}`} className="cat-tile">
                    <Img src={imageUrl(c.image)} alt={c.name} label={`${c.name} · 4:5`} />
                    <span className="cat-tile__label">
                      {c.name}
                      <i className="bi bi-arrow-right" aria-hidden="true" />
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section--alt">
        <div className="shell">
          <SectionHead
            eyebrow={t('nav.shop')}
            title={t('home.featured')}
            note={t('home.featuredNote')}
            action={<Link to="/products?is_featured=Yes" className="btn btn-outline-secondary btn-sm">{t('common.viewAll')}</Link>}
          />
          {summary.loading ? <GridSkeleton count={4} />
            : summary.error ? <ErrorState error={summary.error} onRetry={summary.reload} retryLabel={t('common.retry')} />
            : (
              <div className="row g-4">
                {featuredRows.slice(0, 8).map((p) => (
                  <div className="col-6 col-md-4 col-lg-3" key={p.id}><ProductCard product={p} /></div>
                ))}
              </div>
            )}
        </div>
      </section>

      {reelRows.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead
              eyebrow={t('nav.reels')}
              title={t('home.reels')}
              note={t('home.reelsNote')}
              action={<Link to="/reels" className="btn btn-outline-secondary btn-sm">{t('common.viewAll')}</Link>}
            />
            <div className="reel-strip">
              {reelRows.map((r) => (
                <Link to={`/reels/${r.slug}`} className="reel-thumb" key={r.id}>
                  <Img src={imageUrl(r.thumbnail || r.image)} alt={r.title || ''} label="reel · 9:16" />
                  <span className="reel-thumb__play"><i className="bi bi-play-circle" aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section--tight">
        <div className="shell">
          <SectionHead eyebrow={t('nav.newIn')} title={t('nav.newIn')} />
          {summary.loading ? <GridSkeleton count={4} /> : (
            <div className="row g-4">
              {latestRows.slice(0, 8).map((p) => (
                <div className="col-6 col-md-4 col-lg-3" key={p.id}><ProductCard product={p} /></div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
