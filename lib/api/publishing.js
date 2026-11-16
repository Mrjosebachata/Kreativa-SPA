import { supabase } from '../supabaseClient';
import { removePublicFiles, uploadFile } from './storage';

function assertImage(file, label) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error(`${label} debe ser una imagen.`);
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error(`${label} debe estar en formato JPG, PNG o WEBP.`);
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`${label} no puede superar 10 MB.`);
  }
}

export async function publishService({
  title,
  description,
  categoryId,
  price,
  coverFile,
  tags,
}) {
  if (!supabase) {
    throw new Error('Supabase no está conectado. No se puede publicar el servicio.');
  }

  assertImage(coverFile, 'La portada');
  let coverImageUrl = null;

  try {
    coverImageUrl = await uploadFile('service-images', coverFile);
    const { data, error } = await supabase.rpc('publish_service', {
      p_title: title.trim(),
      p_description: description.trim(),
      p_category_id: Number(categoryId),
      p_price: Number(price),
      p_cover_image_url: coverImageUrl,
      p_tags: tags,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    try {
      await removePublicFiles(
        'service-images',
        coverImageUrl ? [coverImageUrl] : []
      );
    } catch (cleanupError) {
      console.error(
        'No se pudo limpiar la portada del intento fallido:',
        cleanupError
      );
    }
    throw error;
  }
}

export async function updateService({
  gigId,
  title,
  description,
  categoryId,
  price,
  coverImageUrl,
  coverFile,
  tags,
}) {
  if (!supabase) {
    throw new Error('Supabase no está conectado. No se puede editar el servicio.');
  }

  let nextCoverImageUrl = coverImageUrl || null;

  try {
    if (coverFile) {
      assertImage(coverFile, 'La portada');
      nextCoverImageUrl = await uploadFile('service-images', coverFile);
    }

    const { data, error } = await supabase.rpc('update_service', {
      p_gig_id: Number(gigId),
      p_title: title.trim(),
      p_description: description.trim(),
      p_category_id: Number(categoryId),
      p_price: Number(price),
      p_cover_image_url: nextCoverImageUrl,
      p_tags: tags,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    if (coverFile && nextCoverImageUrl && nextCoverImageUrl !== coverImageUrl) {
      try {
        await removePublicFiles('service-images', [nextCoverImageUrl]);
      } catch (cleanupError) {
        console.error('No se pudo limpiar la nueva portada:', cleanupError);
      }
    }
    throw error;
  }
}

export async function deleteService(gigId) {
  if (!supabase) {
    throw new Error('Supabase no está conectado. No se puede eliminar el servicio.');
  }

  const { data, error } = await supabase.rpc('delete_service', {
    p_gig_id: Number(gigId),
  });

  if (error) throw error;
  return data;
}
