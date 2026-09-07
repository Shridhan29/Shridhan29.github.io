export const profile = {
  name: 'Shridhan Vidhate',
  fullName: 'Shridhan Satish Vidhate',
  role: 'Software Developer',
  location: 'Pune, Maharashtra',
  email: 'vidhateshridhan117@gmail.com',
  // Deliberately not published on the page (decision D5) — it stays in the PDF.
  resume: '/resume.pdf',

  // The one sentence that has to land before anyone scrolls.
  headline: 'I ship software that leaves the laptop.',
  subhead:
    'Software developer at Aashman Technicals, Pune. An agricultural robotics app live on Google Play, a FastAPI service on Azure behind it, and two Raspberry Pi products running in the field.',

  about: [
    "I've spent the last two years at a robotics and electronics company where the software has to survive contact with the real world — a farm, a dairy plant, a shop floor. That shapes how I build. An app that works on my machine is not finished; an app is finished when it clears Google's production review, runs on a stranger's phone, and someone in the field trusts it.",
    'I own delivery end to end: requirements, architecture, implementation, release, and the support calls afterwards. In practice that has meant Flutter on Android, Python and FastAPI on the backend, React on the web, Postgres and SQLite for storage, and Azure with GitHub Actions for getting it all out the door.',
    'I like the parts most people skip — release compliance, migrations that do not lose data, logs that never record a phone number, and the root-cause hunt when a Bluetooth link drops on a Raspberry Pi in a dairy.',
  ],

  links: {
    github: 'https://github.com/Shridhan29',
    linkedin: 'https://www.linkedin.com/in/shridhan-vidhate-36a401303',
    playStore: 'https://play.google.com/store/apps/details?id=in.aashman.truuna',
    company: 'https://aashman.in/',
  },

  // Facts worth stating as numbers rather than adjectives.
  stats: [
    { value: '13', label: 'production releases', detail: 'TRUUNA, across 8 delivery phases' },
    { value: '20+', label: 'REST endpoints', detail: 'FastAPI, SQLAlchemy 2, Postgres 16' },
    { value: '2', label: 'Raspberry Pi products', detail: 'deployed and running in the field' },
    { value: '100%', label: 'Play review pass rate', detail: 'every submission cleared first time' },
  ],

  openToRemote: true,
} as const
