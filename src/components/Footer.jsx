function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { label: 'Acerca de', href: '#' },
    { label: 'Cómo funciona', href: '#' },
    { label: 'Términos', href: '#' },
    { label: 'Privacidad', href: '#' },
    { label: 'Contacto', href: '#' },
  ];

  return (
    <footer className="border-t border-gold/30 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand" />

            <span className="font-syne text-base font-extrabold text-warm-900">
              KREATIVA
            </span>
          </div>

          <nav
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            aria-label="Links del footer"
          >
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-gold transition-colors duration-200 hover:text-gold-light"
              >
                {label}
              </a>
            ))}
          </nav>

          <p className="text-center text-xs text-gold sm:text-right">
            © {currentYear} KREATIVA.{' '}
            <span className="hidden sm:inline">
              Hecho con ♥ en México.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
