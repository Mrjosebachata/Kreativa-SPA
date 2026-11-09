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
      .map((gigTag) => gigTag.tags?.name)
      .filter(Boolean),
    author: {
      id: row.freelancer_profiles?.profile_id,
      name: row.freelancer_profiles?.profiles?.full_name ?? '',
      avatar: row.freelancer_profiles?.profiles?.avatar_url ?? '',
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
      id,
      title,
      description,
      cover_image_url,
      price,
      is_featured,
      categories (
        name
      ),
      gig_tags (
        tags (
          name
        )
      ),
      freelancer_profiles (
        profile_id,
        rating,
        reviews_count,
        profiles!freelancer_profiles_profile_id_fkey (
          full_name,
          avatar_url,
          location
        )
      )
    `)
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(transformGigSummary);
}

function transformGigDetail(row) {
  const freelancerProfile = row.freelancer_profiles;

  return {
    id: row.id,
    title: row.title,
    category: row.categories?.name ?? '',
    image: row.cover_image_url,
    description: row.description,
    price: Number(row.price),
    isFeatured: row.is_featured,
    tags: (row.gig_tags ?? [])
      .map((gigTag) => gigTag.tags?.name)
      .filter(Boolean),

    author: {
      id: freelancerProfile?.profile_id,
      name: freelancerProfile?.profiles?.full_name ?? '',
      avatar: freelancerProfile?.profiles?.avatar_url ?? '',
      location: freelancerProfile?.profiles?.location ?? '',
      rating: Number(freelancerProfile?.rating ?? 0),
      reviews: freelancerProfile?.reviews_count ?? 0,
      bio: freelancerProfile?.bio ?? '',
      fullBio: freelancerProfile?.full_bio ?? '',

      skills: (freelancerProfile?.freelancer_skills ?? [])
        .map((freelancerSkill) => freelancerSkill.skills?.name)
        .filter(Boolean),

      portfolio: (freelancerProfile?.portfolio_images ?? [])
        .slice()
        .sort(
          (firstImage, secondImage) =>
            firstImage.display_order - secondImage.display_order
        )
        .map((portfolioImage) => portfolioImage.image_url),
    },
  };
}

export async function fetchGigById(gigId) {
  if (!supabase) {
    const { gigs } = await import('../../src/data/mockData.js');

    return gigs.find((gig) => gig.id === gigId) ?? null;
  }

  const { data, error } = await supabase
    .from('gigs')
    .select(`
      id,
      title,
      description,
      cover_image_url,
      price,
      is_featured,
      categories (
        name
      ),
      gig_tags (
        tags (
          name
        )
      ),
      freelancer_profiles (
        profile_id,
        bio,
        full_bio,
        rating,
        reviews_count,
        profiles!freelancer_profiles_profile_id_fkey (
          full_name,
          avatar_url,
          location
        ),
        freelancer_skills (
          skills (
            name
          )
        ),
        portfolio_images (
          image_url,
          display_order
        )
      )
    `)
    .eq('id', gigId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return transformGigDetail(data);
}