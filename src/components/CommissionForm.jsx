import { useState } from 'react';

/**
 * CommissionForm — Formulario para solicitar servicios.
 *
 * @param {Object} props
 * @param {string} props.freelancerName - Nombre del freelancer
 * @param {number} props.gigId - ID del servicio
 * @param {number} props.basePrice - Precio base del servicio
 */
function CommissionForm({ freelancerName, gigId, basePrice }) {
  // Estado del formulario
  const [formData, setFormData] = useState({
    title:       '',
    description: '',
    budget:      basePrice,
    timeline:    'flexible',
    referenceImages: [],
  });

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Maneja cambios en los inputs de texto.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Maneja la carga de imágenes de referencia.
  
   * TODO: En producción, usar un servicio de storage como AWS S3
   * o Firebase Storage, no guardar en cliente.
   */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Limita a 5 imágenes máximo
    const maxImages = 5;
    if (formData.referenceImages.length + files.length > maxImages) {
      alert(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    // Convierte cada archivo a Data URL para preview
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          referenceImages: [
            ...prev.referenceImages,
            { name: file.name, src: event.target.result },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });

    // Limpia el input para permitir re-seleccionar el mismo archivo
    e.target.value = '';
  };

  /**
   * Elimina una imagen de referencia.
   */
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index),
    }));
  };

  /**
   * Valida que los campos obligatorios estén completos.
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('Por favor, ingresa un título para tu solicitud');
      return false;
    }
    if (!formData.description.trim()) {
      alert('Por favor, describe lo que necesitas');
      return false;
    }
    if (formData.budget < basePrice) {
      alert(`El presupuesto mínimo es $${basePrice}`);
      return false;
    }
    return true;
  };

  /**
   * Maneja el envío del formulario.
   *
   * TODO: Conectar con tu backend:
   * POST /api/commissions
   * {
   *   gigId,
   *   freelancerId: freelancer.id,
   *   clientId: currentUser.id,
   *   title,
   *   description,
   *   budget,
   *   timeline,
   *   referenceImages: []  // IDs de archivos subidos a S3
   * }
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simula un envío a la API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Comisión solicitada:', {
        ...formData,
        gigId,
        freelancerName,
      });

      // Muestra mensaje de éxito
      setSubmitted(true);

      // Reset del formulario después de 3 segundos
      setTimeout(() => {
        setFormData({
          title:       '',
          description: '',
          budget:      basePrice,
          timeline:    'flexible',
          referenceImages: [],
        });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error al enviar comisión:', error);
      alert('Hubo un error al enviar tu solicitud. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mensaje de éxito
  if (submitted) {
    return (
      <div className="bg-brand/10 border border-brand/30 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">✓</div>
        <h3 className="text-lg font-bold text-brand mb-2">¡Solicitud enviada!</h3>
        <p className="text-warm-600 text-sm">
          {freelancerName} recibirá tu solicitud en breve y se pondrá en contacto contigo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ════════════════════════════════════════════════════
          TÍTULO DE LA COMISIÓN
          ════════════════════════════════════════════════════ */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-warm-900 mb-2">
          Título de tu proyecto
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Ej: Rediseño de logo para mi startup"
          maxLength={80}
          className="w-full px-4 py-3 rounded-xl
                     border border-warm-200 focus:border-brand focus:ring-2 focus:ring-brand/25
                     text-warm-900 placeholder-warm-400
                     transition-all duration-200 focus:outline-none"
          required
        />
        <p className="text-xs text-warm-400 mt-1">
          {formData.title.length}/80 caracteres
        </p>
      </div>

      {/* ════════════════════════════════════════════════════
          DESCRIPCIÓN Y REQUIREMENTS
          ════════════════════════════════════════════════════ */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-warm-900 mb-2">
          Descripción y requirements
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Cuéntale a {freelancerName} exactamente qué necesitas. Incluye detalles, referencias y expectativas..."
          maxLength={500}
          rows={5}
          className="w-full px-4 py-3 rounded-xl
                     border border-warm-200 focus:border-brand focus:ring-2 focus:ring-brand/25
                     text-warm-900 placeholder-warm-400
                     resize-none transition-all duration-200 focus:outline-none"
          required
        />
        <p className="text-xs text-warm-400 mt-1">
          {formData.description.length}/500 caracteres
        </p>
      </div>

      {/* ════════════════════════════════════════════════════
          IMÁGENES DE REFERENCIA
          ════════════════════════════════════════════════════ */}
      <div>
        <label htmlFor="images" className="block text-sm font-semibold text-warm-900 mb-2">
          Imágenes de referencia (opcional)
        </label>
        <p className="text-xs text-warm-500 mb-3">
          Sube hasta 5 imágenes que te gustaría compartir como referencia
        </p>

        {/* Input file (oculto) */}
        <input
          type="file"
          id="images"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={formData.referenceImages.length >= 5}
        />

        {/* Botón para abrir el file picker */}
        <label
          htmlFor="images"
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl
                     border-2 border-dashed border-warm-300 hover:border-brand
                     bg-cream-100 hover:bg-cream-50
                     cursor-pointer transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium text-warm-700">
            {formData.referenceImages.length >= 5
              ? 'Límite alcanzado'
              : 'Selecciona imágenes'}
          </span>
        </label>

        {/* Galería de imágenes cargadas */}
        {formData.referenceImages.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
            {formData.referenceImages.map((img, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden bg-warm-100"
              >
                <img
                  src={img.src}
                  alt={`Referencia ${index + 1}`}
                  className="w-full h-full object-cover aspect-square"
                />
                {/* Botón para eliminar */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute inset-0 bg-warm-900/60 opacity-0 group-hover:opacity-100
                             flex items-center justify-center transition-opacity duration-200"
                  aria-label={`Eliminar imagen ${index + 1}`}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          PRESUPUESTO
          ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="budget" className="block text-sm font-semibold text-warm-900 mb-2">
            Presupuesto (MXN)
          </label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleInputChange}
            min={basePrice}
            className="w-full px-4 py-3 rounded-xl
                       border border-warm-200 focus:border-brand focus:ring-2 focus:ring-brand/25
                       text-warm-900 placeholder-warm-400
                       transition-all duration-200 focus:outline-none"
            required
          />
          <p className="text-xs text-warm-400 mt-1">
            Mínimo: ${basePrice}
          </p>
        </div>

        {/* PLAZO */}
        <div>
          <label htmlFor="timeline" className="block text-sm font-semibold text-warm-900 mb-2">
            Plazo
          </label>
          <select
            id="timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl
                       border border-warm-200 focus:border-brand focus:ring-2 focus:ring-brand/25
                       text-warm-900 placeholder-warm-400
                       transition-all duration-200 focus:outline-none"
          >
            <option value="flexible">Flexible</option>
            <option value="1week">1 semana</option>
            <option value="2weeks">2 semanas</option>
            <option value="1month">1 mes</option>
            <option value="2months">2 meses</option>
          </select>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          BOTÓN DE ENVÍO
          ════════════════════════════════════════════════════ */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl
                   bg-brand hover:bg-brand-dark active:scale-95
                   text-white font-bold
                   transition-all duration-200 transform
                   disabled:opacity-75 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
            </svg>
            Enviando...
          </>
        ) : (
          <>
            Solicitar comisión
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-warm-500 text-center">
        Al enviar esta solicitud aceptas nuestros términos de servicio y
        {' '}
        <a href="#" className="text-brand hover:underline">política de privacidad</a>.
      </p>
    </form>
  );
}

export default CommissionForm;