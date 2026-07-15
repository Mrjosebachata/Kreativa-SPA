import { useState } from 'react';
 
/**
 * Navbar — Barra de navegación principal (actualizada).
 *
 * @param {Object}   props
 * @param {Function} props.onSearch - Callback que recibe el string de búsqueda
 * @param {Function} props.onOpenMessaging - Callback para abrir mensajes
 * @param {number}   props.unreadCount - Número de mensajes sin leer
 */
function Navbar({ onSearch, onOpenMessaging, unreadCount = 0 }) {
  const [searchValue, setSearchValue]       = useState('');
  const [isMobileMenuOpen, setMobileMenu]   = useState(false);
 
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };
 
  const handleClearSearch = () => {
    setSearchValue('');
    onSearch('');
  };
 
  const handleFormSubmit = (e) => {
    e.preventDefault();
  };
 
  return (
    <header
      className="sticky top-0 z-50
                 bg-cream-50/90 backdrop-blur-md
                 border-b border-warm-100"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
 
          {/* LOGO */}
          <a
            href="/"
            className="flex items-center gap-1.5 flex-shrink-0 group"
            aria-label="KREATIVA — Ir al inicio"
          >
            <span
              className="w-2.5 h-2.5 rounded-full bg-brand
                         transition-transform duration-200 group-hover:scale-125"
            />
            <span className="font-syne font-extrabold text-xl tracking-tight text-warm-900">
              KREATIVA
            </span>
          </a>
 
          {/* BUSCADOR (desktop) */}
          <form
            onSubmit={handleFormSubmit}
            className="flex-1 max-w-lg hidden sm:block"
            role="search"
            aria-label="Buscar servicios"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-warm-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
 
              <input
                type="search"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Busca diseñadores, fotógrafos, desarrolladores..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                           bg-cream-100 border border-warm-200
                           text-warm-900 placeholder-warm-400
                           focus:outline-none focus:ring-2 focus:ring-brand/25
                           focus:border-brand focus:bg-white
                           transition-all duration-200"
              />
 
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-3.5 flex items-center
                             text-warm-400 hover:text-warm-700
                             transition-colors duration-200"
                  aria-label="Limpiar búsqueda"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
 
          {/* BOTONES DERECHA */}
          <div className="flex items-center gap-2 flex-shrink-0">
 
            {/* BOTÓN MENSAJES (nuevo) */}
            <button
              onClick={onOpenMessaging}
              className="relative p-2.5 rounded-xl
                         text-warm-700 hover:text-warm-900 hover:bg-warm-100
                         transition-all duration-200"
              aria-label={`Mensajes ${unreadCount > 0 ? `(${unreadCount} sin leer)` : ''}`}
              title="Ir a mensajes"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              
              {/* Badge de no leídos */}
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
 
            {/* BOTÓN ENTRAR (desktop) */}
            <button
              className="hidden sm:inline-flex px-4 py-2 rounded-xl
                         text-sm font-medium text-warm-700
                         hover:text-warm-900 hover:bg-warm-100
                         transition-all duration-200"
              onClick={() => alert('TODO: Abrir modal de login')}
            >
              Entrar
            </button>
 
            {/* BOTÓN PUBLICAR SERVICIO */}
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                         text-sm font-bold text-white
                         bg-brand hover:bg-brand-dark active:scale-95
                         transition-all duration-200 transform shadow-sm"
              onClick={() => alert('TODO: Abrir formulario de publicación')}
            >
              <span className="hidden sm:inline">Publicar Servicio</span>
              <span className="sm:hidden text-lg leading-none">+</span>
            </button>
 
            {/* BOTÓN HAMBURGUESA (mobile) */}
            <button
              onClick={() => setMobileMenu(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-xl text-warm-600
                         hover:bg-warm-100 transition-colors duration-200"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={isMobileMenuOpen
                    ? 'M6 18L18 6M6 6l12 12'
                    : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
 
        {/* MENÚ MÓVIL */}
        {isMobileMenuOpen && (
          <div className="sm:hidden py-3 border-t border-warm-100 space-y-2">
            <form onSubmit={handleFormSubmit} role="search">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="search"
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Buscar servicios..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                             bg-cream-100 border border-warm-200 text-warm-900
                             placeholder-warm-400 focus:outline-none
                             focus:ring-2 focus:ring-brand/25 focus:border-brand"
                />
              </div>
            </form>
 
            <button
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm
                         font-medium text-warm-700 hover:bg-warm-100
                         transition-colors duration-200"
              onClick={() => alert('TODO: Abrir modal de login')}
            >
              Entrar
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
 
export default Navbar;