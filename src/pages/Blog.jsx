import { useState } from 'react';
import { Link } from 'react-router-dom';
import { content } from '../api/endpoints';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../context/I18nContext';
import { Crumbs } from '../components/layout/Layout';
import { Img, Empty, ErrorState, Pager, Sk } from '../components/ui/Ui';
import { dateShort } from '../utils/format';

export default function Blog() {
  const { t, lang } = useI18n();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => content.blogs({ page, per_page: 9 }), [page]);
  const posts = data?.data ?? [];

  return (
    <>
      <Crumbs trail={[{ label: t('blog.title') }]} />
      <div className="shell section">
        <h1 className="display mb-5">{t('blog.title')}</h1>

        {loading ? (
          <div className="row g-4">{[0, 1, 2].map((i) => <div className="col-md-4" key={i}><Sk h={300} /></div>)}</div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} />
        ) : posts.length === 0 ? (
          <Empty icon="bi-journal-text" title={t('blog.empty')} />
        ) : (
          <>
            <div className="row g-5">
              {posts.map((post) => (
                <div className="col-md-6 col-lg-4" key={post.id}>
                  <article className="post">
                    <Link to={`/blog/${post.slug}`} className="post__media" tabIndex={-1} aria-hidden="true">
                      <Img src={post.thumbnail} alt="" label="blog image" />
                    </Link>
                    <p className="eyebrow mt-3 mb-1">{dateShort(post.published_at, lang)}</p>
                    <h2 className="post__title"><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
                    {post.excerpt && <p className="muted mb-2">{post.excerpt}</p>}
                    <Link to={`/blog/${post.slug}`} style={{ fontSize: 'var(--fs-13)' }}>{t('blog.read')} →</Link>
                  </article>
                </div>
              ))}
            </div>
            <Pager page={data?.current_page ?? page} lastPage={data?.last_page ?? 1} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
