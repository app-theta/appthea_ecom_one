import { useI18n } from '../context/I18nContext';
import { useBusiness } from '../context/BusinessContext';
import { Crumbs } from '../components/layout/Layout';

/** Renders one of the business's rich-text legal fields (e.g. `privacy_policy`).
    One page, reused for every policy route via `field`/`titleKey` props. */
export default function Policy({ field, titleKey }) {
  const { t } = useI18n();
  const { info, loading } = useBusiness();
  const html = info?.[field];
  const title = t(titleKey);

  return (
    <>
      <Crumbs trail={[{ label: title }]} />
      <div className="shell section">
        <h1 className="display mb-4">{title}</h1>
        {loading ? (
          <p className="muted">{t('common.loading')}…</p>
        ) : html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="muted">{t('legal.notPublished')}</p>
        )}
      </div>
    </>
  );
}
