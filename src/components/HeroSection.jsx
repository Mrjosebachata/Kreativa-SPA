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
function HeroSection({ isVisible }) {
  // Si hay una búsqueda o filtro activo, no mostramos el hero
  if (!isVisible) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
      <div className="max-w-2xl">

        {/* ── Etiqueta de estado / badge decorativo ──────────── */}
        <div
          className="inline-flex items-center gap-2
                     px-3 py-1.5 rounded-full mb-5
                     bg-brand/10 border border-brand/20"
        >
          {/* Punto pulsante verde "en vivo" */}
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          <span className="text-xs font-semibold text-brand uppercase tracking-widest">
            Talento Creativo Mexicano
          </span>
        </div>

        {/* ── Headline principal ─────────────────────────────── */}
        <h1
          className="font-jakarta font-bold
                     text-4xl sm:text-5xl
                     text-warm-900 leading-tight tracking-tight mb-4"
        >
          Comisiona el trabajo{' '}
          {/*
           * Efecto de subrayado decorativo:
           * Un span con posición relativa y un fondo dorado semitransparente
           * por debajo (z-index negativo) crea el efecto de resaltado.
           */}
          <span className="relative inline-block">
            <span className="relative z-10">perfecto</span>
            <span
              className="absolute bottom-1 left-0 w-full h-3
                         bg-gold/35 rounded -z-10"
              aria-hidden="true"
            />
          </span>
          {' '}para tu proyecto.
        </h1>

        {/* ── Subtítulo ──────────────────────────────────────── */}
        <p className="text-warm-600 text-lg leading-relaxed">
          Conecta con los mejores freelancers creativos de México.
          Diseño, desarrollo, fotografía, música y más — todo en un solo lugar.
        </p>

        {/* ── Stats rápidas ──────────────────────────────────── */}
        {/*
          TODO: Obtener estos números desde la API:
          fetch('/api/stats').then(res => res.json()).then(setStats)
        */}
        <div className="flex items-center gap-6 mt-6">
          {[
            { value: '2,400+', label: 'Freelancers' },
            { value: '15K+',   label: 'Proyectos completados' },
            { value: '98%',    label: 'Clientes satisfechos' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold text-warm-900">{stat.value}</p>
              <p className="text-xs text-warm-500">{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default HeroSection;