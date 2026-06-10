const CATEGORY_ICONS = {
  'Todos':          '🎯',
  'Diseño Gráfico': '🎨',
  'Ilustración':    '✏️',
  'Fotografía':     '📷',
  'Desarrollo Web': '💻',
  'Video & Motion': '🎬',
  'Música & Audio': '🎵',
  'Copywriting':    '📝',
  'Animación 3D':   '🧊',
};

/**
 * CategoryFilter — Barra de filtros por categoría.
 *
 * @param {Object}   props
 * @param {string[]} props.categories       - Lista de categorías disponibles
 * @param {string}   props.activeCategory   - Categoría actualmente activa
 * @param {Function} props.onCategoryChange - Callback al seleccionar una categoría
 */
function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  return (
    /*
     * sticky + top-16: se queda fijo justo debajo del Navbar (h-16 = 64px).
     * z-40: por debajo del Navbar (z-50) pero sobre el contenido.
     */
    <div className="sticky top-16 z-40 bg-cream-50/90 backdrop-blur-md border-b border-warm-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/*
         * overflow-x-auto + hide-scrollbar:
         * Permite scroll horizontal en móvil sin mostrar el scrollbar.
         * La clase `hide-scrollbar` está definida en src/index.css.
         */}
        <div
          className="flex items-center gap-2 py-3 overflow-x-auto hide-scrollbar"
          role="tablist"
          aria-label="Filtrar por categoría"
        >
          {categories.map((category) => {
            const isActive = category === activeCategory;
            const icon     = CATEGORY_ICONS[category] || '📌';

            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                role="tab"
                aria-selected={isActive}
                aria-label={`Filtrar: ${category}`}
                className={`
                  /* Layout */
                  flex-shrink-0 flex items-center gap-1.5
                  px-4 py-2 rounded-full
                  whitespace-nowrap
                  
                  /* Tipografía */
                  text-sm font-medium
                  
                  /* Interacción */
                  transition-all duration-200
                  active:scale-95 transform
                  focus:outline-none focus:ring-2 focus:ring-brand/30
                  
                  /* Estilos condicionales: activo vs inactivo */
                  ${isActive
                    ? 'bg-warm-900 text-white shadow-md'
                    : 'bg-cream-200 text-warm-600 hover:bg-warm-200 hover:text-warm-900'
                  }
                `}
              >
                <span role="img" aria-hidden="true">{icon}</span>
                <span>{category}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default CategoryFilter;