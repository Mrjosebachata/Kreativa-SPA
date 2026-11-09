import { supabase } from '../supabaseClient';

export async function searchChatbot({ message, history, previousFilters }) {
  if (!supabase) throw Object.assign(new Error('El asistente no está disponible sin Supabase.'), { code: 'ai_unavailable' });
  const { data, error } = await supabase.functions.invoke('chatbot-search', {
    body: { message, history, previousFilters },
  });
  if (error) {
    let payload = null;
    try { payload = await error.context?.json(); } catch { /* La red puede fallar sin JSON. */ }
    throw Object.assign(new Error(payload?.error?.message || 'No se pudo consultar el asistente.'), {
      code: payload?.error?.code || (error.context?.status === 401 ? 'unauthorized' : 'internal'),
    });
  }
  if (!data || typeof data.reply !== 'string' || !Array.isArray(data.profiles)) {
    throw Object.assign(new Error('La respuesta del asistente no es válida.'), { code: 'internal' });
  }
  return data;
}
