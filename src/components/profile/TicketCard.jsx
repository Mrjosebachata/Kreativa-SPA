import { useState } from 'react';

const STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  in_progress: 'En progreso',
  delivered: 'Entregada',
  completed: 'Terminada',
};

export default function TicketCard({
  commission,
  isUpdating,
  isUploading,
  isArchiving,
  isHiding,
  onStatusChange,
  onFilesChange,
  onArchive,
  onHideCompleted,
  onOpenChat,
}) {
  const attachments = commission.attachments ?? [];
  const [previewIndex, setPreviewIndex] = useState(0);
  const preview = attachments[previewIndex];

  const showPrevious = () => {
    setPreviewIndex((current) => (current - 1 + attachments.length) % attachments.length);
  };

  const showNext = () => {
    setPreviewIndex((current) => (current + 1) % attachments.length);
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-warm-100 bg-warm-50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(26,21,16,0.16)]">
      {preview && (
        <div className="relative overflow-hidden bg-warm-100">
          <a href={preview.file_url} target="_blank" rel="noreferrer" title="Abrir avance">
            <img
              src={preview.file_url}
              alt={preview.file_name ?? 'Avance del ticket'}
              className="block h-auto max-h-[28rem] min-h-40 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </a>
          {attachments.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#1c1c21]/85 text-lg text-warm-900 opacity-0 transition-opacity hover:bg-[#1c1c21] group-hover:opacity-100"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Siguiente foto"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#1c1c21]/85 text-lg text-warm-900 opacity-0 transition-opacity hover:bg-[#1c1c21] group-hover:opacity-100"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-[#1c1c21]/75 px-2 py-1.5">
                {attachments.map((attachment, index) => (
                  <button
                    key={attachment.id}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    aria-label={`Ver foto ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all ${index === previewIndex ? 'w-4 bg-brand' : 'w-1.5 bg-white/60'}`}
                  />
                ))}
              </div>
            </>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-[#1c1c21]/95 px-3 py-1.5 text-xs font-semibold text-warm-900 shadow-sm">
            {STATUS_LABELS[commission.status] ?? commission.status}
          </span>
        </div>
      )}

      <div className="px-3.5 pb-3.5 pt-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h4 className="break-words text-sm font-semibold leading-snug text-warm-900">{commission.title}</h4>
          {!preview && (
            <span className="shrink-0 rounded-full bg-[#1c1c21] px-2.5 py-1 text-[10px] font-semibold text-warm-900">
              {STATUS_LABELS[commission.status] ?? commission.status}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 px-3.5 pb-3.5">
        {commission.description && (
          <p className="text-xs leading-relaxed text-warm-600">{commission.description}</p>
        )}

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
          <option value="completed">Terminada</option>
        </select>

        <div className="border-t border-warm-100 pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-warm-800"></p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChat(commission.id)}
                className="inline-flex items-center gap-2 rounded-full border border-brand/40 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7Z" />
                </svg>
                Abrir chat
              </button>
              {commission.status === 'completed' && (
                <button
                  type="button"
                  onClick={() => (commission.is_archived ? onHideCompleted(commission.id) : void onArchive(commission.id))}
                  disabled={isArchiving || isHiding}
                  aria-label={commission.is_archived ? 'Eliminar permanentemente de la vista' : 'Quitar del tablero'}
                  title={commission.is_archived ? 'Eliminar permanentemente de la vista' : 'Quitar del tablero'}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/50 text-red-200 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isArchiving || isHiding ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200/30 border-t-red-200" aria-hidden="true" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16m-10 4v5m4-5v5M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m-9 0 1 13h10l1-13" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </article>
  );
}
