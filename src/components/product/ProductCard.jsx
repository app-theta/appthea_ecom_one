import { Link } from 'react-router-dom';
import { Img, Price, Stars } from '../ui/Ui';
import { useI18n } from '../../context/I18nContext';
import { useCart } from '../../context/CartContext';
import { useBusiness } from '../../context/BusinessContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  headlinePrice, thumbOf, ratingOf, productInStock, primaryBarcode,
  isCombo, isSameCombo, isBundle, variantLabel, barcodes,
} from '../../utils/product';

export default function ProductCard({ product, view = 'grid' }) {
  const { t } = useI18n();
  const { features } = useBusiness();
  const { add } = useCart();
  const wishlist = useWishlist();
  const { isAuthed } = useAuth();
  const toast = useToast();

  const price = headlinePrice(product);
  const rating = ratingOf(product);
  const available = productInStock(product);
  const combo = isCombo(product);
  const needsChoice = combo || barcodes(product).length > 1;
  const saved = wishlist.enabled && wishlist.has(product.id);

  const quickAdd = () => {
    const bc = primaryBarcode(product);
    if (!bc) return;
    add({
      type: 'simple',
      product_id: product.id,
      barcode_id: bc.id,
      quantity: 1,
      total_price: price.now,
      meta: {
        name: product.name,
        slug: product.slug,
        image: thumbOf(product),
        variant: variantLabel(bc),
        unit_price: price.now,
      },
    }, { openDrawer: features.open_cart });
    toast.success(t('pdp.added'));
  };

  const onWish = async () => {
    if (!isAuthed) { toast.info(t('review.loginFirst')); return; }
    try {
      const action = await wishlist.toggle(product.id);
      toast.success(action === 'added' ? t('pdp.addedToWishlist') : t('cart.removed'));
    } catch { toast.error(t('common.somethingWrong')); }
  };

  return (
    <article className={`pcard ${view === 'list' ? 'pcard--row' : ''}`}>
      <div className="pcard__media">
        <div className="pcard__badges">
          {!available && <span className="badge-flag badge-flag--out">{t('pdp.outOfStock')}</span>}
          {price.was > 0 && available && <span className="badge-flag badge-flag--sale">Sale</span>}
          {isSameCombo(product) && <span className="badge-flag badge-flag--combo">Combo</span>}
          {isBundle(product) && <span className="badge-flag badge-flag--combo">Bundle</span>}
        </div>

        {wishlist.enabled && (
          <button
            type="button"
            className={`pcard__wish ${saved ? 'is-on' : ''}`}
            onClick={onWish}
            aria-label={t('nav.wishlist')}
            aria-pressed={saved}
          >
            <i className={`bi ${saved ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden="true" />
          </button>
        )}

        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <Img src={thumbOf(product)} alt={product.name} label="product image" />
        </Link>

        <div className="pcard__quick">
          {needsChoice || !available ? (
            <Link to={`/product/${product.slug}`} className="btn btn-dark btn-sm">
              {available ? t('pdp.selectVariant') : t('common.details')}
            </Link>
          ) : (
            <button type="button" className="btn btn-dark btn-sm" onClick={quickAdd}>
              <i className="bi bi-bag-plus me-2" aria-hidden="true" />{t('pdp.addToCart')}
            </button>
          )}
        </div>
      </div>

      <div className="pcard__body">
        {product.brand?.name && <div className="pcard__brand">{product.brand.name}</div>}
        <Link to={`/product/${product.slug}`} className="pcard__name">{product.name}</Link>
        <Price now={price.now} was={price.was} />
        {rating.count > 0 && (
          <div className="mt-2"><Stars value={rating.value} count={rating.count} /></div>
        )}
        {view === 'list' && product.short_description && (
          <p className="muted mt-3 mb-0" style={{ fontSize: 'var(--fs-14)' }}>{product.short_description}</p>
        )}
      </div>
    </article>
  );
}
