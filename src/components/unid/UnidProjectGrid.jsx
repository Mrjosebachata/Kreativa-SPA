
import { useMemo } from 'react';
import UnidProjectCard from './UnidProjectCard';

export default function UnidProjectGrid({
  projects,
  searchQuery,
  activeCategory,
  onOpenProject,
}) {
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es');

    return projects.filter((project) => {
      const matchesCategory =
        activeCategory === 'Todos' ||
        project.category === activeCategory;

      const searchable = [
        project.title,
        project.category,
        project.author,
        project.description,
        ...project.tags,
      ]
        .join(' ')
        .toLocaleLowerCase('es');

      return matchesCategory && searchable.includes(query);
    });
  }, [projects, searchQuery, activeCategory]);

  return (
    <section aria-label="Proyectos universitarios">
      <p className="mb-5 text-xs text-slate-500">
        {filteredProjects.length}
        {filteredProjects.length === 1
          ? ' proyecto encontrado'
          : ' proyectos encontrados'}
      </p>

      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-20 text-center">
          <p className="font-medium text-[#03002E]">
            No se encontraron proyectos
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Prueba con otra búsqueda o categoría.
          </p>
        </div>
      ) : (
        <div className="masonry-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="masonry-item">
              <UnidProjectCard
                project={project}
                onOpen={onOpenProject}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
