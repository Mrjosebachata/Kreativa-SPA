/* ============================================================
   ARCHIVO: src/lib/supabaseClient.js
   PROPÓSITO: Cliente único de Supabase para toda la app.
   ============================================================ */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Revisa tu archivo .env.local (ver PASO_1_INSTALACION.txt).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
