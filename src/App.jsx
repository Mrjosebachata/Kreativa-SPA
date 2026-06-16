/* ============================================================
   ARCHIVO: src/App.jsx
   PROPÓSITO: Componente raíz de la aplicación.

   RESPONSABILIDADES:
   - Mantiene el estado global: búsqueda, categoría, navegación
   - Pasa ese estado a los componentes hijo mediante props.
   - Controla si mostrar la grid principal o el perfil del freelancer

   ÁRBOL DE COMPONENTES:
     <App>
       ├── <Navbar>          → emite onSearch
       ├── <CategoryFilter>  → emite onCategoryChange
       ├── SI selectedGigId === null:
       │   ├── <HeroSection>     → se oculta si hay búsqueda/filtro
       │   └── <MasonryGrid>     → recibe gigs, emite onSelectFreelancer
       │
       └── SI selectedGigId !== null:
           └── <FreelancerProfile> → recibe gig, emite onBack
   ============================================================ */

import { useState } from 'react';

// Componentes de UI
import Navbar            from './components/Navbar';
import CategoryFilter    from './components/CategoryFilter';
import HeroSection       from './components/HeroSection';
import MasonryGrid       from './components/MasonryGrid';
import FreelancerProfile from './components/FreelancerProfile';
import Footer            from './components/Footer';

// Datos mockeados
import { gigs, categories } from './data/mockData';

/**
 * App — Componente raíz. Orquesta toda la aplicación.
 */
function App() {

  // ── Estado global de la aplicación ────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedGigId,  setSelectedGigId]  = useState(null);

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

  /**
   * Cuando el usuario hace clic en "Comisionar", guardamos el ID del gig.
   * Esto dispara el renderizado de <FreelancerProfile>.
   */
  const handleSelectFreelancer = (gigId) => {
    setSelectedGigId(gigId);
    // Scroll al top
    window.scrollTo(0, 0);
  };

  /**
   * Cuando el usuario hace clic en "Volver" en el perfil del freelancer,
   * volvemos a la vista principal (grid).
   */
  const handleBackToGrid = () => {
    setSelectedGigId(null);
    window.scrollTo(0, 0);
  };

  // Encuentra el gig seleccionado (si hay uno)
  const selectedGig = selectedGigId ? gigs.find((g) => g.id === selectedGigId) : null;

  /*
   * El Hero solo se muestra cuando el usuario NO está buscando
   * ni filtrando — es decir, está en la vista "inicio" limpia.
   */
  const showHero = searchQuery.trim() === '' && activeCategory === 'Todos';

  // ── Renderizado ───────────────────────────────────────────────

  // Si hay un gig seleccionado, mostramos el perfil del freelancer
  if (selectedGig) {
    return (
      <div className="min-h-screen bg-cream-100 font-jakarta flex flex-col">
        <Navbar onSearch={handleSearch} />
        <main className="flex-1">
          <FreelancerProfile
            gig={selectedGig}
            onBack={handleBackToGrid}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Si no hay gig seleccionado, mostramos la grid principal
  return (
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <MasonryGrid
          gigs={gigs}
          searchQuery={searchQuery}
          activeCategory={activeCategory}
          onSelectFreelancer={handleSelectFreelancer}
        />
      </main>

      {/* ── Pie de página ─────────────────────────────────── */}
      <Footer />

    </div>
  );
}

export default App;