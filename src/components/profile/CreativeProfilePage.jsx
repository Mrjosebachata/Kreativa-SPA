import { useEffect, useMemo, useState } from 'react';
import {
  fetchCreativeProfile,
  saveCreativeProfile,
} from '../../../lib/api/creativeProfile';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  DEFAULT_PROFILE_TEXT,
  PROFILE_LIGHT_SURFACE,
  PROFILE_LIGHT_SURFACE_TEXT,
  PROFILE_SURFACE,
  PROFILE_SURFACE_TEXT,
} from './profileTheme';

const INITIAL_FORM = {
  publicName: '',
  fullBio: '',
  skillsText: '',
};

function parseList(value, limit) {
  const seen = new Set();

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) return false;
      const normalized = item.toLocaleLowerCase('es-MX');
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, limit);
}

function isValidImage(file) {
  return (
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
    file.size <= 10 * 1024 * 1024
  );
}

function CreativeProfilePage({
  onBack,
  onPublishService,
  onProfileSaved,
}) {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [originalBannerUrl, setOriginalBannerUrl] = useState('');
  const [themePrimary, setThemePrimary] = useState('#c06cff');
  const [themeBackground, setThemeBackground] = useState('#121216');
  const [themeText, setThemeText] = useState(DEFAULT_PROFILE_TEXT);
  const [themeSurface, setThemeSurface] = useState(PROFILE_SURFACE);
  const [themeSurfaceText, setThemeSurfaceText] = useState(PROFILE_SURFACE_TEXT);
  const [contactLinks, setContactLinks] = useState([]);
  const [originalPortfolioUrls, setOriginalPortfolioUrls] = useState([]);
  const [portfolioUrls, setPortfolioUrls] = useState([]);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const skills = useMemo(
    () => parseList(form.skillsText, 10),
    [form.skillsText]
  );
  const portfolioCount = portfolioUrls.length + portfolioFiles.length;
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Tu perfil';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setError(null);
        const creativeProfile = await fetchCreativeProfile(user?.id);

        if (!isMounted) return;
        setForm({
          publicName: displayName,
          fullBio: creativeProfile.fullBio,
          skillsText: creativeProfile.skills.join(', '),
        });
        setOriginalAvatarUrl(creativeProfile.avatarUrl);
        setAvatarUrl(creativeProfile.avatarUrl);
        setBannerUrl(creativeProfile.bannerUrl);
        setOriginalBannerUrl(creativeProfile.bannerUrl);
        setThemePrimary(creativeProfile.themePrimary);
        setThemeBackground(creativeProfile.themeBackground);
        setThemeText(creativeProfile.themeText);
        setThemeSurface(creativeProfile.themeSurface);
        setThemeSurfaceText(creativeProfile.themeSurfaceText);
        setContactLinks(creativeProfile.contactLinks);
        setOriginalPortfolioUrls(creativeProfile.portfolioUrls);
        setPortfolioUrls(creativeProfile.portfolioUrls);
      } catch (loadError) {
        console.error('Error cargando el perfil creativo:', loadError);
        if (isMounted) {
          setError(
            'No se pudo cargar tu perfil creativo. Verifica que la nueva migración esté aplicada en Supabase.'
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => { isMounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(avatarUrl);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile, avatarUrl]);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview(bannerUrl);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(bannerFile);
    setBannerPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [bannerFile, bannerUrl]);

  useEffect(() => {
    const previews = portfolioFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPortfolioPreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [portfolioFiles]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError(null);
    setSuccessMessage(null);
  };

  const handlePortfolioChange = (event) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selected.some((file) => !isValidImage(file))) {
      setError(
        'Usa únicamente imágenes JPG, PNG o WEBP de hasta 10 MB cada una.'
      );
      return;
    }

    const remainingSlots = 6 - portfolioCount;
    setPortfolioFiles((current) => [
      ...current,
      ...selected.slice(0, remainingSlots),
    ]);
    setError(null);
    setSuccessMessage(null);
  };

  const handleAvatarChange = (event) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!file) return;
    if (!isValidImage(file)) {
      setError(
        'La foto de perfil debe ser JPG, PNG o WEBP y pesar máximo 10 MB.'
      );
      return;
    }

    setAvatarFile(file);
    setError(null);
    setSuccessMessage(null);
  };

  const handleBannerChange = (event) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) return;
    if (!isValidImage(file)) {
      setError('El banner debe ser JPG, PNG o WEBP y pesar máximo 10 MB.');
      return;
    }

    setBannerFile(file);
    setError(null);
    setSuccessMessage(null);
  };

  const validate = () => {
    if (form.publicName.trim().length < 2) {
      return 'El nombre público debe tener al menos 2 caracteres.';
    }
    if (form.publicName.trim().length > 80) {
      return 'El nombre público no puede superar 80 caracteres.';
    }
    if (form.fullBio.trim().length < 40) {
      return 'Tu presentación debe tener al menos 40 caracteres.';
    }
    if (skills.length === 0) {
      return 'Agrega al menos una habilidad.';
    }
    if (portfolioCount > 6) {
      return 'Puedes guardar hasta 6 imágenes de portafolio.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      setSuccessMessage(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const removedPortfolioUrls = originalPortfolioUrls.filter(
        (url) => !portfolioUrls.includes(url)
      );
      const removedAvatarUrls =
        originalAvatarUrl && (avatarFile || !avatarUrl)
          ? [originalAvatarUrl]
          : [];
      const removedBannerUrls =
        originalBannerUrl && (bannerFile || !bannerUrl)
          ? [originalBannerUrl]
          : [];
      const savedProfile = await saveCreativeProfile({
        publicName: form.publicName,
        fullBio: form.fullBio,
        avatarUrl,
        avatarFile,
        bannerUrl,
        bannerFile,
        removedBannerUrls,
        themePrimary,
        themeBackground,
        themeText,
        themeSurface,
        themeSurfaceText,
        contactLinks,
        skills,
        portfolioUrls,
        portfolioFiles,
        removedAvatarUrls,
        removedPortfolioUrls,
      });

      setForm({
        publicName: savedProfile.publicName,
        fullBio: savedProfile.fullBio,
        skillsText: savedProfile.skills.join(', '),
      });
      setOriginalAvatarUrl(savedProfile.avatarUrl);
      setAvatarUrl(savedProfile.avatarUrl);
      setAvatarFile(null);
      setBannerUrl(savedProfile.bannerUrl);
      setOriginalBannerUrl(savedProfile.bannerUrl);
      setBannerFile(null);
      setThemePrimary(savedProfile.themePrimary);
      setThemeBackground(savedProfile.themeBackground);
      setThemeText(savedProfile.themeText);
      setThemeSurface(savedProfile.themeSurface);
      setThemeSurfaceText(savedProfile.themeSurfaceText);
      setContactLinks(savedProfile.contactLinks);
      setOriginalPortfolioUrls(savedProfile.portfolioUrls);
      setPortfolioUrls(savedProfile.portfolioUrls);
      setPortfolioFiles([]);
      await refreshProfile();
      await onProfileSaved?.();
      setSuccessMessage(
        'Tu perfil creativo quedó guardado y se usará en todos tus servicios.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (saveError) {
      console.error('Error guardando el perfil creativo:', saveError);
      setError(
        saveError?.message ||
          'No se pudo guardar tu perfil. Revisa los datos e intenta nuevamente.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/10 hover:text-gold-light"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m15 19-7-7 7-7"
          />
        </svg>
        Volver
      </button>

      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">
          Configuración
        </p>
        <h1 className="mb-3 text-3xl font-bold text-warm-900 sm:text-4xl">
          Tu perfil creativo
        </h1>
        <p className="text-warm-600">
          Completa esta información una sola vez. Tu presentación, habilidades y
          portafolio aparecerán automáticamente en todos los servicios que
          publiques.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-brand/50 bg-brand/10 px-5 py-4 text-sm text-brand"
        >
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m5 13 4 4L19 7"
            />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center rounded-3xl border border-gold/40 bg-cream-50">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <FormSection
              title="Presentación profesional"
              description="Estos datos se muestran junto a tu nombre en tu perfil público."
            >
              <Field
                label="Nombre público"
                htmlFor="creative-public-name"
                hint={`${form.publicName.length}/80`}
              >
                <input
                  id="creative-public-name"
                  name="publicName"
                  value={form.publicName}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder="El nombre que verán los demás usuarios"
                  className="form-control"
                />
                <p className="mt-2 text-xs text-warm-500">
                  Este nombre se mostrará en tu perfil, servicios y conversaciones.
                </p>
              </Field>

              <Field label="Foto de perfil" htmlFor="creative-avatar">
                <input
                  id="creative-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />

                <div className="flex flex-col gap-4 rounded-2xl border border-gold/40 bg-cream-50 p-4 sm:flex-row sm:items-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Vista previa de tu foto de perfil"
                      className="h-28 w-28 flex-shrink-0 rounded-2xl object-cover ring-4 ring-cream-50"
                    />
                  ) : (
                    <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-4xl font-bold text-brand ring-4 ring-cream-50">
                      {avatarInitial}
                    </div>
                  )}

                  <div>
                    <p className="mb-3 text-sm leading-relaxed text-warm-600">
                      Usa una imagen clara y reconocible. Se mostrará en tus
                      servicios, solicitudes y conversaciones.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor="creative-avatar"
                        className="cursor-pointer rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-brand-light"
                      >
                        {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
                      </label>

                      {avatarFile ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarFile(null);
                            setError(null);
                            setSuccessMessage(null);
                          }}
                          className="rounded-xl border border-gold/50 bg-transparent px-4 py-2.5 text-sm font-semibold text-warm-900 transition-colors hover:bg-gold/10"
                        >
                          Cancelar cambio
                        </button>
                      ) : avatarUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl('');
                            setError(null);
                            setSuccessMessage(null);
                          }}
                          className="rounded-xl border border-gold/50 bg-transparent px-4 py-2.5 text-sm font-semibold text-warm-900 transition-colors hover:bg-gold/10"
                        >
                          Quitar foto
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-warm-500">
                      JPG, PNG o WEBP de hasta 10 MB.
                    </p>
                  </div>
                </div>
              </Field>

              <Field
                label="Acerca de ti"
                htmlFor="creative-full-bio"
                hint={`${form.fullBio.length}/1200`}
              >
                <textarea
                  id="creative-full-bio"
                  name="fullBio"
                  value={form.fullBio}
                  onChange={handleChange}
                  minLength={40}
                  maxLength={1200}
                  rows={7}
                  required
                  placeholder="Habla de tu enfoque, experiencia y forma de trabajar."
                  className="form-control resize-y"
                />
              </Field>

              <Field
                label="Habilidades"
                htmlFor="creative-skills"
                hint={`${skills.length}/10 habilidades`}
              >
                <input
                  id="creative-skills"
                  name="skillsText"
                  value={form.skillsText}
                  onChange={handleChange}
                  required
                  placeholder="Illustrator, Branding, Dirección de arte"
                  className="form-control"
                />
                <p className="mt-2 text-xs text-warm-500">
                  Sepáralas con comas. Agrega por lo menos una.
                </p>
              </Field>

              <section className="space-y-3 rounded-2xl border border-gold/40 bg-cream-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-warm-900">
                      Enlaces de contacto o redes
                    </h2>
                    <p className="mt-1 text-xs text-warm-500">
                      Agrega hasta 8 enlaces para que aparezcan en tu perfil público.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setContactLinks((current) =>
                        current.length < 8
                          ? [...current, { label: '', url: '' }]
                          : current
                      )
                    }
                    disabled={contactLinks.length >= 8}
                    className="text-sm font-bold text-gold transition hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Agregar enlace
                  </button>
                </div>

                {contactLinks.length === 0 ? (
                  <p className="rounded-xl bg-cream-100 px-3 py-3 text-xs text-warm-500">
                    Todavía no has agregado enlaces de contacto.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contactLinks.map((link, index) => (
                      <div key={index} className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={link.label}
                          onChange={(event) =>
                            setContactLinks((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, label: event.target.value }
                                  : item
                              )
                            )
                          }
                          maxLength={40}
                          placeholder="Instagram, Behance, GitHub..."
                          className="form-control border-gold/40"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(event) =>
                            setContactLinks((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, url: event.target.value }
                                  : item
                              )
                            )
                          }
                          maxLength={500}
                          placeholder="https://..."
                          className="form-control border-gold/40"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setContactLinks((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index)
                            )
                          }
                          className="rounded-xl px-3 py-2 text-sm font-bold text-red-400 transition hover:bg-red-400/10 sm:self-stretch"
                          aria-label={`Eliminar enlace ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </FormSection>

            <FormSection
              title="Portafolio"
              description="Agrega hasta 6 trabajos propios en JPG, PNG o WEBP de máximo 10 MB."
            >
              <Field
                label="Imágenes de tus trabajos"
                htmlFor="creative-portfolio"
                hint={`${portfolioCount}/6 imágenes`}
              >
                <input
                  id="creative-portfolio"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePortfolioChange}
                  disabled={portfolioCount >= 6}
                  className="sr-only"
                />

                <div className="w-full min-w-0 max-w-full overflow-hidden">
                  <div className="flex h-60 min-w-0 max-w-full gap-3 overflow-x-auto overflow-y-hidden pb-2">
                  {portfolioUrls.map((url, index) => (
                    <PortfolioItem
                      key={url}
                      src={url}
                      alt={`Trabajo guardado ${index + 1}`}
                      onRemove={() => {
                        setPortfolioUrls((current) =>
                          current.filter((item) => item !== url)
                        );
                        setSuccessMessage(null);
                      }}
                    />
                  ))}

                  {portfolioPreviews.map((preview, index) => (
                    <PortfolioItem
                      key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                      src={preview.url}
                      alt={`Nuevo trabajo ${index + 1}`}
                      badge="Nuevo"
                      onRemove={() => {
                        setPortfolioFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index)
                        );
                        setSuccessMessage(null);
                      }}
                    />
                  ))}

                  {portfolioCount < 6 && (
                    <label
                      htmlFor="creative-portfolio"
                      className="flex h-56 w-56 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gold/50 bg-cream-100 text-center transition-colors hover:border-brand"
                    >
                      <UploadPrompt />
                    </label>
                  )}
                  </div>
                </div>
              </Field>
            </FormSection>
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-brand/40 bg-cream-50 p-5 shadow-sm">
              <h2 className="mb-1 font-bold text-warm-900">Personalización visual</h2>
              <p className="mb-4 text-sm leading-relaxed text-warm-600">
                Estos cambios se verán en tu perfil público y en tus servicios.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="creative-banner" className="mb-2 block text-sm font-semibold text-warm-900">
                    Banner del perfil
                  </label>
                  <input
                    id="creative-banner"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleBannerChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="creative-banner"
                    className="flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gold/50 bg-cream-100 text-center transition-colors hover:border-brand"
                    style={bannerPreview ? { backgroundImage: `url(${bannerPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  >
                    {!bannerPreview && (
                      <span className="flex flex-col items-center gap-1 px-3 text-warm-500">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m4.5 16 4.25-4.25a1.75 1.75 0 0 1 2.475 0L13 13.5l1.275-1.275a1.75 1.75 0 0 1 2.475 0L19.5 15" />
                          <circle cx="8.25" cy="9" r="1.25" strokeWidth="1.5" />
                        </svg>
                        <span className="text-xs font-semibold">Agregar banner</span>
                      </span>
                    )}
                  </label>
                  {bannerPreview && (
                    <button
                      type="button"
                      onClick={() => { setBannerFile(null); setBannerUrl(''); }}
                      className="mt-2 text-xs font-semibold text-red-500 hover:underline"
                    >
                      Quitar banner
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-warm-900">
                    Fondo
                    <span className="mt-2 flex items-center gap-2 rounded-xl border border-gold/40 bg-cream-100 p-2">
                      <input
                        type="color"
                        value={themeBackground}
                        onChange={(event) => setThemeBackground(event.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                      />
                      <span className="text-xs font-normal text-warm-500">{themeBackground}</span>
                    </span>
                  </label>
                  <label className="text-sm font-semibold text-warm-900">
                    Acentuado
                    <span className="mt-2 flex items-center gap-2 rounded-xl border border-gold/40 bg-cream-100 p-2">
                      <input
                        type="color"
                        value={themePrimary}
                        onChange={(event) => setThemePrimary(event.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                      />
                      <span className="text-xs font-normal text-warm-500">{themePrimary}</span>
                    </span>
                  </label>
                  <label className="text-sm font-semibold text-warm-900">
                    Texto personalizable
                    <span className="mt-2 flex items-center gap-2 rounded-xl border border-gold/40 bg-cream-100 p-2">
                      <input
                        type="color"
                        value={themeText}
                        onChange={(event) => setThemeText(event.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                      />
                      <span className="text-xs font-normal text-warm-500">{themeText}</span>
                    </span>
                  </label>
                </div>

                <div>
                  <p className="text-sm font-semibold text-warm-900">Superficie de los componentes</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setThemeSurface(PROFILE_SURFACE);
                        setThemeSurfaceText(PROFILE_SURFACE_TEXT);
                      }}
                      className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${themeSurface === PROFILE_SURFACE ? 'border-brand' : 'border-gold/40'}`}
                      style={themeSurface === PROFILE_SURFACE ? { backgroundColor: PROFILE_SURFACE, color: PROFILE_SURFACE_TEXT } : undefined}
                    >
                      Gris neutro
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemeSurface(PROFILE_LIGHT_SURFACE);
                        setThemeSurfaceText(PROFILE_LIGHT_SURFACE_TEXT);
                      }}
                      className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${themeSurface === PROFILE_LIGHT_SURFACE ? 'border-brand' : 'border-gold/40'}`}
                      style={themeSurface === PROFILE_LIGHT_SURFACE ? { backgroundColor: PROFILE_LIGHT_SURFACE, color: PROFILE_LIGHT_SURFACE_TEXT } : undefined}
                    >
                      Blanco
                    </button>
                  </div>
                </div>

                <label className="text-sm font-semibold text-warm-900">
                  Texto dentro de los cuadros
                  <span className="mt-2 flex items-center gap-2 rounded-xl border border-gold/40 bg-cream-100 p-2">
                    <input
                      type="color"
                      value={themeSurfaceText}
                      onChange={(event) => setThemeSurfaceText(event.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <span className="text-xs font-normal text-warm-500">{themeSurfaceText}</span>
                  </span>
                </label>

                <div className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-900">
                  Ten en cuenta que algunos colores de fondo y acento pueden reducir la visibilidad de ciertos elementos. Usa combinaciones con suficiente contraste para que tu perfil sea fácil de leer.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBannerFile(null);
                    setBannerUrl('');
                    setThemePrimary('#c06cff');
                    setThemeBackground('#121216');
                    setThemeText(DEFAULT_PROFILE_TEXT);
                    setThemeSurface(PROFILE_SURFACE);
                    setThemeSurfaceText(PROFILE_SURFACE_TEXT);
                    setContactLinks([]);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full rounded-xl border border-gold/50 px-4 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold/10"
                >
                  Restablecer personalización
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-bold text-black transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                'Guardar perfil'
              )}
            </button>

            {successMessage && (
              <button
                type="button"
                onClick={onPublishService}
                className="w-full rounded-xl border border-brand/50 bg-transparent px-5 py-3 text-sm font-bold text-brand transition-colors hover:bg-brand/10"
              >
                Publicar un servicio
              </button>
            )}
          </aside>
        </form>
      )}
    </main>
  );
}

function FormSection({ title, description, children }) {
  return (
    <section className="min-w-0 rounded-3xl border border-gold/40 bg-cream-50 p-5 shadow-sm sm:p-7">
      <div className="mb-6 border-b border-gold/40 pb-4">
        <h2 className="text-xl font-bold text-warm-900">{title}</h2>
        <p className="mt-1 text-sm text-warm-500">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-warm-900">
          {label}
        </label>
        {hint && <span className="text-xs text-warm-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PortfolioItem({ src, alt, badge, onRemove }) {
  return (
    <div className="group relative h-56 w-56 flex-none overflow-hidden rounded-xl bg-warm-100">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      {badge && (
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {badge}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-lg bg-brand p-2 text-black opacity-100 transition-colors hover:bg-warm-900 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        aria-label={`Eliminar ${alt.toLocaleLowerCase('es-MX')}`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

function UploadPrompt() {
  return (
    <div className="p-3">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-warm-800">Agregar trabajo</p>
      <p className="mt-1 text-xs text-warm-500">Selecciona imágenes</p>
    </div>
  );
}

export default CreativeProfilePage;
