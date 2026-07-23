/* ============================================================
   ARCHIVO: src/lib/api/storage.js
   PROPÓSITO: Subir archivos (imágenes, documentos) a Supabase
   Storage y devolver su URL pública.

   REQUIERE que existan los buckets 'commission-attachments' y
   'message-attachments' en Storage, marcados como PÚBLICOS,
   con políticas de INSERT abiertas (ver GUIA_CONEXION_REACT.md,
   sección "Storage").
   ============================================================ */

import { supabase } from '../supabaseClient';

/**
 * Sube un archivo a un bucket de Supabase Storage.
 *
 * @param {string} bucket - Nombre del bucket ('commission-attachments' | 'message-attachments')
 * @param {File}   file   - Archivo real del input (no Data URL)
 * @returns {Promise<string>} URL pública del archivo subido
 */
export async function uploadFile(bucket, file) {
  if (!supabase) {
    throw new Error('Supabase no está conectado. No se pueden subir archivos.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Debes iniciar sesión para subir archivos.');
  }

  // Nombre único para evitar colisiones entre archivos con el mismo nombre
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error al subir "${file.name}": ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Sube varios archivos en paralelo.
 *
 * @param {string} bucket
 * @param {File[]} files
 * @returns {Promise<string[]>} Array de URLs públicas, mismo orden que `files`
 */
export async function uploadFiles(bucket, files) {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((file) => uploadFile(bucket, file)));
}
