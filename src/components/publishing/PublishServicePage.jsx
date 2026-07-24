import { useEffect, useMemo, useState } from 'react';
import { fetchCategoryOptions } from '../../../lib/api/categories';
import {
  fetchPublisherProfile,
  publishService,
} from '../../../lib/api/publishing';
import { useAuth } from '../../../lib/auth/AuthContext';

const INITIAL_FORM = {
  title: '',
  description: '',
  categoryId: '',
  price: '',
  bio: '',
  fullBio: '',
  location: '',
  tagsText: '',
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

function PublishServicePage({ onBack, onPublished }) {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    location: profile?.location ?? '',
  });
  const [categories, setCategories] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [coverPreview, setCoverPreview] = useState(null);
  const [portfolioPreviews, setPortfolioPreviews] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [publishedGigId, setPublishedGigId] = useState(null);

  const tags = useMemo(() => parseList(form.tagsText, 8), [form.tagsText]);
  const skills = useMemo(() => parseList(form.skillsText, 10), [form.skillsText]);

  useEffect(() => {
    let isMounted = true;

    async function loadPublishingData() {
      try {
        const [categoryOptions, publisherProfile] = await Promise.all([
          fetchCategoryOptions(),
          fetchPublisherProfile(user?.id),
        ]);

        if (!isMounted) return;
        if (categoryOptions.length === 0) {
          throw new Error('No hay categorías visibles para publicar.');
        }

        setCategories(categoryOptions);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || String(categoryOptions[0]?.id ?? ''),
          bio: publisherProfile?.bio ?? current.bio,
          fullBio: publisherProfile?.full_bio ?? current.fullBio,
          location: current.location || profile?.location || '',
        }));
      } catch (loadError) {
        console.error('Error preparando el formulario de publicación:', loadError);
        if (isMounted) {
          setError(
            'No se pudieron cargar los datos para publicar. Verifica que la migración de este sprint esté aplicada.'
          );
        }
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    void loadPublishingData();
    return () => { isMounted = false; };
  }, [profile?.location, user?.id]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

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
  };

  const handleCoverChange = (event) => {
    const [file] = Array.from(event.target.files ?? []);
    if (file) setCoverFile(file);
    event.target.value = '';
  };

  const handlePortfolioChange = (event) => {
    const selected = Array.from(event.target.files ?? []);
    const remainingSlots = 6 - portfolioFiles.length;
    setPortfolioFiles((current) => [
      ...current,
      ...selected.slice(0, remainingSlots),
    ]);
    event.target.value = '';
  };

  const validate = () => {
    if (form.title.trim().length < 10) {
      return 'El título debe tener al menos 10 caracteres.';
    }
    if (form.description.trim().length < 40) {
      return 'La descripción debe tener al menos 40 caracteres.';
    }
    if (!form.categoryId) {
      return 'Selecciona una categoría.';
    }
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
      return 'Ingresa un precio mayor que cero.';
    }
    if (!coverFile) {
      return 'Agrega una imagen de portada.';
    }
    if (form.bio.trim().length < 20) {
      return 'Tu biografía corta debe tener al menos 20 caracteres.';
    }
    if (form.fullBio.trim().length < 40) {
      return 'Tu presentación debe tener al menos 40 caracteres.';
    }
    if (skills.length === 0) {
      return 'Agrega al menos una habilidad.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError(null);
    setIsPublishing(true);

    try {
      const gigId = await publishService({
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        price: form.price,
        coverFile,
        bio: form.bio,
        fullBio: form.fullBio,
        location: form.location,
        tags,
        skills,
        portfolioFiles,
      });

      await refreshProfile();
      setPublishedGigId(gigId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (publishError) {
      console.error('Error publicando el servicio:', publishError);
      setError(
        publishError?.message ||
          'No se pudo publicar el servicio. Revisa los datos e intenta nuevamente.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsPublishing(false);
    }
  };

  if (publishedGigId) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16 sm:px-6">
        <section className="w-full rounded-3xl border border-brand/20 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m5 13 4 4L19 7"
              />
            </svg>
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Servicio publicado
          </p>
          <h1 className="mb-3 text-3xl font-bold text-warm-900">
            Tu talento ya está en KREATIVA
          </h1>
          <p className="mx-auto mb-7 max-w-lg text-warm-600">
            El servicio ya aparece en el catálogo y podrás recibir solicitudes de
            comisión. También encontrarás una confirmación en Notificaciones.
          </p>
          <button
            type="button"
            onClick={() => onPublished(publishedGigId)}
            className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
          >
            Ver catálogo
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
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
        Volver al catálogo
      </button>

      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">
          Comparte tu talento
        </p>
        <h1 className="mb-3 text-3xl font-bold text-warm-900 sm:text-4xl">
          Publica un servicio creativo
        </h1>
        <p className="text-warm-600">
          Cuéntale a los clientes qué haces, muestra tu trabajo y define un precio
          inicial claro.
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

      {isLoadingData ? (
        <div className="flex min-h-80 items-center justify-center rounded-3xl bg-white">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <FormSection
              title="El servicio"
              description="La información principal que verá el cliente en el catálogo."
            >
              <Field label="Título" htmlFor="publish-title" hint={`${form.title.length}/120`}>
                <input
                  id="publish-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  minLength={10}
                  maxLength={120}
                  required
                  placeholder="Ej. Diseño una identidad visual memorable para tu marca"
                  className="form-control"
                />
              </Field>

              <Field
                label="Descripción"
                htmlFor="publish-description"
                hint={`${form.description.length}/1200`}
              >
                <textarea
                  id="publish-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  minLength={40}
                  maxLength={1200}
                  rows={6}
                  required
                  placeholder="Describe qué incluye el servicio, tu proceso y qué recibirá el cliente."
                  className="form-control resize-y"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoría" htmlFor="publish-category">
                  <select
                    id="publish-category"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    required
                    className="form-control"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Precio inicial (MXN)" htmlFor="publish-price">
                  <input
                    id="publish-price"
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    required
                    placeholder="1500"
                    className="form-control"
                  />
                </Field>
              </div>

              <Field
                label="Etiquetas"
                htmlFor="publish-tags"
                hint={`${tags.length}/8 etiquetas`}
              >
                <input
                  id="publish-tags"
                  name="tagsText"
                  value={form.tagsText}
                  onChange={handleChange}
                  placeholder="Branding, Logotipo, Identidad visual"
                  className="form-control"
                />
                <p className="mt-2 text-xs text-warm-500">
                  Sepáralas con comas para mejorar las búsquedas.
                </p>
              </Field>
            </FormSection>

            <FormSection
              title="Portada y portafolio"
              description="Usa imágenes propias en JPG, PNG o WEBP de hasta 10 MB."
            >
              <Field label="Imagen de portada" htmlFor="publish-cover">
                <input
                  id="publish-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  className="sr-only"
                />
                <label
                  htmlFor="publish-cover"
                  className="group flex min-h-56 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-warm-200 bg-cream-100 transition-colors hover:border-brand"
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Vista previa de la portada"
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <UploadPrompt
                      title="Selecciona la portada"
                      subtitle="Será la imagen principal de tu servicio"
                    />
                  )}
                </label>
              </Field>

              <Field
                label="Trabajos de portafolio"
                htmlFor="publish-portfolio"
                hint={`${portfolioFiles.length}/6 imágenes`}
              >
                <input
                  id="publish-portfolio"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePortfolioChange}
                  disabled={portfolioFiles.length >= 6}
                  className="sr-only"
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {portfolioPreviews.map((preview, index) => (
                    <div
                      key={`${preview.file.name}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-warm-100"
                    >
                      <img
                        src={preview.url}
                        alt={`Trabajo de portafolio ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPortfolioFiles((current) =>
                            current.filter((_, fileIndex) => fileIndex !== index)
                          )
                        }
                        className="absolute right-2 top-2 rounded-lg bg-warm-900/75 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Eliminar imagen ${index + 1}`}
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
                  ))}

                  {portfolioFiles.length < 6 && (
                    <label
                      htmlFor="publish-portfolio"
                      className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-warm-200 bg-cream-100 text-center transition-colors hover:border-brand"
                    >
                      <UploadPrompt title="Agregar" subtitle="Hasta 6" compact />
                    </label>
                  )}
                </div>
              </Field>
            </FormSection>

            <FormSection
              title="Tu perfil creativo"
              description="Esta información se comparte entre todos tus servicios."
            >
              <Field
                label="Biografía corta"
                htmlFor="publish-bio"
                hint={`${form.bio.length}/240`}
              >
                <textarea
                  id="publish-bio"
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
                htmlFor="publish-full-bio"
                hint={`${form.fullBio.length}/1200`}
              >
                <textarea
                  id="publish-full-bio"
                  name="fullBio"
                  value={form.fullBio}
                  onChange={handleChange}
                  minLength={40}
                  maxLength={1200}
                  rows={6}
                  required
                  placeholder="Habla de tu enfoque, experiencia y forma de trabajar."
                  className="form-control resize-y"
                />
              </Field>

              <Field label="Ubicación" htmlFor="publish-location">
                <input
                  id="publish-location"
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
                htmlFor="publish-skills"
                hint={`${skills.length}/10 habilidades`}
              >
                <input
                  id="publish-skills"
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
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-warm-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-warm-900">Antes de publicar</h2>
              <ul className="space-y-3 text-sm text-warm-600">
                {[
                  'Explica exactamente qué incluye tu precio.',
                  'Usa imágenes propias y de buena calidad.',
                  'Mantén tus datos de contacto dentro de KREATIVA.',
                  'Las solicitudes llegarán a Mensajes y Notificaciones.',
                ].map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={isPublishing || categories.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Publicando...
                </>
              ) : (
                'Publicar servicio'
              )}
            </button>

            <p className="text-center text-xs leading-relaxed text-warm-500">
              Al publicar confirmas que tienes derecho a usar las imágenes y el
              contenido incluidos.
            </p>
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

function UploadPrompt({ title, subtitle, compact = false }) {
  return (
    <div className={`text-center ${compact ? 'p-2' : 'p-6'}`}>
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
      <p className="text-sm font-semibold text-warm-800">{title}</p>
      <p className="mt-1 text-xs text-warm-500">{subtitle}</p>
    </div>
  );
}

export default PublishServicePage;
