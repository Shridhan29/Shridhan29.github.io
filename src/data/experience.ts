export const experience = [
  {
    company: 'Aashman Technicals Pvt. Ltd.',
    href: 'https://aashman.in/',
    role: 'Software Developer',
    note: 'Started as Software Development Intern',
    period: 'Jan 2024 — present',
    location: 'Pune, Maharashtra',
    summary:
      'A robotics and electronics company building industrial automation and agricultural machines. I am the software side of it.',
    // Ongoing responsibilities first, in the present tense; then finished
    // pieces of work, in the past.
    bullets: [
      'Own software delivery end to end across the company’s products — requirements, architecture, implementation, release, and post-release support — spanning Flutter mobile, React web, and Python and Node.js backends.',
      'Run hosting and deployment for internal and customer-facing systems, from Apache shared hosting and domain configuration through to Azure App Service with GitHub Actions CI/CD and Key Vault secrets across staging and production.',
      'Lead root cause analysis on hardware–software integration issues across Raspberry Pi and Bluetooth deployments, cutting downtime and documenting fixes and incident history within defined SOPs.',
      'Took TRUUNA from first commit to a live Google Play listing across 13 production releases and 8 delivery phases, clearing Google production review on every submission.',
      'Designed a service-to-service integration contract that lets the company ERP/CRM pull app registrations, bookings, payment submissions, and a user activity audit trail over token-authenticated HTTP, with both databases kept fully isolated.',
    ],
    stack: [
      'Flutter',
      'React',
      'Python',
      'FastAPI',
      'Node.js',
      'PostgreSQL',
      'Azure',
      'GitHub Actions',
      'Raspberry Pi',
    ],
  },
] as const
