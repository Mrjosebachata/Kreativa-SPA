import { useMemo, useState } from 'react';

const TYPE_META = {
  commission_requested: {
    label: 'Comisión',
    color: 'bg-brand/10 text-brand',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 9.414V19a2 2 0 0 1-2 2Z"
      />
    ),
  },
  commission_status_changed: {
    label: 'Actualización',
    color: 'bg-gold/10 text-gold',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"
      />
    ),
  },
  review_received: {
    label: 'Reseña',
    color: 'bg-gold/10 text-gold',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m11.049 2.927.951-1.927.951 1.927a2 2 0 0 0 1.506 1.094l2.127.309-1.539 1.5a2 2 0 0 0-.575 1.77l.363 2.118-1.902-1a2 2 0 0 0-1.862 0l-1.902 1 .363-2.118a2 2 0 0 0-.575-1.77l-1.539-1.5 2.127-.309a2 2 0 0 0 1.506-1.094ZM5 13h14M7 17h10M9 21h6"
      />
    ),
  },
  service_published: {
    label: 'Servicio',
    color: 'bg-gold/10 text-gold',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m5 13 4 4L19 7"
      />
    ),
  },
  moderation_warning: {
    label: 'Moderación',
    color: 'bg-gold-light text-warm-900',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      />
    ),
  },
  account_suspended: {
    label: 'Cuenta suspendida',
    color: 'bg-brand/10 text-brand-dark',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.36 18.36A9 9 0 1 0 5.64 5.64m12.72 12.72L5.64 5.64" />
    ),
  },
  account_blocked: {
    label: 'Cuenta bloqueada',
    color: 'bg-red-400/10 text-red-300',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10V8a6 6 0 0 1 12 0v2m-11 0h10a2 2 0 0 1 2 2v7H5v-7a2 2 0 0 1 2-2Z" />
    ),
  },
  account_reactivated: {
    label: 'Cuenta reactivada',
    color: 'bg-cream-200 text-brand',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
    ),
  },
};

function NotificationsPage({
  notifications,
  onBack,
  onMarkRead,
  onMarkAllRead,
  onOpenNotification,
}) {
  const [filter, setFilter] = useState('all');
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const visibleNotifications = useMemo(
    () =>
      filter === 'unread'
        ? notifications.filter((notification) => !notification.is_read)
        : notifications,
    [filter, notifications]
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/10 hover:text-gold-light"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m15 19-7-7 7-7"
          />
        </svg>
        Volver
      </button>

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-warm-900 sm:text-4xl">
            Notificaciones
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="self-start rounded-xl border border-gold/60 bg-transparent px-4 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/10 hover:text-gold-light sm:self-auto"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="mb-5 flex gap-2">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label={`Todas (${notifications.length})`}
        />
        <FilterButton
          active={filter === 'unread'}
          onClick={() => setFilter('unread')}
          label={`Sin leer (${unreadCount})`}
        />
      </div>

      {visibleNotifications.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h2 className="mb-2 text-lg font-bold text-warm-900">
            {filter === 'unread' ? 'Todo está al día' : 'Aún no hay notificaciones'}
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-warm-500">
            {filter === 'unread'
              ? 'No tienes notificaciones pendientes por revisar.'
              : 'Cuando recibas una solicitud de comisión, una actualización o una reseña aparecerá aquí.'}
          </p>
        </div>
      ) : (
        <div className="max-h-[32rem] overflow-y-auto rounded-2xl bg-cream-50/60 shadow-sm">
          <section className="overflow-hidden">
            {visibleNotifications.map((notification, index) => {
              const meta = TYPE_META[notification.type] ?? TYPE_META.commission_status_changed;

              return (
                <article
                  key={notification.id}
                  className={`relative flex gap-3 p-4 transition-colors sm:p-4 ${
                    index > 0 ? 'border-t border-gold/15' : ''
                  } ${notification.is_read ? 'bg-cream-50' : 'bg-brand/[0.035]'}`}
                >
                  {!notification.is_read && (
                    <span className="absolute left-2 top-8 h-2 w-2 rounded-full bg-brand" />
                  )}

                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {meta.icon}
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-brand">
                        {meta.label}
                      </span>
                      <span className="text-xs text-warm-400">
                        {formatNotificationDate(notification.created_at)}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-warm-900">{notification.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-warm-600 sm:text-sm">
                      {notification.body}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3">
                      {notification.entity_type && (
                        <button
                          type="button"
                          onClick={() => onOpenNotification(notification)}
                          className="text-sm font-semibold text-brand hover:underline"
                        >
                          {notification.entity_type === 'commission'
                            ? 'Ir a mensajes'
                            : notification.entity_type === 'service'
                              ? 'Ver catálogo'
                              : 'Ver perfil'}
                        </button>
                      )}
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(notification.id)}
                          className="text-sm font-medium text-gold/80 hover:text-gold-light"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}
    </main>
  );
}

function FilterButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? 'bg-brand text-black shadow-sm'
          : 'border border-brand/50 text-brand hover:border-brand hover:bg-brand/10'
      }`}
    >
      {label}
    </button>
  );
}

function formatNotificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export default NotificationsPage;
