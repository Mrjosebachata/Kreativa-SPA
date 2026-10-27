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
    <div className="sticky top-16 z-40 bg-cream-100/90 backdrop-blur-md">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/*
         * overflow-x-auto + hide-scrollbar:
         * Permite scroll horizontal en móvil sin mostrar el scrollbar.
         * La clase `hide-scrollbar` está definida en src/index.css.
         */}
        <div
          className="flex items-center gap-2 overflow-x-auto py-2 hide-scrollbar"
          role="tablist"
          aria-label="Filtrar por categoría"
        >
          {categories.map((category) => {
            const isActive = category === activeCategory;
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
                    ? 'bg-brand text-black shadow-[0_0_24px_rgba(215,255,63,0.18)]'
                    : 'border border-warm-200 bg-transparent text-warm-600 hover:border-brand hover:text-warm-900'
                  }
                `}
              >
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
