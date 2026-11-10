import { useEffect, useMemo, useState } from 'react';
import {
  createCommissionReminder,
  fetchFreelancerDashboard,
  updateCommissionStatus,
  updateReminderStatus,
  uploadCommissionAttachments,
} from '../../../lib/api/dashboard';
import TicketMasonryGrid from './TicketMasonryGrid';

function formatDate(value, fallback = 'Sin fecha') {
  if (!value) return fallback;

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function isOverdue(value) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

function DashboardIcon({ children }) {
  return (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
      {children}
    </span>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-gold/40 bg-cream-100/60 px-4 py-7 text-center text-sm text-warm-500">
      {children}
    </div>
  );
}

export default function PrivateFreelancerDashboard({ userId }) {
  const [dashboard, setDashboard] = useState({ commissions: [], reminders: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingReminderId, setUpdatingReminderId] = useState(null);
  const [updatingCommissionId, setUpdatingCommissionId] = useState(null);
  const [uploadingCommissionId, setUploadingCommissionId] = useState(null);
  const [reminderDrafts, setReminderDrafts] = useState({});

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

  const activeReminders = useMemo(
    () => dashboard.reminders.filter((reminder) => reminder.status === 'pending'),
    [dashboard.reminders]
  );

  const handleReminderStatus = async (reminder, status) => {
    try {
      setUpdatingReminderId(reminder.id);
      const updatedReminder = await updateReminderStatus(userId, reminder.id, status);
      setDashboard((current) => ({
        ...current,
        reminders: current.reminders
          .map((item) => (item.id === updatedReminder.id ? updatedReminder : item))
          .filter((item) => item.status !== 'dismissed'),
      }));
    } catch (updateError) {
      console.error('Error actualizando el recordatorio:', updateError);
      setError('No se pudo actualizar el recordatorio. Intenta nuevamente.');
    } finally {
      setUpdatingReminderId(null);
    }
  };

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

  const handleReminderDraft = (commissionId, field, value) => {
    setReminderDrafts((current) => ({
      ...current,
      [commissionId]: { ...current[commissionId], [field]: value },
    }));
  };

  const handleCreateReminder = async (commissionId) => {
    const draft = reminderDrafts[commissionId] ?? {};
    if (!draft.title?.trim()) {
      setError('Escribe un título para el recordatorio.');
      return;
    }

    try {
      setUpdatingCommissionId(commissionId);
      setError(null);
      const reminder = await createCommissionReminder(userId, {
        commissionId,
        title: draft.title,
        notes: draft.notes,
        dueAt: draft.dueAt,
      });
      setDashboard((current) => ({
        ...current,
        reminders: [...current.reminders, reminder].sort(
          (a, b) => new Date(a.due_at || '9999-12-31') - new Date(b.due_at || '9999-12-31')
        ),
      }));
      setReminderDrafts((current) => ({ ...current, [commissionId]: {} }));
    } catch (reminderError) {
      console.error('Error creando recordatorio:', reminderError);
      setError('No se pudo crear el recordatorio.');
    } finally {
      setUpdatingCommissionId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-gold/40 bg-cream-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-warm-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          Cargando tu tablero...
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-3xl border border-brand/30 bg-cream-50 p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Área privada</p>
          <h2 className="mt-1 text-2xl font-bold text-warm-900">Mi tablero de trabajo</h2>
          <p className="mt-1 max-w-2xl text-sm text-warm-500">
            Aquí solo tú puedes consultar tus recordatorios, comisiones activas y fechas de entrega.
          </p>
        </div>
        <div className="rounded-2xl bg-brand/10 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-brand">{activeReminders.length}</p>
          <p className="text-xs font-semibold text-warm-600">pendientes</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-gold/30 bg-cream-100/70 p-4 lg:order-1">
          <div className="mb-4 flex items-center gap-3">
            <DashboardIcon>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
            </DashboardIcon>
            <div>
              <h3 className="font-bold text-warm-900">Recordatorios</h3>
              <p className="text-xs text-warm-500">Tus pendientes personales</p>
            </div>
          </div>

          {activeReminders.length === 0 ? (
            <EmptyState>No tienes recordatorios pendientes.</EmptyState>
          ) : (
            <div className="space-y-3">
              {activeReminders.map((reminder) => (
                <article key={reminder.id} className="rounded-xl border border-gold/30 bg-cream-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-warm-900">{reminder.title}</h4>
                    <button
                      type="button"
                      onClick={() => handleReminderStatus(reminder, 'done')}
                      disabled={updatingReminderId === reminder.id}
                      className="text-xs font-bold text-brand hover:underline disabled:opacity-50"
                    >
                      Listo
                    </button>
                  </div>
                  {reminder.notes && <p className="mt-1 text-xs leading-relaxed text-warm-500">{reminder.notes}</p>}
                  <p className={`mt-2 text-xs font-semibold ${isOverdue(reminder.due_at) ? 'text-red-600' : 'text-gold'}`}>
                    {isOverdue(reminder.due_at) ? 'Vencido · ' : 'Vence · '}{formatDate(reminder.due_at)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gold/30 bg-cream-100/70 p-4 lg:order-3 lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <DashboardIcon>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11ZM8 8h8m-8 4h5m-5 4h3" /></svg>
            </DashboardIcon>
            <div>
              <h3 className="font-bold text-warm-900">Tickets activos</h3>
              <p className="text-xs text-warm-500">Comisiones en curso</p>
            </div>
          </div>

          <TicketMasonryGrid
            commissions={dashboard.commissions}
            reminderDrafts={reminderDrafts}
            updatingCommissionId={updatingCommissionId}
            uploadingCommissionId={uploadingCommissionId}
            onStatusChange={handleCommissionStatus}
            onFilesChange={handleCommissionFiles}
            onReminderDraftChange={handleReminderDraft}
            onCreateReminder={handleCreateReminder}
          />
        </section>

        <section className="rounded-2xl border border-gold/30 bg-cream-100/70 p-4 lg:order-2">
          <div className="mb-4 flex items-center gap-3">
            <DashboardIcon>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </DashboardIcon>
            <div>
              <h3 className="font-bold text-warm-900">Fechas de entrega</h3>
              <p className="text-xs text-warm-500">Ordenadas por proximidad</p>
            </div>
          </div>

          {dashboard.reminders.filter((reminder) => reminder.due_at).length === 0 ? (
            <EmptyState>Aún no tienes fechas registradas.</EmptyState>
          ) : (
            <div className="space-y-3">
              {dashboard.reminders.filter((reminder) => reminder.due_at).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-cream-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-warm-900">{reminder.title}</p>
                    <p className={`mt-1 text-xs font-semibold ${reminder.status === 'done' ? 'text-brand' : isOverdue(reminder.due_at) ? 'text-red-600' : 'text-gold'}`}>
                      {reminder.status === 'done' ? 'Completado · ' : ''}{formatDate(reminder.due_at)}
                    </p>
                  </div>
                  <span className="text-lg" aria-hidden="true">{reminder.status === 'done' ? '✓' : '⏱'}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
