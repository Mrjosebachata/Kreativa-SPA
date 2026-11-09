import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyModerationAction,
  fetchModerationReports,
  MODERATION_ACTION_LABELS,
  REPORT_REASONS,
} from '../../../lib/api/moderation';
import { useAuth } from '../../../lib/auth/AuthContext';

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'dismissed', label: 'Descartados' },
];

const STATUS_LABELS = {
  open: 'Abierto',
  resolved: 'Resuelto',
  dismissed: 'Descartado',
};

const ACCOUNT_STATUS_LABELS = {
  active: 'Activa',
  suspended: 'Suspendida',
  blocked: 'Bloqueada',
};

function ModerationPage({ onBack }) {
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState('open');
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadReports = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchModerationReports(filter);
      setReports(data);
      setSelectedReportId((current) =>
        data.some((report) => report.id === current)
          ? current
          : (data[0]?.id ?? null)
      );
    } catch (loadError) {
      console.error('Error cargando moderacion:', loadError);
      setError(
        loadError?.message || 'No se pudo cargar la cola de moderacion.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter, isAdmin]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  useEffect(() => {
    setSelectedServiceId(
      selectedReport?.serviceId ?? selectedReport?.services?.[0]?.id ?? ''
    );
    setNote('');
    setSuccessMessage(null);
  }, [selectedReportId, selectedReport]);

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-warm-900">Acceso restringido</h1>
        <p className="mt-2 text-warm-600">
          Esta pantalla esta disponible unicamente para administradores.
        </p>
        <button type="button" onClick={onBack} className="mt-6 rounded-xl bg-brand px-5 py-3 font-bold text-black">
          Volver al catalogo
        </button>
      </main>
    );
  }

  const handleAction = async ({
    action,
    label,
    serviceId = null,
    portfolioImageId = null,
  }) => {
    if (!selectedReport) return;

    const confirmed = window.confirm(
      `${label}. Esta accion quedara registrada en la bitacora. ¿Deseas continuar?`
    );
    if (!confirmed) return;

    setIsApplying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await applyModerationAction({
        reportId: selectedReport.id,
        action,
        note,
        serviceId,
        portfolioImageId,
      });
      setSuccessMessage(`${label}. La bitacora y el reporte fueron actualizados.`);
      await loadReports();
    } catch (actionError) {
      console.error('Error aplicando moderacion:', actionError);
      setError(
        actionError?.message || 'No se pudo aplicar la accion de moderacion.'
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gold hover:bg-gold/10 hover:text-gold-light"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
        </svg>
        Volver
      </button>

      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand">
          Administracion
        </p>
        <h1 className="text-3xl font-bold text-warm-900 sm:text-4xl">
          Moderacion y reportes
        </h1>
      </div>

      <nav className="mb-5 overflow-x-auto border-b border-gold/40" aria-label="Vistas de moderación">
        <div className="flex min-w-max gap-7">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`border-b-2 px-1 py-4 text-sm font-bold transition-colors ${
              filter === option.value
                ? 'border-brand text-brand'
                : 'border-transparent text-gold/80 hover:text-gold-light'
            }`}
          >
            {option.label}
          </button>
        ))}
        </div>
      </nav>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-brand/30 bg-brand/10 px-5 py-4 text-sm text-brand-dark">
          {error}
        </div>
      )}
      {successMessage && (
        <div role="status" className="mb-5 rounded-2xl border border-gold/50 bg-gold/10 px-5 py-4 text-sm text-gold-light">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-warm-900">No hay reportes en esta vista</h2>
          <p className="mt-2 text-sm text-warm-500">
            Cambia el filtro para consultar otros estados.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <ReportList
            reports={reports}
            selectedReportId={selectedReportId}
            onSelect={setSelectedReportId}
          />

          {selectedReport && (
            <ReportDetail
              report={selectedReport}
              note={note}
              onNoteChange={setNote}
              selectedServiceId={selectedServiceId}
              onServiceChange={setSelectedServiceId}
              onAction={handleAction}
              isApplying={isApplying}
            />
          )}
        </div>
      )}
    </main>
  );
}

function ReportList({ reports, selectedReportId, onSelect }) {
  return (
    <section className="h-fit overflow-hidden rounded-2xl bg-cream-50/60 shadow-sm" aria-label="Cola de reportes">
      {reports.map((report, index) => (
        <button
          key={report.id}
          type="button"
          onClick={() => onSelect(report.id)}
          className={`w-full p-4 text-left transition-colors ${
            index > 0 ? 'border-t border-gold/15' : ''
          } ${
            selectedReportId === report.id
              ? 'bg-brand/[0.06]'
              : 'bg-cream-50 hover:bg-gold/10'
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-brand">
              {reasonLabel(report.reason)}
            </span>
            <span className="rounded-full bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">
              {STATUS_LABELS[report.status] ?? report.status}
            </span>
          </div>
          <h2 className="truncate font-bold text-warm-900">{report.reportedUserName}</h2>
          <p className="mt-1 truncate text-sm text-warm-500">
            {report.serviceTitle || 'Reporte de cuenta o portafolio'}
          </p>
          <p className="mt-2 text-xs text-warm-400">{formatDate(report.createdAt)}</p>
        </button>
      ))}
    </section>
  );
}

function ReportDetail({
  report,
  note,
  onNoteChange,
  selectedServiceId,
  onServiceChange,
  onAction,
  isApplying,
}) {
  const isFinalized = report.status !== 'open';

  return (
    <section className="space-y-6 rounded-3xl border border-gold/40 bg-cream-50 p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 border-b border-gold/30 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {report.reportedUserAvatar ? (
            <img src={report.reportedUserAvatar} alt="" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
              {report.reportedUserName?.charAt(0)?.toUpperCase()}
            </span>
          )}
          <div>
            <h2 className="text-xl font-bold text-warm-900">{report.reportedUserName}</h2>
            <p className="text-sm text-warm-500">
              Cuenta {ACCOUNT_STATUS_LABELS[report.accountStatus] ?? report.accountStatus}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-gold/30 bg-cream-100 px-4 py-3 text-sm">
          <p className="font-bold text-warm-900">{report.warningCount} avisos</p>
          <p className="text-xs text-warm-500">Conteo derivado de la bitacora</p>
        </div>
      </div>

      {report.warningCount >= 2 && report.accountStatus === 'active' && (
        <div className="rounded-2xl border border-gold/60 bg-gold/10 px-4 py-3 text-sm text-gold-light">
          Esta cuenta ya tiene dos avisos. Considera suspenderla; la decision no se aplica automaticamente.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem label="Motivo" value={reasonLabel(report.reason)} />
        <DetailItem label="Reportado por" value={report.reporterName} />
        <DetailItem label="Servicio" value={report.serviceTitle || 'No aplica'} />
        <DetailItem label="Fecha" value={formatDate(report.createdAt)} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-warm-900">Detalles del reporte</h3>
        <p className="rounded-2xl bg-cream-100 px-4 py-3 text-sm leading-relaxed text-warm-700">
          {report.details || 'El usuario no agrego detalles.'}
        </p>
      </div>

      {!isFinalized && (
        <>
          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label htmlFor="moderation-note" className="text-sm font-bold text-warm-900">
                Nota de moderacion
              </label>
              <span className="text-xs text-warm-400">{note.length}/500</span>
            </div>
            <textarea
              id="moderation-note"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Explica la decision o el aviso para dejar evidencia."
              className="form-control resize-y"
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-warm-900">Acciones sobre la cuenta</h3>
            <div className="flex flex-wrap gap-2">
              <ActionButton label="Descartar reporte" onClick={() => onAction({ action: 'dismiss_report', label: 'Descartar reporte' })} disabled={isApplying} secondary />
              <ActionButton
                label={report.warningCount >= 2 ? 'Límite de avisos alcanzado' : 'Enviar aviso'}
                onClick={() => onAction({ action: 'warn', label: 'Enviar aviso' })}
                disabled={isApplying || report.warningCount >= 2}
              />
              <ActionButton label="Suspender" onClick={() => onAction({ action: 'suspend', label: 'Suspender cuenta' })} disabled={isApplying} />
              <ActionButton label="Bloquear" onClick={() => onAction({ action: 'block', label: 'Bloquear cuenta' })} disabled={isApplying} />
              <ActionButton label="Reactivar" onClick={() => onAction({ action: 'reactivate', label: 'Reactivar cuenta' })} disabled={isApplying} secondary />
            </div>
          </div>
        </>
      )}

      {!isFinalized && report.services?.length > 0 && (
        <div className="border-t border-gold/30 pt-5">
          <h3 className="mb-3 text-sm font-bold text-warm-900">Servicio relacionado</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="moderation-service" className="mb-2 block text-xs font-semibold text-warm-600">
                Servicio de la cuenta
              </label>
              <select
                id="moderation-service"
                value={selectedServiceId}
                onChange={(event) => onServiceChange(event.target.value)}
                className="form-control"
              >
                {report.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title} ({service.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <ActionButton
                label="Ocultar"
                onClick={() => onAction({ action: 'hide_service', label: 'Ocultar servicio', serviceId: Number(selectedServiceId) })}
                disabled={isApplying || !selectedServiceId}
                secondary
              />
              <ActionButton
                label="Eliminar"
                onClick={() => onAction({ action: 'delete_service', label: 'Eliminar servicio', serviceId: Number(selectedServiceId) })}
                disabled={isApplying || !selectedServiceId}
              />
            </div>
          </div>
        </div>
      )}

      {!isFinalized && report.portfolioImages?.length > 0 && (
        <div className="border-t border-gold/30 pt-5">
          <h3 className="mb-2 text-sm font-bold text-warm-900">Imagenes de portafolio</h3>
          <p className="mb-3 text-xs text-warm-500">
            Al retirar una imagen se elimina su fila. El archivo puede permanecer en Storage.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {report.portfolioImages.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-xl border border-gold/30 bg-cream-100">
                <img src={image.url} alt="Trabajo del portafolio reportado" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onAction({ action: 'remove_portfolio_image', label: 'Retirar imagen de portafolio', portfolioImageId: image.id })}
                  disabled={isApplying}
                  className="w-full px-3 py-2 text-xs font-bold text-brand-dark hover:bg-brand/10 disabled:opacity-50"
                >
                  Retirar imagen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gold/30 pt-5">
        <h3 className="mb-3 text-sm font-bold text-warm-900">Historial de acciones</h3>
        {report.actions?.length ? (
          <ol className="space-y-3">
            {report.actions.map((action) => (
              <li key={action.id} className="rounded-xl bg-cream-100 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-warm-900">
                    {MODERATION_ACTION_LABELS[action.action] ?? action.action}
                  </span>
                  <time className="text-xs text-warm-400">{formatDate(action.createdAt)}</time>
                </div>
                <p className="mt-1 text-xs text-warm-500">Por {action.adminName || 'Administrador'}</p>
                {action.note && <p className="mt-2 text-warm-700">{action.note}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-warm-500">Esta cuenta aun no tiene acciones registradas.</p>
        )}
      </div>
    </section>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl bg-cream-100 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-warm-800">{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick, disabled, secondary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        secondary
          ? 'border border-gold/60 bg-transparent text-gold hover:bg-gold/10'
          : 'bg-brand text-black hover:bg-brand-light'
      }`}
    >
      {label}
    </button>
  );
}

function reasonLabel(value) {
  return REPORT_REASONS.find((reason) => reason.value === value)?.label ?? value;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default ModerationPage;
