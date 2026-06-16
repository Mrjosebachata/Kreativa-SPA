import ImageCarousel from './ImageCarousel';
import CommissionForm from './CommissionForm';

/**
 * FreelancerProfile — Página de perfil del freelancer.
 *
 * @param {Object}                                    props
 * @param {import('../data/mockData').Gig}           props.gig - El servicio/gig del freelancer
 * @param {Function}                                 props.onBack - Callback para volver atrás
 */
function FreelancerProfile({ gig, onBack }) {
  const { author, price } = gig;

  return (
    <div className="min-h-screen bg-cream-100 pb-16">
      {/* ════════════════════════════════════════════════════
          BOTÓN DE VOLVER ATRÁS
          ════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2
                     text-sm font-medium text-warm-600 hover:text-warm-900
                     hover:bg-white rounded-lg transition-all duration-200"
          aria-label="Volver atrás"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ════════════════════════════════════════════════════
            HEADER DEL PERFIL
            Foto, nombre, rating, ubicación
            ════════════════════════════════════════════════════ */}
        <div className="mt-6 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar grande */}
            <img
              src={author.avatar}
              alt={author.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md flex-shrink-0"
            />

            {/* Información */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-2">
                {author.name}
              </h1>

              {/* Rating y ubicación */}
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-gold text-xl leading-none">★</span>
                  <span className="font-bold text-warm-800">
                    {author.rating.toFixed(1)}
                  </span>
                  <span className="text-warm-500">
                    ({author.reviews} reseñas)
                  </span>
                </div>

                <span className="text-sm text-warm-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                  {author.location}
                </span>
              </div>

              {/* Bio corta */}
              <p className="text-warm-600">{author.bio}</p>
            </div>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            GRID PRINCIPAL: CARRUSEL + FORMULARIO
            ════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">

          {/* ──────────────────────────────────────────────
              COLUMNA 1 & 2: CARRUSEL + BIO/SKILLS
              ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* CARRUSEL DE IMÁGENES */}
            <section>
              <h2 className="text-xl font-bold text-warm-900 mb-4">
                Portafolio de trabajos
              </h2>
              <ImageCarousel
                images={author.portfolio}
                freelancerName={author.name}
              />
            </section>

            {/* BIO COMPLETA */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-warm-900 mb-4">Acerca de</h3>
              <p className="text-warm-700 leading-relaxed mb-6">
                {author.fullBio}
              </p>

              {/* SKILLS / HABILIDADES */}
              <h4 className="text-sm font-bold text-warm-800 mb-3 uppercase tracking-wide">
                Habilidades
              </h4>
              <div className="flex flex-wrap gap-2">
                {author.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-full
                             text-xs font-medium
                             bg-brand/10 text-brand border border-brand/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

          </div>

          {/* ──────────────────────────────────────────────
              COLUMNA 3: FORMULARIO DE COMISIÓN (sticky en desktop)
              ────────────────────────────────────────── */}
          <section className="lg:sticky lg:top-20 lg:h-fit">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-warm-900 mb-2">
                Solicitar comisión
              </h3>
              <p className="text-sm text-warm-500 mb-4">
                Desde ${price.toLocaleString('es-MX')}
              </p>

              <CommissionForm
                freelancerName={author.name}
                gigId={gig.id}
                basePrice={price}
              />
            </div>
          </section>

        </div>

        {/* ════════════════════════════════════════════════════
            SECCIÓN: MÁS SERVICIOS DEL FREELANCER
            (En futuro, cargar otros gigs del mismo author)
            ════════════════════════════════════════════════════ */}
        <section className="py-10 border-t border-warm-200">
          <h3 className="text-2xl font-bold text-warm-900 mb-6">
            Más servicios de {author.name.split(' ')[0]}
          </h3>
          <div className="bg-cream-100 rounded-2xl p-8 text-center">
            <p className="text-warm-600">
              TODO: Cargar otros servicios del mismo freelancer desde la API.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}

export default FreelancerProfile;