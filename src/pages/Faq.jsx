import { Link } from 'react-router-dom';
import { content } from '../api/endpoints';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../context/I18nContext';
import { Crumbs } from '../components/layout/Layout';
import { Empty, ErrorState, Sk } from '../components/ui/Ui';

export default function Faq() {
  const { t } = useI18n();
  const { data, loading, error, reload } = useAsync(() => content.faqs(), []);
  const faqs = Array.isArray(data) ? data : [];

  return (
    <>
      <Crumbs trail={[{ label: t('faq.title') }]} />
      <div className="shell section" style={{ maxWidth: 820 }}>
        <h1 className="display mb-5">{t('faq.title')}</h1>

        {loading ? (
          <Sk h={220} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />
        ) : faqs.length === 0 ? (
          <Empty icon="bi-question-circle" title={t('faq.empty')} />
        ) : (
          <div className="faq">
            {faqs.map((f, i) => (
              <details key={f.id} className="faq__item" open={i === 0}>
                <summary>{f.question}</summary>
                <div className="faq__answer">{f.answer}</div>
              </details>
            ))}
          </div>
        )}

        <p className="muted mt-5 mb-0">
          {t('faq.stillQuestions')} <Link to="/contact">{t('contact.title')}</Link>
        </p>
      </div>
    </>
  );
}
