import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import AccountStatusBanner from './moderation/AccountStatusBanner';

function Navbar({
  onSearch,
  onSearchSubmit,
  onOpenMessaging,
  onOpenNotifications,
  onPublishService,
  onConfigureProfile,
  onViewProfile,
  onOpenDashboard,
  onOpenModeration,
  unreadCount = 0,
  unreadNotificationCount = 0,
  showSearch = true,
  searchValue: controlledSearchValue = '',
}) {
  const {
    user,
    profile,
    isAuthenticated,
    isAdmin,
    openAuthModal,
    requireAuth,
    signOut,
  } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [isMobileMenuOpen, setMobileMenu] = useState(false);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setSearchValue(controlledSearchValue);
  }, [controlledSearchValue]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Mi cuenta';
  const avatarUrl = profile?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();
  const isFreelancer = ['freelancer', 'both'].includes(
    profile?.marketplace_role ?? profile?.role
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onSearch('');
    onSearchSubmit?.('');
  };

  const handleOpenMessaging = () => {
    setMobileMenu(false);
    requireAuth(
      onOpenMessaging,
      'Inicia sesión para acceder a tus conversaciones.'
    );
  };

  const handleOpenNotifications = () => {
    setMobileMenu(false);
    requireAuth(
      onOpenNotifications,
      'Inicia sesión para consultar tus notificaciones.'
    );
  };

  const handlePublishService = () => {
    setMobileMenu(false);
    requireAuth(
      onPublishService,
      'Inicia sesión para publicar un servicio.'
    );
  };

  const handleConfigureProfile = () => {
    setMobileMenu(false);
    setAccountMenuOpen(false);
    requireAuth(
      onConfigureProfile,
      'Inicia sesión para configurar tu perfil creativo.'
    );
  };

  const handleViewProfile = () => {
    setMobileMenu(false);
    setAccountMenuOpen(false);
    requireAuth(
      onViewProfile,
      'Inicia sesión para ver tu perfil creativo.'
    );
  };

  const handleOpenDashboard = () => {
    setMobileMenu(false);
    setAccountMenuOpen(false);
    requireAuth(onOpenDashboard, 'Inicia sesión para abrir tu tablero.');
  };

  const handleOpenModeration = () => {
    setMobileMenu(false);
    setAccountMenuOpen(false);
    requireAuth(onOpenModeration, 'Inicia sesión para abrir moderación.');
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      setAccountMenuOpen(false);
      setMobileMenu(false);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      window.alert('No se pudo cerrar la sesión. Intenta nuevamente.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const AccountSummary = ({ compact = false }) => (
    <div className={`flex items-center gap-3 ${compact ? '' : 'min-w-0'}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
          {initial}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-warm-900">
            {displayName}
          </span>
          {isAdmin && (
            <span className="!bg-transparent !p-0 !text-gold text-[10px] font-bold uppercase tracking-wide">
              ADMIN
            </span>
          )}
        </div>
        {!compact && (
          <p className="truncate text-xs text-warm-500">{user?.email}</p>
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-warm-100 bg-cream-50/90 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <a
            href="/"
            className="group flex flex-shrink-0 items-center gap-1.5"
            aria-label="KREATIVA — Ir al inicio"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_12px_rgba(215,255,63,0.6)] transition-transform duration-200 group-hover:scale-125" />
            <span className="font-syne text-xl font-extrabold tracking-tight text-warm-900">
              KREATIVA
            </span>
          </a>

          {showSearch && <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit?.();
            }}
            className="hidden max-w-lg flex-1 sm:block"
            role="search"
            aria-label="Buscar servicios"
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <svg
                  className="h-4 w-4 text-warm-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m21 21-6-6m2-5A7 7 0 1 1 3 10a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>

              <input
                type="search"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Busca diseñadores, fotógrafos, desarrolladores..."
                className="w-full appearance-none rounded-full border border-warm-200 bg-cream-100 py-2.5 pl-10 pr-10 text-sm text-warm-900 outline-none transition-all duration-200 placeholder:text-warm-400 focus:border-brand focus:bg-warm-50 focus:ring-2 focus:ring-brand/25"
              />

              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-3.5 flex items-center text-warm-400 transition-colors hover:text-warm-700"
                  aria-label="Limpiar búsqueda"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </form>}

          <div className="flex flex-shrink-0 items-center gap-2">
            
            {/* ACCESO AL ESPACIO UNIVERSITARIO */}
            <a
              href="/unid"
              className="inline-flex items-center px-1 py-2 font-syne text-sm font-extrabold tracking-tight text-warm-900 underline decoration-brand decoration-2 underline-offset-4 transition hover:text-brand"
              aria-label="Visitar el espacio universitario UNID"
            >
              UNID
            </a>

            {isAuthenticated && <button
              type="button"
              onClick={handleOpenNotifications}
              className="relative rounded-xl p-2.5 text-gold transition-all duration-200 hover:bg-gold/10 hover:text-gold-light"
              aria-label={`Notificaciones${unreadNotificationCount > 0 ? ` (${unreadNotificationCount} sin leer)` : ""}`}
              title="Ver notificaciones"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
                />
              </svg>
              {unreadNotificationCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </button>}

            {isAuthenticated && <button
              type="button"
              onClick={handleOpenMessaging}
              className="relative rounded-xl p-2.5 text-gold transition-all duration-200 hover:bg-gold/10 hover:text-gold-light"
              aria-label={`Mensajes${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
              title="Ir a mensajes"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.7 8.7 0 0 1-3.5-.74L4 20l1.2-4.1A8.5 8.5 0 1 1 21 11.5Z"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>}

            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
                  className="rounded-xl px-2 py-1.5 transition-colors hover:bg-warm-100"
                  aria-haspopup="menu"
                  aria-expanded={isAccountMenuOpen}
                >
                  <AccountSummary compact />
                </button>

                {isAccountMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-72 rounded-2xl border border-warm-100 bg-warm-50 p-3 shadow-xl"
                  >
                    <div className="border-b border-warm-100 px-2 pb-3 pt-1">
                      <AccountSummary />
                    </div>
                    {isFreelancer && <button
                      type="button"
                      role="menuitem"
                      onClick={handleConfigureProfile}
                      className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-warm-700 transition-colors hover:bg-warm-100 hover:text-warm-900"
                    >
                      <svg
                        className="h-4 w-4 text-warm-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232 18.768 8.768M16.732 3.732a2.5 2.5 0 0 1 3.536 3.536L7.5 20.036 3 21l.964-4.5L16.732 3.732Z"
                        />
                      </svg>
                      Configurar perfil creativo
                    </button>}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleViewProfile}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-warm-700 transition-colors hover:bg-warm-100 hover:text-warm-900"
                    >
                      <svg className="h-4 w-4 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 0c-1.6 4-4.6 6-9 6s-7.4-2-9-6c1.6-4 4.6-6 9-6s7.4 2 9 6Z" />
                      </svg>
                      Ver mi perfil
                    </button>
                    {isFreelancer && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleOpenDashboard}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-warm-700 transition-colors hover:bg-warm-100 hover:text-warm-900"
                      >
                        <svg className="h-4 w-4 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM8 8h8M8 12h5M8 16h3" />
                        </svg>
                        Mi tablero
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleOpenModeration}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-warm-700 transition-colors hover:bg-warm-100 hover:text-warm-900"
                      >
                        <svg className="h-4 w-4 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3 4 6v5c0 5.25 3.4 8.74 8 10 4.6-1.26 8-4.75 8-10V6l-8-3Zm-3 8 2 2 4-4" />
                        </svg>
                        Moderación y reportes
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="mt-2 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-warm-700 transition-colors hover:bg-warm-100 hover:text-warm-900 disabled:opacity-50"
                    >
                      {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                type="button"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-warm-700 transition-all duration-200 hover:bg-warm-100 hover:text-warm-900 sm:inline-flex"
                onClick={() => openAuthModal()}
              >
                Log In
                </button>
                <button
                  type="button"
                  className="hidden rounded-xl bg-brand px-4 py-2 text-sm font-bold text-black transition hover:bg-brand-light sm:inline-flex"
                  onClick={() => openAuthModal()}
                >
                  Sign Up
                </button>
              </>
            )}

            {isAuthenticated && <button
              type="button"
              className="inline-flex transform items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-black shadow-sm transition-all duration-200 hover:bg-brand-dark active:scale-95"
              onClick={handlePublishService}
            >
              <span className="hidden sm:inline">Publicar Servicio</span>
              <span className="text-lg leading-none sm:hidden">+</span>
            </button>}

            <button
              type="button"
              onClick={() => setMobileMenu((isOpen) => !isOpen)}
              className="rounded-xl p-2 text-warm-600 transition-colors hover:bg-warm-100 sm:hidden"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isMobileMenuOpen
                      ? "M6 18 18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="space-y-3 border-t border-warm-100 py-3 sm:hidden">
            {showSearch && <form onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit?.();
            }} role="search">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg
                    className="h-4 w-4 text-warm-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m21 21-6-6m2-5A7 7 0 1 1 3 10a7 7 0 0 1 14 0Z"
                    />
                  </svg>
                </div>
                <input
                  type="search"
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Buscar servicios..."
                  className="w-full appearance-none rounded-full border border-warm-200 bg-cream-100 py-2.5 pl-9 pr-10 text-sm text-warm-900 outline-none placeholder:text-warm-400 focus:border-brand focus:ring-2 focus:ring-brand/25"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-3 flex items-center text-warm-400 transition-colors hover:text-warm-700"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>}

            {isAuthenticated ? (
              <div className="rounded-xl bg-cream-100 p-3">
                <AccountSummary />
                <button
                  type="button"
                  onClick={handleConfigureProfile}
                  className="mt-3 flex w-full items-center gap-2 rounded-lg border border-warm-200 bg-warm-50 px-3 py-2 text-left text-sm font-medium text-warm-700"
                >
                  <svg
                    className="h-4 w-4 text-warm-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232 18.768 8.768M16.732 3.732a2.5 2.5 0 0 1 3.536 3.536L7.5 20.036 3 21l.964-4.5L16.732 3.732Z"
                    />
                  </svg>
                  Configurar perfil creativo
                </button>
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg border border-warm-200 bg-warm-50 px-3 py-2 text-left text-sm font-medium text-warm-700"
                >
                  <svg className="h-4 w-4 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 0c-1.6 4-4.6 6-9 6s-7.4-2-9-6c1.6-4 4.6-6 9-6s7.4 2 9 6Z" />
                  </svg>
                  Ver mi perfil
                </button>
                {isFreelancer && (
                  <button
                    type="button"
                    onClick={handleOpenDashboard}
                    className="mt-2 w-full rounded-lg border border-warm-200 bg-warm-50 px-3 py-2 text-left text-sm font-medium text-warm-700"
                  >
                    Mi tablero
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenModeration}
                    className="mt-2 w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-left text-sm font-medium text-warm-700"
                  >
                    Moderación y reportes
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                    className="mt-2 w-full rounded-lg border border-warm-200 bg-warm-50 px-3 py-2 text-left text-sm font-medium text-warm-700 disabled:opacity-50"
                >
                  {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-warm-700 transition-colors hover:bg-warm-100"
                onClick={() => {
                  setMobileMenu(false);
                  openAuthModal();
                }}
              >
                Entrar o crear cuenta
              </button>
            )}
          </div>
        )}
      </nav>
      <AccountStatusBanner compact />
    </header>
  );
}

export default Navbar;
