import { useAuth } from '../../../lib/auth/AuthContext';

function AccountStatusBanner({ compact = false }) {
  const { accountStatus, profile } = useAuth();

  if (!accountStatus || accountStatus === 'active') return null;

  const isBlocked = accountStatus === 'blocked';

  return (
    <div
      role="alert"
      className={`border-y border-brand/30 bg-brand/10 text-warm-900 ${
        compact ? 'px-4 py-3' : 'px-4 py-4'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-dark"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          />
        </svg>
        <div>
          <p className="font-bold">
            {isBlocked ? 'Tu cuenta esta bloqueada' : 'Tu cuenta esta suspendida'}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-warm-700">
            Puedes iniciar sesion y consultar el catalogo, pero no puedes enviar
            mensajes, solicitar comisiones, publicar servicios, crear reportes ni
            resenas.
            {profile?.account_status_reason
              ? ` Motivo: ${profile.account_status_reason}`
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccountStatusBanner;
