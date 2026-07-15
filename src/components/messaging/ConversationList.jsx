/* ============================================================
   ARCHIVO: src/components/messaging/ConversationList.jsx (CORREGIDO)
   ============================================================
   FIX: antes se asumía que conv.messages SIEMPRE tenía al menos
   un elemento (cierto con mockData, falso con datos reales — p.ej.
   una conversación recién creada podía no tener mensajes). Ahora:
   - lastMessage puede ser null sin romper el render
   - se muestra un texto de fallback ("Sin mensajes todavía")
   - se soporta el caso de un mensaje sin texto pero con adjuntos
     (se muestra "📎 Imagen adjunta" en vez de string vacío)
   - formatRelativeTime tolera fechas nulas/inválidas
   ============================================================ */

import { useState } from 'react';

function ConversationList({ conversations, currentUserId, onSelectConversation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    const otherUserName = currentUserId === conv.clientId ? conv.freelancerName : conv.clientName;
    const subject = conv.subject || '';
    const query = searchQuery.toLowerCase();
    return (
      (otherUserName || '').toLowerCase().includes(query) ||
      subject.toLowerCase().includes(query)
    );
  });

  const sortedConversations = [...filteredConversations].sort(
    (a, b) => new Date(b.lastMessage ?? 0) - new Date(a.lastMessage ?? 0)
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <div className="h-screen flex flex-col bg-cream-100">
      <div className="sticky top-0 z-10 bg-white border-b border-warm-200 p-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-warm-900 mb-4">
            Mensajes
            {totalUnread > 0 && (
              <span className="ml-2 px-2.5 py-1 rounded-full bg-brand text-white text-sm">
                {totalUnread}
              </span>
            )}
          </h2>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="w-full px-4 py-2.5 rounded-xl border border-warm-200 focus:border-brand
                         focus:ring-2 focus:ring-brand/25 text-warm-900 placeholder-warm-400
                         transition-all duration-200 focus:outline-none"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-warm-800 mb-2">
              {searchQuery ? 'Sin resultados' : 'Sin conversaciones'}
            </h3>
            <p className="text-warm-500">
              {searchQuery
                ? 'No encontramos conversaciones que coincidan con tu búsqueda.'
                : 'Cuando comiences una comisión, verás tus conversaciones aquí.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {sortedConversations.map((conv) => {
              const otherUser =
                currentUserId === conv.clientId
                  ? { name: conv.freelancerName, avatar: conv.freelancerAvatar }
                  : { name: conv.clientName, avatar: conv.clientAvatar };

              // ── FIX: conv.messages puede venir vacío ──────────────
              const messages = conv.messages ?? [];
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
              const isUnread = conv.unreadCount > 0;

              // Texto de preview con manejo de todos los casos:
              // sin mensajes / solo texto / solo adjuntos / ambos
              let previewText = 'Sin mensajes todavía — inicia la conversación';
              if (lastMessage) {
                const prefix = lastMessage.senderId === currentUserId ? 'Tú: ' : '';
                if (lastMessage.text && lastMessage.text.trim() !== '') {
                  previewText = `${prefix}${lastMessage.text}`;
                } else if (lastMessage.files && lastMessage.files.length > 0) {
                  previewText = `${prefix}📎 Imagen adjunta`;
                } else {
                  previewText = `${prefix}(mensaje vacío)`;
                }
              }

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className="w-full px-4 py-4 hover:bg-cream-200 transition-colors text-left
                             focus:outline-none focus:ring-2 focus:ring-brand focus:ring-inset"
                >
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <h3 className={`font-semibold truncate ${isUnread ? 'text-warm-900 font-bold' : 'text-warm-800'}`}>
                          {otherUser.name}
                        </h3>
                        <span className={`text-xs ml-2 flex-shrink-0 ${isUnread ? 'text-brand font-bold' : 'text-warm-400'}`}>
                          {formatRelativeTime(conv.lastMessage)}
                        </span>
                      </div>

                      <p className="text-xs text-warm-500 mb-1 truncate">{conv.subject}</p>

                      <p className={`text-sm truncate ${isUnread ? 'text-warm-900 font-medium' : 'text-warm-600'}`}>
                        {previewText}
                      </p>
                    </div>

                    {isUnread && (
                      <div className="flex-shrink-0 flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * formatRelativeTime — FIX: ahora tolera `null`/`undefined`/fechas
 * inválidas sin mostrar "Invalid Date" ni tronar.
 */
function formatRelativeTime(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

export default ConversationList;