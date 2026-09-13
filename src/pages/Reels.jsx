import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { reels as reelsApi } from '../api/endpoints';
import { useAsync } from '../hooks/useAsync';
import { useI18n } from '../context/I18nContext';
import { useBusiness } from '../context/BusinessContext';
import { Sk, ErrorState, Empty, Img } from '../components/ui/Ui';
import { imageUrl } from '../utils/format';
import { paginated } from '../utils/product';

/** True for a hosted-embed URL (YouTube/Vimeo) that needs an &lt;iframe&gt;
    rather than a plain &lt;video src&gt;. */
function isEmbedVideo(url) {
  return /youtube\.com|youtu\.be|player\.vimeo\.com/i.test(url || '');
}

/** Appends autoplay/mute params an embed needs to behave like the native
    &lt;video muted loop&gt; used for direct file URLs. */
function withAutoplay(url) {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}autoplay=1&mute=1&playsinline=1`;
}

/** Vertical snap feed. Autoplay follows the reel in view; view/like are posted once. */
export default function Reels() {
  const { slug } = useParams();
  const { t } = useI18n();
  const { features } = useBusiness();
  const { data, loading, error, reload } = useAsync(() => reelsApi.list({ per_page: 20 }), [], { skip: !features.product_reels });
  const rows = useMemo(() => paginated(data).rows, [data]);
  const containerRef = useRef(null);

  if (!features.product_reels) return <Navigate to="/" replace />;

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
  const [likes, setLikes] = useState(Number(reel.reel_likes_count ?? reel.likes_count ?? reel.total_likes ?? 0));
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

  const video = reel.reel_video_url || reel.video || reel.video_url || reel.file;
  const embed = isEmbedVideo(video);
  const poster = imageUrl(reel.thumbnail || reel.image);
  const title = reel.title || reel.name;
  const description = reel.description || reel.short_description;
  const productSlug = reel.product?.slug || reel.slug;

  return (
    <section className="reel" ref={ref} data-reel={reel.slug}>
      {video ? (
        embed ? (
          <iframe
            src={withAutoplay(video)}
            title={title || 'Reel'}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video ref={videoRef} src={video} poster={poster || undefined} loop muted={muted} playsInline preload="metadata" />
        )
      ) : (
        <Img src={poster} alt={title || ''} label="reel video · 9:16" />
      )}

      <div className="reel__side">
        <button type="button" className={liked ? 'is-on' : ''} onClick={like} aria-pressed={liked} aria-label={t('reels.likes')}>
          <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden="true" />
          <small>{likes}</small>
        </button>
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}>
          <i className={`bi ${muted ? 'bi-volume-mute' : 'bi-volume-up'}`} aria-hidden="true" />
        </button>
        {(reel.reel_views_count ?? reel.views_count ?? reel.total_views) != null && (
          <span className="text-center" style={{ color: '#fff' }}>
            <i className="bi bi-eye" aria-hidden="true" />
            <small className="d-block">{reel.reel_views_count ?? reel.views_count ?? reel.total_views}</small>
          </span>
        )}
      </div>

      <div className="reel__meta">
        {title && <h2 style={{ fontFamily: 'var(--font-logo)', fontSize: 'var(--fs-24)', margin: 0 }}>{title}</h2>}
        {description && (
          <p className="mb-3 mt-2" style={{ color: 'rgba(255,255,255,.8)', fontSize: 'var(--fs-14)', maxWidth: '46ch' }}>
            {description}
          </p>
        )}
        {productSlug && (
          <Link to={`/product/${productSlug}`} className="btn btn-light btn-sm">
            <i className="bi bi-bag me-2" aria-hidden="true" />{t('reels.shop')}
          </Link>
        )}
      </div>
    </section>
  );
}
