import { useState } from 'react';
import { Img } from '../ui/Ui';

export default function ImageGallery({ images = [], alt = '' }) {
  const [i, setI] = useState(0);
  const list = images.length ? images : [null];

  return (
    <div className="gallery">
      <div className="gallery__thumbs">
        {list.map((src, n) => (
          <button
            key={`${src ?? 'ph'}-${n}`}
            type="button"
            className="gallery__thumb"
            aria-current={n === i}
            onClick={() => setI(n)}
            aria-label={`Image ${n + 1}`}
          >
            <Img src={src} alt="" label="img" />
          </button>
        ))}
      </div>
      <div className="gallery__stage">
        <Img src={list[i]} alt={alt} label="product image · 3:4" />
      </div>
    </div>
  );
}
