/* ============================================================
   ARCHIVO: src/components/MasonryGrid.jsx
   PROPÓSITO: Grid masonry estilo Pinterest + lógica de filtrado.

   RESPONSABILIDADES:
   1. Recibe los gigs, el término de búsqueda y la categoría activa.
   2. Filtra los gigs localmente (mock) — en el futuro lo hará el backend.
   3. Renderiza el grid masonry usando CSS Columns (ver index.css).
   4. Emite evento cuando el usuario selecciona un freelancer.
   ============================================================ */

import { useState, useEffect } from 'react';
import GigCard from './GigCard';

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * MasonryGrid — Contenedor del grid estilo Pinterest.
 *
 * @param {Object}                          props
 * @param {import('../data/mockData').Gig[]} props.gigs                   - Lista completa de servicios
 * @param {string}                           props.searchQuery             - Término de búsqueda activo
 * @param {string}                           props.activeCategory          - Categoría seleccionada
 * @param {Function}                         props.onSelectFreelancer      - Callback al seleccionar un gig
 */
function MasonryGrid({ gigs, searchQuery, activeCategory, onSelectFreelancer }) {
  // Lista de gigs filtrados que se mostrarán en el grid
  const [filteredGigs, setFilteredGigs] = useState(gigs);

  /**
   * Efecto de filtrado — se ejecuta cada vez que cambian
   * la búsqueda, la categoría o la lista de gigs.
   */
  useEffect(() => {
    let result = [...gigs]; // Copia del arreglo original (no mutar el original)

    // — Filtro 1: por categoría ─────────────────────────────────
    if (activeCategory && activeCategory !== 'Todos') {
      result = result.filter((gig) => gig.category === activeCategory);
    }

    // — Filtro 2: por término de búsqueda ──────────────────────
    // Busca en: título, categoría, etiquetas y nombre del autor
    if (searchQuery && searchQuery.trim() !== '') {
      const query = normalizeText(searchQuery);
      result = result.filter(
        (gig) =>
          normalizeText(gig.title).includes(query) ||
          normalizeText(gig.category).includes(query) ||
          gig.tags.some((tag) => normalizeText(tag).includes(query)) ||
          normalizeText(gig.author.name).includes(query)
      );
    }

    setFilteredGigs(result);
  }, [gigs, searchQuery, activeCategory]);

  // ── Estado Vacío (sin resultados) ──────────────────────────────
  if (filteredGigs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="text-6xl mb-5 select-none">🔍</div>
        <h3 className="text-xl font-bold text-warm-800 mb-2">
          Sin resultados
        </h3>
        <p className="text-warm-500 max-w-sm leading-relaxed">
          No encontramos servicios que coincidan con{' '}
          <em>"{searchQuery || activeCategory}"</em>.
          Intenta con otros términos o explora todas las categorías.
        </p>
      </div>
    );
  }

  return (
    <section aria-label={`Servicios de freelancers — ${filteredGigs.length} resultados`}>

      {/* ── MASONRY GRID ───────────────────────────────────────*/}
      <div className="masonry-grid">
        {filteredGigs.map((gig, index) => (
          <div
            key={gig.id}
            className="masonry-item animate-fade-in"
            style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
          >
            <GigCard
              gig={gig}
              onSelectFreelancer={onSelectFreelancer}
            />
          </div>
        ))}
      </div>

    </section>
  );
}

export default MasonryGrid;
