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

export async function fetchFavoriteProfiles() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('profile_favorites')
    .select(`
      freelancer_id,
      created_at,
      freelancer_profiles!inner(
        profile_id,
        rating,
        reviews_count,
        profiles!freelancer_profiles_profile_id_fkey(
          full_name,
          avatar_url,
          banner_url,
          theme_primary,
          theme_background,
          theme_text,
          theme_surface,
          theme_surface_text
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((favorite) => {
    const freelancer = favorite.freelancer_profiles;
    const profile = freelancer?.profiles;

    return {
      id: favorite.freelancer_id,
      name: profile?.full_name ?? 'Usuario de Kreativa',
      avatar: profile?.avatar_url ?? '',
      banner: profile?.banner_url ?? '',
      themePrimary: profile?.theme_primary ?? '#c06cff',
      themeBackground: profile?.theme_background ?? '#121216',
      themeText: profile?.theme_text ?? '#f8f8f8',
      themeSurface: profile?.theme_surface ?? '#1c1c21',
      themeSurfaceText: profile?.theme_surface_text ?? '#f8f8f8',
      rating: Number(freelancer?.rating ?? 0),
      reviews: freelancer?.reviews_count ?? 0,
    };
  });
}
