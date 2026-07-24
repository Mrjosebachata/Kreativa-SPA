import { supabase } from '../supabaseClient';

export async function fetchCategoryOptions() {
  if (!supabase) {
    const { categories } = await import('../../src/data/mockData.js');
    return categories
      .filter((name) => name !== 'Todos')
      .map((name, index) => ({ id: index + 1, name }));
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchCategories() {
  const options = await fetchCategoryOptions();
  return ['Todos', ...options.map((category) => category.name)];
}
