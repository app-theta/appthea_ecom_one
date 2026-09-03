import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="shell section">
      <div className="mx-auto text-center" style={{ maxWidth: 460, paddingBlock: 'var(--sp-12)' }}>
        <div className="display" style={{ fontSize: '5rem', color: 'var(--line)', lineHeight: 1 }}>404</div>
        <h1 className="display mt-3 mb-3" style={{ fontSize: 'var(--fs-28)' }}>{t('common.notFoundTitle')}</h1>
        <p className="muted mb-4">{t('common.notFoundBody')}</p>
        <div className="d-grid gap-2 d-sm-flex justify-content-center">
          <Link to="/" className="btn btn-primary btn-cta">{t('common.backHome')}</Link>
          <Link to="/products" className="btn btn-outline-secondary btn-cta">{t('nav.shop')}</Link>
        </div>
      </div>
    </div>
  );
}
