import { useEffect, useState } from 'react';

import CategoryFilter from './components/CategoryFilter';
import Footer from './components/Footer';
import FreelancerProfile from './components/FreelancerProfile';
import HeroSection from './components/HeroSection';
import MasonryGrid from './components/MasonryGrid';
import MessagingPage from './components/messaging/MessagingPage';
import Navbar from './components/Navbar';

import { fetchCategories } from '../lib/api/categories';
import { fetchGigs } from '../lib/api/gigs';
import { fetchConversations } from '../lib/api/messaging';
import { useAuth } from '../lib/auth/AuthContext';

function App() {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    openAuthModal,
  } = useAuth();
  const userId = user?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [currentView, setCurrentView] = useState('grid');

  const [gigs, setGigs] = useState([]);
  const [categories, setCategories] = useState(['Todos']);
  const [conversations, setConversations] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // El catálogo sigue siendo público.
  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        setIsLoadingCatalog(true);
        setLoadError(null);

        const [gigsData, categoriesData] = await Promise.all([
          fetchGigs(),
          fetchCategories(),
        ]);

        if (!isMounted) return;
        setGigs(gigsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error cargando el catálogo:', error);
        if (isMounted) {
          setLoadError(
            'No se pudieron cargar los servicios. Revisa tu conexión o inténtalo de nuevo.'
          );
        }
      } finally {
        if (isMounted) setIsLoadingCatalog(false);
      }
    }

    void loadCatalog();
    return () => { isMounted = false; };
  }, []);

  // Las conversaciones se consultan únicamente para el usuario autenticado.
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setConversations([]);
      return undefined;
    }

    let isMounted = true;

    fetchConversations(userId)
      .then((data) => {
        if (isMounted) setConversations(data);
      })
      .catch((error) => {
        console.error('Error cargando conversaciones:', error);
        if (isMounted) setConversations([]);
      });

    return () => { isMounted = false; };
  }, [isAuthenticated, userId]);

  // Si la sesión expira con la bandeja abierta, evita mostrar datos privados.
  useEffect(() => {
    if (currentView === 'messaging' && !isAuthenticated) {
      setCurrentView('grid');
    }
  }, [currentView, isAuthenticated]);

  const refreshConversations = async () => {
    if (!isAuthenticated || !userId) return;

    try {
      const data = await fetchConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error('Error actualizando conversaciones:', error);
    }
  };

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
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para acceder a tus conversaciones.');
      return;
    }

    setCurrentView('messaging');
    void refreshConversations();
    window.scrollTo(0, 0);
  };

  const handleBackFromMessaging = () => {
    setCurrentView('grid');
    window.scrollTo(0, 0);
  };

  const showHero = searchQuery.trim() === '' && activeCategory === 'Todos';
  const unreadCount = conversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount || 0),
    0
  );
  const isLoading = isAuthLoading || isLoadingCatalog;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-warm-500">Cargando KREATIVA...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-lg font-bold text-warm-900">Algo salió mal</h2>
          <p className="mb-4 text-sm text-warm-500">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'profile' && selectedGigId) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <Navbar
          onSearch={setSearchQuery}
          onOpenMessaging={handleOpenMessaging}
          unreadCount={unreadCount}
        />
        <main className="flex-1">
          <FreelancerProfile gigId={selectedGigId} onBack={handleBackToGrid} />
        </main>
        <Footer />
      </div>
    );
  }

  if (currentView === 'messaging' && isAuthenticated && userId) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <main className="flex-1">
          <MessagingPage
            conversations={conversations}
            currentUserId={userId}
            onBack={handleBackFromMessaging}
            onConversationsChange={refreshConversations}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
      <Navbar
        onSearch={setSearchQuery}
        onOpenMessaging={handleOpenMessaging}
        unreadCount={unreadCount}
      />
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <HeroSection isVisible={showHero} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6 lg:px-8">
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
