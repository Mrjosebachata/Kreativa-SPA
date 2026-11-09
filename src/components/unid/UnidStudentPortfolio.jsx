
import ImageCarousel from '../ImageCarousel';

export default function UnidStudentPortfolio({
  images = [],
  studentName = 'Estudiante',
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-[#1A1510]">
        Portafolio de trabajos
      </h2>

      {images.length > 0 ? (
        <ImageCarousel
          key={`${studentName}-${images.join('|')}`}
          images={images}
          freelancerName={studentName}
        />
      ) : (
        <div className="rounded-2xl bg-white p-12 text-center text-sm text-[#817A74]">
          Este estudiante todavía no ha publicado trabajos.
        </div>
      )}
    </section>
  );
}
