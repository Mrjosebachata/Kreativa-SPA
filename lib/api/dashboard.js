import { supabase } from '../supabaseClient';
import { uploadFiles } from './storage';

const TICKET_STATUSES = [
  'pending',
  'accepted',
  'in_progress',
  'delivered',
  'completed',
];

export async function fetchFreelancerDashboard(userId) {
  if (!supabase || !userId) {
    return { commissions: [] };
  }

  const { data: commissions, error: commissionsError } = await supabase
    .from('commissions')
    .select('id, title, description, budget, timeline, status, created_at, updated_at')
    .eq('freelancer_id', userId)
    .order('updated_at', { ascending: false });

  if (commissionsError) throw commissionsError;

  // La función es idempotente: solo crea la notificación de vencimiento una vez.
  const { error: deadlineNotificationError } = await supabase.rpc(
    'create_commission_deadline_notifications'
  );
  if (deadlineNotificationError) {
    console.warn('No se pudieron revisar los vencimientos de tickets:', deadlineNotificationError);
  }

  const commissionIds = (commissions ?? []).map((commission) => commission.id);
  let attachments = [];

  if (commissionIds.length > 0) {
    const { data, error: attachmentsError } = await supabase
      .from('commission_attachments')
      .select('id, commission_id, file_url, file_name, created_at')
      .in('commission_id', commissionIds)
      .order('created_at', { ascending: false });

    if (attachmentsError) throw attachmentsError;
    attachments = data ?? [];
  }

  return {
    commissions: (commissions ?? []).map((commission) => ({
      ...commission,
      is_archived: commission.status === 'cancelled',
      status: commission.status === 'cancelled' ? 'completed' : commission.status,
      attachments: attachments.filter((file) => file.commission_id === commission.id),
    })),
  };
}

export async function updateCommissionStatus(userId, commissionId, status) {
  if (!supabase || !userId) throw new Error('Supabase no está conectado.');
  if (!TICKET_STATUSES.includes(status)) throw new Error('Estado de ticket no válido.');

  const { data, error } = await supabase
    .from('commissions')
    .update({ status })
    .eq('id', commissionId)
    .eq('freelancer_id', userId)
    .select('id, title, description, budget, timeline, status, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

// Archivar una comisión terminada la saca del tablero sin perder su historial.
export async function archiveCompletedCommission(userId, commissionId) {
  if (!supabase || !userId) throw new Error('Supabase no está conectado.');

  const { data, error } = await supabase
    .from('commissions')
    .update({ status: 'cancelled' })
    .eq('id', commissionId)
    .eq('freelancer_id', userId)
    .eq('status', 'completed')
    .select('id, status')
    .single();

  if (error) throw error;
  return data;
}

export async function uploadCommissionAttachments(userId, commissionId, files) {
  if (!supabase || !userId) throw new Error('Supabase no está conectado.');
  if (!files?.length) return [];

  const urls = await uploadFiles('commission-attachments', files);
  const rows = urls.map((fileUrl, index) => ({
    commission_id: commissionId,
    file_url: fileUrl,
    file_name: files[index]?.name ?? null,
  }));

  const { data, error } = await supabase
    .from('commission_attachments')
    .insert(rows)
    .select('id, commission_id, file_url, file_name, created_at');

  if (error) throw error;
  return data ?? [];
}

export async function createCommissionReminder(userId, { commissionId, title, notes, dueAt }) {
  if (!supabase || !userId) throw new Error('Supabase no está conectado.');

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      user_id: userId,
      commission_id: commissionId,
      title: title.trim(),
      notes: notes?.trim() || null,
      due_at: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null,
    })
    .select('id, commission_id, title, notes, due_at, status, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updateReminderStatus(userId, reminderId, status) {
  if (!supabase || !userId) {
    throw new Error('Supabase no está conectado.');
  }

  const { data, error } = await supabase
    .from('reminders')
    .update({ status })
    .eq('id', reminderId)
    .eq('user_id', userId)
    .select('id, commission_id, title, notes, due_at, status, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}
