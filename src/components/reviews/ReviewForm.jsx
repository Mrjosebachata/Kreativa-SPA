import { useState } from 'react';
import { createReview } from '../../../lib/api/reviews';
import StarRating from './StarRating';

function ReviewForm({ commissionId, freelancerName, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating) {
      setError('Selecciona una calificacion entre 1 y 5 estrellas.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createReview({ commissionId, rating, comment });
      setIsComplete(true);
      await onSubmitted?.();
    } catch (submitError) {
      console.error('Error publicando la resena:', submitError);
      setError(
        submitError?.message ||
          'No se pudo publicar la resena. Verifica el estado de la comision.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-gold/40 bg-gold-light/30 px-4 py-3 text-sm text-warm-800"
      >
        Gracias. Tu calificacion ya aparece en el perfil de {freelancerName}.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-gold/40 bg-cream-50 p-4"
    >
      <div>
        <h3 className="font-bold text-warm-900">Califica el trabajo recibido</h3>
        <p className="mt-1 text-sm text-warm-600">
          Tu experiencia ayudara a otros clientes a conocer a {freelancerName}.
        </p>
      </div>

      <StarRating
        value={rating}
        onChange={(nextRating) => {
          setRating(nextRating);
          setError(null);
        }}
        label={`Calificacion para ${freelancerName}`}
      />

      <div>
        <label
          htmlFor={`review-comment-${commissionId}`}
          className="mb-2 block text-sm font-semibold text-warm-900"
        >
          Comentario opcional
        </label>
        <textarea
          id={`review-comment-${commissionId}`}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setError(null);
          }}
          maxLength={500}
          rows={3}
          placeholder="Cuenta como fue trabajar con este freelancer."
          className="form-control resize-y"
        />
        <p className="mt-1 text-right text-xs text-warm-400">
          {comment.length}/500
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-dark">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Publicando...' : 'Publicar resena'}
      </button>
    </form>
  );
}

export default ReviewForm;
