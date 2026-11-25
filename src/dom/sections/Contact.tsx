import { useState, type FormEvent } from 'react'
import { profile } from '@/data/profile'
import { Section } from '@/dom/ui/Section'

type Status = 'idle' | 'sending' | 'sent' | 'error'

// Web3Forms access keys are public by design — they are embedded in the client
// bundle, are not credentials, and grant no account access. Keeping this in a CI
// secret bought nothing while adding a way for the deployed form to silently
// break, so the working key is the default and the env var is only an override.
const ACCESS_KEY =
  (import.meta.env.VITE_WEB3FORMS_KEY as string | undefined) ??
  'fa34bbbf-a4f2-420b-9060-66827ccf859c'

export function Contact() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    // Honeypot: bots fill every field they find, humans never see this one.
    if (data.get('company')) {
      setStatus('sent')
      return
    }

    if (!ACCESS_KEY) {
      setStatus('error')
      setError('The form is not configured. Please email me directly.')
      return
    }

    data.append('access_key', ACCESS_KEY)
    data.append('subject', `Portfolio enquiry from ${data.get('name')}`)
    data.append('from_name', 'shridhan29.github.io')

    setStatus('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) throw new Error(json.message ?? 'Submission failed')
      setStatus('sent')
      form.reset()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const field = 'field'

  return (
    <Section id="contact" label="Contact" title="Building something that has to work in the field?">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-14 xl:gap-20">
        <div>
          <p className="measure text-base leading-relaxed text-mist md:text-lg">
            I'm open to software development roles — in Pune, or remote. The fastest way to reach me
            is the form, or email if you'd rather skip it.
          </p>

          <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
            <li className="py-4">
              <span className="mb-1.5 block font-mono text-xs tracking-[0.16em] text-mist uppercase">
                Email
              </span>
              <a href={`mailto:${profile.email}`} className="link text-bone">
                {profile.email}
              </a>
            </li>
            <li className="py-4">
              <span className="mb-1.5 block font-mono text-xs tracking-[0.16em] text-mist uppercase">
                Elsewhere
              </span>
              <span className="flex flex-wrap gap-4">
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link text-bone"
                >
                  GitHub <span className="link-arrow">↗</span>
                </a>
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link text-bone"
                >
                  LinkedIn <span className="link-arrow">↗</span>
                </a>
                <a
                  href={profile.resume}
                  className="link text-bone"
                  data-goatcounter-click="resume-contact"
                >
                  Résumé (PDF)
                </a>
              </span>
            </li>
            <li className="py-4">
              <span className="mb-1.5 block font-mono text-xs tracking-[0.16em] text-mist uppercase">
                Based in
              </span>
              <span className="text-mist">{profile.location}</span>
            </li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="card space-y-5 p-5 sm:p-8 md:p-10">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-bone/90">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              className={field}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-bone/90">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={field}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-medium text-bone/90">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className={`${field} resize-y`}
              placeholder="What are you building?"
            />
          </div>

          {/* Honeypot — hidden from people, irresistible to bots. */}
          <div aria-hidden className="absolute left-[-9999px]">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            aria-busy={status === 'sending'}
            className="btn btn-primary w-full justify-center disabled:opacity-50 sm:w-auto"
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>

          <p aria-live="polite" className="min-h-5 text-sm">
            {status === 'sent' && (
              <span className="text-accent-soft">
                Thanks — that reached my inbox. I'll reply soon.
              </span>
            )}
            {status === 'error' && (
              <span className="text-ember">
                {error}{' '}
                <a href={`mailto:${profile.email}`} className="link">
                  Email me instead
                </a>
                .
              </span>
            )}
          </p>
        </form>
      </div>
    </Section>
  )
}
