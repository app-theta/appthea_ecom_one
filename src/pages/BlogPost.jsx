import { Link, useParams } from 'react-router-dom';
import { content } from '../api/endpoints';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../context/I18nContext';
import { Crumbs } from '../components/layout/Layout';
import { Empty, ErrorState, Sk } from '../components/ui/Ui';
import { dateShort } from '../utils/format';

export default function BlogPost() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const { data: post, loading, error, reload } = useAsync(() => content.blog(slug), [slug]);
  const notFound = error?.status === 404;

  return (
    <>
      <Crumbs trail={[{ label: t('blog.title'), to: '/blog' }, { label: post?.title || '…' }]} />
      <div className="shell section" style={{ maxWidth: 820 }}>
        {loading ? (
          <><Sk h={40} w="70%" /><Sk h={320} className="mt-4" /></>
        ) : notFound ? (
          <Empty icon="bi-journal-x" title={t('blog.notFound')} action={<Link to="/blog" className="btn btn-primary btn-sm mt-2">{t('blog.back')}</Link>} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />
        ) : (
          <article>
            <p className="eyebrow mb-2">{dateShort(post?.published_at, lang)}</p>
            <h1 className="display mb-4">{post?.title}</h1>
            {post?.thumbnail && (
              <img src={post.thumbnail} alt="" className="mb-5" style={{ width: '100%', borderRadius: 'var(--radius)' }} />
            )}
            {/* written by the shop in the admin's rich-text editor */}
            <div className="post__body" dangerouslySetInnerHTML={{ __html: post?.description || '' }} />
            <Link to="/blog" className="link-quiet d-inline-block mt-5">← {t('blog.back')}</Link>
          </article>
        )}
      </div>
    </>
  );
}
