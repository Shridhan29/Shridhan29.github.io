/**
 * A sentence whose words light up one by one as its pinned track scrolls past
 * (`.pin-track .scrub-word` in index.css). The words are drawn from
 * `aria-hidden` spans; assistive tech reads the sentence once, whole, from a
 * visually hidden copy, never word by word.
 *
 * `accentFrom` draws the words from that index on in the heading's second tone.
 * Without scroll-timeline support every word is simply visible.
 */
export function WordScrub({ text, accentFrom }: { text: string; accentFrom?: number }) {
  const words = text.split(' ')
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => (
          <span
            key={i}
            className={`scrub-word ${accentFrom !== undefined && i >= accentFrom ? 't-accent' : ''}`}
            style={{ '--i': i, '--n': words.length } as React.CSSProperties}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </>
  )
}
