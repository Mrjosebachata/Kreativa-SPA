import { useEffect, useState } from 'react';
import ImageCarousel from '../ImageCarousel';
import {
  createProject,
  deleteProject,
  fetchProjectsByFreelancerId,
  updateProject,
} from '../../../lib/api/projects';

const EMPTY_LINK = { label: '', url: '' };

export default function ProjectsSection({
  freelancerId,
  freelancerName,
  isOwner,
  profilePrimary,
  profileAccentText = '#ffffff',
  profileSurfaceText = '#f8f8f8',
}) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchProjectsByFreelancerId(freelancerId);

        if (isMounted) setProjects(data);
      } catch (loadError) {
        console.error('Error cargando proyectos:', loadError);

        if (isMounted) {
          setError('No se pudieron cargar los proyectos.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [freelancerId]);

  const openCreateForm = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const openEditForm = (project) => {
    setSelectedProject(null);
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleSaved = (project) => {
    setProjects((current) => {
      const exists = current.some((item) => item.id === project.id);

      if (exists) {
        return current.map((item) =>
          item.id === project.id ? project : item
        );
      }

      return [project, ...current];
    });
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const handleDelete = async (project) => {
    const confirmed = window.confirm(
      `¿Quieres eliminar el proyecto "${project.title}"?`
    );

    if (!confirmed) return;

    try {
      setError(null);
      await deleteProject({
        projectId: project.id,
        freelancerId,
      });
      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );
      setSelectedProject(null);
    } catch (deleteError) {
      console.error('Error eliminando proyecto:', deleteError);
      setError('No se pudo eliminar el proyecto.');
    }
  };

  return (
    <section className="-mt-2 space-y-1">
      <div className="flex items-center justify-end gap-4">

        {isOwner && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold leading-none shadow-sm transition hover:brightness-90"
            style={{
              backgroundColor: profilePrimary,
            }}
            aria-label="Agregar proyecto"
            title="Agregar proyecto"
          >
            <img
              src="/icons/project-add.png"
              alt=""
              aria-hidden="true"
              className="h-5 w-5 object-contain"
            />
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300/40 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-24 items-center justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: profilePrimary, borderTopColor: 'transparent' }}
          />
        </div>
      ) : projects.length > 0 ? (
        <div className="masonry-grid columns-1 gap-5 sm:columns-2 lg:columns-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="masonry-item mb-5 break-inside-avoid"
            >
              <ProjectCard
                project={project}
                isOwner={isOwner}
                profilePrimary={profilePrimary}
                profileAccentText={profileAccentText}
                profileSurfaceText={profileSurfaceText}
                onOpen={() => setSelectedProject(project)}
                onEdit={() => openEditForm(project)}
                onDelete={() => void handleDelete(project)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-2 text-center">
          <h3 className="text-lg font-bold text-warm-900">
            Aún no hay proyectos publicados
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-warm-500">
            {isOwner
              ? 'Agrega tu primer proyecto personal para mostrar tu trabajo.'
              : 'Este freelancer todavía no ha agregado proyectos personales.'}
          </p>
        </div>
      )}

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          profilePrimary={profilePrimary}
          profileAccentText={profileAccentText}
          profileSurfaceText={profileSurfaceText}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {isFormOpen && (
        <ProjectFormModal
          project={editingProject}
          freelancerId={freelancerId}
          profilePrimary={profilePrimary}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProject(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}

function ProjectCard({
  project,
  isOwner,
  profilePrimary,
  profileAccentText,
  profileSurfaceText,
  onOpen,
  onEdit,
  onDelete,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cover = project.images[0]?.url;

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-cream-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
      >
        {cover ? (
          <img
            src={cover}
            alt={`Proyecto: ${project.title}`}
            className="block h-auto w-full object-contain transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className="flex min-h-48 items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: `${profilePrimary}18` }}
          >
            Sin imagen
          </div>
        )}

        <div className="p-4">
          <h3 className="line-clamp-2 text-base font-bold" style={{ color: profileSurfaceText }}>
            {project.title}
          </h3>
        </div>
      </button>

      {isOwner && (
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((current) => !current);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold shadow-lg transition hover:brightness-90"
            style={{
              backgroundColor: profilePrimary,
              color: profileAccentText,
            }}
            aria-label="Acciones del proyecto"
            aria-expanded={isMenuOpen}
          >
            ⋯
          </button>

          {isMenuOpen && (
            <div className="project-action-menu absolute right-0 z-20 mt-2 w-32 overflow-hidden rounded-xl border py-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className="block w-full px-4 py-2 text-left text-sm font-semibold text-warm-800 hover:bg-gold/10"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-500 hover:bg-red-500/10"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ProjectDetailsModal({
  project,
  profilePrimary,
  profileAccentText,
  profileSurfaceText,
  onClose,
}) {
  const systemGreen = '#d7ff3f';
  const systemPurple = '#c06cff';
  const systemWhite = '#f8f8f8';

  return (
    <ModalShell onClose={onClose} labelledBy="project-details-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2
          id="project-details-title"
          className="text-2xl font-bold"
          style={{ color: systemWhite }}
        >
          {project.title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-gold/50 px-3 py-2 text-sm font-semibold text-gold hover:bg-gold/10"
        >
          Cerrar
        </button>
      </div>

      {project.images.length > 0 && (
        <ImageCarousel
          images={project.images.map((image) => image.url)}
          freelancerName={project.title}
        />
      )}

      {project.description && (
        <p className="mt-6 whitespace-pre-wrap leading-relaxed" style={{ color: systemWhite }}>
          {project.description}
        </p>
      )}

      {project.links.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: systemPurple }}>
            Enlaces
          </h3>

          <div className="flex flex-wrap gap-2">
            {project.links.map((link) => (
              <a
                key={link.id ?? `${link.label}-${link.url}`}
                href={normalizeUrl(link.url)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-gold underline decoration-1 underline-offset-4 transition hover:text-gold-light"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {project.projectUrl && (
        <a
          href={normalizeUrl(project.projectUrl)}
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex rounded-xl px-5 py-3 text-sm font-bold transition hover:brightness-90"
          style={{
            backgroundColor: systemGreen,
            color: '#121216',
          }}
        >
          Visitar proyecto
        </a>
      )}

      {project.collaborators.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: systemPurple }}>
            Colaboradores
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {project.collaborators.map((collaborator) => (
              collaborator.contactUrl ? (
                <a
                  key={collaborator.id ?? collaborator.name}
                  href={normalizeUrl(collaborator.contactUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-gold underline decoration-1 underline-offset-4 transition hover:text-gold-light"
                >
                  {collaborator.name}
                </a>
              ) : (
                <span
                  key={collaborator.id ?? collaborator.name}
                  className="text-sm font-semibold"
                  style={{ color: systemWhite }}
                >
                  {collaborator.name}
                </span>
              )
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ProjectFormModal({
  project,
  freelancerId,
  profilePrimary,
  onClose,
  onSaved,
}) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [projectUrl, setProjectUrl] = useState(project?.projectUrl ?? '');
  const [existingImages, setExistingImages] = useState(
    project?.images ?? []
  );
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [links, setLinks] = useState(
    project?.links?.length
      ? project.links.map((link) => ({
          label: link.label,
          url: link.url,
        }))
      : [{ ...EMPTY_LINK }]
  );
  const [collaborators, setCollaborators] = useState(
    project?.collaborators?.length
      ? project.collaborators.map((item) => ({
          name: item.name,
          contactUrl: item.contactUrl ?? '',
        }))
      : [{ name: '', contactUrl: '' }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const previews = newImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setNewPreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [newImages]);

  const imageCount = existingImages.length + newImages.length;

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (imageCount + files.length > 12) {
      setError('Puedes agregar hasta 12 imágenes por proyecto.');
      return;
    }

    setNewImages((current) => [...current, ...files]);
    setError(null);
  };

  const saveProject = async (event) => {
    event.preventDefault();

    if (title.trim().length < 2) {
      setError('El título debe tener al menos 2 caracteres.');
      return;
    }

    if (imageCount === 0) {
      setError('Agrega al menos una imagen al proyecto.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const savedProject = project
        ? await updateProject({
            projectId: project.id,
            freelancerId,
            title,
            description,
            projectUrl,
            existingImageUrls: existingImages.map((image) => image.url),
            newImageFiles: newImages,
            removedImageUrls: (project.images ?? [])
              .filter(
                (image) =>
                  !existingImages.some((current) => current.id === image.id)
              )
              .map((image) => image.url),
            links,
            collaborators,
          })
        : await createProject({
            freelancerId,
            title,
            description,
            projectUrl,
            imageFiles: newImages,
            links,
            collaborators,
          });

      onSaved(savedProject);
    } catch (saveError) {
      console.error('Error guardando proyecto:', saveError);
      setError(saveError?.message || 'No se pudo guardar el proyecto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="project-form-title"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2
          id="project-form-title"
          className="text-2xl font-bold text-warm-900"
        >
          {project ? 'Editar proyecto' : 'Agregar proyecto'}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-gold/50 px-3 py-2 text-sm font-semibold text-gold hover:bg-gold/10"
        >
          Cerrar
        </button>
      </div>

      <form onSubmit={saveProject} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-300/40 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <label className="block text-sm font-semibold text-warm-900">
          Título
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
            className="form-control mt-2 border-gold/40"
            placeholder="Ej. Identidad visual para una cafetería"
          />
        </label>

        <label className="block text-sm font-semibold text-warm-900">
          Descripción
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={5}
            className="form-control mt-2 resize-y border-gold/40"
            placeholder="Describe el proceso, objetivo y resultado del proyecto."
          />
        </label>

        <label className="block text-sm font-semibold text-warm-900">
          Página o plataforma del proyecto (opcional)
          <input
            type="url"
            value={projectUrl}
            onChange={(event) => setProjectUrl(event.target.value)}
            maxLength={500}
            className="form-control mt-2 border-gold/40"
            placeholder="https://tu-proyecto.com"
          />
          <span className="mt-1 block text-xs font-normal text-warm-500">
            Se mostrará como un botón para visitar el proyecto.
          </span>
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-warm-900">
              Imágenes
            </span>
            <label
              htmlFor="project-images"
              className="cursor-pointer text-sm font-bold text-gold hover:text-gold-light"
            >
              Agregar imágenes
            </label>
          </div>

          <input
            id="project-images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImagesChange}
            className="sr-only"
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {existingImages.map((image) => (
              <div
                key={image.id ?? image.url}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <img
                  src={image.url}
                  alt="Imagen existente del proyecto"
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    setExistingImages((current) =>
                      current.filter((item) => item.id !== image.id)
                    )
                  }
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-warm-900/80 text-white hover:bg-red-500"
                  aria-label="Eliminar imagen"
                >
                  ×
                </button>
              </div>
            ))}

            {newPreviews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <img
                  src={preview.url}
                  alt="Nueva imagen del proyecto"
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewImages((current) =>
                      current.filter((_, fileIndex) => fileIndex !== index)
                    )
                  }
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-warm-900/80 text-white hover:bg-red-500"
                  aria-label="Eliminar imagen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-warm-900">
              Enlaces
            </span>

            <button
              type="button"
              onClick={() => setLinks((current) => [...current, { ...EMPTY_LINK }])}
              className="text-sm font-bold text-gold hover:text-gold-light"
            >
              + Agregar enlace
            </button>
          </div>

          <div className="space-y-3">
            {links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={link.label}
                  onChange={(event) =>
                    setLinks((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, label: event.target.value }
                          : item
                      )
                    )
                  }
                  placeholder="Behance"
                  className="form-control border-gold/40"
                />
                <input
                  value={link.url}
                  onChange={(event) =>
                    setLinks((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, url: event.target.value }
                          : item
                      )
                    )
                  }
                  placeholder="https://..."
                  className="form-control border-gold/40"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-warm-900">
              Personas que trabajaron en el proyecto
            </span>

            <button
              type="button"
              onClick={() =>
                setCollaborators((current) => [
                  ...current,
                  { name: '', contactUrl: '' },
                ])
              }
              className="text-sm font-bold text-gold hover:text-gold-light"
            >
              + Agregar persona
            </button>
          </div>

          <div className="space-y-3">
            {collaborators.map((name, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-2">
                <input
                  value={name.name}
                  onChange={(event) =>
                    setCollaborators((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item
                      )
                    )
                  }
                  placeholder="Nombre del colaborador"
                  className="form-control border-gold/40"
                />
                <input
                  type="url"
                  value={name.contactUrl}
                  onChange={(event) =>
                    setCollaborators((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, contactUrl: event.target.value }
                          : item
                      )
                    )
                  }
                  placeholder="Enlace de contacto (opcional)"
                  className="form-control border-gold/40"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: '#d7ff3f', color: '#121216' }}
        >
          {isSaving
            ? 'Guardando...'
            : project
              ? 'Guardar cambios'
              : 'Publicar proyecto'}
        </button>
      </form>
    </ModalShell>
  );
}

function ModalShell({ onClose, labelledBy, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="kreativa-system-modal kreativa-project-modal my-4 max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-gold/30 bg-cream-50 p-5 shadow-2xl sm:p-7">
        {children}
      </section>
    </div>
  );
}

function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
