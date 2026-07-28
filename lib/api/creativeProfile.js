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

function normalizeProfile(row) {
  return {
    bio: row?.bio ?? '',
    fullBio: row?.full_bio ?? '',
    location: row?.location ?? '',
    avatarUrl: row?.avatar_url ?? '',
    skills: Array.isArray(row?.skills) ? row.skills : [],
    portfolioUrls: Array.isArray(row?.portfolio_urls)
      ? row.portfolio_urls
      : [],
  };
}

export function isCreativeProfileComplete(profile) {
  return Boolean(
    profile?.bio?.trim().length >= 20 &&
      profile?.fullBio?.trim().length >= 40 &&
      profile?.skills?.length > 0
  );
}

export async function fetchCreativeProfile(userId) {
  if (!supabase || !userId) return normalizeProfile(null);

  const { data, error } = await supabase.rpc('get_my_creative_profile');
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return normalizeProfile(row);
}

export async function saveCreativeProfile({
  bio,
  fullBio,
  location,
  avatarUrl,
  avatarFile,
  skills,
  portfolioUrls = [],
  portfolioFiles = [],
  removedAvatarUrls = [],
  removedPortfolioUrls = [],
}) {
  if (!supabase) {
    throw new Error(
      'Supabase no está conectado. No se puede guardar el perfil creativo.'
    );
  }

  if (avatarFile) {
    assertImage(avatarFile, 'La foto de perfil');
  }

  portfolioFiles.forEach((file, index) => {
    assertImage(file, `La imagen ${index + 1} del portafolio`);
  });

  let uploadedAvatarUrl = null;
  const uploadedPortfolioUrls = [];

  try {
    if (avatarFile) {
      uploadedAvatarUrl = await uploadFile('service-images', avatarFile);
    }

    for (const file of portfolioFiles) {
      uploadedPortfolioUrls.push(await uploadFile('service-images', file));
    }

    const nextAvatarUrl = uploadedAvatarUrl || avatarUrl || null;
    const nextPortfolioUrls = [
      ...portfolioUrls,
      ...uploadedPortfolioUrls,
    ];
    const { error } = await supabase.rpc('save_creative_profile', {
      p_bio: bio.trim(),
      p_full_bio: fullBio.trim(),
      p_location: location.trim(),
      p_avatar_url: nextAvatarUrl,
      p_skills: skills,
      p_portfolio_urls: nextPortfolioUrls,
    });

    if (error) throw error;

    try {
      await removePublicFiles('service-images', [
        ...removedAvatarUrls,
        ...removedPortfolioUrls,
      ]);
    } catch (cleanupError) {
      console.error(
        'El perfil se guardó, pero no se pudieron retirar algunas imágenes anteriores:',
        cleanupError
      );
    }

    return {
      bio: bio.trim(),
      fullBio: fullBio.trim(),
      location: location.trim(),
      avatarUrl: nextAvatarUrl ?? '',
      skills,
      portfolioUrls: nextPortfolioUrls,
    };
  } catch (error) {
    try {
      await removePublicFiles('service-images', [
        ...(uploadedAvatarUrl ? [uploadedAvatarUrl] : []),
        ...uploadedPortfolioUrls,
      ]);
    } catch (cleanupError) {
      console.error(
        'No se pudieron limpiar las imágenes del intento fallido:',
        cleanupError
      );
    }

    throw error;
  }
}
