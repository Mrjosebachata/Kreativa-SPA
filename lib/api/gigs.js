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
        profiles ( full_name, avatar_url, location )
      )
    `)
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformGigSummary);
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
    return gigs.find((g) => g.id === gigId) ?? null;
  }

  const { data, error } = await supabase
    .from('gigs')
    .select(`
      id, title, description, cover_image_url, price, is_featured,
      categories ( name ),
      gig_tags ( tags ( name ) ),
      freelancer_profiles (
        profile_id, bio, full_bio, rating, reviews_count,
        profiles ( full_name, avatar_url, location ),
        freelancer_skills ( skills ( name ) ),
        portfolio_images ( image_url, display_order )
      )
    `)
    .eq('id', gigId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return transformGigDetail(data);
}
