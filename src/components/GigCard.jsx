/**
 * GigCard — Tarjeta de presentación de un servicio freelance.
 *
 * Usa la clase `group` de Tailwind para coordinar todos los
 * efectos hover desde el contenedor padre, sin useState.
 * Esto es más eficiente ya que no genera re-renders de React.
 *
 * @param {Object}                          props
 * @param {import('../data/mockData').Gig}  props.gig - Datos del servicio
 */
function GigCard({ gig }) {
  // Formatea el precio en pesos mexicanos (ej: $1,500)
  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style:                 'currency',
    currency:              'MXN',
    minimumFractionDigits: 0,
  }).format(gig.price);

  /**
   * Acción al hacer clic en "Comisionar".
   * stopPropagation evita que el clic también active handleCardClick.
   *
   * TODO: Conectar con tu sistema de checkout o carrito:
   *   - Con react-router-dom: navigate(`/checkout/${gig.id}`)
   *   - O abrir un modal: setCheckoutModal({ open: true, gigId: gig.id })
   */
  const handleComisionar = (e) => {
    e.stopPropagation();
    alert(`¡Próximamente! Checkout para:\n"${gig.title}"`);
  };

  /**
   * Acción al hacer clic en la tarjeta completa.
   *
   * TODO: Navegar a la página de detalle del servicio:
   *   navigate(`/gig/${gig.id}`) — requiere react-router-dom
   */
  const handleCardClick = () => {
    console.log(`Ver detalle del gig ID: ${gig.id}`);
  };

  return (
    /*
     * `group` en el contenedor padre activa todos los `group-hover:`
     * en los elementos hijos cuando el mouse entra a ESTE elemento.
     * Es como un "event bus" de CSS.
     */
    <article
      className="group relative rounded-2xl overflow-hidden bg-white cursor-pointer
                 shadow-sm
                 hover:shadow-[0_12px_40px_rgba(26,21,16,0.16)]
                 transition-all duration-300 ease-out
                 hover:-translate-y-1"
      onClick={handleCardClick}
      aria-label={`Servicio: ${gig.title} — Desde ${formattedPrice}`}
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
                     bg-white/90 backdrop-blur-sm shadow-sm
                     transition-opacity duration-300"
        >
          {gig.category}
        </span>

        {/* ── Badge de Destacado (esquina superior derecha) ── */}
        {gig.isFeatured && (
          <span
            className="absolute top-3 right-3
                       px-2.5 py-1 rounded-full
                       text-xs font-bold text-white
                       bg-brand shadow-sm"
          >
            ✦ Destacado
          </span>
        )}

        {/* ════════════════════════════════════════════════════
            OVERLAY DE HOVER
            Gradiente oscuro que sube desde la parte inferior.
            Contiene el precio y el botón "Comisionar".

            Técnica:
            - opacity-0 por defecto → invisible
            - group-hover:opacity-100 → visible al hacer hover en <article>
            - El contenido interno también tiene una animación de
              translate para dar sensación de movimiento hacia arriba.
            ════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0
                     bg-gradient-to-t from-warm-900/90 via-warm-900/40 to-transparent
                     flex flex-col justify-end p-4
                     opacity-0 group-hover:opacity-100
                     transition-opacity duration-300 ease-out"
        >
          {/* Contenido del overlay (sube un poco al aparecer) */}
          <div
            className="translate-y-3 group-hover:translate-y-0
                       transition-transform duration-300 ease-out"
          >
            {/* Precio */}
            <p className="text-white/65 text-xs font-medium mb-0.5">
              Desde
            </p>
            <p className="text-white text-2xl font-bold leading-none mb-3.5">
              {formattedPrice}
            </p>

            {/* Botón principal de acción */}
            <button
              onClick={handleComisionar}
              className="w-full py-2.5 px-4 rounded-xl
                         bg-brand hover:bg-brand-light active:scale-95
                         text-white text-sm font-bold
                         transition-all duration-200 transform"
            >
              Comisionar →
            </button>
          </div>
        </div>
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

        {/* Etiquetas / Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Mostramos solo las primeras 2 etiquetas para no saturar */}
          {gig.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full
                         text-xs font-medium
                         bg-warm-100 text-warm-600"
            >
              {tag}
            </span>
          ))}
        </div>

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

            {/* Rating con estrella y número de reseñas */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Estrella dorada */}
              <span className="text-gold text-xs leading-none">★</span>
              <span className="text-xs font-bold text-warm-800">
                {gig.author.rating.toFixed(1)}
              </span>
              <span className="text-xs text-warm-400">
                ({gig.author.reviews})
              </span>
            </div>

          </div>
        </div>
      </div>
    </article>
  );
}

export default GigCard;