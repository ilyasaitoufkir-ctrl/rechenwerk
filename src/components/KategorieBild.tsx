interface Props {
  slug: string
  alt: string
  className?: string
}

/**
 * Kategoriefoto mit dunklem Overlay (siehe .kategoriebild-overlay/-img in
 * index.css) - srcset 600/1200px, damit kleine Geräte nicht die große
 * Variante laden. Die Originaldateien liegen unter public/images/kategorien/
 * und werden vom Service Worker vorab gecacht (siehe vite.config.ts), damit
 * sie offline verfügbar sind. Quellen siehe CREDITS.md.
 */
export function KategorieBild({ slug, alt, className = '' }: Props) {
  const basis = `/images/kategorien/${slug}`
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={`${basis}-1200.webp`}
        srcSet={`${basis}-600.webp 600w, ${basis}-1200.webp 1200w`}
        sizes="(min-width: 480px) 480px, 100vw"
        alt={alt}
        loading="lazy"
        className="kategoriebild-img h-full w-full object-cover"
      />
      <div className="kategoriebild-overlay pointer-events-none absolute inset-0" />
    </div>
  )
}
