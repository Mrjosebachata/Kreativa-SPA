import { supabase } from '../supabaseClient';

function transformGigSummary(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.categories?.name ?? '',
    image: row.cover_image_url,
    description: row.description,
    price: Number(row.price),
    isFeatured: row.is_featured,
    tags: (row.gig_tags ?? [])
      .map((gt) => gt.tags?.name)
      .filter(Boolean),
    author: {
      id: row.freelancer_profiles?.profile_id,
      name: row.freelancer_profiles?.profiles?.full_name ?? '',
      avatar: row.freelancer_profiles?.profiles?.avatar_url ?? '',
      banner: row.freelancer_profiles?.profiles?.banner_url ?? '',
      themePrimary: row.freelancer_profiles?.profiles?.theme_primary ?? '#c06cff',
      themeBackground: row.freelancer_profiles?.profiles?.theme_background ?? '#121216',
      themeText: row.freelancer_profiles?.profiles?.theme_text ?? '#f8f8f8',
      themeSurface: row.freelancer_profiles?.profiles?.theme_surface ?? '#1c1c21',
      themeSurfaceText: row.freelancer_profiles?.profiles?.theme_surface_text ?? '#f8f8f8',
      contactLinks: row.freelancer_profiles?.profiles?.contact_links ?? [],
      location: row.freelancer_profiles?.profiles?.location ?? '',
      rating: Number(row.freelancer_profiles?.rating ?? 0),
      reviews: row.freelancer_profiles?.reviews_count ?? 0,
    },
  };
}

export async function fetchGigs() {
  if (!supabase) {
    const { gigs } = await import('../../src/data/mockData.js');
    return gigs;
  }

  const { data, error } = await supabase
    .from('gigs')
    .select(`
      id, title, description, cover_image_url, price, is_featured,
      categories ( name ),
      gig_tags ( tags ( name ) ),
      freelancer_profiles (
        profile_id, rating, reviews_count,
        profiles!freelancer_profiles_profile_id_fkey ( full_name, avatar_url, banner_url, theme_primary, theme_background, theme_text, theme_surface, theme_surface_text, contact_links, location )
      )
    `)
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformGigSummary);
}

export async function fetchGigsByFreelancerId(profileId) {
  if (!profileId) return [];

  const gigs = await fetchGigs();
  return gigs.filter((gig) => gig.author?.id === profileId);
}

function transformGigDetail(row) {
  const fp = row.freelancer_profiles;

  return {
    id: row.id,
    title: row.title,
    category: row.categories?.name ?? '',
    image: row.cover_image_url,
    description: row.description,
    price: Number(row.price),
    isFeatured: row.is_featured,
    tags: (row.gig_tags ?? []).map((gt) => gt.tags?.name).filter(Boolean),
    author: {
      id: fp?.profile_id,
      name: fp?.profiles?.full_name ?? '',
      avatar: fp?.profiles?.avatar_url ?? '',
      banner: fp?.profiles?.banner_url ?? '',
      themePrimary: fp?.profiles?.theme_primary ?? '#c06cff',
      themeBackground: fp?.profiles?.theme_background ?? '#121216',
      themeText: fp?.profiles?.theme_text ?? '#f8f8f8',
      themeSurface: fp?.profiles?.theme_surface ?? '#1c1c21',
      themeSurfaceText: fp?.profiles?.theme_surface_text ?? '#f8f8f8',
      contactLinks: fp?.profiles?.contact_links ?? [],
      location: fp?.profiles?.location ?? '',
      rating: Number(fp?.rating ?? 0),
      reviews: fp?.reviews_count ?? 0,
      bio: fp?.bio ?? '',
      fullBio: fp?.full_bio ?? '',
      skills: (fp?.freelancer_skills ?? [])
        .map((fs) => fs.skills?.name)
        .filter(Boolean),
      portfolio: (fp?.portfolio_images ?? [])
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((p) => p.image_url),
    },
  };
}

export async function fetchGigById(gigId) {
  if (!supabase) {
    const { gigs } = await import('../../src/data/mockData.js');
    const selectedGig = gigs.find((g) => g.id === gigId);
    if (!selectedGig) return null;

    return {
      ...selectedGig,
      services: gigs.filter(
        (gig) => gig.author?.id === selectedGig.author?.id
      ),
    };
  }

  const { data, error } = await supabase
    .from('gigs')
    .select(`
      id, title, description, cover_image_url, price, is_featured,
      categories ( name ),
      gig_tags ( tags ( name ) ),
      freelancer_profiles (
        profile_id, bio, full_bio, rating, reviews_count,
        profiles!freelancer_profiles_profile_id_fkey ( full_name, avatar_url, banner_url, theme_primary, theme_background, theme_text, theme_surface, theme_surface_text, contact_links, location ),
        freelancer_skills ( skills ( name ) ),
        portfolio_images ( image_url, display_order )
      )
    `)
    .eq('id', gigId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const gig = transformGigDetail(data);
  const services = await fetchGigsByFreelancerId(gig.author.id);

  return {
    ...gig,
    services,
  };
}

export async function fetchPublicProfileById(profileId) {
  if (!profileId) return null;

  if (!supabase) {
    const { gigs } = await import('../../src/data/mockData.js');
    const matchingGigs = gigs.filter((gig) => gig.author?.id === profileId);
    const matchingGig = matchingGigs[0];
    return matchingGig
      ? {
          ...matchingGig,
          id: null,
          title: '',
          price: 0,
          services: matchingGigs,
        }
      : {
          id: null,
          title: '',
          category: 'Perfil de Kreativa',
          image: '',
          price: 0,
          tags: [],
          services: [],
          author: {
            id: profileId,
            name: 'Usuario de Kreativa',
            avatar: '',
            location: '',
            rating: 0,
            reviews: 0,
            bio: '',
            fullBio: '',
            skills: [],
            portfolio: [],
          },
        };
  }

  let profile;
  const { data: sessionData } = await supabase.auth.getUser();
  const isOwnProfile = sessionData.user?.id === profileId;

  if (isOwnProfile) {
    const { data: ownProfile, error: ownProfileError } = await supabase.rpc(
      'get_my_profile'
    );

    if (!ownProfileError) {
      profile = Array.isArray(ownProfile) ? ownProfile[0] : ownProfile;
    }
  }

  if (!profile) {
    const { data: publicProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, banner_url, theme_primary, theme_background, theme_text, theme_surface, theme_surface_text, contact_links, location, role')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError) throw profileError;
    profile = publicProfile;
  }

  if (!profile) return null;

  const services = await fetchGigsByFreelancerId(profileId);

  let freelancer = null;
  let freelancerError = null;

  if (isOwnProfile) {
    const { data: creativeData, error: creativeError } = await supabase.rpc(
      'get_my_creative_profile'
    );
    // Un usuario cliente o administrador puede no tener perfil creativo.
    // En ese caso conservamos el perfil base y no interrumpimos la vista.
    freelancerError = null;
    const creative = Array.isArray(creativeData)
      ? creativeData[0]
      : creativeData;

    if (!creativeError && creative) {
      freelancer = {
        bio: creative.bio,
        full_bio: creative.full_bio,
        banner_url: creative.banner_url,
        theme_primary: creative.theme_primary,
        theme_background: creative.theme_background,
        theme_text: creative.theme_text,
        theme_surface: creative.theme_surface,
        theme_surface_text: creative.theme_surface_text,
        contact_links: creative.contact_links ?? [],
        rating: creative.rating,
        reviews_count: creative.reviews_count,
        skills: creative.skills ?? [],
        portfolio_urls: creative.portfolio_urls ?? [],
      };
    }
  } else {
    const result = await supabase
      .from('freelancer_profiles')
      .select(`
        profile_id, bio, full_bio, rating, reviews_count,
        freelancer_skills ( skills ( name ) ),
        portfolio_images ( image_url, display_order )
      `)
      .eq('profile_id', profileId)
      .maybeSingle();

    freelancer = result.data;
    freelancerError = result.error;
  }

  if (freelancerError) throw freelancerError;

  const portfolio = freelancer?.portfolio_urls?.length
    ? freelancer.portfolio_urls
    : (freelancer?.portfolio_images ?? [])
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((item) => item.image_url);
  const skills = freelancer?.skills?.length
    ? freelancer.skills
    : (freelancer?.freelancer_skills ?? [])
        .map((item) => item.skills?.name)
        .filter(Boolean);

  const roleLabel =
    profile.account_role === 'admin'
      ? 'Administrador'
      : profile.role === 'freelancer'
        ? 'Freelancer'
        : profile.role === 'both'
          ? 'Cliente · Freelancer'
          : 'Cliente';

  return {
    id: null,
    title: '',
    category: roleLabel,
    image: portfolio[0] ?? '',
    price: 0,
    tags: [],
    services,
    author: {
      id: profile.id,
      name: profile.full_name ?? 'Usuario de Kreativa',
      avatar: profile.avatar_url ?? '',
      banner: profile.banner_url ?? freelancer?.banner_url ?? '',
      themePrimary: profile.theme_primary ?? freelancer?.theme_primary ?? '#c06cff',
      themeBackground: profile.theme_background ?? freelancer?.theme_background ?? '#121216',
      themeText: profile.theme_text ?? freelancer?.theme_text ?? '#f8f8f8',
      themeSurface: profile.theme_surface ?? freelancer?.theme_surface ?? '#1c1c21',
      themeSurfaceText: profile.theme_surface_text ?? freelancer?.theme_surface_text ?? '#f8f8f8',
      contactLinks: profile.contact_links ?? freelancer?.contact_links ?? [],
      location: profile.location ?? '',
      rating: Number(freelancer?.rating ?? 0),
      reviews: freelancer?.reviews_count ?? 0,
      bio: freelancer?.bio ?? '',
      fullBio: freelancer?.full_bio ?? '',
      skills,
      portfolio,
    },
  };
}
