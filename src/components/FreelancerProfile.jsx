import { useEffect, useState } from 'react';
import ImageCarousel from './ImageCarousel';
import CommissionForm from './CommissionForm';
import {
  fetchGigById,
  fetchPublicProfileById,
} from '../../lib/api/gigs';
import {
  fetchFavoriteStatus,
  addFavorite,
  removeFavorite,
} from '../../lib/api/favorites';
import { useAuth } from '../../lib/auth/AuthContext';
import ReportModal from './moderation/ReportModal';
import ReviewsSection from './reviews/ReviewsSection';
import ReviewForm from './reviews/ReviewForm';
import ProjectsSection from './profile/ProjectsSection';
import {
  getContrastColor,
  PROFILE_SURFACE,
  normalizeHex,
  withAlpha,
} from './profile/profileTheme';

const PUBLIC_TABS = [
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

function MoreActionsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function FreelancerProfile({
  gigId,
  profileId,
  onBack,
  initialTab = 'about',
  reviewCommissionId = null,
  onReviewSubmitted,
  onEditService,
  onDeleteService,
}) {
  const { user, requireAuth } = useAuth();
  const tabs = PUBLIC_TABS;

  const [gig, setGig] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab || 'about');
  }, [initialTab]);


  useEffect(() => {
    let isMounted = true;

    async function loadGig() {
      try {
        setIsLoading(true);
        setError(null);

        const data = gigId
          ? await fetchGigById(gigId)
          : await fetchPublicProfileById(profileId);

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
  }, [gigId, profileId]);

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

  useEffect(() => {
    if (reviewCommissionId && gig?.author?.id) {
      setActiveTab('reviews');
      setIsReviewModalOpen(true);
    }
  }, [gig?.author?.id, reviewCommissionId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: '#c6ff00', borderTopColor: 'transparent' }}
        />
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
  const hasService = Boolean(gig.id);
  const storedPrimary = author.themePrimary?.toLowerCase();
  const profilePrimary =
    !storedPrimary || storedPrimary === '#c6ff00'
      ? '#c06cff'
      : author.themePrimary;
  const profileBackground = author.themeBackground || '#121216';
  const profileText = normalizeHex(author.themeText, getContrastColor(profileBackground));
  const profileAccentText = getContrastColor(profilePrimary);
  const profileSurface = normalizeHex(author.themeSurface, PROFILE_SURFACE);
  const profileSurfaceText = normalizeHex(
    author.themeSurfaceText,
    getContrastColor(profileSurface)
  );
  const profileDivider = withAlpha(profileSurfaceText, '35');

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
    author.portfolio?.[0] ||
    author.avatar;

  const services = gig.services?.length
    ? gig.services
    : gig.id
      ? [gig]
      : [];

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
    const commissionService = gig.id
      ? gig
      : services[0];

    if (commissionService) {
      setSelectedCommission(commissionService);
    }
  };

  return (
    <div
      className="profile-theme min-h-screen bg-cream-100 pb-16 text-warm-900"
      style={{
        '--profile-primary': profilePrimary,
        '--profile-background': profileBackground,
        '--profile-text': profileText,
        '--profile-accent-text': profileAccentText,
        '--profile-surface': profileSurface,
        '--profile-surface-text': profileSurfaceText,
        '--profile-muted': withAlpha(profileText, 'b3'),
        '--profile-divider': profileDivider,
        backgroundColor: profileBackground,
        color: profileText,
      }}
    >
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

        <section className="bg-transparent">

          <div className="relative h-48 overflow-hidden rounded-3xl bg-transparent sm:h-64">
            {bannerImage ? (
              <img
                src={bannerImage}
                alt={`Banner de ${author.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full bg-cream-200"
                style={{ backgroundColor: profileBackground }}
              />
            )}
          </div>

          <div
            className="relative border-t-4 bg-transparent px-5 pb-3 pt-4 sm:px-8 sm:pb-3 sm:pt-4"
            style={{ borderTopColor: profileBackground }}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div className="min-w-0 flex-1 pl-28 sm:pl-40">
                {author.avatar ? (
                  <img
                    src={author.avatar}
                    alt={`Foto de ${author.name}`}
                    className="absolute left-5 top-0 h-28 w-28 -translate-y-1/2 rounded-2xl border-4 object-cover sm:left-8 sm:h-36 sm:w-36"
                    style={{ borderColor: profileBackground }}
                  />
                ) : (
                  <div
                    className="absolute left-5 top-0 flex h-28 w-28 -translate-y-1/2 items-center justify-center rounded-2xl border-4 text-4xl font-bold sm:left-8 sm:h-36 sm:w-36"
                    style={{
                      backgroundColor: profilePrimary,
                      color: profileBackground,
                      borderColor: profileBackground,
                    }}
                  >
                    {author.name.charAt(0)}
                  </div>
                )}

                <div className="relative min-w-0 -translate-y-3 pb-1">
                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-3xl" style={{ color: profileText }}>
                    {author.name}
                  </h1>

                  <p className="mt-1 truncate text-xs font-bold sm:text-sm" style={{ color: profilePrimary }}>
                    {category} · {subcategory}
                  </p>
                </div>
              </div>

              <div className="relative flex flex-wrap items-center gap-3 -translate-y-3 sm:pb-1">

                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={isFavoriteLoading}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-gold transition hover:bg-gold/10 ${
                    isFavorite
                      ? 'bg-gold/20'
                      : ''
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

                {(hasService || services.length > 0) && (
                  <button
                    type="button"
                    onClick={goToCommissions}
                    className="rounded-full px-5 py-3 text-sm font-bold text-cream-100 transition hover:brightness-90"
                    style={{ backgroundColor: profilePrimary }}
                  >
                    Comisionar
                  </button>
                )}

                {canReport && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenActionMenu((current) => current === 'profile' ? null : 'profile')}
                      className="inline-flex h-10 w-10 items-center justify-center text-red-400 transition hover:text-red-300"
                      aria-label="Abrir acciones del perfil"
                      aria-expanded={openActionMenu === 'profile'}
                    >
                      <MoreActionsIcon />
                    </button>
                    {openActionMenu === 'profile' && (
                      <div
                        className="absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border p-1 shadow-xl"
                        style={{ backgroundColor: '#121216', borderColor: '#343439' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenu(null);
                            openReport(hasService ? 'service' : 'profile');
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-400 transition hover:bg-red-400/10"
                        >
                          Reportar {hasService ? 'servicio' : 'perfil'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <nav
          className="mt-2 overflow-x-auto border-b"
          style={{ borderBottomColor: `${profilePrimary}66` }}
          aria-label="Vistas del perfil"
        >
          <div className="flex min-w-max gap-7">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-4 text-sm transition ${
                  activeTab === tab.id
                    ? 'border-b-4 border-brand font-extrabold'
                    : 'border-b-2 border-transparent font-bold opacity-70 hover:opacity-100'
                }`}
                style={
                  activeTab === tab.id
                    ? {
                        borderColor: profilePrimary,
                        color: profilePrimary,
                      }
                    : { color: profilePrimary }
                }
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

        <main className="mt-4">

          {activeTab === 'about' && (
            <div className="grid gap-8 lg:grid-cols-3">

              <section className="rounded-2xl border border-gold/40 bg-cream-50 p-6 lg:col-span-1">
                <h2 className="mb-4 text-xl font-bold" style={{ color: profileText }}>
                  Información
                </h2>

                <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--profile-surface-text)' }}>
                  {author.fullBio ||
                    author.bio ||
                    'Este freelancer aún no ha agregado una descripción.'}
                </p>

                <h3 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide" style={{ color: profileText }}>
                  Habilidades
                </h3>

                <div className="flex flex-wrap gap-2">
                  {(author.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full px-3 py-1.5 text-xs font-bold"
                      style={{
                        color: profileAccentText,
                        backgroundColor: profilePrimary,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-6 border-t border-gold/40 pt-5">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: profileText }}>
                    Contacto y redes
                  </h3>
                  {author.contactLinks?.length > 0 ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {author.contactLinks.map((link) => (
                        <a
                          key={`${link.label}-${link.url}`}
                          href={normalizeExternalUrl(link.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold underline decoration-1 underline-offset-4 transition hover:opacity-75"
                          style={{ color: profilePrimary }}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--profile-surface-text)' }}>
                      Los enlaces de contacto aparecerán cuando agregues tus redes.
                    </p>
                  )}
                </div>
              </section>

              <section className="lg:col-span-2">
                <h2 className="mb-4 text-xl font-bold" style={{ color: profileText }}>
                  Portafolio
                </h2>

                {author.portfolio?.length > 0 ? (
                  <ImageCarousel
                    images={author.portfolio}
                    freelancerName={author.name}
                  />
                ) : (
                  <div className="rounded-2xl border border-gold/40 bg-cream-50 p-12 text-center text-sm" style={{ color: 'var(--profile-surface-text)' }}>
                    Este freelancer aún no ha subido trabajos a su portafolio.
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'projects' && (
            <ProjectsSection
              freelancerId={author.id}
              freelancerName={author.name}
              isOwner={user?.id === author.id}
              profilePrimary={profilePrimary}
              profileAccentText={profileAccentText}
              profileText={profileText}
              profileSurface={profileSurface}
              profileSurfaceText={profileSurfaceText}
            />
          )}

          {activeTab === 'commissions' && (
            <section className="space-y-5">
              <div>
                <p className="mt-1 text-sm" style={{ color: 'var(--profile-surface-text)' }}>
                  Elige uno de los servicios disponibles para solicitar una comisión.
                </p>
              </div>

              {services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((service) => (
                    <CommissionCard
                      key={service.id}
                      service={service}
                      profilePrimary={profilePrimary}
                      profileText={profileText}
                      profileSurfaceText={profileSurfaceText}
                      onCommission={() => setSelectedCommission(service)}
                      isOwner={user?.id === author.id}
                      onEdit={() => onEditService?.(service)}
                      onDelete={() => onDeleteService?.(service)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-gold/40 bg-cream-50 p-10 text-center">
                  <h3 className="text-lg font-bold" style={{ color: profileText }}>
                    Aún no hay comisiones disponibles
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--profile-surface-text)' }}>
                    Este perfil todavía no ha publicado servicios para solicitar.
                  </p>
                </div>
              )}

            </section>
          )}

          {activeTab === 'reviews' && (
            <ReviewsSection
              freelancerId={author.id}
              initialRating={author.rating}
              initialCount={author.reviews}
              profilePrimary={profilePrimary}
              profileBackground={profileBackground}
              profileText={profileText}
              profileSurfaceText={profileSurfaceText}
            />
          )}
        </main>
      </div>

      {isReviewModalOpen && reviewCommissionId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsReviewModalOpen(false);
            }
          }}
        >
          <section className="my-4 w-full max-w-3xl rounded-2xl border border-gold/40 bg-cream-100 p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2
                id="review-modal-title"
                className="text-xl font-bold text-warm-900"
              >
                Dejar reseña
              </h2>

              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="rounded-xl border border-gold/50 px-3 py-2 text-sm font-semibold text-gold hover:bg-gold/10"
              >
                Cerrar
              </button>
            </div>

            <ReviewForm
              commissionId={reviewCommissionId}
              freelancerName={author.name}
              onSubmitted={async () => {
                await onReviewSubmitted?.();
                setIsReviewModalOpen(false);
              }}
            />
          </section>
        </div>
      )}

      {selectedCommission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="commission-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCommission(null);
            }
          }}
        >
          <section
            className="kreativa-system-modal kreativa-commission-modal my-4 max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6"
            style={{
              backgroundColor: '#121216',
              borderColor: '#d7ff3f',
              color: '#f8f8f8',
            }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#d7ff3f' }}>
                  Solicitar comisión
                </p>

                <h2
                  id="commission-modal-title"
                  className="mt-1 text-xl font-bold"
                  style={{ color: '#f8f8f8' }}
                >
                  {selectedCommission.title}
                </h2>

                <p className="mt-1 text-sm" style={{ color: '#a09f99' }}>
                  Desde ${Number(selectedCommission.price || 0).toLocaleString('es-MX')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCommission(null)}
                className="rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-white/10"
                style={{ borderColor: '#d7ff3f', color: '#d7ff3f' }}
              >
                Cerrar
              </button>
            </div>

            <CommissionForm
              freelancerName={author.name}
              freelancerId={author.id}
              gigId={selectedCommission.id}
              basePrice={Number(selectedCommission.price || 0)}
              onSubmitted={() => setSelectedCommission(null)}
            />
          </section>
        </div>
      )}

      <ReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget?.targetType}
        targetUserId={author.id}
        serviceId={
          reportTarget?.targetType === 'service' && hasService
            ? gig.id
            : null
        }
        targetName={author.name}
      />
    </div>
  );
}

export default FreelancerProfile;

function normalizeExternalUrl(url) {
  const value = String(url ?? '').trim();
  if (!value) return '#';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function CommissionCard({
  service,
  profilePrimary,
  profileText,
  profileSurfaceText,
  onCommission,
  isOwner = false,
  onEdit,
  onDelete,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <article className="relative h-64 overflow-hidden rounded-2xl border border-gold/40 bg-cream-50 shadow-sm transition hover:border-gold/70 md:h-56">
      {isOwner && (
        <div className="absolute right-4 top-4 z-20">
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center text-warm-700 transition hover:text-brand"
            aria-label={`Abrir acciones de ${service.title}`}
            title="Acciones del servicio"
            aria-expanded={isMenuOpen}
          >
            <MoreActionsIcon />
          </button>
          {isMenuOpen && (
            <div
              className="commission-action-menu absolute right-0 top-full mt-1 w-40 rounded-xl border p-1 shadow-xl"
              style={{ backgroundColor: '#121216', borderColor: '#343439' }}
            >
              <button type="button" onClick={() => { setIsMenuOpen(false); onEdit?.(); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10">Editar servicio</button>
              <button type="button" onClick={() => { setIsMenuOpen(false); onDelete?.(); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-400/10">Eliminar servicio</button>
            </div>
          )}
        </div>
      )}
      <div className="grid h-full md:grid-cols-[280px_1fr]">
        <div className="relative h-full overflow-hidden bg-cream-200">
          {service.image ? (
            <img
              src={service.image}
              alt={`Portada de ${service.title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center text-sm font-semibold text-warm-500"
              style={{ backgroundColor: `${profilePrimary}18` }}
            >
              Sin imagen de portada
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: profilePrimary }}>
              {service.category || 'Servicio creativo'}
            </p>
            <h3 className="text-xl font-bold sm:text-2xl" style={{ color: profileText }}>
              {service.title}
            </h3>
            {service.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: profileSurfaceText }}>
                {service.description}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: profileSurfaceText }}>
                Desde
              </p>
              <p className="mt-1 text-2xl font-bold" style={{ color: profilePrimary }}>
                ${Number(service.price || 0).toLocaleString('es-MX')}
              </p>
            </div>

            <button
              type="button"
              onClick={onCommission}
              className="rounded-xl px-5 py-3 text-sm font-bold text-cream-100 transition hover:brightness-90"
              style={{ backgroundColor: profilePrimary }}
            >
              Comisionar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
