type Props = {
  /** Path without extension or width suffix, e.g. "/img/truuna/01-language". */
  base: string
  widths: [number, number]
  alt: string
  width: number
  height: number
  className?: string
  sizes?: string
  priority?: boolean
}

/**
 * AVIF first, WebP fallback, both at two widths. Intrinsic width/height are
 * required so the layout never shifts while images decode.
 */
export function Picture({ base, widths, alt, width, height, className, sizes, priority }: Props) {
  const set = (ext: string) => widths.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ')
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`${base}-${widths[0]}.webp`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={className}
      />
    </picture>
  )
}
