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
    bannerUrl: row?.banner_url ?? '',
    themePrimary: row?.theme_primary ?? '#c6ff00',
    themeBackground: row?.theme_background ?? '#121216',
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
  publicName,
  fullBio,
  avatarUrl,
  avatarFile,
  bannerUrl,
  bannerFile,
  themePrimary = '#c6ff00',
  themeBackground = '#121216',
  skills,
  portfolioUrls = [],
  portfolioFiles = [],
  removedAvatarUrls = [],
  removedBannerUrls = [],
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

  if (bannerFile) {
    assertImage(bannerFile, 'El banner');
  }

  portfolioFiles.forEach((file, index) => {
    assertImage(file, `La imagen ${index + 1} del portafolio`);
  });

  let uploadedAvatarUrl = null;
  let uploadedBannerUrl = null;
  const uploadedPortfolioUrls = [];

  try {
    if (avatarFile) {
      uploadedAvatarUrl = await uploadFile('service-images', avatarFile);
    }

    if (bannerFile) {
      uploadedBannerUrl = await uploadFile('service-images', bannerFile);
    }

    for (const file of portfolioFiles) {
      uploadedPortfolioUrls.push(await uploadFile('service-images', file));
    }

    const nextAvatarUrl = uploadedAvatarUrl || avatarUrl || null;
    const nextBannerUrl = uploadedBannerUrl || bannerUrl || null;
    const nextPortfolioUrls = [
      ...portfolioUrls,
      ...uploadedPortfolioUrls,
    ];
    const { error } = await supabase.rpc('save_creative_profile', {
      // El RPC anterior conserva p_bio por compatibilidad. La interfaz ya
      // utiliza únicamente "Acerca de ti" como biografía pública.
      p_bio: fullBio.trim(),
      p_full_bio: fullBio.trim(),
      p_location: null,
      p_avatar_url: nextAvatarUrl,
      p_banner_url: nextBannerUrl,
      p_theme_primary: themePrimary,
      p_theme_background: themeBackground,
      p_skills: skills,
      p_portfolio_urls: nextPortfolioUrls,
    });

    if (error) throw error;

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { error: nameError } = await supabase
      .from('profiles')
      .update({ full_name: publicName.trim() })
      .eq('id', authData.user?.id);

    if (nameError) throw nameError;

    try {
      await removePublicFiles('service-images', [
        ...removedAvatarUrls,
        ...removedBannerUrls,
        ...removedPortfolioUrls,
      ]);
    } catch (cleanupError) {
      console.error(
        'El perfil se guardó, pero no se pudieron retirar algunas imágenes anteriores:',
        cleanupError
      );
    }

    return {
      publicName: publicName.trim(),
      bio: fullBio.trim(),
      fullBio: fullBio.trim(),
      location: '',
      avatarUrl: nextAvatarUrl ?? '',
      bannerUrl: nextBannerUrl ?? '',
      themePrimary,
      themeBackground,
      skills,
      portfolioUrls: nextPortfolioUrls,
    };
  } catch (error) {
    try {
      await removePublicFiles('service-images', [
        ...(uploadedAvatarUrl ? [uploadedAvatarUrl] : []),
        ...(uploadedBannerUrl ? [uploadedBannerUrl] : []),
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
