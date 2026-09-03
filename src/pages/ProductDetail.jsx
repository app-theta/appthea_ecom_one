import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { catalog } from '../api/endpoints';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../context/I18nContext';
import { useCart } from '../context/CartContext';
import { useBusiness } from '../context/BusinessContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Crumbs } from '../components/layout/Layout';
import ImageGallery from '../components/product/ImageGallery';
import VariantPicker from '../components/product/VariantPicker';
import ComboTiers from '../components/product/ComboTiers';
import BundleSelector from '../components/product/BundleSelector';
import ProductCard from '../components/product/ProductCard';
import ReviewSection from '../components/review/ReviewSection';
import { Price, Stars, Stepper, Sk, ErrorState, Img } from '../components/ui/Ui';
import { money, plain } from '../utils/format';
import {
  barcodes as barcodesOf, primaryBarcode, barcodePrice, headlinePrice, productImages,
  isSameCombo, isBundle, comboTiers, bundlesOf, variantLabel, inStock, stockOf,
  ratingOf, num, paginated, thumbOf,
} from '../utils/product';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { add } = useCart();
  const { features } = useBusiness();
  const wishlist = useWishlist();
  const { isAuthed } = useAuth();
  const toast = useToast();

  const { data: product, loading, error, reload } = useAsync(() => catalog.product(slug), [slug]);

  const [barcodeId, setBarcodeId] = useState(null);
  const [qty, setQty] = useState(1);
  const [tier, setTier] = useState(null);
  const [freePicks, setFreePicks] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [bundleSel, setBundleSel] = useState({});

  const bcs = useMemo(() => (product ? barcodesOf(product) : []), [product]);

  useEffect(() => {
    if (!product) return;
    setBarcodeId(primaryBarcode(product)?.id ?? null);
    setQty(1); setTier(null); setFreePicks([]); setBundle(null); setBundleSel({});
    window.scrollTo({ top: 0 });
  }, [product]);

  const related = useAsync(
    () => catalog.products({ category_id: product?.category?.id, per_page: 4 }),
    [product?.category?.id],
    { skip: !product?.category?.id },
  );

  if (loading) return <DetailSkeleton />;
  if (error) return <div className="shell section"><ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} /></div>;
  if (!product) return null;

  const selected = bcs.find((b) => Number(b.id) === Number(barcodeId)) || primaryBarcode(product);
  const price = selected ? barcodePrice(selected) : headlinePrice(product);
  const rating = ratingOf(product);
  const tiers = comboTiers(product);
  const bundles = bundlesOf(product);
  const available = selected ? inStock(selected) : false;
  const maxQty = Math.max(1, stockOf(selected) || 99);

  /* ── the price shown on the CTA row ─────────────────────────────────────── */
  const activeTotal = tier
    ? num(tier.combo_price)
    : bundle
      ? num(bundle.price) 
      : price.now * qty;

  const buildEntry = () => {
    if (bundle) {
      const items = Array.isArray(bundle.items) ? bundle.items : [];
      const selections = [];
      const labels = [];
      for (const it of items) {
        const p = it.product || {};
        const own = barcodesOf(p);
        const bid = it.is_current_product
          ? barcodeId
          : bundleSel[p.id]?.barcode_id ?? (own.length === 1 ? own[0].id : null);
        if (!bid) { toast.error(t('pdp.needBundleItems')); return null; }
        selections.push({ product_id: p.id, barcode_id: bid });
        labels.push(`${num(it.quantity) > 1 ? `${it.quantity} × ` : ''}${p.name}`);
      }
      return {
        type: 'bundle',
        bundle_id: bundle.id,
        bundle_quantity: qty,
        selections,
        total_price: num(bundle.price) * qty,
        meta: {
          name: bundle.name || `${product.name} — ${t('cart.bundle')}`,
          slug: product.slug,
          image: thumbOf(product),
          items: labels,
          unit_price: num(bundle.price),
        },
      };
    }

    if (!selected) { toast.error(t('pdp.needVariant')); return null; }

    if (tier) {
      const freeNeeded = num(tier.free_qty);
      const picks = freePicks.slice(0, freeNeeded);
      if (freeNeeded > 0 && (picks.length < freeNeeded || picks.some((p) => !p?.product_id || !p?.barcode_id))) {
        toast.error(t('pdp.needFree'));
        return null;
      }
      return {
        type: 'combo_product',
        product_id: product.id,
        barcode_id: selected.id,
        quantity: num(tier.combo_qty),
        free_selections: picks.map((p) => ({ product_id: p.product_id, barcode_id: p.barcode_id })),
        total_price: num(tier.combo_price),
        meta: {
          name: product.name,
          slug: product.slug,
          image: thumbOf(product),
          variant: `${tier.combo_qty} ${t('pdp.pieces')} · ${variantLabel(selected)}`,
          free_items: picks.map((p) => [p.name, p.variant].filter(Boolean).join(' · ')),
          tier_qty: num(tier.combo_qty),
          unit_price: num(tier.combo_price),
        },
      };
    }

    return {
      type: 'simple',
      product_id: product.id,
      barcode_id: selected.id,
      quantity: qty,
      total_price: price.now * qty,
      meta: {
        name: product.name,
        slug: product.slug,
        image: productImages(product)[0],
        variant: variantLabel(selected),
        unit_price: price.now,
      },
    };
  };

  const addToCart = (thenCheckout = false) => {
    const entry = buildEntry();
    if (!entry) return;
    add(entry, { openDrawer: features.open_cart && !thenCheckout });
    if (thenCheckout) navigate('/checkout');
    else toast.success(t('pdp.added'));
  };

  const onWish = async () => {
    if (!isAuthed) { toast.info(t('review.loginFirst')); return; }
    try {
      const action = await wishlist.toggle(product.id);
      toast.success(action === 'added' ? t('pdp.addedToWishlist') : t('cart.removed'));
    } catch { toast.error(t('common.somethingWrong')); }
  };

  const relatedRows = paginated(related.data).rows.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <Crumbs
        trail={[
          { label: t('nav.shop'), to: '/products' },
          product.category?.name && { label: product.category.name, to: `/products?category_id=${product.category.id}` },
          { label: product.name },
        ].filter(Boolean)}
      />

      <div className="shell" style={{ paddingBlock: 'var(--sp-8) var(--sp-16)' }}>
        <div className="row g-5">
          <div className="col-lg-7">
            <ImageGallery images={productImages(product)} alt={product.name} />
          </div>

          <div className="col-lg-5">
            {product.brand?.name && <p className="eyebrow mb-1">{product.brand.name}</p>}
            <h1 className="pdp__title">{product.name}</h1>

            <div className="pdp__meta mb-4">
              {rating.count > 0 && (
                <a href="#reviews" className="d-inline-flex align-items-center gap-2" style={{ color: 'var(--inkSoft)' }}>
                  <Stars value={rating.value} /> {rating.count} {t('pdp.reviews')}
                </a>
              )}
              <span className={available ? '' : 'text-decoration-none'} style={{ color: available ? 'var(--wine)' : 'var(--inkMute)' }}>
                <i className={`bi ${available ? 'bi-check-circle' : 'bi-x-circle'} me-1`} aria-hidden="true" />
                {available ? t('pdp.inStock') : t('pdp.outOfStock')}
              </span>
              {selected?.sku && <span className="mute">{t('pdp.sku')} {selected.sku}</span>}
            </div>

            <Price now={price.now} was={price.was} size="lg" />

            <hr className="rule" />

            <VariantPicker
              barcodes={bcs}
              value={barcodeId}
              label={t('pdp.selectVariant')}
              onChange={(b) => setBarcodeId(b.id)}
            />

            {isSameCombo(product) && (
              <ComboTiers
                tiers={tiers}
                selectedQty={tier ? num(tier.combo_qty) : null}
                onSelect={(next) => { setTier(next); setFreePicks([]); if (next) setQty(1); }}
                freePicks={freePicks}
                onFreePick={(slot, pick) => setFreePicks((list) => {
                  const next = [...list];
                  next[slot] = pick;
                  return next;
                })}
              />
            )}

            {isBundle(product) && (
              <BundleSelector
                bundles={bundles}
                selectedId={bundle?.id ?? null}
                onSelect={(b) => { setBundle(b); setBundleSel({}); setQty(1); }}
                selections={bundleSel}
                currentBarcodeId={barcodeId}
                onSelectItem={(pid, val) => setBundleSel((s) => ({ ...s, [pid]: val }))}
              />
            )}

            <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
              {!tier && <Stepper value={qty} onChange={setQty} max={bundle ? 99 : maxQty} />}
              <div className="d-flex flex-grow-1 gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-cta flex-grow-1"
                  onClick={() => addToCart(false)}
                  disabled={!available && !bundle}
                >
                  <i className="bi bi-bag-plus me-2" aria-hidden="true" />
                  {available || bundle ? t('pdp.addToCart') : t('pdp.outOfStock')}
                </button>
                {features.user_wishlist && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-cta"
                    onClick={onWish}
                    aria-label={t('nav.wishlist')}
                    aria-pressed={wishlist.has(product.id)}
                  >
                    <i className={`bi ${wishlist.has(product.id) ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-dark btn-cta w-100 mt-2"
              onClick={() => addToCart(true)}
              disabled={!available && !bundle}
            >
              {t('pdp.buyNow')} · <span className="mono">{money(activeTotal)}</span>
            </button>

            {(product.description || product.short_description) && (
              <>
                <hr className="rule" />
                <div className="opt-label">{t('pdp.description')}</div>
                <p className="muted mb-0" style={{ textWrap: 'pretty' }}>
                  {plain(product.description || product.short_description)}
                </p>
              </>
            )}
          </div>
        </div>

        <hr className="rule" style={{ marginBlock: 'var(--sp-16)' }} />
        <ReviewSection productId={product.id} />

        {relatedRows.length > 0 && (
          <section className="section--tight">
            <div className="section-head">
              <h2 className="display" style={{ fontSize: 'var(--fs-24)' }}>{t('pdp.related')}</h2>
              {product.category?.id && (
                <Link to={`/products?category_id=${product.category.id}`} className="btn btn-outline-secondary btn-sm">
                  {t('common.viewAll')}
                </Link>
              )}
            </div>
            <div className="row g-4">
              {relatedRows.map((p) => (
                <div className="col-6 col-md-3" key={p.id}><ProductCard product={p} /></div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="shell" style={{ paddingBlock: 'var(--sp-8)' }}>
      <div className="row g-5">
        <div className="col-lg-7"><Sk h={0} style={{ aspectRatio: '3 / 4', height: 'auto' }} /></div>
        <div className="col-lg-5 d-grid gap-3 align-content-start">
          <Sk h={12} w="30%" />
          <Sk h={34} w="80%" />
          <Sk h={16} w="40%" />
          <Sk h={1} w="100%" />
          <Sk h={44} w="60%" />
          <Sk h={50} w="100%" />
        </div>
      </div>
    </div>
  );
}
