import { supabase } from '../supabaseClient';

async function getCurrentUser() {
  if (!supabase) {
    throw new Error('Supabase no está conectado.');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  if (!user) {
    throw new Error('Debes iniciar sesión.');
  }

  return user;
}

export async function fetchFavoriteStatus(freelancerId) {
  if (!supabase || !freelancerId) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from('profile_favorites')
    .select('freelancer_id')
    .eq('user_id', user.id)
    .eq('freelancer_id', freelancerId)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

export async function addFavorite(freelancerId) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from('profile_favorites')
    .insert({
      user_id: user.id,
      freelancer_id: freelancerId,
    });

  if (error) throw error;
}

export async function removeFavorite(freelancerId) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from('profile_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('freelancer_id', freelancerId);

  if (error) throw error;
}