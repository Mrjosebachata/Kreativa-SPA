import { supabase } from '../supabaseClient';

async function getCurrentUserId() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function fetchFavoriteStatus(freelancerId) {
  const userId = await getCurrentUserId();
  if (!userId || !freelancerId) return false;

  const { data, error } = await supabase
    .from('profile_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('freelancer_id', freelancerId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function addFavorite(freelancerId) {
  const userId = await getCurrentUserId();
  if (!userId || !freelancerId) throw new Error('Debes iniciar sesión para guardar favoritos.');

  const { error } = await supabase
    .from('profile_favorites')
    .upsert(
      { user_id: userId, freelancer_id: freelancerId },
      { onConflict: 'user_id,freelancer_id' }
    );

  if (error) throw error;
}

export async function removeFavorite(freelancerId) {
  const userId = await getCurrentUserId();
  if (!userId || !freelancerId) return;

  const { error } = await supabase
    .from('profile_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('freelancer_id', freelancerId);

  if (error) throw error;
}
