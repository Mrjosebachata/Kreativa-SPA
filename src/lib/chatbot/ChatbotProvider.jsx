import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { searchChatbot } from '../../../lib/api/chatbot';

const ChatbotContext = createContext(null);
const EMPTY_FILTERS = { category: null, minPrice: null, maxPrice: null, skills: [], tags: [], keywords: [], relaxed: [] };
const storageKey = (userId) => `kreativa:chatbot:v1:${userId || 'anon'}`;
const withoutCredentials = (text) => String(text || '')
  .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[correo omitido]')
  .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[identificador omitido]')
  .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token omitido]');
const privateFreeFilters = (filters) => ({
  ...filters,
  category: filters.category ? withoutCredentials(filters.category) : null,
  skills: (filters.skills || []).map(withoutCredentials),
  tags: (filters.tags || []).map(withoutCredentials),
  keywords: (filters.keywords || []).map(withoutCredentials),
});

function readHistory(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return {
      key,
      messages: Array.isArray(value.messages) ? value.messages.slice(-30) : [],
      filters: value.filters && typeof value.filters === 'object' ? value.filters : EMPTY_FILTERS,
    };
  } catch {
    return { key, messages: [], filters: EMPTY_FILTERS };
  }
}

export function ChatbotProvider({ children }) {
  const { user, isAuthAvailable, requireAuth } = useAuth();
  const key = storageKey(user?.id);
  const [chat, setChat] = useState(() => readHistory(key));
  const [isSending, setIsSending] = useState(false);
  const previousKey = useRef(key);
  const currentKey = useRef(key);
  const requestGeneration = useRef(0);
  currentKey.current = key;

  useEffect(() => {
    if (previousKey.current !== key) {
      if (previousKey.current !== storageKey(null) && key === storageKey(null)) {
        try { localStorage.removeItem(previousKey.current); } catch { /* Storage deshabilitado. */ }
      }
      previousKey.current = key;
      requestGeneration.current += 1;
      setChat(readHistory(key));
      setIsSending(false);
    }
  }, [key]);

  useEffect(() => {
    if (chat.key !== key) return;
    try { localStorage.setItem(key, JSON.stringify({
      messages: chat.messages.slice(-30).map((item) => ({
        ...item,
        text: withoutCredentials(item.text),
        profiles: item.profiles?.map((profile) => Object.fromEntries(
          Object.entries(profile).map(([name, value]) => [name, typeof value === 'string' ? withoutCredentials(value) : value])
        )),
      })),
      filters: privateFreeFilters(chat.filters),
    })); }
    catch { /* Cuota o modo privado: el chat sigue en memoria. */ }
  }, [chat, key]);

  function newConversation() {
    requestGeneration.current += 1;
    setIsSending(false);
    setChat({ key, messages: [], filters: EMPTY_FILTERS });
  }

  async function send(rawMessage) {
    const message = rawMessage.trim();
    if (!message || message.length > 500 || isSending || !isAuthAvailable) return false;
    if (!requireAuth(() => true, 'Inicia sesión para buscar perfiles con el asistente y controlar el costo de la IA.')) return false;
    const requestKey = key;
    const generation = ++requestGeneration.current;
    const history = chat.messages.filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-6).map(({ role, text }) => ({ role, text: text.slice(0, 500) }));
    setChat((current) => ({ ...current, messages: [...current.messages, { role: 'user', text: message }].slice(-30) }));
    setIsSending(true);
    try {
      const result = await searchChatbot({ message, history, previousFilters: chat.filters });
      if (currentKey.current !== requestKey || requestGeneration.current !== generation) return true;
      setChat((current) => ({
        ...current, filters: result.filters,
        messages: [...current.messages, {
          role: 'assistant', text: result.reply, profiles: result.profiles,
          filters: result.filters, mode: result.mode, remaining: result.usage?.remaining,
        }].slice(-30),
      }));
    } catch (error) {
      if (currentKey.current !== requestKey || requestGeneration.current !== generation) return true;
      setChat((current) => ({ ...current, messages: [...current.messages, {
        role: 'error', code: error.code || 'internal', text: error.message,
      }].slice(-30) }));
    } finally {
      if (currentKey.current === requestKey && requestGeneration.current === generation) setIsSending(false);
    }
    return true;
  }

  return <ChatbotContext.Provider value={{ messages: chat.key === key ? chat.messages : [], isSending, isAuthAvailable, send, newConversation }}>
    {children}
  </ChatbotContext.Provider>;
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) throw new Error('useChatbot necesita ChatbotProvider.');
  return context;
}
