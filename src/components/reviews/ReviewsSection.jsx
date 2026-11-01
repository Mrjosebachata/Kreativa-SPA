import { useEffect, useMemo, useState } from 'react';
import { fetchReviewsForFreelancer } from '../../../lib/api/reviews';
import StarRating from './StarRating';

function ReviewsSection({ freelancerId, initialRating = 0, initialCount = 0 }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchReviewsForFreelancer(freelancerId);
        if (isMounted) setReviews(data);
      } catch (loadError) {
        console.error('Error cargando resenas:', loadError);
        if (isMounted) {
          setError('No se pudieron cargar las resenas en este momento.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadReviews();
    return () => {
      isMounted = false;
    };
  }, [freelancerId]);

  const average = useMemo(() => {
    if (Number(initialCount) > 0) return Number(initialRating || 0);
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [initialCount, initialRating, reviews]);
  const total = Number(initialCount || 0) || reviews.length;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="reviews-title">
      <div className="mb-6 flex flex-col gap-3 border-b border-warm-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="reviews-title" className="text-xl font-bold text-warm-900">
            Resenas
          </h2>
          <p className="mt-1 text-sm text-warm-500">
            Opiniones de clientes con comisiones completadas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-warm-900">
            {average.toFixed(1)}
          </span>
          <div>
            <StarRating value={average} readOnly size="sm" />
            <p className="text-xs text-warm-500">
              {total} {total === 1 ? 'resena' : 'resenas'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-32 items-center justify-center">
          <span className="h-7 w-7 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-brand-dark">
          {error}
        </p>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl bg-cream-100 px-5 py-8 text-center">
          <p className="font-semibold text-warm-800">Aun no hay resenas</p>
          <p className="mt-1 text-sm text-warm-500">
            Las calificaciones apareceran cuando se completen las primeras comisiones.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => {
            const initial = review.author.name.charAt(0).toUpperCase();

            return (
              <article key={review.id} className="border-b border-warm-100 pb-5 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  {review.author.avatar ? (
                    <img
                      src={review.author.avatar}
                      alt={`Foto de ${review.author.name}`}
                      className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                      {initial}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-warm-900">
                          {review.author.name}
                        </h3>
                        <StarRating value={review.rating} readOnly size="sm" />
                      </div>
                      <time
                        dateTime={review.createdAt}
                        className="text-xs text-warm-400"
                      >
                        {formatReviewDate(review.createdAt)}
                      </time>
                    </div>
                    {review.comment && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-warm-700">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatReviewDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default ReviewsSection;
