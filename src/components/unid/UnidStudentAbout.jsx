
export default function UnidStudentAbout({
  description = '',
  skills = [],
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-[#1A1510]">
        Acerca de
      </h2>

      <p className="mb-6 leading-relaxed text-[#625D59]">
        {description ||
          'Este estudiante todavía no ha agregado una descripción.'}
      </p>

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#1A1510]">
        Habilidades
      </h3>

      <div className="flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-[#F0D36B] bg-[#FFF8DF] px-3 py-1.5 text-xs font-medium text-[#03002E]"
            >
              {skill}
            </span>
          ))
        ) : (
          <p className="text-sm text-[#817A74]">
            No hay habilidades registradas.
          </p>
        )}
      </div>
    </section>
  );
}
