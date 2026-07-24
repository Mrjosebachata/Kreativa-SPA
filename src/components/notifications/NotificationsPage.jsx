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
    color: 'bg-blue-50 text-blue-700',
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
    color: 'bg-amber-50 text-amber-700',
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
    color: 'bg-emerald-50 text-emerald-700',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m5 13 4 4L19 7"
      />
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
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-warm-600 transition-colors hover:bg-white hover:text-warm-900"
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
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Mantente al día
          </p>
          <h1 className="text-3xl font-bold text-warm-900 sm:text-4xl">
            Notificaciones
          </h1>
          <p className="mt-2 text-warm-600">
            Solicitudes, cambios en comisiones y nuevas reseñas en un solo lugar.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="self-start rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm font-semibold text-warm-700 transition-colors hover:border-brand hover:text-brand sm:self-auto"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="mb-5 flex gap-2 rounded-2xl bg-cream-200 p-1.5">
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
        <section className="rounded-3xl border border-warm-100 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warm-100 text-warm-500">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-warm-900">
            {filter === 'unread' ? 'Todo está al día' : 'Aún no hay notificaciones'}
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-warm-500">
            {filter === 'unread'
              ? 'No tienes notificaciones pendientes por revisar.'
              : 'Cuando recibas una solicitud de comisión, una actualización o una reseña aparecerá aquí.'}
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-warm-100 bg-white shadow-sm">
          {visibleNotifications.map((notification, index) => {
            const meta = TYPE_META[notification.type] ?? TYPE_META.commission_status_changed;

            return (
              <article
                key={notification.id}
                className={`relative flex gap-4 p-5 transition-colors sm:p-6 ${
                  index > 0 ? 'border-t border-warm-100' : ''
                } ${notification.is_read ? 'bg-white' : 'bg-brand/[0.035]'}`}
              >
                {!notification.is_read && (
                  <span className="absolute left-2 top-8 h-2 w-2 rounded-full bg-brand" />
                )}

                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <h2 className="font-bold text-warm-900">{notification.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-warm-600">
                    {notification.body}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3">
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
                        className="text-sm font-medium text-warm-500 hover:text-warm-900"
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
          ? 'bg-white text-warm-900 shadow-sm'
          : 'text-warm-500 hover:text-warm-900'
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
