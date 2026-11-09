import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { sendMessage, markConversationRead } from '../../../lib/api/messaging';
import { useAuth } from '../../../lib/auth/AuthContext';
import AccountStatusBanner from '../moderation/AccountStatusBanner';
import ReviewForm from '../reviews/ReviewForm';

function ChatWindow({
  conversation,
  currentUserId,
  onBack,
  onMessageSent,
  onReviewSubmitted,
}) {
  const { isAccountActive } = useAuth();
  const [messages, setMessages] = useState(conversation.messages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(conversation.messages);
  }, [conversation.id, conversation.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Marca la conversación como leída al abrirla (afecta el badge
  // de no-leídos en el Navbar)
  useEffect(() => {
    markConversationRead(conversation.id, currentUserId).catch((err) =>
      console.error('Error marcando como leída:', err)
    );
  }, [conversation.id, currentUserId]);

  /**
   * handleSendMessage — Envía un mensaje real a Supabase.
   *
   * @param {string} text
   * @param {File[]} files - Archivos reales (vienen de MessageInput)
   */
  const handleSendMessage = async (text, files) => {
    setIsLoading(true);

    try {
      const saved = await sendMessage({
        conversationId: conversation.id,
        senderId: currentUserId,
        text,
        files,
      });

      const isClientSender = currentUserId === conversation.clientId;
      const newMessage = {
        id: saved.id,
        senderId: currentUserId,
        senderName: isClientSender ? conversation.clientName : conversation.freelancerName,
        senderAvatar: isClientSender ? conversation.clientAvatar : conversation.freelancerAvatar,
        text: saved.body,
        files: saved.files,
        timestamp: saved.created_at,
      };

      setMessages((prev) => [...prev, newMessage]);
      onMessageSent?.(); // avisa a MessagingPage/App para refrescar la bandeja
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('No se pudo enviar el mensaje. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const otherUser =
    currentUserId === conversation.clientId
      ? { name: conversation.freelancerName, avatar: conversation.freelancerAvatar }
      : { name: conversation.clientName, avatar: conversation.clientAvatar };
  const canReview =
    currentUserId === conversation.clientId &&
    conversation.commissionId &&
    conversation.commissionStatus === 'completed' &&
    !conversation.hasReview;

  return (
    <div className="h-screen flex flex-col bg-cream-100">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gold/40 bg-cream-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-colors"
            aria-label="Volver a bandeja"
          >
            <svg className="w-5 h-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0">
            <h3 className="font-semibold text-warm-900 truncate">{otherUser.name}</h3>
            <p className="text-xs text-warm-500">Conversación sobre comisión</p>
          </div>
        </div>
      </div>

      <AccountStatusBanner compact />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {canReview && (
          <ReviewForm
            commissionId={conversation.commissionId}
            freelancerName={conversation.freelancerName}
            onSubmitted={onReviewSubmitted}
          />
        )}

        <div className="flex justify-center my-4">
          <span className="text-xs bg-gold/10 text-gold px-3 py-1 rounded-full">
            Conversación iniciada el {new Date(conversation.lastMessage).toLocaleDateString('es-MX')}
          </span>
        </div>

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
            currentUserId={currentUserId}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {isAccountActive ? (
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      ) : (
        <div className="border-t border-gold/40 bg-cream-100 px-4 py-4 text-center text-sm text-warm-600">
          El envío de mensajes está deshabilitado mientras tu cuenta no esté activa.
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
