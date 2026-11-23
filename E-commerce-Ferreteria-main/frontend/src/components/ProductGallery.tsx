import { useState } from 'react';
import catalogReferences from '../data/catalog-references.json';
import galleryReferences from '../data/gallery-references.json';

const referenceGallery: Record<string, string[]> = {
  '/images/reference/drill-bosch.jpg': [
    '/images/reference/drill-bosch.jpg',
    '/images/reference/drill-kit-bosch.png',
    '/images/reference/drill-dimensions-bosch.jpg',
    '/images/reference/drill-workshop.jpg',
    '/images/reference/drill-masonry.jpg',
  ],
};

export default function ProductGallery({ image, name }: { image: string; name: string }) {
  const reference = catalogReferences.find((item) => item.image === image);
  const gallery = galleryReferences.find((item) => item.image === image);
  const images = reference
    ? [image, ...reference.images]
    : gallery
      ? [image, ...gallery.images]
      : referenceGallery[image] || [image];
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
      {gallery && (
        <p className="gallery-caption">
          {gallery.note} Fuente:{' '}
          <a href={gallery.source} target="_blank" rel="noopener noreferrer">
            {gallery.store}
          </a>
          .
        </p>
      )}
      {reference && (
        <p className="gallery-caption">
          Precio publicado en{' '}
          <a href={reference.source} target="_blank" rel="noopener noreferrer">
            {reference.store}
          </a>
          :{' '}
          {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
            reference.price / 100,
          )}
          . Consultado el 14/11/2026. Puede variar según ubicación y promoción; no incluye envío.
        </p>
      )}
    </div>
  );
}
