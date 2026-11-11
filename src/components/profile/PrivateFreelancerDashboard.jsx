import { useEffect, useMemo, useState } from 'react';
import {
  archiveCompletedCommission,
  fetchFreelancerDashboard,
  updateCommissionStatus,
  uploadCommissionAttachments,
} from '../../../lib/api/dashboard';
import TicketMasonryGrid from './TicketMasonryGrid';

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'accepted', label: 'Aceptados' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed', label: 'Completados' },
];

const HIDDEN_COMPLETED_KEY = 'kreativa:hidden-completed-commission-ids';

function readHiddenCompletedIds() {
  try {
    return JSON.parse(window.localStorage.getItem(HIDDEN_COMPLETED_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function PrivateFreelancerDashboard({ userId, onOpenChat }) {
  const [dashboard, setDashboard] = useState({ commissions: [] });
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingCommissionId, setUpdatingCommissionId] = useState(null);
  const [uploadingCommissionId, setUploadingCommissionId] = useState(null);
  const [archivingCommissionId, setArchivingCommissionId] = useState(null);
  const [hidingCommissionId, setHidingCommissionId] = useState(null);
  const [hiddenCompletedIds, setHiddenCompletedIds] = useState(readHiddenCompletedIds);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchFreelancerDashboard(userId);
        if (isMounted) setDashboard(data);
      } catch (loadError) {
        console.error('Error cargando el tablero privado:', loadError);
        if (isMounted) {
          setError('No se pudo cargar tu tablero. Verifica la migración de recordatorios en Supabase.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadDashboard();
    return () => { isMounted = false; };
  }, [userId]);

  const filteredCommissions = useMemo(
    () => filter === 'all'
      ? dashboard.commissions.filter((commission) => !hiddenCompletedIds.includes(commission.id))
      : dashboard.commissions.filter((commission) => commission.status === filter && !hiddenCompletedIds.includes(commission.id)),
    [dashboard.commissions, filter, hiddenCompletedIds]
  );

  const handleCommissionStatus = async (commissionId, status) => {
    try {
      setUpdatingCommissionId(commissionId);
      setError(null);
      const updated = await updateCommissionStatus(userId, commissionId, status);
      setDashboard((current) => ({
        ...current,
        commissions: current.commissions.map((commission) =>
          commission.id === updated.id
            ? { ...commission, ...updated }
            : commission
        ),
      }));
    } catch (updateError) {
      console.error('Error actualizando el ticket:', updateError);
      const errorDetail = [updateError?.message, updateError?.details, updateError?.hint]
        .filter(Boolean)
        .join(' · ');
      setError(
        errorDetail
          ? `No se pudo actualizar el ticket: ${errorDetail}`
          : 'No se pudo actualizar el estado del ticket. Verifica las políticas de Supabase.'
      );
    } finally {
      setUpdatingCommissionId(null);
    }
  };

  const handleCommissionFiles = async (commissionId, event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    const validFiles = files.filter(
      (file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );
    if (validFiles.length !== files.length) {
      setError('Solo se permiten imágenes de hasta 10 MB cada una.');
      return;
    }

    try {
      setUploadingCommissionId(commissionId);
      setError(null);
      const uploaded = await uploadCommissionAttachments(userId, commissionId, validFiles);
      setDashboard((current) => ({
        ...current,
        commissions: current.commissions.map((commission) =>
          commission.id === commissionId
            ? { ...commission, attachments: [...uploaded, ...(commission.attachments ?? [])] }
            : commission
        ),
      }));
    } catch (uploadError) {
      console.error('Error subiendo avance:', uploadError);
      setError('No se pudieron subir las imágenes de avance.');
    } finally {
      setUploadingCommissionId(null);
    }
  };

  const archiveCommission = async (commissionId) => {
    try {
      setArchivingCommissionId(commissionId);
      setError(null);
      await archiveCompletedCommission(userId, commissionId);
      setDashboard((current) => ({
        ...current,
        commissions: current.commissions.map((commission) => commission.id === commissionId
          ? { ...commission, status: 'completed', is_archived: true }
          : commission),
      }));
    } catch (archiveError) {
      console.error('Error archivando la comisión:', archiveError);
      setError('No se pudo quitar la comisión del tablero. Intenta nuevamente.');
    } finally {
      setArchivingCommissionId(null);
    }
  };

  const hideCompletedCommission = (commissionId) => {
    setHidingCommissionId(commissionId);
    setHiddenCompletedIds((current) => {
      const next = [...new Set([...current, commissionId])];
      window.localStorage.setItem(HIDDEN_COMPLETED_KEY, JSON.stringify(next));
      return next;
    });
    setHidingCommissionId(null);
  };

  const handleArchiveCommission = (commissionId) => {
    setConfirmation({
      type: 'archive',
      commissionId,
      title: 'Quitar comisión del tablero',
      message: 'La comisión seguirá guardada y aparecerá en Completados como archivada.',
      actionLabel: 'Quitar del tablero',
    });
  };

  const handleHideCompletedCommission = (commissionId) => {
    setConfirmation({
      type: 'hide',
      commissionId,
      title: 'Eliminar de la vista',
      message: 'Se ocultará del SPA, pero el registro no se borrará de la base de datos.',
      actionLabel: 'Eliminar de la vista',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmation) return;
    const action = confirmation;
    setConfirmation(null);

    if (action.type === 'archive') {
      await archiveCommission(action.commissionId);
      return;
    }

    hideCompletedCommission(action.commissionId);
  };

  if (isLoading) {
    return (
      <section className="flex min-h-[58vh] items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <span
            className="h-14 w-14 animate-spin rounded-full border-[5px] border-white/10 border-t-brand shadow-[0_0_28px_rgba(215,255,63,0.18)]"
            aria-hidden="true"
          />
          <p className="mt-5 text-sm font-semibold tracking-wide text-warm-500">
            Cargando tablero…
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-bold text-warm-900">Mi tablero</h2>
          <p className="mt-1 max-w-2xl text-sm text-warm-500">
            Organiza tus tickets de trabajo, cambia su estado y consulta sus avances.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <div className="mb-8 flex flex-wrap items-center gap-2" aria-label="Filtros de tickets">
          {FILTERS.map((option) => {
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-4 py-2.5 text-xs font-bold transition-colors sm:text-sm ${
                  filter === option.value
                    ? 'bg-brand text-black'
                    : 'border border-gold/40 text-gold hover:bg-gold/10 hover:text-gold-light'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <section>
          <TicketMasonryGrid
            commissions={filteredCommissions}
            updatingCommissionId={updatingCommissionId}
            uploadingCommissionId={uploadingCommissionId}
            archivingCommissionId={archivingCommissionId}
            hidingCommissionId={hidingCommissionId}
            onStatusChange={handleCommissionStatus}
            onFilesChange={handleCommissionFiles}
            onArchive={handleArchiveCommission}
            onHideCompleted={handleHideCompletedCommission}
            onOpenChat={onOpenChat}
            className="sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
          />
        </section>
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-confirmation-title"
            className="w-full max-w-md rounded-3xl border border-gold/30 bg-cream-50 p-6 shadow-2xl shadow-black/50"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.5m0 3.5h.01M10.3 4.6 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <h2 id="dashboard-confirmation-title" className="text-xl font-bold text-warm-900">{confirmation.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-warm-500">{confirmation.message}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-xl border border-gold/50 px-4 py-2.5 text-sm font-bold text-gold transition hover:bg-gold/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmAction()}
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-black transition hover:bg-brand-light"
              >
                {confirmation.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
