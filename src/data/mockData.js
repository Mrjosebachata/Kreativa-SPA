/* ============================================================
   ARCHIVO: src/data/mockData.js
   PROPÓSITO: Datos de ejemplo que simulan la respuesta de una API REST.

   ╔══════════════════════════════════════════════════════════╗
   ║  TODO — CONEXIÓN CON BACKEND                             ║
   ║                                                          ║
   ║  Cuando tengas tu API lista, este archivo deja de        ║
   ║  usarse. En su lugar, en App.jsx harás un fetch() a      ║
   ║  tu endpoint:                                            ║
   ║                                                          ║
   ║  fetch('https://tu-api.com/api/gigs')                    ║
   ║    .then(res => res.json())                              ║
   ║    .then(data => setGigs(data))                          ║
   ║                                                          ║
   ║  Asegúrate de que tu API devuelva objetos con la misma   ║
   ║  estructura definida en el typedef de abajo.             ║
   ╚══════════════════════════════════════════════════════════╝
   ============================================================ */

/**
 * Estructura de un servicio (Gig).
 *
 * @typedef {Object} Author
 * @property {string} name    - Nombre del freelancer
 * @property {string} avatar  - URL de la foto de perfil
 * @property {number} rating  - Calificación promedio (ej. 4.9)
 * @property {number} reviews - Número total de reseñas
 *
 * @typedef {Object} Gig
 * @property {number}   id          - ID único del servicio
 * @property {string}   title       - Título descriptivo del servicio
 * @property {string}   category    - Categoría principal
 * @property {string}   image       - URL de la imagen de portada
 * @property {Author}   author      - Datos del freelancer
 * @property {number}   price       - Precio base en MXN
 * @property {string[]} tags        - Etiquetas (máx. 3 recomendadas)
 * @property {boolean}  isFeatured  - Si aparece como "Destacado"
 */

/** @type {Gig[]} */
export const gigs = [
  // ─────────────────────── DISEÑO GRÁFICO ────────────────────────
  {
    id: 1,
    title: 'Identidad de marca completa: logo, paleta y manual de estilo',
    category: 'Diseño Gráfico',
    image: 'https://picsum.photos/seed/kreativa-brand/400/560',
    author: {
      name: 'Sofía Medina',
      avatar: 'https://i.pravatar.cc/40?img=47',
      rating: 4.9,
      reviews: 234,
    },
    price: 1500,
    tags: ['Branding', 'Logo', 'Manual de Marca'],
    isFeatured: true,
  },
  {
    id: 2,
    title: 'Diseño de packaging sustentable y eco-friendly para tu producto',
    category: 'Diseño Gráfico',
    image: 'https://picsum.photos/seed/kreativa-pkg/400/400',
    author: {
      name: 'Andrés Torres',
      avatar: 'https://i.pravatar.cc/40?img=12',
      rating: 4.7,
      reviews: 89,
    },
    price: 850,
    tags: ['Packaging', 'Eco-design', 'Print'],
    isFeatured: false,
  },
  {
    id: 19,
    title: 'Diseño UI/UX de app móvil con prototipo navegable en Figma',
    category: 'Diseño Gráfico',
    image: 'https://picsum.photos/seed/kreativa-figma/400/560',
    author: {
      name: 'Renata Solís',
      avatar: 'https://i.pravatar.cc/40?img=53',
      rating: 4.9,
      reviews: 287,
    },
    price: 5200,
    tags: ['Figma', 'UI/UX', 'Prototipo'],
    isFeatured: true,
  },
  {
    id: 20,
    title: 'Plantillas profesionales para presentaciones en PowerPoint y Canva',
    category: 'Diseño Gráfico',
    image: 'https://picsum.photos/seed/kreativa-ppt/600/400',
    author: {
      name: 'Hugo Paredes',
      avatar: 'https://i.pravatar.cc/40?img=8',
      rating: 4.5,
      reviews: 52,
    },
    price: 420,
    tags: ['Presentaciones', 'Canva', 'PowerPoint'],
    isFeatured: false,
  },

  // ──────────────────────── ILUSTRACIÓN ─────────────────────────
  {
    id: 3,
    title: 'Ilustración de personajes originales para tu marca o historia',
    category: 'Ilustración',
    image: 'https://picsum.photos/seed/kreativa-char/400/540',
    author: {
      name: 'Valentina Cruz',
      avatar: 'https://i.pravatar.cc/40?img=22',
      rating: 5.0,
      reviews: 312,
    },
    price: 2200,
    tags: ['Personajes', 'Digital Art', 'Procreate'],
    isFeatured: true,
  },
  {
    id: 4,
    title: 'Retrato artístico en acuarela digital al estilo editorial',
    category: 'Ilustración',
    image: 'https://picsum.photos/seed/kreativa-wc/400/480',
    author: {
      name: 'Camila Rojas',
      avatar: 'https://i.pravatar.cc/40?img=33',
      rating: 4.8,
      reviews: 156,
    },
    price: 950,
    tags: ['Retrato', 'Acuarela', 'Editorial'],
    isFeatured: false,
  },
  {
    id: 5,
    title: 'Portada artística para libro, álbum musical o cómic',
    category: 'Ilustración',
    image: 'https://picsum.photos/seed/kreativa-cover/400/400',
    author: {
      name: 'Diego Hernández',
      avatar: 'https://i.pravatar.cc/40?img=55',
      rating: 4.6,
      reviews: 78,
    },
    price: 1100,
    tags: ['Portada', 'Arte Digital', 'Composición'],
    isFeatured: false,
  },

  // ──────────────────────── FOTOGRAFÍA ──────────────────────────
  {
    id: 6,
    title: 'Sesión fotográfica editorial para campaña de moda o lifestyle',
    category: 'Fotografía',
    image: 'https://picsum.photos/seed/kreativa-fashion/400/600',
    author: {
      name: 'María Fuentes',
      avatar: 'https://i.pravatar.cc/40?img=44',
      rating: 4.9,
      reviews: 201,
    },
    price: 3500,
    tags: ['Moda', 'Editorial', 'Studio'],
    isFeatured: true,
  },
  {
    id: 7,
    title: 'Fotografía de producto para e-commerce, catálogos y redes',
    category: 'Fotografía',
    image: 'https://picsum.photos/seed/kreativa-product/600/400',
    author: {
      name: 'Roberto Silva',
      avatar: 'https://i.pravatar.cc/40?img=68',
      rating: 4.7,
      reviews: 133,
    },
    price: 800,
    tags: ['Producto', 'E-commerce', 'Fondo blanco'],
    isFeatured: false,
  },

  // ─────────────────────── DESARROLLO WEB ───────────────────────
  {
    id: 8,
    title: 'Landing page de alta conversión con React, animaciones y SEO',
    category: 'Desarrollo Web',
    image: 'https://picsum.photos/seed/kreativa-landing/600/420',
    author: {
      name: 'Luis Ávila',
      avatar: 'https://i.pravatar.cc/40?img=61',
      rating: 4.8,
      reviews: 94,
    },
    price: 4200,
    tags: ['React', 'Tailwind CSS', 'SEO'],
    isFeatured: false,
  },
  {
    id: 9,
    title: 'Tienda en línea completa: carrito, pagos con Stripe y panel admin',
    category: 'Desarrollo Web',
    image: 'https://picsum.photos/seed/kreativa-ecom/400/500',
    author: {
      name: 'Patricia Gómez',
      avatar: 'https://i.pravatar.cc/40?img=36',
      rating: 4.9,
      reviews: 178,
    },
    price: 9800,
    tags: ['E-commerce', 'Stripe', 'Full Stack'],
    isFeatured: true,
  },

  // ─────────────────────── VIDEO & MOTION ───────────────────────
  {
    id: 10,
    title: 'Video promocional cinematográfico para tu marca o producto',
    category: 'Video & Motion',
    image: 'https://picsum.photos/seed/kreativa-film/400/400',
    author: {
      name: 'Fernanda López',
      avatar: 'https://i.pravatar.cc/40?img=28',
      rating: 5.0,
      reviews: 267,
    },
    price: 5500,
    tags: ['Cinematografía', '4K', 'Color Grading'],
    isFeatured: true,
  },
  {
    id: 11,
    title: 'Motion graphics: animación de logo y elementos en After Effects',
    category: 'Video & Motion',
    image: 'https://picsum.photos/seed/kreativa-motion/400/520',
    author: {
      name: 'Carlos Vega',
      avatar: 'https://i.pravatar.cc/40?img=15',
      rating: 4.8,
      reviews: 142,
    },
    price: 1800,
    tags: ['After Effects', 'Motion', 'Animación'],
    isFeatured: false,
  },
  {
    id: 12,
    title: 'Edición de Reels y contenido corto viral para Instagram y TikTok',
    category: 'Video & Motion',
    image: 'https://picsum.photos/seed/kreativa-reels/400/460',
    author: {
      name: 'Andrea Morales',
      avatar: 'https://i.pravatar.cc/40?img=41',
      rating: 4.6,
      reviews: 89,
    },
    price: 650,
    tags: ['Reels', 'TikTok', 'Trending'],
    isFeatured: false,
  },

  // ─────────────────────── MÚSICA & AUDIO ───────────────────────
  {
    id: 13,
    title: 'Composición musical original con licencia comercial para tu marca',
    category: 'Música & Audio',
    image: 'https://picsum.photos/seed/kreativa-music/600/380',
    author: {
      name: 'Tomás Ruiz',
      avatar: 'https://i.pravatar.cc/40?img=59',
      rating: 4.9,
      reviews: 118,
    },
    price: 2800,
    tags: ['Jingle', 'Composición', 'Licencia Comercial'],
    isFeatured: false,
  },
  {
    id: 14,
    title: 'Mezcla y masterización profesional de tu EP o álbum completo',
    category: 'Música & Audio',
    image: 'https://picsum.photos/seed/kreativa-master/400/420',
    author: {
      name: 'Elena Castillo',
      avatar: 'https://i.pravatar.cc/40?img=37',
      rating: 4.7,
      reviews: 76,
    },
    price: 1500,
    tags: ['Mezcla', 'Mastering', 'Estudio'],
    isFeatured: false,
  },

  // ─────────────────────── COPYWRITING ──────────────────────────
  {
    id: 15,
    title: 'Estrategia de contenido y copywriting persuasivo para redes sociales',
    category: 'Copywriting',
    image: 'https://picsum.photos/seed/kreativa-copy/600/400',
    author: {
      name: 'Isabela Mora',
      avatar: 'https://i.pravatar.cc/40?img=48',
      rating: 4.8,
      reviews: 203,
    },
    price: 1200,
    tags: ['Copy', 'Redes Sociales', 'Estrategia'],
    isFeatured: false,
  },
  {
    id: 16,
    title: 'Guión profesional para podcast, webinar o video corporativo',
    category: 'Copywriting',
    image: 'https://picsum.photos/seed/kreativa-script/400/400',
    author: {
      name: 'Javier Núñez',
      avatar: 'https://i.pravatar.cc/40?img=18',
      rating: 4.9,
      reviews: 91,
    },
    price: 750,
    tags: ['Guión', 'Podcast', 'Storytelling'],
    isFeatured: false,
  },

  // ─────────────────────── ANIMACIÓN 3D ─────────────────────────
  {
    id: 17,
    title: 'Render fotorrealista 3D de producto para presentaciones y catálogos',
    category: 'Animación 3D',
    image: 'https://picsum.photos/seed/kreativa-3d/400/500',
    author: {
      name: 'Natalia Ponce',
      avatar: 'https://i.pravatar.cc/40?img=26',
      rating: 5.0,
      reviews: 145,
    },
    price: 3800,
    tags: ['Blender', 'Render', 'Producto'],
    isFeatured: true,
  },
  {
    id: 18,
    title: 'Animación 3D explicativa para startups, pitch decks y webinars',
    category: 'Animación 3D',
    image: 'https://picsum.photos/seed/kreativa-anim3d/600/400',
    author: {
      name: 'Sergio Leal',
      avatar: 'https://i.pravatar.cc/40?img=70',
      rating: 4.7,
      reviews: 63,
    },
    price: 6500,
    tags: ['Cinema 4D', 'Explicativo', 'Animación'],
    isFeatured: false,
  },
];

/**
 * Lista de categorías disponibles para el filtro.
 *
 * TODO: En el futuro, obtener este listado desde la API:
 *   fetch('https://tu-api.com/api/categories')
 *     .then(res => res.json())
 *     .then(data => setCategories(data))
 */
export const categories = [
  'Todos',
  'Diseño Gráfico',
  'Ilustración',
  'Fotografía',
  'Desarrollo Web',
  'Video & Motion',
  'Música & Audio',
  'Copywriting',
  'Animación 3D',
];