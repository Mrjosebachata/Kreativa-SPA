import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useChatbot } from '../../lib/chatbot/ChatbotProvider';
import { resolveChatbotTheme } from '../../lib/chatbot/ChatbotTheme';
import './Chatbot.css';

const ChatbotPanel = lazy(() => import('./ChatbotPanel'));

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => resolveChatbotTheme(window.location.pathname));
  const [view, setView] = useState('grid');
  const buttonRef = useRef(null);
  const { isSending } = useChatbot();

  useEffect(() => {
    // Si UNID pasa a ser una vista por estado, actualizar el tema en este evento.
    const onRoute = () => setTheme(resolveChatbotTheme(window.location.pathname));
    const onView = (event) => setView(event.detail?.view || 'grid');
    window.addEventListener('popstate', onRoute);
    window.addEventListener('kreativa:chatbot:view', onView);
    return () => {
      window.removeEventListener('popstate', onRoute);
      window.removeEventListener('kreativa:chatbot:view', onView);
    };
  }, []);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function openProfile(gigId) {
    close();
    window.dispatchEvent(new CustomEvent('kreativa:chatbot:open-profile', { detail: { gigId } }));
  }

  return <div className="chatbot-root" data-chatbot-theme={theme} data-chatbot-view={view}>
    <button
      ref={buttonRef}
      type="button"
      className="chatbot-launcher"
      aria-label={open ? 'Cerrar asistente de perfiles' : 'Abrir asistente de perfiles'}
      aria-expanded={open}
      onClick={() => open ? close() : setOpen(true)}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 5h16v11H9l-5 4V5Z" strokeLinejoin="round" />
        <path d="M8 9h8M8 12h5" strokeLinecap="round" />
      </svg>
    </button>
    {open && <Suspense fallback={<div className="chatbot-panel chatbot-loading" role="status">Abriendo asistente…</div>}>
      <ChatbotPanel onClose={close} onOpenProfile={openProfile} isSending={isSending} />
    </Suspense>}
  </div>;
}
