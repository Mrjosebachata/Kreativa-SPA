import { useEffect, useState } from 'react';
import { fetchFavoriteProfiles, removeFavorite } from '../../../lib/api/favorites';

function FavoritesPage({ onBack, onOpenProfile }) {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetchFavoriteProfiles()
      .then((data) => {
        if (isMounted) setFavorites(data);
      })
      .catch((loadError) => {
        console.error('Error cargando perfiles favoritos:', loadError);
        if (isMounted) setError('No se pudieron cargar tus perfiles favoritos.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const handleRemove = async (profileId) => {
    try {
      await removeFavorite(profileId);
      setFavorites((current) => current.filter((favorite) => favorite.id !== profileId));
    } catch (removeError) {
      console.error('Error eliminando favorito:', removeError);
      window.alert('No se pudo quitar el perfil de favoritos.');
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gold transition hover:bg-gold/10"
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
              d="m15 19-7-7 7-7"
            />
          </svg>

        Volver
        
      </button>

      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">Tu colección</p>
        <h1 className="text-3xl font-bold text-warm-900">Mis favoritos</h1>
        <p className="mt-2 text-warm-600">Perfiles creativos que guardaste para volver a visitarlos.</p>
      </div>

      {isLoading && (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-gold/30 bg-cream-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-5 text-red-300">{error}</div>
      )}

      {!isLoading && !error && favorites.length === 0 && (
        <div className="rounded-3xl border border-gold/30 bg-cream-50 p-10 text-center">
          <div className="mx-auto mb-4 text-4xl text-gold">♡</div>
          <h2 className="text-xl font-bold text-warm-900">Aún no tienes favoritos</h2>
          <p className="mt-2 text-sm text-warm-600">Guarda perfiles desde el botón del corazón para encontrarlos aquí.</p>
        </div>
      )}

      {!isLoading && !error && favorites.length > 0 && (
        <div className="space-y-3">
          {favorites.map((favorite, index) => (
            <article
              key={favorite.id}
              className="flex animate-fade-in flex-col gap-4 rounded-2xl border border-warm-200 bg-cream-50 p-3 shadow-sm transition-colors hover:border-gold/60 sm:flex-row sm:items-center"
              style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
            >
              {favorite.avatar ? (
                <img
                  src={favorite.avatar}
                  alt={`Foto de ${favorite.name}`}
                  className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-brand text-2xl font-bold text-black">
                  {favorite.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-warm-900">{favorite.name}</h2>
                <p className="mt-1 text-sm text-warm-500">
                  ★ {favorite.rating.toFixed(1)} · {favorite.reviews} reseñas
                </p>
                <p className="mt-1 text-xs text-warm-600">Perfil creativo guardado</p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => onOpenProfile(favorite.id)}
                  className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-black transition hover:bg-brand-dark"
                >
                  Ver perfil
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(favorite.id)}
                  className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Quitar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default FavoritesPage;
