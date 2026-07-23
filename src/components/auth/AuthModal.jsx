import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';

const ERROR_MESSAGES = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  user_already_exists: 'Ya existe una cuenta con ese correo.',
  email_exists: 'Ya existe una cuenta con ese correo.',
  weak_password: 'La contraseña debe tener al menos 6 caracteres.',
  over_email_send_rate_limit:
    'Se enviaron demasiados correos. Espera unos minutos antes de intentar de nuevo.',
};

function translateError(error) {
  if (error?.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  const message = error?.message ?? 'No se pudo completar la autenticación.';

  if (message === 'Invalid login credentials') {
    return ERROR_MESSAGES.invalid_credentials;
  }

  if (message.toLowerCase().includes('already registered')) {
    return ERROR_MESSAGES.user_already_exists;
  }

  if (message.toLowerCase().includes('at least 6 characters')) {
    return ERROR_MESSAGES.weak_password;
  }

  return message;
}

function AuthModal() {
  const {
    isAuthAvailable,
    isAuthModalOpen,
    authModalMessage,
    closeAuthModal,
    signIn,
    signUp,
  } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => emailInputRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        closeAuthModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeAuthModal, isAuthModalOpen, isSubmitting]);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setMode('signin');
      setEmail('');
      setPassword('');
      setFullName('');
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        closeAuthModal();
        return;
      }

      const result = await signUp(email, password, fullName);

      if (result.session) {
        closeAuthModal();
        return;
      }

      setSuccessMessage(
        'Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.'
      );
      setPassword('');
    } catch (authError) {
      console.error('Error de autenticación:', authError);
      setError(translateError(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = () => {
    setMode((currentMode) => (currentMode === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setSuccessMessage(null);
    setPassword('');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-warm-900/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          closeAuthModal();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="w-full max-w-md rounded-3xl border border-white/70 bg-cream-50 p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              <span className="font-syne text-sm font-extrabold tracking-tight text-warm-900">
                KREATIVA
              </span>
            </div>
            <h2 id="auth-modal-title" className="text-2xl font-bold text-warm-900">
              {mode === 'signin' ? 'Qué gusto verte' : 'Crea tu cuenta'}
            </h2>
            <p className="mt-1 text-sm text-warm-500">
              {mode === 'signin'
                ? 'Inicia sesión para continuar.'
                : 'Únete para comisionar y conversar con creativos.'}
            </p>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-900 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {authModalMessage && !successMessage && (
          <div className="mb-5 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-warm-700">
            {authModalMessage}
          </div>
        )}

        {!isAuthAvailable ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Agrega las variables de Supabase para habilitar el acceso. El catálogo público
            seguirá disponible en modo de demostración.
          </div>
        ) : successMessage ? (
          <div className="py-3 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8m-16 11h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
                />
              </svg>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-warm-700">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null);
                setMode('signin');
              }}
              className="font-semibold text-brand hover:underline"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-full-name"
                  className="mb-1.5 block text-sm font-semibold text-warm-900"
                >
                  Nombre completo
                </label>
                <input
                  id="auth-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-sm font-semibold text-warm-900"
              >
                Correo
              </label>
              <input
                ref={emailInputRef}
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="tu@correo.com"
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-sm font-semibold text-warm-900"
              >
                Contraseña
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm text-warm-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Un momento...'
                : mode === 'signin'
                  ? 'Iniciar sesión'
                  : 'Crear cuenta'}
            </button>

            <p className="text-center text-sm text-warm-500">
              {mode === 'signin' ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={changeMode}
                className="font-semibold text-brand hover:underline"
              >
                {mode === 'signin' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}

export default AuthModal;
