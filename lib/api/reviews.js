import { supabase } from '../supabaseClient';

function normalizeReview(row, profilesById) {
  const author = profilesById[row.client_id] ?? {};

  return {
    id: row.id,
    commissionId: row.commission_id,
    rating: Number(row.rating),
    comment: row.comment ?? '',
    createdAt: row.created_at,
    author: {
      id: row.client_id,
      name: author.full_name ?? 'Cliente de KREATIVA',
      avatar: author.avatar_url ?? '',
    },
  };
}

export async function fetchReviewsForFreelancer(freelancerId) {
  if (!supabase || !freelancerId) return [];

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, commission_id, client_id, rating, comment, created_at')
    .eq('freelancer_id', freelancerId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (reviewsError) throw reviewsError;
  if (!reviews?.length) return [];

  const clientIds = [...new Set(reviews.map((review) => review.client_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', clientIds);

  if (profilesError) throw profilesError;

  const profilesById = Object.fromEntries(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  return reviews.map((review) => normalizeReview(review, profilesById));
}

export async function createReview({ commissionId, rating, comment }) {
  if (!supabase) {
    throw new Error('Supabase no esta conectado. No se puede publicar la resena.');
  }

  const { data, error } = await supabase.rpc('create_review', {
    p_commission_id: commissionId,
    p_rating: rating,
    p_comment: comment.trim() || null,
  });

  if (error) throw error;
  return data;
}
