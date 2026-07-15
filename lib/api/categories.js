/* ============================================================
   ARCHIVO: src/lib/api/categories.js
   ============================================================ */

import { supabase } from '../supabaseClient';

/**
 * fetchCategories — Trae las categorías y antepone "Todos"
 * (que en la BD NO es una categoría real, es un filtro de UI).
 * Devuelve un array de strings, igual que mockData.categories.
 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return ['Todos', ...data.map((c) => c.name)];
}
