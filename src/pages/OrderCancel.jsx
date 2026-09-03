import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

/** Gateway cancel/failure return: /order/cancel?order=CODE&message=… */
export default function OrderCancel() {
  const [params] = useSearchParams();
  const { t } = useI18n();
  const code = params.get('order') || '';
  const message = params.get('message') || '';

  return (
    <div className="shell section">
      <div className="mx-auto text-center" style={{ maxWidth: 520 }}>
        <div
          className="mx-auto mb-4"
          style={{
            width: 64, height: 64, display: 'grid', placeItems: 'center', borderRadius: '50%',
            background: 'rgba(255,77,31,.1)', color: 'var(--flame)', fontSize: 'var(--fs-28)',
          }}
        >
          <i className="bi bi-exclamation" aria-hidden="true" />
        </div>
        <h1 className="display mb-3">{t('order.cancelTitle')}</h1>
        <p className="muted">{message || t('order.cancelBody')}</p>

        {code && (
          <div className="card-plain p-4 my-4 d-flex align-items-center justify-content-between">
            <span className="opt-label mb-0">{t('order.number')}</span>
            <strong className="mono" style={{ fontSize: 'var(--fs-18)' }}>{code}</strong>
          </div>
        )}

        <div className="d-grid gap-2 d-sm-flex justify-content-center mt-4">
          <Link to="/checkout" className="btn btn-primary btn-cta">{t('order.tryAgain')}</Link>
          <Link to="/cart" className="btn btn-outline-secondary btn-cta">{t('cart.viewCart')}</Link>
        </div>
      </div>
    </div>
  );
}
