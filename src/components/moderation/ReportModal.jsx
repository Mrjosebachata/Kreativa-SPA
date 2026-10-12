import { useEffect, useRef, useState } from 'react';
import { createReport, REPORT_REASONS } from '../../../lib/api/moderation';
import { useAuth } from '../../../lib/auth/AuthContext';

function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetUserId,
  serviceId = null,
  targetName,
}) {
  const { isAccountActive } = useAuth();
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const reasonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => reasonRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (isOpen) {
      setReason(REPORT_REASONS[0].value);
      setDetails('');
      setError(null);
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen, targetType, targetUserId, serviceId]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAccountActive) {
      setError('Tu cuenta debe estar activa para crear un reporte.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createReport({
        reportedUserId: targetUserId,
        serviceId: targetType === 'service' ? serviceId : null,
        reason,
        details,
      });
      setSuccess(true);
    } catch (submitError) {
      console.error('Error creando el reporte:', submitError);
      setError(
        submitError?.message ||
          'No se pudo enviar el reporte. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetLabel = targetType === 'service' ? 'servicio' : 'perfil';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-warm-900/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="w-full max-w-lg rounded-3xl border border-warm-100 bg-cream-50 p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand">
              Moderacion
            </p>
            <h2 id="report-modal-title" className="text-2xl font-bold text-warm-900">
              Reportar {targetLabel}
            </h2>
            <p className="mt-1 text-sm text-warm-500">
              Revisaremos el {targetLabel} de {targetName} sin revelar tu identidad.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-900 disabled:opacity-50"
            aria-label="Cerrar reporte"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div role="status" className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-warm-900">Reporte enviado</h3>
            <p className="mt-2 text-sm leading-relaxed text-warm-600">
              Un administrador revisara la informacion y registrara cualquier accion.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="report-reason" className="mb-2 block text-sm font-semibold text-warm-900">
                Motivo
              </label>
              <select
                ref={reasonRef}
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="form-control"
              >
                {REPORT_REASONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label htmlFor="report-details" className="text-sm font-semibold text-warm-900">
                  Detalles opcionales
                </label>
                <span className="text-xs text-warm-400">{details.length}/500</span>
              </div>
              <textarea
                id="report-details"
                value={details}
                onChange={(event) => {
                  setDetails(event.target.value);
                  setError(null);
                }}
                maxLength={500}
                rows={5}
                placeholder="Describe brevemente lo ocurrido y donde lo observaste."
                className="form-control resize-y"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-brand-dark">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm font-semibold text-warm-700 hover:bg-warm-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isAccountActive}
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default ReportModal;
