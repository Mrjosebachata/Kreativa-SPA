import { useState } from 'react';

/**
 * ImageCarousel — Galería de imágenes del portafolio.
 *
 * @param {Object}   props
 * @param {string[]} props.images - Array de URLs de imágenes
 * @param {string}   props.freelancerName - Nombre para aria-label
 */
function ImageCarousel({ images, freelancerName }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Soporte para navegación con teclado
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft')  goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  return (
    <div
      className="relative bg-warm-100 rounded-2xl overflow-hidden"
      role="region"
      aria-label={`Galería de trabajos de ${freelancerName}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >

      {/* ════════════════════════════════════════════════════
          IMAGEN PRINCIPAL
          ════════════════════════════════════════════════════ */}
      <div className="relative aspect-video bg-warm-200">
        <img
          src={images[currentIndex]}
          alt={`Trabajo ${currentIndex + 1} de ${freelancerName}`}
          className="w-full h-full object-cover"
        />

        {/* Overlay de gradiente en la esquina inferior (para legibilidad del contador) */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-warm-900/40 to-transparent" />
      </div>

      {/* ════════════════════════════════════════════════════
          CONTADOR (esquina inferior izquierda)
          ════════════════════════════════════════════════════ */}
      <span className="absolute bottom-4 left-4 text-xs font-semibold text-white bg-warm-900/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
        {currentIndex + 1} / {images.length}
      </span>

      {/* ════════════════════════════════════════════════════
          BOTÓN ANTERIOR (izquierda)
          ════════════════════════════════════════════════════ */}
      <button
        onClick={goToPrevious}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10
                   w-10 h-10 rounded-full
                   bg-white/80 hover:bg-white
                   flex items-center justify-center
                   transition-all duration-200 active:scale-90
                   focus:outline-none focus:ring-2 focus:ring-brand/50"
        aria-label="Imagen anterior"
        disabled={images.length <= 1}
      >
        <svg className="w-5 h-5 text-warm-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ════════════════════════════════════════════════════
          BOTÓN SIGUIENTE (derecha)
          ════════════════════════════════════════════════════ */}
      <button
        onClick={goToNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10
                   w-10 h-10 rounded-full
                   bg-white/80 hover:bg-white
                   flex items-center justify-center
                   transition-all duration-200 active:scale-90
                   focus:outline-none focus:ring-2 focus:ring-brand/50"
        aria-label="Imagen siguiente"
        disabled={images.length <= 1}
      >
        <svg className="w-5 h-5 text-warm-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ════════════════════════════════════════════════════
          INDICADORES (dots) — solo si hay más de 1 imagen
          ════════════════════════════════════════════════════ */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 absolute bottom-4 right-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      )}

    </div>
  );
}

export default ImageCarousel;