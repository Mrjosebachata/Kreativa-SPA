import { useState } from 'react';

function ImageCarousel({ images, freelancerName }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((previous) =>
      previous === 0 ? images.length - 1 : previous - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((previous) =>
      previous === images.length - 1 ? 0 : previous + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') goToPrevious();
    if (event.key === 'ArrowRight') goToNext();
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gold/40 bg-cream-50"
      role="region"
      aria-label={`Galería de trabajos de ${freelancerName}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="relative aspect-video bg-cream-200">
        <img
          src={images[currentIndex]}
          alt={`Trabajo ${currentIndex + 1} de ${freelancerName}`}
          className="h-full w-full object-cover"
        />

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream-100/70 to-transparent" />
      </div>

      <span className="absolute bottom-4 left-4 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-cream-100 shadow-lg">
        {currentIndex + 1} / {images.length}
      </span>

      <button
        type="button"
        onClick={goToPrevious}
        disabled={images.length <= 1}
        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-gold/90 text-cream-100 transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Imagen anterior"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m15 19-7-7 7-7"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={goToNext}
        disabled={images.length <= 1}
        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-gold/90 text-cream-100 transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Imagen siguiente"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m9 5 7 7-7 7"
          />
        </svg>
      </button>

      {images.length > 1 && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-gold'
                  : 'w-2 bg-gold/50 hover:bg-gold-light'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
              aria-current={
                index === currentIndex ? 'true' : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;