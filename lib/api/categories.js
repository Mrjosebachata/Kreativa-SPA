import { supabase } from '../supabaseClient';

export async function fetchCategories() {
  if (!supabase) {
    const { categories } = await import('../../src/data/mockData.js');
    return categories;
  }

  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return ['Todos', ...data.map((c) => c.name)];
}
