/* ============================================================
   ARCHIVO: src/components/messaging/MessageBubble.jsx
   PROPÓSITO: Renderiza un mensaje individual en el chat.
   
   Características:
   - Distingue entre mensajes propios y del otro usuario
   - Muestra avatares y nombres
   - Soporta múltiples archivos/imágenes adjuntos
   - Timestamp relativo (ej: "hace 5 min")
   ============================================================ */

/**
 * MessageBubble — Un mensaje individual en el chat.
 *
 * @param {Object}   props
 * @param {Object}   props.message - Datos del mensaje
 * @param {boolean}  props.isOwn   - Si es mensaje propio (true) o del otro (false)
 * @param {number}   props.currentUserId - ID del usuario actual
 */
function MessageBubble({ message, isOwn, currentUserId }) {
  
  /**
   * Convierte un timestamp en un string legible
   * Ej: "hace 2 horas", "hace 30 min", "ayer a las 14:30"
   */
  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now - msgDate;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    
    return msgDate.toLocaleDateString('es-MX');
  };

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* ── Avatar del remitente ── */}
      <img
        src={message.senderAvatar}
        alt={message.senderName}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />

      {/* ── Contenedor del mensaje ── */}
      <div className={`max-w-xs ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        
        {/* Nombre + hora (oculto si es propio) */}
        {!isOwn && (
          <div className="flex items-center gap-2 px-3">
            <span className="text-xs font-semibold text-warm-700">
              {message.senderName}
            </span>
            <span className="text-xs text-warm-400">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}

        {/* Burbuja del mensaje */}
        <div
          className={`px-4 py-2 rounded-2xl break-words ${
            isOwn
              ? 'bg-brand text-white rounded-br-none'
              : 'bg-warm-100 text-warm-900 rounded-bl-none'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>

        {/* Archivos/imágenes adjuntos */}
        {message.files && message.files.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {message.files.map((file, idx) => (
              <a
                key={idx}
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-lg overflow-hidden bg-warm-200 hover:opacity-75 transition-opacity"
              >
                {/* Si es imagen (URL contiene 'jpg', 'png', 'picsum', etc) */}
                {file.match(/\.(jpg|jpeg|png|gif|webp)|picsum|pravatar/i) ? (
                  <img
                    src={file}
                    alt={`Adjunto ${idx + 1}`}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  /* Si es archivo */
                  <div className="w-full h-32 bg-warm-200 flex flex-col items-center justify-center p-2">
                    <svg className="w-6 h-6 text-warm-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs text-warm-600 text-center line-clamp-2">
                      {file.split('/').pop()}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Hora (solo si es mensaje propio) */}
        {isOwn && (
          <span className="text-xs text-warm-400 px-3">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>

    </div>
  );
}

export default MessageBubble;