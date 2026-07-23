import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../supabaseClient';
import {
  fetchProfile,
  signInWithEmail,
  signOut as signOutApi,
  signUpWithEmail,
} from './authApi';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState(null);
  const profileRequestRef = useRef(0);

  const loadProfile = useCallback(async (userId) => {
    const requestId = ++profileRequestRef.current;

    if (!userId) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await fetchProfile(userId);
      if (requestId === profileRequestRef.current) {
        setProfile(nextProfile);
      }
    } catch (error) {
      console.error('Error cargando el perfil autenticado:', error);
      if (requestId === profileRequestRef.current) {
        setProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function initializeAuth() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error('Error recuperando la sesión:', error);
        setSession(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setSession(data.session);
      await loadProfile(data.session?.user?.id);

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;

      setSession(nextSession);
      setProfile(null);
      void loadProfile(nextSession?.user?.id);
    });

    return () => {
      isMounted = false;
      profileRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const openAuthModal = useCallback((message = null) => {
    setAuthModalMessage(message);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalMessage(null);
  }, []);

  const requireAuth = useCallback(
    (action, message = 'Inicia sesión para continuar.') => {
      if (!session?.user) {
        openAuthModal(message);
        return false;
      }

      return typeof action === 'function' ? action() : true;
    },
    [openAuthModal, session]
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      isAuthenticated: Boolean(session?.user),
      isAdmin: profile?.account_role === 'admin',
      isAuthAvailable: Boolean(supabase),
      isAuthModalOpen,
      authModalMessage,
      openAuthModal,
      closeAuthModal,
      requireAuth,
      refreshProfile: () => loadProfile(session?.user?.id),
      signUp: signUpWithEmail,
      signIn: signInWithEmail,
      signOut: signOutApi,
    }),
    [
      authModalMessage,
      closeAuthModal,
      isAuthModalOpen,
      isLoading,
      loadProfile,
      openAuthModal,
      profile,
      requireAuth,
      session,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }

  return context;
}
