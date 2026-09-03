import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { Crumbs } from '../components/layout/Layout';
import { GridSkeleton, ErrorState, Empty, Pager } from '../components/ui/Ui';
import { useI18n } from '../context/I18nContext';
import { useBusiness } from '../context/BusinessContext';
import { useAsync } from '../hooks/useAsync';
import { catalog } from '../api/endpoints';
import { paginated } from '../utils/product';

const SORTS = ['latest', 'oldest', 'price_low', 'price_high', 'name_asc', 'name_desc', 'popular', 'stock_high', 'stock_low'];

export default function Products() {
  const { t } = useI18n();
  const { categories, brands } = useBusiness();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = useMemo(() => {
    const q = {
      keyword: params.get('keyword') || undefined,
      category_id: params.get('category_id') || undefined,
      sub_category_id: params.get('sub_category_id') || undefined,
      brand_id: params.get('brand_id') || undefined,
      is_featured: params.get('is_featured') || undefined,
      min_price: params.get('min_price') || undefined,
      max_price: params.get('max_price') || undefined,
      sort: params.get('sort') || 'latest',
      per_page: 12,
      page: Number(params.get('page') || 1),
    };
    Object.keys(q).forEach((k) => q[k] === undefined && delete q[k]);
    return q;
  }, [params]);

  const { data, loading, error, reload } = useAsync(() => catalog.products(query), [JSON.stringify(query)]);
  const { rows, page, lastPage, total } = paginated(data);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '' || value === undefined) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const activeChips = [
    params.get('keyword') && { key: 'keyword', label: `“${params.get('keyword')}”` },
    params.get('category_id') && {
      key: 'category_id',
      label: categories.find((c) => String(c.id) === params.get('category_id'))?.name || t('plp.category'),
    },
    params.get('brand_id') && {
      key: 'brand_id',
      label: brands.find((b) => String(b.id) === params.get('brand_id'))?.name || t('plp.brand'),
    },
    params.get('is_featured') === 'Yes' && { key: 'is_featured', label: t('plp.featuredOnly') },
    (params.get('min_price') || params.get('max_price')) && {
      key: 'price',
      label: `${params.get('min_price') || 0} – ${params.get('max_price') || '∞'}`,
    },
  ].filter(Boolean);

  const clearPrice = () => {
    const next = new URLSearchParams(params);
    next.delete('min_price'); next.delete('max_price'); next.delete('page');
    setParams(next, { replace: true });
  };

  const filters = (
    <div className="filters">
      {categories.length > 0 && (
        <div className="filter-group">
          <h5>{t('plp.category')}</h5>
          <div className="filter-list">
            {categories.map((c) => (
              <label key={c.id}>
                <input
                  type="radio"
                  name="category"
                  className="form-check-input mt-0"
                  checked={params.get('category_id') === String(c.id)}
                  onChange={() => setParam('category_id', c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {brands.length > 0 && (
        <div className="filter-group">
          <h5>{t('plp.brand')}</h5>
          <div className="filter-list">
            {brands.map((b) => (
              <label key={b.id}>
                <input
                  type="radio"
                  name="brand"
                  className="form-check-input mt-0"
                  checked={params.get('brand_id') === String(b.id)}
                  onChange={() => setParam('brand_id', b.id)}
                />
                {b.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="filter-group">
        <h5>{t('plp.price')}</h5>
        <PriceFilter
          min={params.get('min_price') || ''}
          max={params.get('max_price') || ''}
          onApply={(min, max) => {
            const next = new URLSearchParams(params);
            min ? next.set('min_price', min) : next.delete('min_price');
            max ? next.set('max_price', max) : next.delete('max_price');
            next.delete('page');
            setParams(next, { replace: true });
          }}
          onClear={clearPrice}
        />
      </div>

      <div className="filter-group">
        <label className="d-flex align-items-center gap-2" style={{ fontSize: 'var(--fs-14)' }}>
          <input
            type="checkbox"
            className="form-check-input mt-0"
            checked={params.get('is_featured') === 'Yes'}
            onChange={(e) => setParam('is_featured', e.target.checked ? 'Yes' : null)}
          />
          {t('plp.featuredOnly')}
        </label>
      </div>
    </div>
  );

  return (
    <>
      <Crumbs trail={[{ label: t('plp.title') }]} />
      <div className="shell section--tight" style={{ paddingBottom: 'var(--sp-16)' }}>
        <header className="mb-4">
          <p className="eyebrow">{t('nav.shop')}</p>
          <h1 className="display">{params.get('keyword') ? `“${params.get('keyword')}”` : t('plp.title')}</h1>
        </header>

        <div className="row g-5">
          <aside className="col-lg-3 d-none d-lg-block">{filters}</aside>

          <div className="col-lg-9">
            <div className="toolbar">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-lg-none"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  <i className="bi bi-funnel me-2" aria-hidden="true" />{t('plp.filters')}
                </button>
                <span className="mute mono" style={{ fontSize: 'var(--fs-13)' }}>
                  {total} {t('plp.results')}
                </span>
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className="tag-clear"
                    onClick={() => (chip.key === 'price' ? clearPrice() : setParam(chip.key, null))}
                  >
                    {chip.label}<i className="bi bi-x" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={params.get('sort') || 'latest'}
                  onChange={(e) => setParam('sort', e.target.value)}
                  aria-label={t('plp.sort')}
                >
                  {SORTS.map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
                </select>
                <div className="view-toggle d-none d-md-inline-flex">
                  <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')} aria-label="Grid view">
                    <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
                  </button>
                  <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="List view">
                    <i className="bi bi-list-ul" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {filtersOpen && <div className="d-lg-none mb-5 pb-4 border-bottom">{filters}</div>}

            {loading ? <GridSkeleton count={9} />
              : error ? <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />
              : rows.length === 0 ? <Empty icon="bi-search" title={t('plp.empty')} />
              : view === 'list' ? (
                <div className="d-grid gap-4">
                  {rows.map((p) => <ProductCard key={p.id} product={p} view="list" />)}
                </div>
              ) : (
                <div className="row g-4">
                  {rows.map((p) => (
                    <div className="col-6 col-md-4" key={p.id}><ProductCard product={p} /></div>
                  ))}
                </div>
              )}

            <Pager page={page} lastPage={lastPage} onPage={(n) => setParam('page', n)} />
          </div>
        </div>
      </div>
    </>
  );
}

function PriceFilter({ min, max, onApply, onClear }) {
  const { t } = useI18n();
  const [a, setA] = useState(min);
  const [b, setB] = useState(max);
  return (
    <div className="d-grid gap-2">
      <div className="d-flex gap-2">
        <input
          type="number" className="form-control form-control-sm" placeholder={t('plp.min')}
          value={a} onChange={(e) => setA(e.target.value)} aria-label={t('plp.min')}
        />
        <input
          type="number" className="form-control form-control-sm" placeholder={t('plp.max')}
          value={b} onChange={(e) => setB(e.target.value)} aria-label={t('plp.max')}
        />
      </div>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-dark btn-sm flex-grow-1" onClick={() => onApply(a, b)}>
          {t('common.apply')}
        </button>
        {(min || max) && (
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setA(''); setB(''); onClear(); }}>
            {t('plp.clearAll')}
          </button>
        )}
      </div>
    </div>
  );
}
