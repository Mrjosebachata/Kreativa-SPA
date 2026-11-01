import { supabase } from '../supabaseClient';

export const REPORT_REASONS = [
  { value: 'insults', label: 'Insultos o lenguaje ofensivo' },
  { value: 'threats', label: 'Amenazas' },
  { value: 'discrimination', label: 'Contenido discriminatorio' },
  { value: 'inappropriate_content', label: 'Imagenes o contenido inapropiado' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'impersonation', label: 'Suplantacion de identidad' },
  { value: 'privacy_misuse', label: 'Uso indebido de informacion personal' },
  { value: 'other', label: 'Otro motivo' },
];

export const MODERATION_ACTION_LABELS = {
  dismiss_report: 'Reporte descartado',
  warn: 'Aviso enviado',
  suspend: 'Cuenta suspendida',
  block: 'Cuenta bloqueada',
  reactivate: 'Cuenta reactivada',
  hide_service: 'Servicio ocultado',
  delete_service: 'Servicio eliminado',
  remove_portfolio_image: 'Imagen retirada',
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase no esta conectado.');
  }

  return supabase;
}

export async function createReport({
  reportedUserId,
  serviceId = null,
  reason,
  details,
}) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('create_report', {
    p_reported_user_id: reportedUserId,
    p_service_id: serviceId,
    p_reason: reason,
    p_details: details.trim() || null,
  });

  if (error) throw error;
  return data;
}

export async function fetchModerationReports(status = 'all') {
  const client = requireSupabase();
  const { data, error } = await client.rpc('get_moderation_reports', {
    p_status: status === 'all' ? null : status,
  });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function applyModerationAction({
  reportId,
  action,
  note,
  serviceId = null,
  portfolioImageId = null,
}) {
  const client = requireSupabase();
  const { error } = await client.rpc('moderate_report', {
    p_report_id: reportId,
    p_action: action,
    p_note: note.trim() || null,
    p_service_id: serviceId,
    p_portfolio_image_id: portfolioImageId,
  });

  if (error) throw error;
}
