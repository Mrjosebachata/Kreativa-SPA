import { useEffect, useMemo, useState } from 'react';
import { fetchReviewsForFreelancer } from '../../../lib/api/reviews';
import StarRating from './StarRating';

function ReviewsSection({
  freelancerId,
  initialRating = 0,
  initialCount = 0,
  profilePrimary = '#c6ff00',
  profileBackground = '#121216',
  profileText = '#f8f8f8',
  profileSurfaceText = '#f8f8f8',
}) {
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
        console.error('Error cargando reseñas:', loadError);
        if (isMounted) {
          setError('No se pudieron cargar las reseñas en este momento.');
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
  const textColor = profileSurfaceText;
  const mutedColor = profileSurfaceText;

  return (
    <section
      className="rounded-2xl border p-6 shadow-sm"
      style={{
        backgroundColor: 'var(--profile-surface, #1c1c21)',
        borderColor: 'var(--profile-divider, rgba(255, 255, 255, 0.12))',
        color: textColor,
      }}
      aria-labelledby="reviews-title"
    >
      <div
        className="mb-6 flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: 'var(--profile-divider, rgba(255, 255, 255, 0.12))' }}
      >
        <div>
          <h2 id="reviews-title" className="text-xl font-bold" style={{ color: profileText }}>
            Reseñas
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold" style={{ color: profileSurfaceText }}>
            {average.toFixed(1)}
          </span>
          <div>
            <StarRating
              value={average}
              readOnly
              size="sm"
              activeColor={profilePrimary}
              inactiveColor={`${profilePrimary}55`}
            />
            <p className="text-xs" style={{ color: mutedColor }}>
              {total} {total === 1 ? 'reseña' : 'reseñas'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-32 items-center justify-center">
          <span
            className="h-7 w-7 animate-spin rounded-full border-4 border-t-transparent"
            style={{
              borderColor: `${profilePrimary}55`,
              borderTopColor: 'transparent',
            }}
          />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm" style={{ color: profilePrimary }}>
          {error}
        </p>
      ) : reviews.length === 0 ? (
        <div
          className="rounded-2xl px-5 py-8 text-center"
          style={{ backgroundColor: `${profilePrimary}12` }}
        >
          <p className="font-semibold">Aún no hay reseñas</p>
          <p className="mt-1 text-sm" style={{ color: mutedColor }}>
            Las calificaciones apareceran cuando se completen las primeras comisiones.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => {
            const initial = review.author.name.charAt(0).toUpperCase();

            return (
              <article
                key={review.id}
                className="border-b pb-5 last:border-0 last:pb-0"
                style={{ borderColor: 'var(--profile-divider, rgba(255, 255, 255, 0.12))' }}
              >
                <div className="flex items-start gap-3">
                  {review.author.avatar ? (
                    <img
                      src={review.author.avatar}
                      alt={`Foto de ${review.author.name}`}
                      className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: `${profilePrimary}18`,
                        color: profilePrimary,
                      }}
                    >
                      {initial}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold" style={{ color: profileSurfaceText }}>
                          {review.author.name}
                        </h3>
                        <StarRating
                          value={review.rating}
                          readOnly
                          size="sm"
                          activeColor={profilePrimary}
                          inactiveColor={`${profilePrimary}55`}
                        />
                      </div>
                      <time
                        dateTime={review.createdAt}
                        className="text-xs"
                        style={{ color: mutedColor }}
                      >
                        {formatReviewDate(review.createdAt)}
                      </time>
                    </div>
                    {review.comment && (
                      <p
                        className="mt-3 whitespace-pre-wrap text-sm leading-relaxed"
                        style={{ color: mutedColor }}
                      >
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
