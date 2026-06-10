/* ============================================================
   ARCHIVO: src/components/Footer.jsx
   PROPÓSITO: Pie de página de la plataforma.
   ============================================================ */

/**
 * Footer — Pie de página con logo, links y copyright.
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { label: 'Acerca de',   href: '#' },
    { label: 'Cómo funciona', href: '#' },
    { label: 'Términos',    href: '#' },
    { label: 'Privacidad',  href: '#' },
    { label: 'Contacto',    href: '#' },
  ];

  return (
    <footer className="border-t border-warm-200 bg-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span className="font-syne font-extrabold text-base text-warm-900">
              KREATIVA
            </span>
          </div>

          {/* Links de navegación */}
          <nav
            className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2"
            aria-label="Links del footer"
          >
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-warm-500 hover:text-warm-900
                           transition-colors duration-200"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-warm-400 text-center sm:text-right">
            © {currentYear} KREATIVA.{' '}
            <span className="hidden sm:inline">Hecho con ♥ en México.</span>
          </p>

        </div>
      </div>
    </footer>
  );
}

export default Footer;