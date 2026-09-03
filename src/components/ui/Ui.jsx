import { useState } from 'react';
import { money, percentOff } from '../../utils/format';

/* ── Image with a striped placeholder fallback ─────────────────────────────── */
export function Img({ src, alt = '', label = 'product image', className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`ph ${className}`.trim()} role="img" aria-label={alt || label}>{label}</div>;
  }
  return (
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} {...rest} />
  );
}

/* ── Price ────────────────────────────────────────────────────────────────── */
export function Price({ now, was, size = 'md', showOff = true }) {
  const off = was ? percentOff(was, now) : 0;
  return (
    <span className={`price ${size === 'lg' ? 'price--lg' : ''}`}>
      <span className="price__now">{money(now)}</span>
      {off > 0 && <span className="price__was">{money(was)}</span>}
      {off > 0 && showOff && <span className="price__off">−{off}%</span>}
    </span>
  );
}

/* ── Stars ────────────────────────────────────────────────────────────────── */
export function Stars({ value = 0, size = 'sm', count }) {
  const v = Number(value) || 0;
  return (
    <span className={`stars ${size === 'lg' ? 'stars--lg' : ''}`} aria-label={`${v} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`bi ${v >= n ? 'bi-star-fill' : v >= n - 0.5 ? 'bi-star-half' : 'bi-star'}`} aria-hidden="true" />
      ))}
      {count != null && <span className="mute ms-2" style={{ fontSize: 'var(--fs-12)' }}>({count})</span>}
    </span>
  );
}

/* ── Rating input ─────────────────────────────────────────────────────────── */
export function RatingInput({ value, onChange, label }) {
  return (
    <div>
      {label && <div className="opt-label">{label}</div>}
      <div className="rating-input">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={value >= n ? 'is-on' : ''}
            onClick={() => onChange(n)}
            aria-label={`${n} star`}
          >
            <i className={`bi ${value >= n ? 'bi-star-fill' : 'bi-star'}`} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Quantity stepper ─────────────────────────────────────────────────────── */
export function Stepper({ value, onChange, min = 1, max = 99 }) {
  const v = Number(value) || min;
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, v - 1))} disabled={v <= min} aria-label="Decrease">
        <i className="bi bi-dash" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={v}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
        }}
        aria-label="Quantity"
      />
      <button type="button" onClick={() => onChange(Math.min(max, v + 1))} disabled={v >= max} aria-label="Increase">
        <i className="bi bi-plus" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ── Skeletons ────────────────────────────────────────────────────────────── */
export function Sk({ h = 14, w = '100%', r, className = '', style }) {
  return <div className={`sk ${className}`.trim()} style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Sk h={0} style={{ aspectRatio: '3 / 4', height: 'auto' }} />
      <div className="mt-3 d-grid gap-2">
        <Sk h={10} w="40%" />
        <Sk h={16} w="85%" />
        <Sk h={16} w="35%" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="row g-4">
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-6 col-md-4 col-lg-3" key={i}><ProductCardSkeleton /></div>
      ))}
    </div>
  );
}

/* ── Empty & error states ─────────────────────────────────────────────────── */
export function Empty({ icon = 'bi-inbox', title, body, action }) {
  return (
    <div className="empty">
      <i className={`bi ${icon}`} aria-hidden="true" />
      {title && <div style={{ fontSize: 'var(--fs-16)', color: 'var(--ink)' }}>{title}</div>}
      {body && <p className="mute mb-0" style={{ maxWidth: '38ch' }}>{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, retryLabel = 'Try again' }) {
  return (
    <Empty
      icon="bi-exclamation-triangle"
      title={error?.message || 'Something went wrong.'}
      body={error?.list?.length ? error.list.join(' ') : null}
      action={onRetry && (
        <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={onRetry}>{retryLabel}</button>
      )}
    />
  );
}

/* ── Pagination ───────────────────────────────────────────────────────────── */
export function Pager({ page, lastPage, onPage }) {
  if (!lastPage || lastPage < 2) return null;
  const pages = pageWindow(page, lastPage);
  return (
    <nav className="d-flex justify-content-center gap-1 mt-5" aria-label="Pagination">
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onPage(page - 1)} disabled={page <= 1}>
        <i className="bi bi-chevron-left" aria-hidden="true" />
      </button>
      {pages.map((p, i) => (p === '…' ? (
        <span key={`gap${i}`} className="px-2 align-self-center mute">…</span>
      ) : (
        <button
          key={p}
          type="button"
          className={`btn btn-sm ${p === page ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={() => onPage(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      )))}
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onPage(page + 1)} disabled={page >= lastPage}>
        <i className="bi bi-chevron-right" aria-hidden="true" />
      </button>
    </nav>
  );
}

function pageWindow(page, last) {
  const out = new Set([1, last, page, page - 1, page + 1]);
  const list = [...out].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const withGaps = [];
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) withGaps.push('…');
    withGaps.push(n);
  });
  return withGaps;
}

/* ── Section heading ──────────────────────────────────────────────────────── */
export function SectionHead({ eyebrow, title, note, action }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="display">{title}</h2>
        {note && <p className="muted mb-0 mt-2">{note}</p>}
      </div>
      {action}
    </div>
  );
}

export { money };
