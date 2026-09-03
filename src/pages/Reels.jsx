import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { reels as reelsApi } from '../api/endpoints';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../context/I18nContext';
import { Sk, ErrorState, Empty, Img } from '../components/ui/Ui';
import { imageUrl } from '../utils/format';
import { paginated } from '../utils/product';

/** Vertical snap feed. Autoplay follows the reel in view; view/like are posted once. */
export default function Reels() {
  const { slug } = useParams();
  const { t } = useI18n();
  const { data, loading, error, reload } = useAsync(() => reelsApi.list({ per_page: 20 }), []);
  const rows = useMemo(() => paginated(data).rows, [data]);
  const containerRef = useRef(null);

  const ordered = useMemo(() => {
    if (!slug) return rows;
    const i = rows.findIndex((r) => r.slug === slug);
    return i > 0 ? [rows[i], ...rows.slice(0, i), ...rows.slice(i + 1)] : rows;
  }, [rows, slug]);

  if (loading) return <div className="shell section"><Sk h={520} /></div>;
  if (error) return <div className="shell section"><ErrorState error={error} onRetry={reload} retryLabel={t('common.retry')} /></div>;
  if (!ordered.length) return <div className="shell section"><Empty icon="bi-play-btn" title={t('reels.empty')} /></div>;

  return (
    <div className="reels" ref={containerRef}>
      {ordered.map((reel) => <Reel key={reel.id} reel={reel} root={containerRef} />)}
    </div>
  );
}

function Reel({ reel, root }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(Boolean(reel.is_liked));
  const [likes, setLikes] = useState(Number(reel.likes_count ?? reel.total_likes ?? 0));
  const [viewed, setViewed] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      const v = videoRef.current;
      if (entry.isIntersecting) {
        v?.play?.().catch(() => {});
        if (!viewed) { setViewed(true); reelsApi.view(reel.id).catch(() => {}); }
      } else {
        v?.pause?.();
      }
    }, { root: root?.current || null, threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [reel.id, viewed, root]);

  const like = async () => {
    setLiked((v) => !v);
    setLikes((n) => (liked ? Math.max(0, n - 1) : n + 1));
    try { await reelsApi.like(reel.id); } catch { /* optimistic */ }
  };

  const video = reel.video || reel.video_url || reel.file;
  const poster = imageUrl(reel.thumbnail || reel.image);
  const product = reel.product;

  return (
    <section className="reel" ref={ref} data-reel={reel.slug}>
      {video ? (
        <video ref={videoRef} src={video} poster={poster || undefined} loop muted={muted} playsInline preload="metadata" />
      ) : (
        <Img src={poster} alt={reel.title || ''} label="reel video · 9:16" />
      )}

      <div className="reel__side">
        <button type="button" className={liked ? 'is-on' : ''} onClick={like} aria-pressed={liked} aria-label={t('reels.likes')}>
          <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden="true" />
          <small>{likes}</small>
        </button>
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}>
          <i className={`bi ${muted ? 'bi-volume-mute' : 'bi-volume-up'}`} aria-hidden="true" />
        </button>
        {(reel.views_count ?? reel.total_views) != null && (
          <span className="text-center" style={{ color: '#fff' }}>
            <i className="bi bi-eye" aria-hidden="true" />
            <small className="d-block">{reel.views_count ?? reel.total_views}</small>
          </span>
        )}
      </div>

      <div className="reel__meta">
        {reel.title && <h2 style={{ fontFamily: 'var(--font-logo)', fontSize: 'var(--fs-24)', margin: 0 }}>{reel.title}</h2>}
        {reel.description && (
          <p className="mb-3 mt-2" style={{ color: 'rgba(255,255,255,.8)', fontSize: 'var(--fs-14)', maxWidth: '46ch' }}>
            {reel.description}
          </p>
        )}
        {product?.slug && (
          <Link to={`/product/${product.slug}`} className="btn btn-light btn-sm">
            <i className="bi bi-bag me-2" aria-hidden="true" />{t('reels.shop')}
          </Link>
        )}
      </div>
    </section>
  );
}
