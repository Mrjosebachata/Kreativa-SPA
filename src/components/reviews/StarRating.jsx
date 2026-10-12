const STAR_VALUES = [1, 2, 3, 4, 5];

function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  label = 'Calificacion',
}) {
  const sizeClass = size === 'sm' ? 'text-base' : 'text-3xl';

  if (readOnly) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 ${sizeClass}`}
        role="img"
        aria-label={`${label}: ${Number(value).toFixed(1)} de 5 estrellas`}
      >
        {STAR_VALUES.map((star) => (
          <span
            key={star}
            className={star <= Math.round(value) ? 'text-gold' : 'text-warm-200'}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </span>
    );
  }

  const selectValue = (nextValue) => {
    onChange?.(Math.min(5, Math.max(1, nextValue)));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      selectValue((value || 0) + 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      selectValue((value || 2) - 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      selectValue(1);
    }
    if (event.key === 'End') {
      event.preventDefault();
      selectValue(5);
    }
  };

  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {STAR_VALUES.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          tabIndex={value === star || (!value && star === 1) ? 0 : -1}
          onClick={() => selectValue(star)}
          className={`rounded-md px-0.5 text-3xl leading-none transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand/30 ${
            star <= value ? 'text-gold' : 'text-warm-200'
          }`}
        >
          <span aria-hidden="true">★</span>
        </button>
      ))}
    </div>
  );
}

export default StarRating;
