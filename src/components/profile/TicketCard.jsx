const STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  in_progress: 'En progreso',
  delivered: 'Entregada',
  completed: 'Terminada',
};

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-brand/15 text-brand-dark',
  delivered: 'bg-violet-100 text-violet-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

const TIMELINE_LABELS = {
  flexible: 'Plazo flexible',
  '1week': '1 semana',
  '2weeks': '2 semanas',
  '1month': '1 mes',
  '2months': '2 meses',
};

function formatDate(value, fallback = 'Sin fecha') {
  if (!value) return fallback;

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function TicketCard({
  commission,
  reminderDraft,
  isUpdating,
  isUploading,
  onStatusChange,
  onFilesChange,
  onReminderDraftChange,
  onCreateReminder,
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-gold/30 bg-cream-50 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 border-b border-gold/20 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Ticket de trabajo</p>
          <h4 className="mt-1 break-words text-base font-bold leading-snug text-warm-900">{commission.title}</h4>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[commission.status] ?? 'bg-warm-100 text-warm-700'}`}>
          {STATUS_LABELS[commission.status] ?? commission.status}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-warm-500">{TIMELINE_LABELS[commission.timeline] ?? 'Plazo por confirmar'}</span>
          <span className="font-semibold text-gold">Actualizada · {formatDate(commission.updated_at)}</span>
        </div>

        <label className="block text-xs font-semibold text-warm-700" htmlFor={`ticket-status-${commission.id}`}>
          Cambiar estado
        </label>
        <select
          id={`ticket-status-${commission.id}`}
          value={commission.status}
          onChange={(event) => void onStatusChange(commission.id, event.target.value)}
          disabled={isUpdating}
          className="w-full rounded-lg border border-gold/40 bg-cream-100 px-3 py-2 text-xs text-warm-900 outline-none focus:border-brand"
        >
          <option value="pending">Pendiente</option>
          <option value="accepted">Aceptada</option>
          <option value="in_progress">En progreso</option>
          <option value="delivered">Entregada</option>
          <option value="completed">Terminada</option>
        </select>

        <div className="border-t border-gold/20 pt-3">
          <p className="text-xs font-bold text-warm-800">Avances y entregables</p>
          <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg border border-brand/40 px-3 py-2 text-xs font-bold text-brand hover:bg-brand/10">
            {isUploading ? 'Subiendo...' : 'Subir fotos'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={isUploading}
              onChange={(event) => void onFilesChange(commission.id, event)}
            />
          </label>
          {commission.attachments?.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {commission.attachments.map((attachment) => (
                <a key={attachment.id} href={attachment.file_url} target="_blank" rel="noreferrer" title={attachment.file_name ?? 'Ver archivo'}>
                  <img src={attachment.file_url} alt={attachment.file_name ?? 'Avance del ticket'} className="aspect-square w-full rounded-lg object-cover transition-transform hover:scale-[1.03]" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gold/20 pt-3">
          <p className="text-xs font-bold text-warm-800">Agregar recordatorio</p>
          <input
            value={reminderDraft?.title ?? ''}
            onChange={(event) => onReminderDraftChange(commission.id, 'title', event.target.value)}
            placeholder="Ej. Entregar primera propuesta"
            maxLength={120}
            className="mt-2 w-full rounded-lg border border-gold/40 bg-cream-100 px-3 py-2 text-xs text-warm-900 outline-none focus:border-brand"
          />
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              value={reminderDraft?.dueAt ?? ''}
              onChange={(event) => onReminderDraftChange(commission.id, 'dueAt', event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gold/40 bg-cream-100 px-3 py-2 text-xs text-warm-900 outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={() => void onCreateReminder(commission.id)}
              disabled={isUpdating}
              className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
