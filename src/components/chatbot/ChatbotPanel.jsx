import { useEffect, useRef, useState } from 'react';
import { useChatbot } from '../../lib/chatbot/ChatbotProvider';

const SUGGESTIONS = [
  'Necesito un logo para mi negocio',
  'Busco ilustración de personajes',
  'Quiero una página web',
];

function ChatbotCard({ profile, onOpenProfile }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = (profile.name || '?').charAt(0).toUpperCase();
  const currency = /^[A-Z]{3}$/.test(profile.currency) ? profile.currency : 'MXN';
  const startingPrice = Number.isFinite(profile.startingPrice) ? profile.startingPrice : 0;
  return <article className="chatbot-card">
    <div className="chatbot-card-top">
      {profile.avatarUrl && !imageFailed
        ? <img src={profile.avatarUrl} alt={`Foto de ${profile.name}`} onError={() => setImageFailed(true)} />
        : <span className="chatbot-avatar" aria-label={`Inicial de ${profile.name}`}>{initial}</span>}
      <div>
        <strong>{profile.name}</strong>
        {profile.location && <small>{profile.location}</small>}
      </div>
    </div>
    {profile.bio && <p className="chatbot-card-bio">{profile.bio}</p>}
    <small className="chatbot-card-title">{profile.gigTitle}</small>
    <div className="chatbot-card-bottom">
      <strong>Desde {new Intl.NumberFormat('es-MX', { style: 'currency', currency, maximumFractionDigits: 0 }).format(startingPrice)}</strong>
      <button type="button" onClick={() => onOpenProfile(profile.gigId)}>Ver perfil</button>
    </div>
  </article>;
}

function filterLine(filters) {
  if (!filters) return '';
  const parts = [filters.category, filters.minPrice != null && `desde $${filters.minPrice}`, filters.maxPrice != null && `hasta $${filters.maxPrice}`,
    ...(filters.tags || []), ...(filters.skills || []), ...(filters.keywords || [])].filter(Boolean);
  const relaxed = filters.relaxed?.length ? ` · Ampliado: ${filters.relaxed.join(', ')}` : '';
  return parts.length || relaxed ? `Filtros: ${parts.join(' · ') || 'generales'}${relaxed}` : '';
}

export default function ChatbotPanel({ onClose, onOpenProfile }) {
  const { messages, isSending, isAuthAvailable, send, newConversation } = useChatbot();
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages, isSending]);
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(event) {
    event?.preventDefault();
    if (!draft.trim() || isSending) return;
    const accepted = await send(draft);
    if (accepted) setDraft('');
  }

  return <section className="chatbot-panel" role="dialog" aria-label="Asistente de búsqueda de perfiles">
    <header className="chatbot-header">
      <div><strong>Encuentra talento creativo</strong><small>Cuéntame qué necesitas</small></div>
      <div className="chatbot-header-actions">
        <button type="button" onClick={() => { newConversation(); setDraft(''); inputRef.current?.focus(); }} aria-label="Nueva conversación">Nueva conversación</button>
        <button type="button" onClick={onClose} aria-label="Cerrar asistente">×</button>
      </div>
    </header>
    <div className="chatbot-messages" aria-live="polite" aria-relevant="additions text">
      {messages.length === 0 && <div className="chatbot-welcome">
        <p>Hola. Puedo ayudarte a encontrar perfiles según tu proyecto.</p>
        <div className="chatbot-suggestions">
          {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setDraft(suggestion); inputRef.current?.focus(); }}>{suggestion}</button>)}
        </div>
      </div>}
      {!isAuthAvailable && <p className="chatbot-notice" role="status">El asistente no está disponible en modo local sin Supabase.</p>}
      {messages.map((item, index) => <div key={index} className={`chatbot-message chatbot-message-${item.role}`}>
        <p>{item.role === 'error' && item.code === 'rate_limited' ? 'Llegaste al límite diario. Vuelve mañana.' : item.text}</p>
        {item.role === 'assistant' && <>
          {item.profiles?.length > 0 && <div className="chatbot-cards">{item.profiles.map((profile) => <ChatbotCard key={profile.gigId} profile={profile} onOpenProfile={onOpenProfile} />)}</div>}
          {item.profiles?.length === 0 && <p className="chatbot-empty">Puedes probar con otra categoría o presupuesto.</p>}
          {filterLine(item.filters) && <small className="chatbot-filters">{filterLine(item.filters)}</small>}
          {item.mode === 'basic' && <small className="chatbot-filters">Modo básico</small>}
        </>}
      </div>)}
      {isSending && <p className="chatbot-typing" role="status">Escribiendo…</p>}
      <div ref={endRef} />
    </div>
    <form className="chatbot-form" onSubmit={submit}>
      <label htmlFor="chatbot-message">Describe tu proyecto</label>
      <div className="chatbot-compose">
        <textarea
          ref={inputRef} id="chatbot-message" rows="2" maxLength="500"
          value={draft} onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(); } }}
          placeholder="Ej. Un logo y manual de marca por $2,000"
          disabled={!isAuthAvailable || isSending}
        />
        <button type="submit" disabled={!draft.trim() || !isAuthAvailable || isSending} aria-label="Enviar consulta">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 20 16-8L4 4v6l10 2-10 2v6Z" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <p className="chatbot-disclaimer">Asistente con IA: puede equivocarse. No compartas datos personales.</p>
    </form>
  </section>;
}
