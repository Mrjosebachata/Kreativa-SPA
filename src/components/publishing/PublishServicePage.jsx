import { useEffect, useMemo, useState } from 'react';
import { fetchCategoryOptions } from '../../../lib/api/categories';
import {
  fetchCreativeProfile,
  isCreativeProfileComplete,
} from '../../../lib/api/creativeProfile';
import { publishService } from '../../../lib/api/publishing';
import { useAuth } from '../../../lib/auth/AuthContext';

const INITIAL_FORM = {
  title: '',
  description: '',
  categoryId: '',
  price: '',
  tagsText: '',
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

function PublishServicePage({ onBack, onPublished, onConfigureProfile }) {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [hasCreativeProfile, setHasCreativeProfile] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [publishedGigId, setPublishedGigId] = useState(null);

  const tags = useMemo(() => parseList(form.tagsText, 8), [form.tagsText]);

  useEffect(() => {
    let isMounted = true;

    async function loadPublishingData() {
      try {
        setIsLoadingData(true);
        setError(null);
        const [categoryOptions, creativeProfile] = await Promise.all([
          fetchCategoryOptions(),
          fetchCreativeProfile(user?.id),
        ]);

        if (!isMounted) return;
        if (categoryOptions.length === 0) {
          throw new Error('No hay categorías visibles para publicar.');
        }

        setCategories(categoryOptions);
        setHasCreativeProfile(isCreativeProfileComplete(creativeProfile));
        setForm((current) => ({
          ...current,
          categoryId:
            current.categoryId || String(categoryOptions[0]?.id ?? ''),
        }));
      } catch (loadError) {
        console.error('Error preparando el formulario de publicación:', loadError);
        if (isMounted) {
          setError(
            'No se pudieron cargar los datos para publicar. Verifica que la nueva migración esté aplicada en Supabase.'
          );
        }
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    void loadPublishingData();
    return () => { isMounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError(null);
  };

  const handleCoverChange = (event) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError(
        'La portada debe ser una imagen JPG, PNG o WEBP de hasta 10 MB.'
      );
      return;
    }

    setCoverFile(file);
    setError(null);
  };

  const validate = () => {
    if (!hasCreativeProfile) {
      return 'Completa tu perfil creativo antes de publicar.';
    }
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
        tags,
      });

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
            El servicio ya aparece en el catálogo usando la información de tu
            perfil creativo. También encontrarás una confirmación en
            Notificaciones.
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
          Define qué ofreces y agrega una portada. Tu presentación y portafolio
          se tomarán automáticamente de tu perfil creativo.
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
        <>
          {!hasCreativeProfile && (
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-amber-950">
                  Primero configura tu perfil creativo
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  Guarda tu presentación y habilidades una sola vez antes de
                  publicar servicios.
                </p>
              </div>
              <button
                type="button"
                onClick={onConfigureProfile}
                className="flex-shrink-0 rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-950"
              >
                Configurar perfil
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <FormSection
              title="El servicio"
              description="La información y portada que verá el cliente en el catálogo."
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
                  rows={7}
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

              <Field label="Portada del servicio" htmlFor="publish-cover">
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
                    <div className="relative h-64 w-full">
                      <img
                        src={coverPreview}
                        alt="Vista previa de la portada"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-3 right-3 rounded-lg bg-warm-900/80 px-3 py-2 text-xs font-semibold text-white">
                        Cambiar portada
                      </span>
                    </div>
                  ) : (
                    <UploadPrompt />
                  )}
                </label>
                <p className="mt-2 text-xs text-warm-500">
                  JPG, PNG o WEBP de hasta 10 MB.
                </p>
              </Field>
            </FormSection>

            <aside className="h-fit space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-warm-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-bold text-warm-900">Antes de publicar</h2>
                <ul className="space-y-3 text-sm text-warm-600">
                  {[
                    'Explica exactamente qué incluye tu precio.',
                    'Usa una portada propia y de buena calidad.',
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
                disabled={
                  isPublishing ||
                  categories.length === 0 ||
                  !hasCreativeProfile
                }
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
                Al publicar confirmas que tienes derecho a usar la imagen y el
                contenido incluidos.
              </p>
            </aside>
          </form>
        </>
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

function UploadPrompt() {
  return (
    <div className="p-6 text-center">
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
      <p className="text-sm font-semibold text-warm-800">
        Selecciona la portada
      </p>
      <p className="mt-1 text-xs text-warm-500">
        Será la imagen principal de este servicio
      </p>
    </div>
  );
}

export default PublishServicePage;
