import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import { imageUrl } from '../../utils/format';

export default function HeroSlider() {
  const { sliders, loading } = useBusiness();
  const [i, setI] = useState(0);
  const slides = sliders.filter((s) => imageUrl(s.image || s));

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % slides.length), 6000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (loading) return <div className="sk" style={{ aspectRatio: '21 / 9', minHeight: 320, borderRadius: 0 }} />;

  if (!slides.length) {
    return (
      <section className="hero">
        <div className="hero__slide">
          <div className="ph" style={{ height: '100%' }}>hero image · 21:9 · basic/slider</div>
        </div>
      </section>
    );
  }

  const go = (n) => setI((n + slides.length) % slides.length);

  return (
    <section className="hero" aria-roledescription="carousel">
      <div className="hero__track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, n) => (
          <div className="hero__slide" key={s.id ?? n} aria-hidden={n !== i}>
            <img src={imageUrl(s.image || s)} alt={s.title || ''} />
            {(s.title || s.button_text) && (
              <div className="hero__caption">
                <div className="shell">
                  {s.sub_title && <p className="eyebrow" style={{ color: 'rgba(255,255,255,.75)' }}>{s.sub_title}</p>}
                  {s.title && <h2>{s.title}</h2>}
                  {(s.url || s.link) && (
                    <Link to={toInternal(s.url || s.link)} className="btn btn-light btn-cta mt-2">
                      {s.button_text || 'Shop now'}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" className="hero__arrow hero__arrow--prev" onClick={() => go(i - 1)} aria-label="Previous">
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          <button type="button" className="hero__arrow hero__arrow--next" onClick={() => go(i + 1)} aria-label="Next">
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
          <div className="hero__dots">
            {slides.map((s, n) => (
              <button
                key={s.id ?? n}
                type="button"
                onClick={() => setI(n)}
                aria-current={n === i}
                aria-label={`Slide ${n + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Slider URLs may be absolute; keep in-app links relative. */
function toInternal(url) {
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin ? `${u.pathname}${u.search}` : url;
  } catch { return url || '/products'; }
}
