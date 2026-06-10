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
          50:  '#FDFBF8',
          100: '#F8F4EF',
          200: '#EFE8DE',
        },
        // Naranja quemado: el color principal de la marca
        brand: {
          DEFAULT: '#D4501E',
          dark:    '#A8380E',
          light:   '#F07A45',
        },
        // Dorado: para ratings, precios destacados y acentos
        gold: {
          DEFAULT: '#E8B84B',
          light:   '#F5D98A',
        },
        // Grises cálidos (en vez de los grises fríos de Tailwind por defecto)
        warm: {
          900: '#1A1510',
          800: '#2E2720',
          700: '#4A3F36',
          600: '#6B5F55',
          500: '#8A7F75',
          400: '#A89F96',
          300: '#C4BAB0',
          200: '#D9D3CC',
          100: '#EDE8E2',
          50:  '#F5F2EE',
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