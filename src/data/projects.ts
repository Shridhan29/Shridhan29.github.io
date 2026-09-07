export type Shot = {
  slug: string
  alt: string
  /** Phone screenshots render in a device frame; web ones in a browser chrome. */
  kind: 'phone' | 'web'
}

export type Project = {
  id: string
  name: string
  tagline: string
  /** One line that earns the click. */
  hook: string
  period: string
  role: string
  stack: string[]
  highlights: string[]
  /** The hard, checkable engineering detail — what a senior reviewer looks for. */
  depth: string[]
  links: { label: string; href: string }[]
  dir: string
  widths: [number, number]
  shots: Shot[]
  featured?: boolean
}

export const projects: Project[] = [
  {
    id: 'truuna',
    name: 'TRUUNA',
    tagline: 'Agricultural robotics, ordered from a phone',
    hook: 'A Flutter app, live on Google Play, that lets a farmer configure a modular field robot, book a demo, pay an advance, and watch it get built.',
    period: '2024 – present',
    role: 'Sole developer — Android app, backend, release, and infrastructure',
    stack: ['Flutter', 'Dart', 'Python 3.12', 'FastAPI', 'PostgreSQL 16', 'Firebase', 'Azure'],
    highlights: [
      'Farmers configure a base chassis and bolt on attachments — a laser weed-remover, a goods transporter — and the app prices the build as they go.',
      'Bilingual from the first screen: English and मराठी, chosen before login rather than buried in settings.',
      'Phone-OTP sign-in with no password, because the users are in a field and not carrying a password manager.',
      'A seven-stage order timeline runs from field-demo request through production and dispatch to delivery, so the buyer is never left guessing.',
      'Shipped across 13 production releases and 8 delivery phases, clearing Google production review on every single submission.',
    ],
    depth: [
      'Python 3.12 FastAPI backend with 20+ REST endpoints on SQLAlchemy 2 and Alembic migrations against Postgres 16.',
      'Server-generated PDF quotes, Firebase Phone Auth, and FCM push for order-stage changes.',
      'Deployed to Azure App Service through Container Registry with a GitHub Actions workflow, cloud Postgres, and Key Vault secrets across separate staging and production environments.',
      'Hardened for Play Store compliance: target API 36, per-environment flavors, Crashlytics, FLAG_SECURE on payment screens, encrypted token storage, and PII-safe logging that never records a phone number, an OTP, or a token.',
      'A token-authenticated service-to-service contract lets the company ERP/CRM pull registrations, bookings, payment submissions, and a user activity audit trail — with both databases kept fully isolated.',
    ],
    links: [
      { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=in.aashman.truuna' },
    ],
    dir: 'truuna',
    widths: [420, 840],
    shots: [
      { slug: '01-language', alt: 'TRUUNA language chooser offering English and Marathi', kind: 'phone' },
      { slug: '02-login-otp', alt: 'Passwordless phone-OTP login screen', kind: 'phone' },
      { slug: '03-configurator', alt: 'Robot configurator showing the base chassis and attachment options', kind: 'phone' },
      { slug: '04-booking-summary', alt: 'Booking summary listing the chassis and selected attachments with totals', kind: 'phone' },
      { slug: '05-order-timeline', alt: 'Seven-stage order timeline from demo request to delivery', kind: 'phone' },
    ],
    featured: true,
  },
  {
    id: 'aashman',
    name: 'Aashman Technicals',
    tagline: 'The company site, shipped under real constraints',
    hook: 'A nine-route React SPA for a robotics firm, deployed to Apache shared hosting with no Node and no SMTP available.',
    period: '2024',
    role: 'Sole developer — frontend, contact API, hosting',
    stack: ['React 18', 'JavaScript', 'PHP', 'CSS3', 'GSAP', 'Framer Motion', 'Apache'],
    highlights: [
      'Nine routes and seventeen components covering the company, its leadership, services, the TRUUNA product line, a help centre, and contact.',
      'A hand-written CSS3 design system — no framework — with GSAP and Framer Motion carrying the motion.',
      'A pinch-zoom media lightbox for product imagery that works on touch and desktop alike.',
    ],
    depth: [
      'A secure PHP contact API with reCAPTCHA v2 verification, per-IP rate limiting, input sanitisation, email header-injection protection, and a CORS allowlist.',
      'The host offered no Node build step and no SMTP relay, so the site ships as a static build with hash routing and falls back to PHP mail() transport.',
      'Domain configuration and deployment handled end to end on Apache shared hosting.',
    ],
    links: [{ label: 'aashman.in', href: 'https://aashman.in/' }],
    dir: 'aashman.in',
    widths: [800, 1600],
    shots: [
      { slug: '02-home', alt: 'Aashman Technicals home page hero', kind: 'web' },
      { slug: '05-products', alt: 'Product page showing the TRUUNA robot render', kind: 'web' },
      { slug: '04-services', alt: 'Services page: industrial automation, research robotics, custom development', kind: 'web' },
      { slug: '07-contact', alt: 'Contact page with the reCAPTCHA-protected form', kind: 'web' },
      { slug: '06-help', alt: 'Help centre with maintenance, safety and training resources', kind: 'web' },
      { slug: '03-about', alt: 'About page with company history and leadership', kind: 'web' },
    ],
  },
  {
    id: 'dms',
    name: 'DMS',
    tagline: 'A dairy POS that keeps selling when the internet dies',
    hook: 'A local-first point-of-sale running on a Raspberry Pi in a dairy, with RFID customer check-in and no cloud dependency.',
    period: '2024 – 2025',
    role: 'Sole developer — frontend, services, hardware integration',
    stack: ['React', 'Node.js', 'Express', 'SQLite', 'Python', 'Chart.js', 'Raspberry Pi'],
    highlights: [
      'Offline by design: the Pi is the server, SQLite is the database, and a dropped connection changes nothing about the shop’s day.',
      'Point of sale with RFID card check-in, so a regular customer taps and their account is on screen.',
      'Product and inventory management, PDF invoicing, payments, staff records, and a full audit history.',
    ],
    depth: [
      'Python microservices handle RFID check-in, notifications, and invoice generation alongside the Node/Express core.',
      'Chart.js dashboards for daily takings and stock movement, with Excel backup exports so the data is never trapped on the device.',
      'Root-cause work on hardware–software integration across Raspberry Pi and Bluetooth, with fixes and incident history documented under defined SOPs.',
    ],
    links: [],
    dir: 'dms',
    widths: [800, 1600],
    shots: [
      { slug: '02-point-of-sale', alt: 'Point of sale screen with RFID scanner and customer selection', kind: 'web' },
      { slug: '03-dashboard', alt: 'Dairy management dashboard', kind: 'web' },
      { slug: '04-admin', alt: 'Admin view with a notification dialog', kind: 'web' },
      { slug: '01-login', alt: 'Dairy POS login screen', kind: 'web' },
    ],
  },
  {
    id: 'urja',
    name: 'Urja Dairy Tour',
    tagline: 'A trilingual kiosk that walks visitors through a dairy plant',
    hook: 'An audio-guided plant tour on a Raspberry Pi kiosk, in English, Hindi and Marathi, tuned to the age of whoever is standing in front of it.',
    period: '2025',
    role: 'Sole developer',
    stack: ['React', 'Framer Motion', 'Howler.js', 'Tailwind CSS', 'Node.js', 'Raspberry Pi'],
    highlights: [
      'Visitors pick an audience — primary, secondary, or adult — and the tour narration adapts to it.',
      'Three languages selected on screen two, before any content loads.',
      'Guided stops through the plant with progress indicators and full playback controls.',
    ],
    depth: [
      'Howler.js drives the audio layer with per-stop tracks and resumable playback.',
      'Runs unattended on a Raspberry Pi kiosk, so the UI has to survive being touched by anyone, in any order, all day.',
    ],
    links: [],
    dir: 'urja',
    widths: [800, 1600],
    shots: [
      { slug: '03-language', alt: 'Language chooser offering English, Hindi and Marathi', kind: 'web' },
      { slug: '02-category', alt: 'Audience selection: primary, secondary, adult', kind: 'web' },
      { slug: '05-tour-progress', alt: 'Tour progress showing stops through the dairy plant', kind: 'web' },
      { slug: '04-tour-options', alt: 'Tour options screen', kind: 'web' },
    ],
  },
]
