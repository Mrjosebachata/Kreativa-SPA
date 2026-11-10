function formatDate(value) {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function NotificationIcon({ type }) {
  if (type === 'message') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7Z" />
      </svg>
    );
  }

  if (type === 'commission' || type === 'ticket') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 4h6M9 12h6m-6 4h3" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
    </svg>
  );
}

export default function NotificationsPage({
  notifications,
  onBack,
  onMarkRead,
  onMarkAllRead,
  onOpenNotification,
}) {
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gold transition hover:bg-gold/10 hover:text-gold-light">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
        </svg>
        Volver
      </button>

      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">Centro de actividad</p>
          <h1 className="text-3xl font-bold text-warm-900 sm:text-4xl">Notificaciones</h1>
          <p className="mt-2 text-sm text-warm-500">Consulta tus novedades, solicitudes y actualizaciones.</p>
        </div>
        <button type="button" onClick={onMarkAllRead} disabled={unreadCount === 0} className="rounded-xl border border-gold/40 px-4 py-2.5 text-sm font-bold text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40">
          Marcar todo como leído
        </button>
      </div>

      {notifications.length === 0 ? (
        <section className="rounded-3xl border border-gold/30 bg-cream-50 px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand"><NotificationIcon type="notification" /></div>
          <h2 className="mt-5 text-lg font-bold text-warm-900">No tienes notificaciones</h2>
          <p className="mt-2 text-sm text-warm-500">Aquí aparecerán tus próximas novedades.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-gold/30 bg-cream-50 shadow-sm" aria-label="Lista de notificaciones">
          {notifications.map((notification) => (
            <article key={notification.id} className={`flex gap-4 border-b border-gold/15 p-4 last:border-b-0 sm:p-5 ${notification.is_read ? 'bg-cream-50' : 'bg-brand/[0.05]'}`}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${notification.is_read ? 'bg-warm-100 text-warm-500' : 'bg-brand/15 text-brand'}`}>
                <NotificationIcon type={notification.type || notification.entity_type} />
              </div>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => void onOpenNotification(notification)} className="text-left">
                  <h2 className="font-bold text-warm-900 hover:text-brand">{notification.title || 'Nueva notificación'}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-warm-600">{notification.body || 'Tienes una nueva actualización en Kreativa.'}</p>
                </button>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-warm-400">
                  <span>{formatDate(notification.created_at)}</span>
                  {!notification.is_read && <span className="font-bold text-brand">Nueva</span>}
                </div>
              </div>
              {!notification.is_read && (
                <button type="button" onClick={() => void onMarkRead(notification.id)} className="self-start rounded-lg px-2 py-1 text-xs font-bold text-gold hover:bg-gold/10">
                  Leída
                </button>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
