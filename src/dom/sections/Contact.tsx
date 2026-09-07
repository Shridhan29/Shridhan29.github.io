import { useState, type FormEvent } from 'react'
import { profile } from '@/data/profile'
import { Section } from '@/dom/ui/Section'

type Status = 'idle' | 'sending' | 'sent' | 'error'

// Web3Forms access keys are public by design — they are embedded in the client
// bundle, are not credentials, and grant no account access. Keeping this in a CI
// secret bought nothing while adding a way for the deployed form to silently
// break, so the working key is the default and the env var is only an override.
const ACCESS_KEY =
  (import.meta.env.VITE_WEB3FORMS_KEY as string | undefined) ?? 'fa34bbbf-a4f2-420b-9060-66827ccf859c'

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

  const field =
    'w-full rounded-md border border-slate bg-ink px-3.5 py-2.5 text-sm text-bone placeholder:text-mist/80 focus:border-accent focus:outline-none'

  return (
    <Section id="contact" label="Contact" title="Building something that has to work in the field?">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16 xl:max-w-6xl xl:gap-24">
        <div>
          <p className="measure text-[0.95rem] leading-relaxed text-mist">
            I'm open to software development roles — in Pune, or remote. The fastest way to reach me is the form, or
            email if you'd rather skip it.
          </p>

          <ul className="mt-8 space-y-4 text-sm">
            <li>
              <span className="block font-mono text-xs tracking-[0.16em] text-mist/80 uppercase">Email</span>
              <a href={`mailto:${profile.email}`} className="text-bone underline decoration-slate underline-offset-4 hover:decoration-accent">
                {profile.email}
              </a>
            </li>
            <li>
              <span className="block font-mono text-xs tracking-[0.16em] text-mist/80 uppercase">Elsewhere</span>
              <span className="flex flex-wrap gap-4">
                <a href={profile.links.github} target="_blank" rel="noreferrer noopener" className="text-bone underline decoration-slate underline-offset-4 hover:decoration-accent">
                  GitHub ↗
                </a>
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer noopener" className="text-bone underline decoration-slate underline-offset-4 hover:decoration-accent">
                  LinkedIn ↗
                </a>
                <a href={profile.resume} className="text-bone underline decoration-slate underline-offset-4 hover:decoration-accent">
                  Résumé (PDF)
                </a>
              </span>
            </li>
            <li>
              <span className="block font-mono text-xs tracking-[0.16em] text-mist/80 uppercase">Based in</span>
              <span className="text-mist">{profile.location}</span>
            </li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs text-mist">
              Name
            </label>
            <input id="name" name="name" required autoComplete="name" className={field} placeholder="Your name" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs text-mist">
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={field} placeholder="you@company.com" />
          </div>
          <div>
            <label htmlFor="message" className="mb-1.5 block text-xs text-mist">
              Message
            </label>
            <textarea id="message" name="message" required rows={5} className={`${field} resize-y`} placeholder="What are you building?" />
          </div>

          {/* Honeypot — hidden from people, irresistible to bots. */}
          <div aria-hidden className="absolute left-[-9999px]">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-full bg-bone px-5 py-2.5 text-sm font-medium text-void transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>

          <p aria-live="polite" className="min-h-5 text-sm">
            {status === 'sent' && <span className="text-accent">Thanks — that reached my inbox. I'll reply soon.</span>}
            {status === 'error' && (
              <span className="text-ember">
                {error}{' '}
                <a href={`mailto:${profile.email}`} className="underline underline-offset-4">
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
