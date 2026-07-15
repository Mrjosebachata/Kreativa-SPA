import { useState, useEffect } from 'react';

import Navbar            from './components/Navbar';
import CategoryFilter    from './components/CategoryFilter';
import HeroSection       from './components/HeroSection';
import MasonryGrid       from './components/MasonryGrid';
import FreelancerProfile from './components/FreelancerProfile';
import MessagingPage     from './components/messaging/MessagingPage';
import Footer            from './components/Footer';

import { fetchGigs }        from '../lib/api/gigs';
import { fetchCategories }  from '../lib/api/categories';
import { fetchConversations } from '../lib/api/messaging';
import { CURRENT_USER_ID }  from '../lib/currentUser';

function App() {
  // ── Estado de navegación/UI (igual que antes) ──────────────────
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedGigId,  setSelectedGigId]  = useState(null);
  const [currentView,    setCurrentView]    = useState('grid');

  // ── Estado de datos remotos (NUEVO) ─────────────────────────────
  const [gigs, setGigs]                 = useState([]);
  const [categories, setCategories]     = useState(['Todos']);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [loadError, setLoadError]       = useState(null);

  // Carga inicial: gigs + categorías + conversaciones (para el badge
  // de no-leídos, que debe verse aunque no hayas abierto Mensajes)
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [gigsData, categoriesData, conversationsData] = await Promise.all([
          fetchGigs(),
          fetchCategories(),
          fetchConversations(CURRENT_USER_ID),
        ]);

        if (!isMounted) return;
        setGigs(gigsData);
        setCategories(categoriesData);
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error cargando datos de Supabase:', error);
        if (isMounted) {
          setLoadError('No se pudieron cargar los datos. Revisa tu conexión o inténtalo de nuevo.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  // Refresca conversaciones (por si hay mensajes nuevos) cada vez
  // que el usuario entra a la sección de Mensajería
  const refreshConversations = async () => {
    try {
      const data = await fetchConversations(CURRENT_USER_ID);
      setConversations(data);
    } catch (error) {
      console.error('Error actualizando conversaciones:', error);
    }
  };

  // ── Callbacks de navegación (igual que antes) ───────────────────
  const handleSearch = (query) => setSearchQuery(query);
  const handleCategoryChange = (category) => setActiveCategory(category);

  const handleSelectFreelancer = (gigId) => {
    setSelectedGigId(gigId);
    setCurrentView('profile');
    window.scrollTo(0, 0);
  };

  const handleBackToGrid = () => {
    setSelectedGigId(null);
    setCurrentView('grid');
    window.scrollTo(0, 0);
  };

  const handleOpenMessaging = () => {
    setCurrentView('messaging');
    refreshConversations();
    window.scrollTo(0, 0);
  };

  const handleBackFromMessaging = () => {
    setCurrentView('grid');
    window.scrollTo(0, 0);
  };

  const showHero = searchQuery.trim() === '' && activeCategory === 'Todos';
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // ── Estados de carga / error (NUEVO) ────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-warm-500 text-sm">Cargando KREATIVA...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-warm-900 mb-2">Algo salió mal</h2>
          <p className="text-warm-500 text-sm mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Renderizado (misma estructura que antes) ────────────────────

  if (currentView === 'profile' && selectedGigId) {
    return (
      <div className="min-h-screen bg-cream-100 font-jakarta flex flex-col">
        <Navbar onSearch={handleSearch} onOpenMessaging={handleOpenMessaging} unreadCount={unreadCount} />
        <main className="flex-1">
          <FreelancerProfile gigId={selectedGigId} onBack={handleBackToGrid} />
        </main>
        <Footer />
      </div>
    );
  }

  if (currentView === 'messaging') {
    return (
      <div className="min-h-screen bg-cream-100 font-jakarta flex flex-col">
        <main className="flex-1">
          <MessagingPage
            conversations={conversations}
            currentUserId={CURRENT_USER_ID}
            onBack={handleBackFromMessaging}
            onConversationsChange={refreshConversations}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 font-jakarta flex flex-col">
      <Navbar onSearch={handleSearch} onOpenMessaging={handleOpenMessaging} unreadCount={unreadCount} />
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
      <HeroSection isVisible={showHero} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <MasonryGrid
          gigs={gigs}
          searchQuery={searchQuery}
          activeCategory={activeCategory}
          onSelectFreelancer={handleSelectFreelancer}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
