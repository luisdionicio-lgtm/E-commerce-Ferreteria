import { useState } from 'react';

const referenceGallery: Record<string, string[]> = {
  '/images/reference/drill-bosch.jpg': [
    '/images/reference/drill-bosch.jpg',
    '/images/reference/drill-kit-bosch.png',
    '/images/reference/drill-dimensions-bosch.jpg',
    '/images/reference/drill-workshop.jpg',
  ],
};

export default function ProductGallery({ image, name }: { image: string; name: string }) {
  const images = referenceGallery[image] || [image];
  const [selected, setSelected] = useState(0);
  return (
    <div className="product-gallery">
      <div className="detail-picture">
        <img
          src={images[selected]}
          alt={`${name}, vista ${selected + 1}`}
          width={600}
          height={600}
          decoding="async"
        />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbnails" role="group" aria-label="Vistas del producto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Ver vista ${i + 1} de ${name}`}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <img src={src} alt="" width={76} height={76} loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <p className="gallery-caption">
        Imágenes referenciales. Presentación, accesorios y medidas se confirman con la tienda.
      </p>
    </div>
  );
}
