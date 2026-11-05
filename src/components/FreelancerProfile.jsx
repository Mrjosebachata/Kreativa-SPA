import { useEffect, useState } from 'react';
import ImageCarousel from './ImageCarousel';
import CommissionForm from './CommissionForm';
import { fetchGigById } from '../../lib/api/gigs';
import {
  fetchFavoriteStatus,
  addFavorite,
  removeFavorite,
} from '../../lib/api/favorites';
import { useAuth } from '../../lib/auth/AuthContext';
import ReportModal from './moderation/ReportModal';
import ReviewsSection from './reviews/ReviewsSection';

const TABS = [
  { id: 'about', label: 'Acerca de' },
  { id: 'commissions', label: 'Comisiones' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'reviews', label: 'Reseñas' },
];

function HeartIcon({ filled = false }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function FreelancerProfile({ gigId, onBack }) {
  const { user, requireAuth } = useAuth();

  const [gig, setGig] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadGig() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchGigById(gigId);

        if (!isMounted) return;

        if (!data) {
          setError('Este servicio ya no está disponible.');
        } else {
          setGig(data);
        }
      } catch (loadError) {
        console.error('Error cargando el perfil:', loadError);

        if (isMounted) {
          setError('No se pudo cargar el perfil. Intenta de nuevo.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadGig();

    return () => {
      isMounted = false;
    };
  }, [gigId]);

  useEffect(() => {
    if (!gig?.author?.id) return undefined;

    let isMounted = true;

    async function loadFavoriteStatus() {
      try {
        const favoriteStatus = await fetchFavoriteStatus(
          gig.author.id
        );

        if (isMounted) {
          setIsFavorite(favoriteStatus);
        }
      } catch (favoriteError) {
        console.error(
          'Error consultando el estado del favorito:',
          favoriteError
        );
      }
    }

    void loadFavoriteStatus();

    return () => {
      isMounted = false;
    };
  }, [gig?.author?.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream-100 px-4 text-center">
        <div className="mb-4 text-4xl">🔍</div>

        <p className="mb-4 text-warm-600">
          {error}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-cream-100 transition hover:bg-brand-dark"
        >
          Volver
        </button>
      </div>
    );
  }

  const { author, price } = gig;

  const canReport = user?.id !== author.id;

  const category =
    author.category ||
    gig.category ||
    'Servicios creativos';

  const subcategory =
    author.subcategory ||
    gig.tags?.[0] ||
    gig.title;

  const bannerImage =
    author.banner ||
    gig.image ||
    author.portfolio?.[0];

  const openReport = (targetType) => {
    requireAuth(
      () => setReportTarget({ targetType }),
      'Inicia sesión para reportar contenido.'
    );
  };

  const toggleFavorite = () => {
    requireAuth(
      async () => {
        try {
          setIsFavoriteLoading(true);

          if (isFavorite) {
            await removeFavorite(author.id);
            setIsFavorite(false);
          } else {
            await addFavorite(author.id);
            setIsFavorite(true);
          }
        } catch (favoriteError) {
          console.error(
            'Error actualizando el favorito:',
            favoriteError
          );

          alert(
            'No se pudo actualizar el favorito. Intenta nuevamente.'
          );
        } finally {
          setIsFavoriteLoading(false);
        }
      },
      'Inicia sesión para guardar perfiles en favoritos.'
    );
  };

  const goToCommissions = () => {
    setActiveTab('commissions');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-cream-100 pb-16 text-warm-900">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">

        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-gold transition hover:bg-gold/10 hover:text-gold-light"
          aria-label="Volver atrás"
        >
          <svg
            className="h-4 w-4"
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

          Volver
        </button>

        <section className="overflow-hidden rounded-3xl border border-gold/40 bg-cream-50 shadow-xl">

          <div className="relative h-48 overflow-hidden bg-cream-200 sm:h-64">
            {bannerImage ? (
              <img
                src={bannerImage}
                alt={`Banner de ${author.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-brand/60 via-gold/40 to-cream-200" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-cream-50 via-transparent to-black/10" />
          </div>

          <div className="relative px-5 pb-5 sm:px-8 sm:pb-7">
            <div className="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex min-w-0 items-end gap-4">
                {author.avatar ? (
                  <img
                    src={author.avatar}
                    alt={`Foto de ${author.name}`}
                    className="h-28 w-28 flex-shrink-0 rounded-3xl border-4 border-cream-50 object-cover shadow-xl sm:h-36 sm:w-36"
                  />
                ) : (
                  <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-3xl border-4 border-cream-50 bg-brand text-4xl font-bold text-cream-100 shadow-xl sm:h-36 sm:w-36">
                    {author.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-2xl font-bold tracking-tight text-warm-900 sm:text-4xl">
                    {author.name}
                  </h1>

                  <p className="mt-1 truncate text-sm font-medium text-brand sm:text-base">
                    {category} · {subcategory}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:pb-1">

                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={isFavoriteLoading}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
                    isFavorite
                      ? 'border-gold bg-gold/20 text-gold'
                      : 'border-gold/60 text-gold hover:border-gold hover:bg-gold/10'
                  } ${
                    isFavoriteLoading
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                  aria-label={
                    isFavorite
                      ? 'Quitar de favoritos'
                      : 'Guardar en favoritos'
                  }
                  aria-pressed={isFavorite}
                >
                  <HeartIcon filled={isFavorite} />
                </button>

                <button
                  type="button"
                  onClick={goToCommissions}
                  className="rounded-full bg-brand px-5 py-3 text-sm font-bold text-cream-100 transition hover:bg-brand-dark"
                >
                  Comisionar
                </button>
              </div>
            </div>
          </div>
        </section>

        <nav
          className="mt-5 overflow-x-auto border-b border-gold/40"
          aria-label="Vistas del perfil"
        >
          <div className="flex min-w-max gap-7">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-1 py-4 text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gold/80 hover:text-gold-light'
                }`}
                aria-current={
                  activeTab === tab.id
                    ? 'page'
                    : undefined
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="mt-8">

          {activeTab === 'about' && (
            <div className="grid gap-8 lg:grid-cols-3">

              <section className="rounded-2xl border border-gold/40 bg-cream-50 p-6 lg:col-span-1">
                <h2 className="mb-4 text-xl font-bold text-warm-900">
                  Información
                </h2>

                <p className="whitespace-pre-wrap leading-relaxed text-warm-700">
                  {author.fullBio ||
                    author.bio ||
                    'Este freelancer aún no ha agregado una descripción.'}
                </p>

                <h3 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-warm-900">
                  Habilidades
                </h3>

                <div className="flex flex-wrap gap-2">
                  {(author.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-brand/50 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <p className="mt-6 border-t border-gold/40 pt-5 text-xs text-warm-500">
                  Los enlaces de contacto aparecerán cuando el perfil tenga redes vinculadas.
                </p>
              </section>

              <section className="lg:col-span-2">
                <h2 className="mb-4 text-xl font-bold text-warm-900">
                  Portafolio
                </h2>

                {author.portfolio?.length > 0 ? (
                  <ImageCarousel
                    images={author.portfolio}
                    freelancerName={author.name}
                  />
                ) : (
                  <div className="rounded-2xl border border-gold/40 bg-cream-50 p-12 text-center text-sm text-warm-500">
                    Este freelancer aún no ha subido trabajos a su portafolio.
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'projects' && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-warm-900">
                Proyectos de {author.name}
              </h2>

              {author.portfolio?.length > 0 ? (
                <ImageCarousel
                  images={author.portfolio}
                  freelancerName={author.name}
                />
              ) : (
                <div className="rounded-2xl border border-gold/40 bg-cream-50 p-12 text-center text-sm text-warm-500">
                  Aún no hay proyectos publicados.
                </div>
              )}
            </section>
          )}

          {activeTab === 'commissions' && (
            <section className="mx-auto max-w-2xl rounded-2xl border border-gold/40 bg-cream-50 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-warm-900">
                Solicitar comisión
              </h2>

              <p className="mb-5 mt-2 text-sm text-warm-500">
                {gig.title} · Desde $
                {price.toLocaleString('es-MX')}
              </p>

              <CommissionForm
                freelancerName={author.name}
                freelancerId={author.id}
                gigId={gig.id}
                basePrice={price}
              />

              {canReport && (
                <button
                  type="button"
                  onClick={() => openReport('service')}
                  className="mt-4 w-full rounded-xl border border-gold/60 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10"
                >
                  Reportar este servicio
                </button>
              )}
            </section>
          )}

          {activeTab === 'reviews' && (
            <ReviewsSection
              freelancerId={author.id}
              initialRating={author.rating}
              initialCount={author.reviews}
            />
          )}
        </main>
      </div>

      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget?.targetType}
        targetUserId={author.id}
        serviceId={
          reportTarget?.targetType === 'service'
            ? gig.id
            : null
        }
        targetName={author.name}
      />
    </div>
  );
}

export default FreelancerProfile;