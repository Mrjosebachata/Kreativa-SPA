/* ============================================================
   ARCHIVO: src/lib/currentUser.js
   PROPÓSITO: Usuario "actual" simulado, mientras no exista
   autenticación real (Sprint 4 - Supabase Auth).

   TODO (Sprint 4): reemplazar este valor fijo por el usuario
   real de la sesión:

     const { data: { user } } = await supabase.auth.getUser();
     const CURRENT_USER_ID = user.id;

   Por ahora, apunta al cliente de ejemplo "Juan Martínez" que
   ya está sembrado en la tabla `profiles` (ver 01_profiles.csv).
   ============================================================ */

export const CURRENT_USER_ID = '00000000-0000-0000-0000-000000009001';
