import { useState, useRef } from 'react';

function MessageInput({ onSendMessage, isLoading = false }) {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleTextChange = (e) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    // Pasamos los File reales — ChatWindow.jsx se encarga de subirlos
    onSendMessage(message.trim(), selectedFiles);

    setMessage('');
    setSelectedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-warm-200 bg-white p-4">
      {selectedFiles.length > 0 && (
        <div className="mb-4 pb-3 border-b border-warm-100">
          <p className="text-xs font-semibold text-warm-600 mb-2">
            {selectedFiles.length} archivo(s) seleccionado(s)
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-warm-100 rounded-lg">
                <svg className="w-4 h-4 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-warm-700 truncate max-w-xs">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="ml-1 text-warm-400 hover:text-warm-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <input ref={imageInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand/10 hover:bg-brand/20
                     flex items-center justify-center text-brand transition-colors duration-200 disabled:opacity-50"
          title="Adjuntar imagen"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand/10 hover:bg-brand/20
                     flex items-center justify-center text-brand transition-colors duration-200 disabled:opacity-50"
          title="Adjuntar archivo"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje... (Shift+Enter para salto de línea)"
          disabled={isLoading}
          className="flex-1 px-4 py-2 rounded-lg border border-warm-200 focus:border-brand focus:ring-2 focus:ring-brand/25
                     text-sm text-warm-900 placeholder-warm-400 resize-none overflow-hidden
                     transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        <button
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && selectedFiles.length === 0)}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand hover:bg-brand-dark active:scale-95
                     flex items-center justify-center text-white transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          title="Enviar mensaje"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-xs text-warm-400 mt-2">
        <strong>Tip:</strong> Presiona Enter para enviar. Shift+Enter para nueva línea.
      </p>
    </div>
  );
}

export default MessageInput;
