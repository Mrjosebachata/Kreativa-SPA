import { supabase } from '../supabaseClient';

const AUTH_NOT_CONFIGURED_MESSAGE =
  'La autenticación todavía no está configurada en este entorno.';

function requireSupabase() {
  if (!supabase) {
    throw new Error(AUTH_NOT_CONFIGURED_MESSAGE);
  }

  return supabase;
}

export async function signUpWithEmail(email, password, fullName) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();

  if (error) throw error;
}

export async function fetchProfile(userId) {
  if (!userId || !supabase) return null;

  // La migración de autenticación crea este RPC para devolver únicamente
  // el perfil privado del usuario actual, incluido su nivel de acceso.
  const { data, error } = await supabase.rpc('get_my_profile');

  if (!error) {
    return Array.isArray(data) ? (data[0] ?? null) : data;
  }

  // Compatibilidad durante la instalación: si el RPC aún no existe,
  // conserva el login y carga solamente los campos públicos del perfil.
  if (error.code === 'PGRST202' || error.code === '42883') {
    const { data: fallbackProfile, error: fallbackError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, location')
      .eq('id', userId)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    return fallbackProfile
      ? {
          ...fallbackProfile,
          marketplace_role: fallbackProfile.role,
          account_role: 'user',
        }
      : null;
  }

  throw error;
}

export { AUTH_NOT_CONFIGURED_MESSAGE };
