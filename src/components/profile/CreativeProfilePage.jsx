import { useEffect, useMemo, useState } from 'react';
import {
  fetchCreativeProfile,
  saveCreativeProfile,
} from '../../../lib/api/creativeProfile';
import { useAuth } from '../../../lib/auth/AuthContext';

const INITIAL_FORM = {
  bio: '',
  fullBio: '',
  location: '',
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
          bio: creativeProfile.bio,
          fullBio: creativeProfile.fullBio,
          location: creativeProfile.location,
          skillsText: creativeProfile.skills.join(', '),
        });
        setOriginalAvatarUrl(creativeProfile.avatarUrl);
        setAvatarUrl(creativeProfile.avatarUrl);
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

  const validate = () => {
    if (form.bio.trim().length < 20) {
      return 'Tu biografía corta debe tener al menos 20 caracteres.';
    }
    if (form.fullBio.trim().length < 40) {
      return 'Tu presentación debe tener al menos 40 caracteres.';
    }
    if (form.location.trim().length > 120) {
      return 'La ubicación no puede superar 120 caracteres.';
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
      const savedProfile = await saveCreativeProfile({
        bio: form.bio,
        fullBio: form.fullBio,
        location: form.location,
        avatarUrl,
        avatarFile,
        skills,
        portfolioUrls,
        portfolioFiles,
        removedAvatarUrls,
        removedPortfolioUrls,
      });

      setForm({
        bio: savedProfile.bio,
        fullBio: savedProfile.fullBio,
        location: savedProfile.location,
        skillsText: savedProfile.skills.join(', '),
      });
      setOriginalAvatarUrl(savedProfile.avatarUrl);
      setAvatarUrl(savedProfile.avatarUrl);
      setAvatarFile(null);
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
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-warm-600 transition-colors hover:bg-white hover:text-warm-900"
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
          className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"
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
        <div className="flex min-h-80 items-center justify-center rounded-3xl bg-white">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <FormSection
              title="Presentación profesional"
              description="Estos datos se muestran junto a tu nombre en tu perfil público."
            >
              <Field label="Foto de perfil" htmlFor="creative-avatar">
                <input
                  id="creative-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />

                <div className="flex flex-col gap-4 rounded-2xl border border-warm-100 bg-cream-50 p-4 sm:flex-row sm:items-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Vista previa de tu foto de perfil"
                      className="h-28 w-28 flex-shrink-0 rounded-2xl object-cover ring-4 ring-white"
                    />
                  ) : (
                    <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-4xl font-bold text-brand ring-4 ring-white">
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
                        className="cursor-pointer rounded-xl bg-warm-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-warm-800"
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
                          className="rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-100"
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
                          className="rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm font-semibold text-warm-700 transition-colors hover:bg-warm-100"
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
                label="Biografía corta"
                htmlFor="creative-bio"
                hint={`${form.bio.length}/240`}
              >
                <textarea
                  id="creative-bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  minLength={20}
                  maxLength={240}
                  rows={3}
                  required
                  placeholder="Resume tu especialidad y experiencia."
                  className="form-control resize-y"
                />
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

              <Field label="Ubicación" htmlFor="creative-location">
                <input
                  id="creative-location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  maxLength={120}
                  placeholder="Ciudad de México, MX"
                  className="form-control"
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

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                      className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-warm-200 bg-cream-100 text-center transition-colors hover:border-brand"
                    >
                      <UploadPrompt />
                    </label>
                  )}
                </div>
              </Field>
            </FormSection>
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-warm-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-warm-900">
                Un perfil para todo
              </h2>
              <p className="text-sm leading-relaxed text-warm-600">
                Cuando actualices esta información, el cambio se reflejará en
                todos tus servicios actuales y futuros.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
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
                className="w-full rounded-xl border border-brand/30 bg-white px-5 py-3 text-sm font-bold text-brand transition-colors hover:bg-brand/5"
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
    <section className="rounded-3xl border border-warm-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 border-b border-warm-100 pb-4">
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
    <div className="group relative aspect-square overflow-hidden rounded-xl bg-warm-100">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      {badge && (
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {badge}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-lg bg-warm-900/80 p-2 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
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
