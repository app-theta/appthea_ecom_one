import { Link } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { useWishlist } from '../../context/WishlistContext';
import { useI18n } from '../../context/I18nContext';
import { Sk, Empty } from '../../components/ui/Ui';

export default function Wishlist() {
  const { t } = useI18n();
  const { rows, loading } = useWishlist();

  if (loading) {
    return <div className="row g-4">{[0, 1, 2].map((i) => <div className="col-6 col-lg-4" key={i}><Sk h={260} /></div>)}</div>;
  }

  if (!rows.length) {
    return (
      <Empty
        icon="bi-heart"
        title={t('account.noWishlist')}
        action={<Link to="/products" className="btn btn-primary btn-sm mt-2">{t('cart.keepShopping')}</Link>}
      />
    );
  }

  return (
    <>
      <h2 className="offcanvas-title mb-4">{t('account.wishlist')}</h2>
      <div className="row g-4">
        {rows.map((row) => {
          const product = row.product || row;
          return (
            <div className="col-6 col-lg-4" key={row.id}>
              <ProductCard product={product} />
            </div>
          );
        })}
      </div>
    </>
  );
}
