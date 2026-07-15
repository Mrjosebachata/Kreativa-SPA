/* ============================================================
   ARCHIVO: src/lib/api/messaging.js
   PROPÓSITO: Traer conversaciones+mensajes y transformarlos a
   la MISMA forma que usaba mockData.js. Así ConversationList.jsx,
   ChatWindow.jsx y MessageBubble.jsx casi no cambian.
   ============================================================ */

import { supabase } from '../supabaseClient';
import { uploadFiles } from './storage';

/**
 * fetchConversations — Trae TODAS las conversaciones donde el
 * usuario participa (como cliente o como freelancer), con sus
 * mensajes, adjuntos, y el conteo de no-leídos calculado a partir
 * de conversation_reads.
 *
 * NOTA: no usamos "embeds" anidados de Supabase para traer
 * `profiles` dos veces (cliente Y freelancer) porque eso requiere
 * pistas de nombre de constraint FK que pueden variar. En su lugar
 * hacemos 3 consultas simples y las combinamos en JS — más código,
 * pero mucho más robusto para un proyecto que recién arranca.
 *
 * @param {string} userId - UUID del usuario actual
 */
export async function fetchConversations(userId) {
  // 1. Conversaciones donde el usuario participa
  const { data: convos, error: convosError } = await supabase
    .from('conversations')
    .select('id, gig_id, subject, last_message_at, client_id, freelancer_id, created_at')
    .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (convosError) throw convosError;
  if (!convos || convos.length === 0) return [];

  const convoIds = convos.map((c) => c.id);
  const userIds = [...new Set(convos.flatMap((c) => [c.client_id, c.freelancer_id]))];

  // 2. Perfiles de todos los participantes (una sola consulta)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);
  if (profilesError) throw profilesError;
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  // 3. Todos los mensajes de esas conversaciones
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .in('conversation_id', convoIds)
    .order('created_at', { ascending: true });
  if (messagesError) throw messagesError;

  // 4. Adjuntos de esos mensajes
  const messageIds = messages.map((m) => m.id);
  let attachmentsByMessage = {};
  if (messageIds.length > 0) {
    const { data: attachments, error: attachmentsError } = await supabase
      .from('message_attachments')
      .select('message_id, file_url')
      .in('message_id', messageIds);
    if (attachmentsError) throw attachmentsError;

    attachmentsByMessage = attachments.reduce((acc, a) => {
      (acc[a.message_id] ??= []).push(a.file_url);
      return acc;
    }, {});
  }

  // 5. Estado de lectura del usuario actual en cada conversación
  const { data: reads, error: readsError } = await supabase
    .from('conversation_reads')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)
    .in('conversation_id', convoIds);
  if (readsError) throw readsError;
  const readMap = Object.fromEntries(reads.map((r) => [r.conversation_id, r.last_read_at]));

  // 6. Ensamblar todo en la forma que ya usan tus componentes
  return convos.map((c) => {
    const convoMessages = messages
      .filter((m) => m.conversation_id === c.id)
      .map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: profileMap[m.sender_id]?.full_name ?? '',
        senderAvatar: profileMap[m.sender_id]?.avatar_url ?? '',
        text: m.body,
        files: attachmentsByMessage[m.id] ?? [],
        timestamp: m.created_at,
      }));

    const lastReadAt = readMap[c.id] ?? c.created_at;
    const unreadCount = messages.filter(
      (m) =>
        m.conversation_id === c.id &&
        m.sender_id !== userId &&
        new Date(m.created_at) > new Date(lastReadAt)
    ).length;

    return {
      id: c.id,
      gigId: c.gig_id,
      clientId: c.client_id,
      freelancerId: c.freelancer_id,
      subject: c.subject,
      lastMessage: c.last_message_at,
      unreadCount,
      clientName: profileMap[c.client_id]?.full_name ?? '',
      clientAvatar: profileMap[c.client_id]?.avatar_url ?? '',
      freelancerName: profileMap[c.freelancer_id]?.full_name ?? '',
      freelancerAvatar: profileMap[c.freelancer_id]?.avatar_url ?? '',
      messages: convoMessages,
    };
  });
}

/**
 * sendMessage — Inserta un mensaje, sube sus adjuntos (si hay) y
 * actualiza `last_message_at` de la conversación.
 *
 * @param {Object} params
 * @param {number} params.conversationId
 * @param {string} params.senderId  - UUID
 * @param {string} params.text
 * @param {File[]} params.files     - Archivos reales
 * @returns {Promise<{id, body, created_at, files: string[]}>}
 */
export async function sendMessage({ conversationId, senderId, text, files = [] }) {
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: text })
    .select()
    .single();

  if (messageError) throw messageError;

  let fileUrls = [];
  if (files.length > 0) {
    fileUrls = await uploadFiles('message-attachments', files);

    const attachmentRows = fileUrls.map((url, i) => ({
      message_id: message.id,
      file_url: url,
      file_type: files[i].type?.startsWith('image/') ? 'image' : 'file',
      file_name: files[i].name,
    }));

    const { error: attachmentsError } = await supabase
      .from('message_attachments')
      .insert(attachmentRows);
    if (attachmentsError) throw attachmentsError;
  }

  await supabase
    .from('conversations')
    .update({ last_message_at: message.created_at })
    .eq('id', conversationId);

  return { ...message, files: fileUrls };
}

/**
 * markConversationRead — Registra que el usuario leyó la
 * conversación hasta este momento (afecta el conteo de no-leídos).
 */
export async function markConversationRead(conversationId, userId) {
  const { error } = await supabase.from('conversation_reads').upsert(
    {
      conversation_id: conversationId,
      user_id: userId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: 'conversation_id,user_id' }
  );
  if (error) throw error;
}

/**
 * subscribeToMessages — OPCIONAL / BONUS.
 * Escucha mensajes nuevos en tiempo real vía Supabase Realtime
 * (WebSocket), sin necesidad de recargar ni volver a hacer fetch.
 *
 * Requiere activar Realtime en la tabla `messages` desde
 * Supabase Dashboard -> Database -> Replication.
 *
 * Uso en ChatWindow.jsx:
 *   useEffect(() => {
 *     const unsubscribe = subscribeToMessages(conversation.id, (newRow) => {
 *       // Aquí puedes agregar el mensaje al estado local
 *     });
 *     return unsubscribe;
 *   }, [conversation.id]);
 */
export function subscribeToMessages(conversationId, onNewMessage) {
  const channel = supabase
    .channel(`messages-conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onNewMessage(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
