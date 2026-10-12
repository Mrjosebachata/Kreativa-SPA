
import { useEffect, useState } from 'react';
import UnidProjectGrid from './UnidProjectGrid';
import UnidStudentProfile from './UnidStudentProfile';

const projects = [
  {
    id: 1,
    studentId: 'design-01',
    title: 'Identidad visual contemporánea',
    author: 'Estudiante de Diseño Gráfico',
    category: 'Diseño Gráfico',
    tags: ['Branding', 'Identidad'],
    image: 'https://picsum.photos/seed/unid-branding/600/850',
    description: 'Propuesta de identidad visual desarrollada como proyecto académico.',
  },
  {
    id: 2,
    studentId: 'art-01',
    title: 'Ilustración y expresión visual',
    author: 'Estudiante de Ilustración',
    category: 'Ilustración',
    tags: ['Ilustración', 'Arte digital'],
    image: 'https://picsum.photos/seed/unid-ilustracion/600/620',
    description: 'Exploración de técnicas de ilustración y comunicación visual.',
  },
  {
    id: 3,
    studentId: 'photo-01',
    title: 'Fotografía creativa',
    author: 'Estudiante de Comunicación',
    category: 'Fotografía',
    tags: ['Fotografía', 'Composición'],
    image: 'https://picsum.photos/seed/unid-fotografia/600/920',
    description: 'Proyecto fotográfico enfocado en composición e iluminación.',
  },
  {
    id: 4,
    studentId: 'dev-01',
    title: 'Diseño de interfaces digitales',
    author: 'Estudiante de Ingeniería',
    category: 'Desarrollo Web',
    tags: ['UI / UX', 'Diseño web'],
    image: 'https://picsum.photos/seed/unid-web/600/700',
    description: 'Interfaz digital centrada en la experiencia del usuario.',
  },
  {
    id: 5,
    studentId: 'design-01',
    title: 'Cartel editorial experimental',
    author: 'Estudiante de Diseño Gráfico',
    category: 'Diseño Gráfico',
    tags: ['Editorial', 'Tipografía'],
    image: 'https://picsum.photos/seed/unid-editorial/600/980',
    description: 'Experimentación tipográfica y composición editorial.',
  },
  {
    id: 6,
    studentId: 'art-01',
    title: 'Animación y narrativa visual',
    author: 'Estudiante de Ilustración',
    category: 'Animación',
    tags: ['Motion', 'Animación'],
    image: 'https://picsum.photos/seed/unid-motion/600/750',
    description: 'Narrativa visual mediante animación digital.',
  },
  {
    id: 7,
    studentId: 'design-01',
    title: 'Concepto de marca y empaque',
    author: 'Estudiante de Diseño Gráfico',
    category: 'Diseño Gráfico',
    tags: ['Packaging', 'Branding'],
    image: 'https://picsum.photos/seed/unid-packaging/600/680',
    description: 'Diseño de identidad y empaque para un producto conceptual.',
  },
  {
    id: 8,
    studentId: 'dev-01',
    title: 'Diseño y desarrollo frontend',
    author: 'Estudiante de Ingeniería',
    category: 'Desarrollo Web',
    tags: ['React', 'Frontend'],
    image: 'https://picsum.photos/seed/unid-frontend/600/900',
    description: 'Desarrollo académico de una aplicación web.',
  },
  {
    id: 9,
    studentId: 'photo-01',
    title: 'Composición fotográfica',
    author: 'Estudiante de Comunicación',
    category: 'Fotografía',
    tags: ['Retrato', 'Fotografía'],
    image: 'https://picsum.photos/seed/unid-retrato/600/780',
    description: 'Serie fotográfica de composición y retrato.',
  },
  {
    id: 10,
    studentId: 'art-01',
    title: 'Arte digital e ilustración',
    author: 'Estudiante de Ilustración',
    category: 'Ilustración',
    tags: ['Digital', 'Concept Art'],
    image: 'https://picsum.photos/seed/unid-digital/600/1050',
    description: 'Ilustración conceptual desarrollada en medios digitales.',
  },
];

const categories = [
  'Todos',
  'Diseño Gráfico',
  'Ilustración',
  'Fotografía',
  'Desarrollo Web',
  'Animación',
];

export default function UnidPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedProject, setSelectedProject] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isFiltering =
    query.trim().length > 0 || activeCategory !== 'Todos';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedProject]);

  const openProject = (project) => {
    setSelectedProject(project);
    setMobileMenuOpen(false);
  };

  const goHome = () => {
    setSelectedProject(null);
    setMobileMenuOpen(false);
  };

  const goToProjects = () => {
    setSelectedProject(null);
    setMobileMenuOpen(false);

    requestAnimationFrame(() => {
      document.getElementById('proyectos')?.scrollIntoView({
        behavior: 'smooth',
      });
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F4EF] text-[#03002E]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 h-16 border-b border-[#03002E]/10 bg-white/95 backdrop-blur-md">
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={goHome}
            className="flex shrink-0 items-center gap-2 text-left"
            aria-label="Inicio UNID"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#03002E] text-lg font-black text-white">
              U<span className="text-[#FFC514]">.</span>
            </div>

            <div className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight">
                UNID
              </span>
              <span className="block text-[10px] font-medium text-slate-500">
                × Kreativa
              </span>
            </div>
          </button>

          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <button
              type="button"
              onClick={goHome}
              className="transition hover:text-[#9A7700]"
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={goToProjects}
              className="transition hover:text-[#9A7700]"
            >
              Explorar proyectos
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-full bg-[#03002E] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17114F] sm:text-sm"
            >
              Volver a Kreativa
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir navegación"
              aria-expanded={mobileMenuOpen}
              className="rounded-lg border border-[#03002E]/15 px-3 py-2 text-sm md:hidden"
            >
              ☰
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-16 flex flex-col gap-4 border-b bg-white px-6 py-5 text-sm md:hidden">
            <button type="button" onClick={goHome} className="text-left">
              Inicio
            </button>
            <button
              type="button"
              onClick={goToProjects}
              className="text-left"
            >
              Explorar proyectos
            </button>
          </div>
        )}
      </header>

      {selectedProject ? (
        <UnidStudentProfile
          project={selectedProject}
          projects={projects}
          onBack={goHome}
        />
      ) : (
        <main>
          {/* HERO */}
          {!isFiltering && (
            <section
              id="inicio"
              className="bg-[#03002E] px-4 pb-14 pt-14 text-center sm:px-6 sm:pb-16 sm:pt-16 lg:px-8"
            >
              <div className="mx-auto max-w-3xl">
                <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                  Descubre el talento{' '}
                  <span className="text-[#FFC514]">creativo</span>{' '}
                  de UNID.
                </h1>

                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#E4E2F3]">
                  Explora proyectos, descubre nuevas ideas y conoce
                  el trabajo de los estudiantes de nuestra universidad.
                  Todo en un solo lugar.
                </p>

                <button
                  type="button"
                  onClick={goToProjects}
                  className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#FFC514] px-6 py-3 text-sm font-bold text-[#03002E] shadow-sm transition hover:bg-[#FFD64D]"
                >
                  Explorar portafolios
                  <span className="ml-2">→</span>
                </button>
              </div>
            </section>
          )}

          {/* BUSCADOR Y FILTROS */}
          <section
            id="proyectos"
            className="sticky top-16 z-40 scroll-mt-16 border-b border-[#03002E]/10 bg-[#F8F4EF]/95 backdrop-blur-md"
          >
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="relative mb-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 5 5" />
                </svg>

                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar proyectos, estudiantes o especialidades..."
                  aria-label="Buscar proyectos"
                  className="w-full rounded-xl border border-[#03002E]/15 bg-white py-3 pl-11 pr-4 text-sm text-[#03002E] outline-none transition placeholder:text-slate-400 focus:border-[#03002E] focus:ring-2 focus:ring-[#FFC514]/40"
                />
              </div>

              <div
                className="hide-scrollbar flex items-center gap-2 overflow-x-auto"
                role="group"
                aria-label="Filtrar proyectos por categoría"
              >
                {categories.map((category) => {
                  const active = activeCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      aria-pressed={active}
                      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
                        active
                          ? 'bg-[#03002E] text-white shadow-sm'
                          : 'bg-[#EEEEF5] text-[#55536A] hover:bg-[#E2E2EE]'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* GALERÍA MASONRY */}
          <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            <UnidProjectGrid
              projects={projects}
              searchQuery={query}
              activeCategory={activeCategory}
              onOpenProject={openProject}
            />
          </section>
        </main>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#03002E]/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="font-bold text-[#03002E]">
              UNID <span className="text-[#C49A00]">×</span> Kreativa
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Espacio de presentación de portafolios universitarios.
            </p>
          </div>

          <a
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-[#03002E]"
          >
            Regresar a Kreativa →
          </a>
        </div>
      </footer>
    </div>
  );
}
