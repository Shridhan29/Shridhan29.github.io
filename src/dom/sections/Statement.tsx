import { profile } from '@/data/profile'
import { WordScrub } from '@/dom/motion/WordScrub'

/**
 * One sentence, alone on the screen, between the hero and the work. Pinned while
 * its words light up in turn; where scroll timelines are unsupported, or motion
 * is reduced, it is a normal block with the sentence fully drawn.
 */
export function Statement() {
  return (
    <section id="statement" aria-label="What finished means" className="pin-track">
      <div className="pin-sticky flex items-center justify-center py-24 md:py-32">
        <p className="t-statement scrim max-w-[24ch] text-center font-semibold text-balance">
          <WordScrub text={profile.statement} accentFrom={profile.statementAccentFrom} />
        </p>
      </div>
    </section>
  )
}
