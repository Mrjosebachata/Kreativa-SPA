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

export async function fetchPublisherProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('freelancer_profiles')
    .select('bio, full_bio')
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function publishService({
  title,
  description,
  categoryId,
  price,
  coverFile,
  bio,
  fullBio,
  location,
  tags,
  skills,
  portfolioFiles = [],
}) {
  if (!supabase) {
    throw new Error('Supabase no está conectado. No se puede publicar el servicio.');
  }

  assertImage(coverFile, 'La portada');
  portfolioFiles.forEach((file, index) => {
    assertImage(file, `La imagen ${index + 1} del portafolio`);
  });

  const files = [coverFile, ...portfolioFiles];
  const uploadedUrls = [];

  try {
    for (const file of files) {
      uploadedUrls.push(await uploadFile('service-images', file));
    }

    const [coverImageUrl, ...portfolioUrls] = uploadedUrls;
    const { data, error } = await supabase.rpc('publish_service', {
      p_title: title.trim(),
      p_description: description.trim(),
      p_category_id: Number(categoryId),
      p_price: Number(price),
      p_cover_image_url: coverImageUrl,
      p_bio: bio.trim(),
      p_full_bio: fullBio.trim(),
      p_location: location.trim(),
      p_tags: tags,
      p_skills: skills,
      p_portfolio_urls: portfolioUrls,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    try {
      await removePublicFiles('service-images', uploadedUrls);
    } catch (cleanupError) {
      console.error('No se pudieron limpiar las imágenes del intento fallido:', cleanupError);
    }
    throw error;
  }
}
