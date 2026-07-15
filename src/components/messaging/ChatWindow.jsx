import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { sendMessage, markConversationRead } from '../../../lib/api/messaging';

function ChatWindow({ conversation, currentUserId, onBack, onMessageSent }) {
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

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-4 border-b border-warm-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-center my-4">
          <span className="text-xs bg-warm-100 text-warm-600 px-3 py-1 rounded-full">
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

      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}

export default ChatWindow;
