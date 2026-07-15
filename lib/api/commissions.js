/* ============================================================
   ARCHIVO: src/lib/api/commissions.js (CORREGIDO)
   ============================================================
   FIX: la versión anterior creaba la `conversation` pero nunca
   insertaba un primer `message` — la conversación quedaba con
   messages: [] y eso hacía tronar ConversationList.jsx al hacer
   conv.messages[conv.messages.length - 1].senderId (undefined).

   Ahora, al crear la comisión, también se inserta un mensaje
   automático con el resumen de la solicitud (título, presupuesto,
   plazo, descripción). Así:
   - La conversación NUNCA empieza vacía
   - El freelancer ve el contexto completo apenas abre el chat
   - Las imágenes de referencia se reutilizan como adjuntos del
     primer mensaje (no se vuelven a subir, ya tenemos sus URLs)
   ============================================================ */

import { supabase } from '../supabaseClient';
import { uploadFiles } from './storage';

const TIMELINE_LABELS = {
  flexible: 'Flexible',
  '1week': '1 semana',
  '2weeks': '2 semanas',
  '1month': '1 mes',
  '2months': '2 meses',
};

/**
 * createCommission — Inserta la comisión, sube imágenes de
 * referencia a Storage, crea la conversación asociada Y su primer
 * mensaje (para que nunca quede vacía).
 *
 * @param {Object} params
 * @param {number} params.gigId
 * @param {string} params.clientId
 * @param {string} params.freelancerId
 * @param {string} params.title
 * @param {string} params.description
 * @param {number} params.budget
 * @param {string} params.timeline
 * @param {File[]} params.files
 * @returns {Promise<object>} la fila de commissions insertada
 */
export async function createCommission({
  gigId,
  clientId,
  freelancerId,
  title,
  description,
  budget,
  timeline,
  files = [],
}) {
  // 1. Crear la comisión
  const { data: commission, error: commissionError } = await supabase
    .from('commissions')
    .insert({
      gig_id: gigId,
      client_id: clientId,
      freelancer_id: freelancerId,
      title,
      description,
      budget,
      timeline,
    })
    .select()
    .single();

  if (commissionError) throw commissionError;

  // 2. Subir imágenes de referencia (si hay) — guardamos las URLs
  //    para reutilizarlas tanto en commission_attachments como en
  //    el primer mensaje del chat.
  let attachmentUrls = [];
  if (files.length > 0) {
    attachmentUrls = await uploadFiles('commission-attachments', files);

    const attachmentRows = attachmentUrls.map((url, i) => ({
      commission_id: commission.id,
      file_url: url,
      file_name: files[i].name,
    }));

    const { error: attachmentsError } = await supabase
      .from('commission_attachments')
      .insert(attachmentRows);

    if (attachmentsError) throw attachmentsError;
  }

  // 3. Crear la conversación asociada (todavía sin last_message_at,
  //    lo actualizamos abajo con la hora real del primer mensaje)
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      gig_id: gigId,
      commission_id: commission.id,
      client_id: clientId,
      freelancer_id: freelancerId,
      subject: title,
    })
    .select()
    .single();

  if (conversationError) throw conversationError;

  // 4. Insertar el primer mensaje con el resumen de la solicitud
  //    — ESTE es el fix: la conversación ya no nace vacía.
  const summaryText =
    `💼 Nueva solicitud de comisión: "${title}"\n\n` +
    `Presupuesto: $${Number(budget).toLocaleString('es-MX')} MXN\n` +
    `Plazo: ${TIMELINE_LABELS[timeline] ?? timeline}\n\n` +
    description;

  const { data: firstMessage, error: firstMessageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: clientId,
      body: summaryText,
    })
    .select()
    .single();

  if (firstMessageError) throw firstMessageError;

  // 5. Si había imágenes de referencia, las reutilizamos como
  //    adjuntos de ese primer mensaje (mismas URLs, sin re-subir)
  if (attachmentUrls.length > 0) {
    const messageAttachmentRows = attachmentUrls.map((url, i) => ({
      message_id: firstMessage.id,
      file_url: url,
      file_type: 'image',
      file_name: files[i]?.name ?? null,
    }));

    const { error: msgAttachmentsError } = await supabase
      .from('message_attachments')
      .insert(messageAttachmentRows);

    if (msgAttachmentsError) throw msgAttachmentsError;
  }

  // 6. Ahora sí, actualizar last_message_at con la hora real del mensaje
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ last_message_at: firstMessage.created_at })
    .eq('id', conversation.id);

  if (updateError) throw updateError;

  return commission;
}