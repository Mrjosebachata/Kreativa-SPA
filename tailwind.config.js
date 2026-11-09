/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind escanea estos archivos para eliminar CSS no utilizado en producción
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // ── Tipografías ──────────────────────────────────────────────────────
      fontFamily: {
        // Syne: display geométrico para el logo/marca
        syne: ['Syne', 'sans-serif'],
        // Plus Jakarta Sans: moderna y legible para el UI
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },

      // ── Paleta de Colores Personalizada ─────────────────────────────────
      colors: {
        // Fondo crema cálido (reemplaza el blanco frío genérico)
        cream: {
          50:  '#0D0D0F',
          100: '#121216',
          200: '#1B1B21',
        },
        // Naranja quemado: el color principal de la marca
        brand: {
          DEFAULT: '#D7FF3F',
          dark:    '#B8DE22',
          light:   '#E7FF83',
        },
        // Dorado: para ratings, precios destacados y acentos
        gold: {
          DEFAULT: '#C06CFF',
          light:   '#E0B2FF',
        },
        // Grises cálidos (en vez de los grises fríos de Tailwind por defecto)
        warm: {
          900: '#F7F7F3',
          800: '#E5E4DE',
          700: '#C6C5BE',
          600: '#A09F99',
          500: '#7D7C77',
          400: '#62615D',
          300: '#48474A',
          200: '#343439',
          100: '#25252B',
          50:  '#1C1C21',
        },
      },

      // ── Animaciones ──────────────────────────────────────────────────────
      animation: {
        // Para la entrada escalonada de las tarjetas
        'fade-in': 'fadeIn 0.5s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },

  plugins: [],
}
