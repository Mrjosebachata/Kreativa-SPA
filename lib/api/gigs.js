/* ============================================================
   ARCHIVO: src/lib/api/gigs.js
   PROPÓSITO: Traer gigs desde Supabase y transformarlos a la
   MISMA forma que usaba mockData.js. Así GigCard.jsx,
   MasonryGrid.jsx e ImageCarousel.jsx NO necesitan cambiar.
   ============================================================ */

import { supabase } from '../supabaseClient';

/**
 * Convierte una fila de Supabase (con relaciones embebidas) a la
 * forma { id, title, category, image, price, tags, author: {...} }
 * que ya usan GigCard y MasonryGrid.
 */
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

/**
 * fetchGigs — Trae todos los gigs activos para el MasonryGrid.
 * Solo trae lo necesario para la tarjeta (no bio completa, no
 * portafolio) para que la carga inicial sea liviana (RNF-02).
 */
export async function fetchGigs() {
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

/**
 * transformGigDetail — Igual que arriba, pero incluye bio completa,
 * skills y portafolio (para FreelancerProfile.jsx).
 */
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
      // Ordenamos en el cliente (más simple y confiable que ordenar
      // una relación embebida de dos niveles en PostgREST)
      portfolio: (fp?.portfolio_images ?? [])
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((p) => p.image_url),
    },
  };
}

/**
 * fetchGigById — Trae UN gig con todo el detalle para el perfil
 * del freelancer (bio completa, skills, portafolio).
 *
 * @param {number} gigId
 * @returns {Promise<object|null>} null si no existe
 */
export async function fetchGigById(gigId) {
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
