import { supabase } from '../supabaseClient';

export async function fetchNotifications(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, user_id, type, title, body, entity_type, entity_id, is_read, read_at, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    // Permite desplegar el frontend antes de ejecutar la migración sin romper
    // el resto de la aplicación.
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return [];
    }
    throw error;
  }

  return data ?? [];
}

export async function markNotificationRead(notificationId) {
  if (!supabase) return;

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId) {
  if (!supabase || !userId) return;

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

export function subscribeToNotifications(userId, onNotification) {
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`notifications-user-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNotification(payload.new)
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
