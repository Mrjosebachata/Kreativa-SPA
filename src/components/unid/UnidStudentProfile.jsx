
import UnidStudentPortfolio from './UnidStudentPortfolio';
import UnidStudentAbout from './UnidStudentAbout';

const students = {
  'design-01': {
    id: 'design-01',
    name: 'Estudiante de Diseño Gráfico',
    initials: 'DG',
    specialty: 'Diseño gráfico e identidad visual',
    bio: 'Estudiante de UNID con interés en identidad visual, diseño editorial y comunicación gráfica.',
    skills: ['Branding', 'Identidad', 'Editorial', 'Tipografía', 'Packaging'],
  },
  'art-01': {
    id: 'art-01',
    name: 'Estudiante de Ilustración',
    initials: 'IL',
    specialty: 'Ilustración y arte digital',
    bio: 'Estudiante de UNID con interés en ilustración, narrativa visual y expresión artística.',
    skills: ['Ilustración', 'Arte digital', 'Concept Art', 'Animación'],
  },
  'photo-01': {
    id: 'photo-01',
    name: 'Estudiante de Comunicación',
    initials: 'CO',
    specialty: 'Fotografía y comunicación visual',
    bio: 'Estudiante de UNID con interés en fotografía, composición y comunicación visual.',
    skills: ['Fotografía', 'Composición', 'Retrato'],
  },
  'dev-01': {
    id: 'dev-01',
    name: 'Estudiante de Ingeniería',
    initials: 'IS',
    specialty: 'Desarrollo web y diseño de interfaces',
    bio: 'Estudiante de UNID enfocado en desarrollo frontend y experiencias digitales.',
    skills: ['React', 'Frontend', 'UI / UX', 'Diseño web'],
  },
};

export default function UnidStudentProfile({
  project,
  projects,
  onBack,
}) {
  const student = students[project.studentId] || {
    id: project.studentId,
    name: project.author,
    initials: 'U',
    specialty: project.category,
    bio: project.description,
    skills: project.tags,
  };

  const portfolioProjects = projects.filter(
    (item) => item.studentId === project.studentId
  );

  const images = portfolioProjects.map((item) => item.image);

  return (
    <main className="min-h-screen bg-[#F8F4EF] pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-[#625D59] transition hover:bg-white hover:text-[#03002E]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* ENCABEZADO DEL PERFIL */}
        <div className="mb-10 mt-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#03002E] text-2xl font-bold text-[#FFC514] shadow-md">
              {student.initials}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="mb-2 text-3xl font-bold text-[#1A1510] sm:text-4xl">
                {student.name}
              </h1>

              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-[#03002E]">
                  <span className="h-2 w-2 rounded-full bg-[#FFC514]" />
                  Estudiante UNID
                </span>

                <span className="text-[#817A74]">
                  {student.specialty}
                </span>
              </div>

              <p className="text-[#625D59]">{student.bio}</p>
            </div>
          </div>
        </div>

        {/* CONTENIDO DEL PERFIL */}
        <div className="mb-10 grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <UnidStudentPortfolio
              images={images}
              studentName={student.name}
            />

            <UnidStudentAbout
              description={student.bio}
              skills={student.skills}
            />
          </div>

          {/* PANEL LATERAL */}
          <aside className="self-start rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1A1510]">
              Información profesional
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs text-[#817A74]">
                  Institución
                </p>
                <p className="mt-1 text-sm font-semibold text-[#03002E]">
                  Universidad Interamericana para el Desarrollo
                </p>
              </div>

              <div>
                <p className="text-xs text-[#817A74]">
                  Especialidad
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1A1510]">
                  {student.specialty}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#817A74]">
                  Proyectos publicados
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1A1510]">
                  {portfolioProjects.length}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#F0E2A6] bg-[#FFF9E8] p-5 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FFC514]/20 text-xl">
                ✉
              </div>

              <h3 className="mt-3 text-sm font-bold text-[#03002E]">
                Contacta al estudiante
              </h3>

              <p className="mt-2 text-xs leading-6 text-[#625D59]">
                Próximamente podrás comunicarte con estudiantes
                y conocer sus oportunidades de colaboración.
              </p>

              <button
                type="button"
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-xl bg-[#03002E] px-4 py-3 text-sm font-bold text-white opacity-60"
              >
                Contactar · Próximamente
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
