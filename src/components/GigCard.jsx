/**
 * @param {Object}                          props
 * @param {import('../data/mockData').Gig}  props.gig - Datos del servicio
 * @param {Function}                        props.onSelectFreelancer - Callback al seleccionar la tarjeta
 */
function GigCard({ gig, onSelectFreelancer }) {
  const handleCardClick = () => {
    onSelectFreelancer(gig.id);
  };

  return (
    /*
     * `group` en el contenedor padre activa todos los `group-hover:`
     * en los elementos hijos cuando el mouse entra a ESTE elemento.
     * Es como un "event bus" de CSS.
     */
    <article
      className="group relative rounded-2xl overflow-hidden border border-warm-100 bg-warm-50 cursor-pointer
                 shadow-sm
                 hover:shadow-[0_12px_40px_rgba(26,21,16,0.16)]
                 transition-all duration-300 ease-out
                 hover:-translate-y-1"
      onClick={handleCardClick}
      aria-label={`Ver perfil de ${gig.author.name}: ${gig.title}`}
    >
      {/* ════════════════════════════════════════════════════
          SECCIÓN 1: IMAGEN PRINCIPAL
          La imagen es el corazón de la tarjeta (estilo Pinterest).
          ════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-warm-100">
        <img
          src={gig.image}
          alt={`Portafolio de ${gig.author.name}: ${gig.title}`}
          className="w-full h-auto object-cover
                     transition-transform duration-500 ease-out
                     group-hover:scale-105"
          loading="lazy"
        />

        {/* ── Badge de Categoría (esquina superior izquierda) ── */}
        <span
          className="absolute top-3 left-3
                     px-2.5 py-1 rounded-full
                     text-xs font-semibold text-warm-800
                     bg-cream-50/90 backdrop-blur-sm shadow-sm
                     transition-opacity duration-300"
        >
          {gig.category}
        </span>

        {/* ── Indicador de destacado ── */}
        {gig.isFeatured && (
          <span
            className="absolute right-3 top-3 text-2xl leading-none text-gold drop-shadow-[0_0_8px_rgba(192,108,255,0.65)]"
            title="Servicio destacado"
            aria-label="Servicio destacado"
          >
            ★
          </span>
        )}

        {/* Tinte morado que aparece al pasar el cursor. */}
        <div
          className="absolute inset-0
                     bg-gradient-to-t from-gold/75 via-gold/25 to-transparent
                     opacity-0 group-hover:opacity-100
                     transition-opacity duration-300 ease-out"
        />
      </div>

      {/* ════════════════════════════════════════════════════
          SECCIÓN 2: INFORMACIÓN DE LA TARJETA
          Siempre visible (no depende del hover).
          ════════════════════════════════════════════════════ */}
      <div className="p-3.5">
        {/* Título del servicio */}
        <h3 className="text-sm font-semibold text-warm-900 leading-snug mb-2.5 line-clamp-2">
          {gig.title}
        </h3>

        {/* Divisor y fila del autor */}
        <div className="border-t border-warm-100 pt-3">
          <div className="flex items-center justify-between">

            {/* Avatar + nombre del freelancer */}
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={gig.author.avatar}
                alt={`Foto de perfil de ${gig.author.name}`}
                className="w-7 h-7 rounded-full object-cover border-2 border-warm-100 flex-shrink-0"
              />
              <span className="text-xs font-medium text-warm-700 truncate">
                {gig.author.name}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-gold text-xs leading-none">★</span>
              <span className="text-xs font-bold text-warm-800">
                {gig.author.rating.toFixed(1)}
              </span>
            </div>

          </div>
        </div>
      </div>
    </article>
  );
}

export default GigCard;
