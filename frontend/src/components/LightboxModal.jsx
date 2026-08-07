import { useEffect } from 'react';
import { useLightbox } from '../lib/lightbox';

export default function LightboxModal() {
  const { image, closeLightbox } = useLightbox();

  useEffect(() => {
    if (!image) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
    };
    document.addEventListener('keydown', onKeyDown);

    // Prevent the page from scrolling behind the modal while it's open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [image, closeLightbox]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-fixed/90 p-6 backdrop-blur-sm animate-page-fade-in"
      onClick={closeLightbox}
      role="dialog"
      aria-modal="true"
      aria-label={image.title || 'Zoomed artwork'}
    >
      <button
        onClick={closeLightbox}
        aria-label="Close"
        className="absolute right-6 top-6 rounded-full p-2 text-parchment-fixed/80 transition-colors hover:bg-parchment-fixed/10 hover:text-parchment-fixed"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      <figure
        className="flex max-h-full max-w-3xl flex-col items-center"
        onClick={(e) => e.stopPropagation()} // clicking the image/caption shouldn't close it
      >
        <img
          src={image.src}
          alt={image.title || 'Artwork, zoomed in'}
          className="max-h-[80vh] max-w-full rounded-sm object-contain shadow-2xl"
        />
        {(image.title || image.meta) && (
          <figcaption className="mt-5 text-center text-parchment-fixed">
            {image.title && <p className="font-display text-xl italic">{image.title}</p>}
            {image.meta && <p className="placard mt-1 text-[10px] text-brass-bright">{image.meta}</p>}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
