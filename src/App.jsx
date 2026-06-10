import { useState } from 'react';

// Componentes de UI
import Navbar          from './components/Navbar';
import CategoryFilter  from './components/CategoryFilter';
import HeroSection     from './components/HeroSection';
import MasonryGrid     from './components/MasonryGrid';
import Footer          from './components/Footer';


import { gigs, categories } from './data/mockData';

/**
 * App — Componente raíz. Orquesta toda la aplicación.
 */
function App() {

  // ── Estado global de la aplicación ────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');


  /**
   * Recibe el string de búsqueda desde <Navbar>.
   * Lo guarda en el estado → fluye hacia <MasonryGrid>.
   */
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  /**
   * Recibe la categoría seleccionada desde <CategoryFilter>.
   * La guarda en el estado → fluye hacia <MasonryGrid>.
   */
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  /*
   * El Hero solo se muestra cuando el usuario NO está buscando
   * ni filtrando — es decir, está en la vista "inicio" limpia.
   */
  const showHero = searchQuery.trim() === '' && activeCategory === 'Todos';

  // ── Renderizado ───────────────────────────────────────────────
  return (
    // min-h-screen asegura que el Footer siempre quede al fondo
    <div className="min-h-screen bg-cream-100 font-jakarta flex flex-col">

      {/* ── Barra de navegación fija ──────────────────────── */}
      <Navbar onSearch={handleSearch} />

      {/* ── Filtros de categoría (sticky bajo el Navbar) ──── */}
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* ── Hero de bienvenida (se oculta al buscar/filtrar) ─ */}
      <HeroSection isVisible={showHero} />

      {/* ── Contenido principal: grid masonry ─────────────── */}
      {/*
       * `flex-1` hace que el <main> ocupe todo el espacio
       * disponible, empujando el Footer al fondo.
       */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <MasonryGrid
          gigs={gigs}
          searchQuery={searchQuery}
          activeCategory={activeCategory}
        />
      </main>

      {/* ── Pie de página ─────────────────────────────────── */}
      <Footer />

    </div>
  );
}

export default App;