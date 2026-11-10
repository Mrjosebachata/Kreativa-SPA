import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthModal from './components/auth/AuthModal.jsx'
import { AuthProvider } from '../lib/auth/AuthContext.jsx'
import { ChatbotProvider } from './lib/chatbot/ChatbotProvider.jsx'
import ChatbotWidget from './components/chatbot/ChatbotWidget.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ChatbotProvider>
        <App />
        <ChatbotWidget />
        <AuthModal />
      </ChatbotProvider>
    </AuthProvider>
  </StrictMode>,
)
