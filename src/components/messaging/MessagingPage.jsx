import { useState } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

function MessagingPage({
  conversations,
  currentUserId,
  onBack,
  onConversationsChange,
  onReviewSubmitted,
}) {
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  );

  return (
    <div className="h-screen bg-cream-100">
      <div className="hidden lg:flex h-full">
        <div className="w-96 border-r border-gold/40 flex flex-col">
          <div className="px-4 py-3 border-b border-gold/40 flex items-center gap-3 bg-cream-50">
            <button
              onClick={onBack}
              className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-colors"
              aria-label="Volver a KREATIVA"
            >
              <svg className="w-5 h-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <ConversationList
            conversations={conversations}
            currentUserId={currentUserId}
            onSelectConversation={setSelectedConversationId}
          />
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={currentUserId}
              onBack={() => setSelectedConversationId(null)}
              onMessageSent={onConversationsChange}
              onReviewSubmitted={onReviewSubmitted}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-warm-800 mb-2">Selecciona una conversación</h3>
              <p className="text-warm-500 max-w-xs">
                Elige una conversación de la lista para empezar a chatear.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex lg:hidden h-full flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUserId={currentUserId}
            onBack={() => setSelectedConversationId(null)}
            onMessageSent={onConversationsChange}
            onReviewSubmitted={onReviewSubmitted}
          />
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gold/40 flex items-center gap-3 bg-cream-50">
              <button
                onClick={onBack}
                className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-colors"
                aria-label="Volver a KREATIVA"
              >
                <svg className="w-5 h-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
              onSelectConversation={setSelectedConversationId}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default MessagingPage;
