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
    bullets: [
      'Own software delivery end to end across the company’s products — requirements, architecture, implementation, release, and post-release support — spanning Flutter mobile, React web, and Python and Node.js backends.',
      'Took TRUUNA from first commit to a live Google Play listing across 13 production releases and 8 delivery phases, clearing Google production review on every submission.',
      'Run hosting and deployment for internal and customer-facing systems, from Apache shared hosting and domain configuration through to Azure App Service with GitHub Actions CI/CD and Key Vault secrets across staging and production.',
      'Designed a service-to-service integration contract that lets the company ERP/CRM pull app registrations, bookings, payment submissions, and a user activity audit trail over token-authenticated HTTP, with both databases kept fully isolated.',
      'Perform root cause analysis on hardware–software integration issues across Raspberry Pi and Bluetooth deployments, cutting downtime and documenting fixes and incident history within defined SOPs.',
    ],
  },
] as const
