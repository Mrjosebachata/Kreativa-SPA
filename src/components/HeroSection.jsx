/* ============================================================
   ARCHIVO: src/components/HeroSection.jsx
   PROPÓSITO: Banner de bienvenida sobre el grid de servicios.

   Se oculta automáticamente cuando el usuario está buscando
   o filtrando por categoría, para dar más espacio a los resultados.
   ============================================================ */

/**
 * HeroSection — Banner de bienvenida de la plataforma.
 *
 * @param {Object}  props
 * @param {boolean} props.isVisible - Si `false`, el componente no renderiza nada.
 *                                    App.jsx lo controla según si hay búsqueda activa.
 */
function HeroSection({
  isVisible,
  searchValue = '',
  onSearch,
  onSearchSubmit,
  onStartProject,
}) {
  // Si hay una búsqueda o filtro activo, no mostramos el hero
  if (!isVisible) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-3 pt-14 text-center sm:px-6 lg:px-8 lg:pb-4 lg:pt-20">
      <div className="mx-auto max-w-4xl">

        {/* ── Headline principal ─────────────────────────────── */}
        <h1
          className="font-jakarta font-bold
                     mb-4 text-4xl font-bold leading-tight tracking-tight text-warm-900 sm:text-6xl lg:text-7xl"
        >
          Comisiona el trabajo{' '}
          {/*
           * Efecto de subrayado decorativo:
           * Un span con posición relativa y un fondo dorado semitransparente
           * por debajo (z-index negativo) crea el efecto de resaltado.
           */}
          <span className="relative inline-block">
            <span className="relative z-10 text-gold">perfecto</span>
            <span
              className="absolute bottom-1 left-0 w-full h-3
                         -z-10 h-3 w-full rounded bg-gold/25"
              aria-hidden="true"
            />
          </span>
          {' '}para tu proyecto.
        </h1>

        {/* ── Subtítulo ──────────────────────────────────────── */}
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-warm-600 sm:text-lg">
          Conecta con los mejores freelancers creativos de México.
          Diseño, desarrollo, fotografía, música y más — todo en un solo lugar.
        </p>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={onStartProject}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-black transition hover:bg-brand-light active:scale-95"
          >
            Empieza tu proyecto
          </button>
        </div>

        <form
          className="relative mx-auto mt-7 max-w-4xl"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
          role="search"
          aria-label="Buscar servicios creativos"
        >
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-warm-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5A7 7 0 1 1 3 10a7 7 0 0 1 14 0Z" />
            </svg>
          </span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Busca un proyecto, talento o categoría"
            className="w-full rounded-full border border-warm-200 bg-warm-50 py-4 pl-12 pr-4 text-left text-sm text-warm-900 outline-none transition placeholder:text-warm-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </form>

      </div>
    </section>
  );
}

export default HeroSection;
