import { useCallback, useEffect, useState } from 'react';

import CategoryFilter from './components/CategoryFilter';
import Footer from './components/Footer';
import FreelancerProfile from './components/FreelancerProfile';
import HeroSection from './components/HeroSection';
import MasonryGrid from './components/MasonryGrid';
import MessagingPage from './components/messaging/MessagingPage';
import Navbar from './components/Navbar';
import NotificationsPage from './components/notifications/NotificationsPage';
import PublishServicePage from './components/publishing/PublishServicePage';

import { fetchCategories } from '../lib/api/categories';
import { fetchGigs } from '../lib/api/gigs';
import { fetchConversations } from '../lib/api/messaging';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../lib/api/notifications';
import { useAuth } from '../lib/auth/AuthContext';

const PRIVATE_VIEWS = new Set(['messaging', 'notifications', 'publish']);

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
  const [notifications, setNotifications] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadCatalog = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) setIsLoadingCatalog(true);
      setLoadError(null);

      const [gigsData, categoriesData] = await Promise.all([
        fetchGigs(),
        fetchCategories(),
      ]);

      setGigs(gigsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error cargando el catálogo:', error);
      setLoadError(
        'No se pudieron cargar los servicios. Revisa tu conexión o inténtalo de nuevo.'
      );
    } finally {
      if (showLoading) setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

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

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setNotifications([]);
      return undefined;
    }

    let isMounted = true;

    fetchNotifications(userId)
      .then((data) => {
        if (isMounted) setNotifications(data);
      })
      .catch((error) => {
        console.error('Error cargando notificaciones:', error);
        if (isMounted) setNotifications([]);
      });

    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      if (!isMounted) return;
      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) return current;
        return [notification, ...current];
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (PRIVATE_VIEWS.has(currentView) && !isAuthenticated) {
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

  const handleOpenNotifications = () => {
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para consultar tus notificaciones.');
      return;
    }

    setCurrentView('notifications');
    window.scrollTo(0, 0);
  };

  const handleOpenPublishing = () => {
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para publicar un servicio.');
      return;
    }

    setCurrentView('publish');
    window.scrollTo(0, 0);
  };

  const handlePublished = async () => {
    await loadCatalog({ showLoading: false });
    setActiveCategory('Todos');
    setSearchQuery('');
    setSelectedGigId(null);
    setCurrentView('grid');
    window.scrollTo(0, 0);
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marcando la notificación:', error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!userId) return;

    try {
      await markAllNotificationsRead(userId);
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at ?? readAt,
        }))
      );
    } catch (error) {
      console.error('Error marcando las notificaciones:', error);
    }
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.is_read) {
      await handleMarkNotificationRead(notification.id);
    }

    if (notification.entity_type === 'commission') {
      handleOpenMessaging();
      return;
    }

    handleBackToGrid();
  };

  const showHero = searchQuery.trim() === '' && activeCategory === 'Todos';
  const unreadCount = conversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount || 0),
    0
  );
  const unreadNotificationCount = notifications.reduce(
    (sum, notification) => sum + (notification.is_read ? 0 : 1),
    0
  );
  const isLoading = isAuthLoading || isLoadingCatalog;
  const navbarProps = {
    onSearch: setSearchQuery,
    onOpenMessaging: handleOpenMessaging,
    onOpenNotifications: handleOpenNotifications,
    onPublishService: handleOpenPublishing,
    unreadCount,
    unreadNotificationCount,
  };

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
            onClick={() => void loadCatalog()}
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
        <Navbar {...navbarProps} />
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
            onBack={handleBackToGrid}
            onConversationsChange={refreshConversations}
          />
        </main>
      </div>
    );
  }

  if (currentView === 'notifications' && isAuthenticated && userId) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <Navbar {...navbarProps} />
        <NotificationsPage
          notifications={notifications}
          onBack={handleBackToGrid}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onOpenNotification={handleOpenNotification}
        />
        <Footer />
      </div>
    );
  }

  if (currentView === 'publish' && isAuthenticated && userId) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <Navbar {...navbarProps} />
        <PublishServicePage
          onBack={handleBackToGrid}
          onPublished={handlePublished}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
      <Navbar {...navbarProps} />
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
