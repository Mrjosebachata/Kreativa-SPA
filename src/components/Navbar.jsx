/* ============================================================
   ARCHIVO: src/components/Navbar.jsx
   PROPÓSITO: Barra de navegación principal (sticky).

   CONTIENE:
   - Logo de la plataforma (KREATIVA)
   - Buscador central (búsqueda en tiempo real)
   - Botones de autenticación (Entrar / Publicar Servicio)
   - Menú hamburguesa para móvil
   ============================================================ */

import { useState } from 'react';

/**
 * Navbar — Barra de navegación superior fija.
 *
 * @param {Object}   props
 * @param {Function} props.onSearch - Callback que recibe el string de búsqueda.
 *                                    Se llama en cada keystroke (tiempo real).
 */
function Navbar({ onSearch }) {
  const [searchValue, setSearchValue]       = useState('');
  const [isMobileMenuOpen, setMobileMenu]   = useState(false);

  /**
   * Maneja cambios en el input de búsqueda.
   * Actualiza el estado local Y notifica al padre (App.jsx) en tiempo real.
   */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value); // ← notifica a App.jsx → llega a MasonryGrid
  };

  /**
   * Limpia el buscador completamente.
   */
  const handleClearSearch = () => {
    setSearchValue('');
    onSearch('');
  };

  /**
   * Evita el comportamiento por defecto del form al presionar Enter.
   */
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

          {/* ══════════════════════════════════════════════════
              LOGO
              ══════════════════════════════════════════════════ */}
          <a
            href="/"
            className="flex items-center gap-1.5 flex-shrink-0 group"
            aria-label="KREATIVA — Ir al inicio"
          >
            {/* Punto decorativo del logo */}
            <span
              className="w-2.5 h-2.5 rounded-full bg-brand
                         transition-transform duration-200 group-hover:scale-125"
            />
            {/* Nombre de la plataforma */}
            <span className="font-syne font-extrabold text-xl tracking-tight text-warm-900">
              KREATIVA
            </span>
          </a>

          {/* ══════════════════════════════════════════════════
              BUSCADOR CENTRAL (oculto en móvil, visible en sm+)
              ══════════════════════════════════════════════════ */}
          <form
            onSubmit={handleFormSubmit}
            className="flex-1 max-w-lg hidden sm:block"
            role="search"
            aria-label="Buscar servicios"
          >
            <div className="relative">
              {/* Ícono de lupa */}
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

              {/* Input de búsqueda */}
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

              {/* Botón para limpiar la búsqueda (aparece si hay texto) */}
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

          {/* ══════════════════════════════════════════════════
              BOTONES DE AUTENTICACIÓN

              TODO: Conectar con tu sistema de auth:
              - Firebase Auth: signInWithGoogle()
              - NextAuth.js / Auth.js: signIn()
              - Tu propio JWT: navigate('/login')
              ══════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Botón Entrar (ghost) */}
            <button
              className="hidden sm:inline-flex px-4 py-2 rounded-xl
                         text-sm font-medium text-warm-700
                         hover:text-warm-900 hover:bg-warm-100
                         transition-all duration-200"
              onClick={() => alert('TODO: Abrir modal de login')}
            >
              Entrar
            </button>

            {/* Botón Publicar Servicio (primario) */}
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                         text-sm font-bold text-white
                         bg-brand hover:bg-brand-dark active:scale-95
                         transition-all duration-200 transform shadow-sm"
              onClick={() => alert('TODO: Abrir formulario de publicación')}
            >
              <span className="hidden sm:inline">Publicar Servicio</span>
              {/* En móvil solo el ícono "+" */}
              <span className="sm:hidden text-lg leading-none">+</span>
            </button>

            {/* Botón hamburguesa (solo móvil) */}
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
                    ? 'M6 18L18 6M6 6l12 12'   // ✕ cerrar
                    : 'M4 6h16M4 12h16M4 18h16' // ≡ hamburguesa
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            MENÚ MÓVIL (desplegable)
            Solo visible en pantallas pequeñas cuando se abre.
            ══════════════════════════════════════════════════ */}
        {isMobileMenuOpen && (
          <div className="sm:hidden py-3 border-t border-warm-100 space-y-2">

            {/* Buscador en móvil */}
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

            {/* Link Entrar (móvil) */}
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