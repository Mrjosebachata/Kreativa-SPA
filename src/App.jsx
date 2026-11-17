import { useCallback, useEffect, useState } from 'react';

import CategoryFilter from './components/CategoryFilter';
import Footer from './components/Footer';
import FreelancerProfile from './components/FreelancerProfile';
import HeroSection from './components/HeroSection';
import MasonryGrid from './components/MasonryGrid';
import MessagingPage from './components/messaging/MessagingPage';
import ModerationPage from './components/moderation/ModerationPage';
import Navbar from './components/Navbar';
import UnidPage from './components/unid/UnidPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import CreativeProfilePage from './components/profile/CreativeProfilePage';
import FavoritesPage from './components/profile/FavoritesPage';
import PrivateFreelancerDashboard from './components/profile/PrivateFreelancerDashboard';
import PublishServicePage from './components/publishing/PublishServicePage';

import { fetchCategories } from '../lib/api/categories';
import { fetchGigs } from '../lib/api/gigs';
import { deleteService } from '../lib/api/publishing';
import { fetchConversations } from '../lib/api/messaging';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../lib/api/notifications';
import { useAuth } from '../lib/auth/AuthContext';

const PRIVATE_VIEWS = new Set([
  'messaging',
  'notifications',
  'publish',
  'creative-profile',
  'dashboard',
  'favorites',
  'moderation',
]);

function App({ requestedGig }) {
  const {
    user,
    isAuthenticated,
    isAdmin,
    profile,
    isLoading: isAuthLoading,
    openAuthModal,
  } = useAuth();
  const userId = user?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [profileInitialTab, setProfileInitialTab] = useState('about');
  const [reviewCommissionId, setReviewCommissionId] = useState(null);
  const [currentView, setCurrentView] = useState('grid');
  const [creativeProfileReturnView, setCreativeProfileReturnView] =
    useState('grid');
  const [editingService, setEditingService] = useState(null);

  const [gigs, setGigs] = useState([]);
  const [categories, setCategories] = useState(['Todos']);
  const [conversations, setConversations] = useState([]);
  const [messagingConversationId, setMessagingConversationId] = useState(null);
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
      const errorDetail = [error?.message, error?.details, error?.hint]
        .filter(Boolean)
        .join(' · ');
      setLoadError(
        errorDetail
          ? `No se pudieron cargar los servicios: ${errorDetail}`
          : 'No se pudieron cargar los servicios. Revisa tu conexión o inténtalo de nuevo.'
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

      if (
        notification.type === 'commission_status_changed' &&
        notification.title === 'Comisión completada'
      ) {
        void refreshConversations();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (
      (PRIVATE_VIEWS.has(currentView) && !isAuthenticated) ||
      (currentView === 'moderation' && !isAdmin)
    ) {
      setCurrentView('grid');
    }
  }, [currentView, isAdmin, isAuthenticated]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('kreativa:chatbot:view', { detail: { view: currentView } }));
  }, [currentView]);

  const refreshConversations = async () => {
    if (!isAuthenticated || !userId) return;

    try {
      const data = await fetchConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error('Error actualizando conversaciones:', error);
    }
  };

  const handleCreativeProfileSaved = async () => {
    await Promise.all([
      loadCatalog({ showLoading: false }),
      refreshConversations(),
    ]);
  };

  const handleSelectFreelancer = (gigId) => {
    setSelectedGigId(gigId);
    setSelectedProfileId(null);
    setProfileInitialTab('about');
    setReviewCommissionId(null);
    setCurrentView('profile');
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (requestedGig?.id) handleSelectFreelancer(requestedGig.id);
  }, [requestedGig]);

  const handleBackToGrid = () => {
    setSelectedGigId(null);
    setSelectedProfileId(null);
    setProfileInitialTab('about');
    setReviewCommissionId(null);
    setCurrentView('grid');
    window.scrollTo(0, 0);
  };

  const handleOpenMessaging = () => {
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para acceder a tus conversaciones.');
      return;
    }

    setCurrentView('messaging');
    setMessagingConversationId(null);
    void refreshConversations();
    window.scrollTo(0, 0);
  };

  const handleOpenCommissionChat = async (commissionId) => {
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para abrir el chat de esta comisión.');
      return;
    }

    try {
      const data = await fetchConversations(userId);
      setConversations(data);
      setMessagingConversationId(
        data.find((conversation) => conversation.commissionId === commissionId)?.id ?? null
      );
    } catch (error) {
      console.error('Error cargando el chat de la comisión:', error);
      setMessagingConversationId(null);
    }

    setCurrentView('messaging');
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
    setEditingService(null);
    window.scrollTo(0, 0);
  };

  const handleOpenEditService = (service) => {
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para editar tu servicio.');
      return;
    }

    setEditingService(service);
    setCurrentView('publish');
    window.scrollTo(0, 0);
  };

  const handleDeleteService = async (service) => {
    if (!service?.id) return;
    if (!window.confirm(`¿Quieres eliminar el servicio "${service.title}"?`)) return;

    try {
      await deleteService(service.id);
      await loadCatalog({ showLoading: false });
      handleBackToGrid();
    } catch (error) {
      console.error('Error eliminando el servicio:', error);
      window.alert(error?.message || 'No se pudo eliminar el servicio.');
    }
  };

  const handleOpenCreativeProfile = (returnView = 'grid') => {
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para configurar tu perfil creativo.');
      return;
    }

    setCreativeProfileReturnView(returnView);
    setCurrentView('creative-profile');
    window.scrollTo(0, 0);
  };

  const handleOpenOwnProfile = () => {
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para ver tu perfil creativo.');
      return;
    }

    setSelectedGigId(null);
    setSelectedProfileId(userId);
    setProfileInitialTab('about');
    setReviewCommissionId(null);
    setCurrentView('profile');
    window.scrollTo(0, 0);
  };

  const handleOpenFavorites = () => {
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para consultar tus favoritos.');
      return;
    }

    setCurrentView('favorites');
    window.scrollTo(0, 0);
  };

  const handleOpenDashboard = () => {
    const marketplaceRole = profile?.marketplace_role ?? profile?.role;
    if (!isAuthenticated || !userId) {
      openAuthModal('Inicia sesión para abrir tu tablero.');
      return;
    }
    if (!['freelancer', 'both'].includes(marketplaceRole)) return;
    setCurrentView('dashboard');
    window.scrollTo(0, 0);
  };

  const handleOpenModeration = () => {
    if (!isAuthenticated || !userId || !isAdmin) return;

    setCurrentView('moderation');
    window.scrollTo(0, 0);
  };

  const handleBackFromCreativeProfile = () => {
    setCurrentView(creativeProfileReturnView);
    window.scrollTo(0, 0);
  };

  const handlePublished = async () => {
    await loadCatalog({ showLoading: false });
    setEditingService(null);
    setActiveCategory('Todos');
    setSearchQuery('');
    setSearchInput('');
    setSelectedGigId(null);
    setCurrentView('grid');
    window.scrollTo(0, 0);
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
    setSearchQuery(value);
  };

  const handleSearchSubmit = (value = searchInput) => {
    setSearchQuery(value.trim());
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

  const handleOpenReviewFromNotification = async (notification) => {
    if (!isAuthenticated || !userId || notification.entity_type !== 'commission') {
      return;
    }

    if (!notification.is_read) {
      await handleMarkNotificationRead(notification.id);
    }

    let currentConversations = conversations;
    let conversation = currentConversations.find(
      (item) => String(item.commissionId) === String(notification.entity_id)
    );

    if (!conversation) {
      try {
        currentConversations = await fetchConversations(userId);
        setConversations(currentConversations);
        conversation = currentConversations.find(
          (item) => String(item.commissionId) === String(notification.entity_id)
        );
      } catch (error) {
        console.error('Error cargando la comisión para la reseña:', error);
        return;
      }
    }

    if (
      !conversation ||
      conversation.clientId !== userId ||
      conversation.commissionStatus !== 'completed' ||
      conversation.hasReview
    ) {
      return;
    }

    setSelectedGigId(null);
    setSelectedProfileId(conversation.freelancerId);
    setProfileInitialTab('reviews');
    setReviewCommissionId(conversation.commissionId);
    setCurrentView('profile');
    window.scrollTo(0, 0);
  };

  const showHero = activeCategory === 'Todos';
  const unreadCount = conversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount || 0),
    0
  );
  const unreadNotificationCount = notifications.reduce(
    (sum, notification) => sum + (notification.is_read ? 0 : 1),
    0
  );
  const reviewableCommissionIds = new Set(
    conversations
      .filter(
        (conversation) =>
          conversation.clientId === userId &&
          conversation.commissionStatus === 'completed' &&
          !conversation.hasReview
      )
      .map((conversation) => String(conversation.commissionId))
  );
  const isLoading = isAuthLoading || isLoadingCatalog;
  const viewingOwnProfile =
    currentView === 'profile' && Boolean(selectedProfileId) && !selectedGigId;
  const navbarProps = {
    onSearch: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
    onOpenMessaging: handleOpenMessaging,
    onOpenNotifications: handleOpenNotifications,
    onPublishService: handleOpenPublishing,
    onConfigureProfile: handleOpenCreativeProfile,
    onViewProfile: handleOpenOwnProfile,
    onOpenFavorites: handleOpenFavorites,
    onOpenDashboard: handleOpenDashboard,
    onOpenModeration: handleOpenModeration,
    unreadCount,
    unreadNotificationCount,
    showSearch: !showHero && !viewingOwnProfile,
    searchValue: searchInput,
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

  if (currentView === 'profile' && (selectedGigId || selectedProfileId)) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <Navbar {...navbarProps} />
        <main className="flex-1">
          <FreelancerProfile
            gigId={selectedGigId}
            profileId={selectedProfileId}
            onBack={handleBackToGrid}
            initialTab={profileInitialTab}
            reviewCommissionId={reviewCommissionId}
            onReviewSubmitted={refreshConversations}
            onEditService={handleOpenEditService}
            onDeleteService={handleDeleteService}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (currentView === 'dashboard' && isAuthenticated && userId) {
    const marketplaceRole = profile?.marketplace_role ?? profile?.role;
    if (['freelancer', 'both'].includes(marketplaceRole)) {
      return (
        <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
          <Navbar {...navbarProps} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={handleBackToGrid}
              className="mb-6 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-gold transition hover:bg-gold/10"
            >
              ← Volver
            </button>
            <PrivateFreelancerDashboard userId={userId} onOpenChat={handleOpenCommissionChat} />
          </main>
          <Footer />
        </div>
      );
    }
  }

  if (currentView === 'messaging' && isAuthenticated && userId) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <main className="flex-1">
          <MessagingPage
            conversations={conversations}
            currentUserId={userId}
            onBack={handleBackToGrid}
            initialConversationId={messagingConversationId}
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
          reviewableCommissionIds={reviewableCommissionIds}
          onOpenReview={handleOpenReviewFromNotification}
        />
        <Footer />
      </div>
    );
  }

  if (currentView === 'favorites' && isAuthenticated && userId) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <Navbar {...navbarProps} />
        <FavoritesPage
          onBack={handleBackToGrid}
          onOpenProfile={(profileId) => {
            setSelectedGigId(null);
            setSelectedProfileId(profileId);
            setProfileInitialTab('about');
            setReviewCommissionId(null);
            setCurrentView('profile');
            window.scrollTo(0, 0);
          }}
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
          onConfigureProfile={() => handleOpenCreativeProfile('publish')}
          editService={editingService}
        />
        <Footer />
      </div>
    );
  }

  if (currentView === 'creative-profile' && isAuthenticated && userId) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <Navbar {...navbarProps} />
        <CreativeProfilePage
          onBack={handleBackFromCreativeProfile}
          onPublishService={handleOpenPublishing}
          onProfileSaved={handleCreativeProfileSaved}
        />
        <Footer />
      </div>
    );
  }

  if (currentView === 'moderation' && isAuthenticated && userId && isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
        <Navbar {...navbarProps} />
        <ModerationPage onBack={handleBackToGrid} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-100 font-jakarta">
      <Navbar {...navbarProps} />
      <HeroSection
        isVisible={showHero}
        searchValue={searchInput}
        onSearch={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onStartProject={() => openAuthModal('Inicia sesión para comenzar tu proyecto.')}
      />
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6 lg:px-8">
        <div id="servicios">
          <MasonryGrid
            gigs={gigs}
            searchQuery={searchQuery}
            activeCategory={activeCategory}
            onSelectFreelancer={handleSelectFreelancer}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AppRouter() {
  const [pathname, setPathname] = useState(() => window.location.pathname.replace(/\/$/, ''));
  const [requestedGig, setRequestedGig] = useState(null);

  useEffect(() => {
    const onRoute = () => setPathname(window.location.pathname.replace(/\/$/, ''));
    const onOpenProfile = (event) => {
      const gigId = Number(event.detail?.gigId);
      if (!Number.isSafeInteger(gigId) || gigId <= 0) return;
      if (window.location.pathname.startsWith('/unid')) {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      setRequestedGig({ id: gigId });
    };
    window.addEventListener('popstate', onRoute);
    window.addEventListener('kreativa:chatbot:open-profile', onOpenProfile);
    return () => {
      window.removeEventListener('popstate', onRoute);
      window.removeEventListener('kreativa:chatbot:open-profile', onOpenProfile);
    };
  }, []);

  if (pathname === '/unid') {
    return <UnidPage />;
  }

  return <App requestedGig={requestedGig} />;
}

export default AppRouter;
