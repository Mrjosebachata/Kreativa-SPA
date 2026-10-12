
export default function UnidProjectCard({ project, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(project)}
      className="group block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#FFC514]"
      aria-label={`Ver perfil de ${project.author}`}
    >
      <div className="relative overflow-hidden bg-slate-100">
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#03002E]/85 to-transparent px-3 pb-3 pt-12 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
          <span className="text-xs font-semibold text-white">
            Ver perfil del estudiante →
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold leading-snug text-[#03002E]">
          {project.title}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {project.author}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#F1F0F8] px-2 py-1 text-[11px] text-[#03002E]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
