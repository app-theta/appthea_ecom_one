import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviews as reviewsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../api/errors';
import { Stars, RatingInput, Sk, Empty } from '../ui/Ui';
import { dateShort, initials } from '../../utils/format';

export default function ReviewSection({ productId }) {
  const { t, lang } = useI18n();
  const { isAuthed } = useAuth();
  const toast = useToast();
  const [writing, setWriting] = useState(false);

  const { data, loading, reload } = useAsync(() => reviewsApi.list(productId), [productId]);
  const rows = Array.isArray(data) ? data : (data?.data ?? []);
  const summary = data?.summary || null;

  return (
    <section id="reviews" className="section--tight">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <p className="eyebrow">{t('pdp.reviews')}</p>
          <h2 className="display" style={{ fontSize: 'var(--fs-24)' }}>{t('review.title')}</h2>
        </div>
        {isAuthed ? (
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setWriting((v) => !v)}>
            {t('review.write')}
          </button>
        ) : (
          <Link to="/login" className="btn btn-outline-secondary btn-sm">{t('review.loginFirst')}</Link>
        )}
      </div>

      {summary && (
        <div className="d-flex align-items-center gap-4 mb-4">
          <div className="display" style={{ fontSize: 'var(--fs-34)' }}>{Number(summary.average || 0).toFixed(1)}</div>
          <div>
            <Stars value={summary.average} size="lg" />
            <div className="mute" style={{ fontSize: 'var(--fs-13)' }}>{summary.total} {t('pdp.reviews')}</div>
          </div>
        </div>
      )}

      {writing && (
        <ReviewForm
          productId={productId}
          onDone={() => { setWriting(false); reload(); toast.success(t('review.submitted')); }}
        />
      )}

      {loading ? (
        <div className="d-grid gap-4 mt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="d-grid gap-2">
              <Sk h={12} w="30%" /><Sk h={12} w="90%" /><Sk h={12} w="70%" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Empty icon="bi-chat-square-text" title={t('review.none')} />
      ) : (
        <div>
          {rows.map((r) => (
            <article className="review" key={r.id}>
              <header className="review__head">
                <span className="avatar">{initials(r.customer?.name || r.customer_name || 'A')}</span>
                <div>
                  <div style={{ fontSize: 'var(--fs-14)' }}>{r.customer?.name || r.customer_name || 'Customer'}</div>
                  <div className="mute" style={{ fontSize: 'var(--fs-12)' }}>{dateShort(r.created_at, lang)}</div>
                </div>
                <span className="ms-auto"><Stars value={r.rating} /></span>
              </header>
              {r.title && <div style={{ fontSize: 'var(--fs-15)' }}>{r.title}</div>}
              <p className="muted mb-0" style={{ textWrap: 'pretty' }}>{r.comment || r.review}</p>
              {(r.replies || []).map((rep) => (
                <div className="review__reply" key={rep.id}>
                  <div className="opt-label mb-1">{t('review.sellerReply')}</div>
                  {rep.comment || rep.reply}
                </div>
              ))}
              <div className="mt-3">
                <button
                  type="button"
                  className="link-quiet"
                  onClick={async () => {
                    try {
                      await reviewsApi.reaction({ review_id: r.id, reaction: 'like' });
                      reload();
                    } catch (e) { toast.error(parseApiError(e).message); }
                  }}
                >
                  <i className="bi bi-hand-thumbs-up me-1" aria-hidden="true" />
                  {t('review.helpful')}{r.likes_count ? ` (${r.likes_count})` : ''}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewForm({ productId, onDone }) {
  const { t } = useI18n();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await reviewsApi.store({ product_id: productId, rating, comment });
      setComment('');
      onDone();
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fields);
      toast.error(parsed.message);
    } finally { setBusy(false); }
  };

  return (
    <form className="card-plain p-4 mb-4 d-grid gap-3" onSubmit={submit}>
      <RatingInput value={rating} onChange={setRating} label={t('review.rating')} />
      <div>
        <label className="opt-label" htmlFor="rv-comment">{t('review.comment')}</label>
        <textarea
          id="rv-comment"
          className="form-control"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
        {errors.comment && <div className="field-error">{errors.comment}</div>}
      </div>
      <div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? `${t('common.loading')}…` : t('review.submit')}
        </button>
      </div>
    </form>
  );
}
