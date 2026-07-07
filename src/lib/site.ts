/**
 * Site-wide constants. Runtime values (phone, socials…) are ALSO stored in the
 * SiteSettings global in Payload — these are the fallbacks used when the CMS
 * is empty and for build-time contexts (sitemap, JSON-LD defaults).
 */
export const SITE = {
  name: 'EazyBase',
  legalName: 'Eazybase Extensions Ltd',
  domain: 'https://www.eazybase.co.uk',
  phone: '0330 229 0775',
  phoneHref: 'tel:03302290775',
  whatsappNumber: '447845655113',
  whatsappHref: 'https://wa.me/447845655113?text=Hi%20EazyBase%2C%20I%27d%20like%20to%20talk%20about%20a%20modular%20extension.',
  email: 'info@eazybase.co.uk',
  tagline: 'Modular Home Extensions at an Affordable Price',
  award: 'Best Nationwide Modular Home Construction Company 2023',
  awardBody: 'Northern Enterprise Awards',
  base: 'Blackburn, Lancashire',
  social: {
    facebook: 'https://www.facebook.com/EazyBase',
    instagram: 'https://www.instagram.com/eazybaseextensions',
    tiktok: 'https://www.tiktok.com/@eazybase2',
    yell: 'https://www.yell.com/biz/eazybase-extensions-ltd-blackburn-9070825/',
    google: 'https://g.page/eazybase-extensions-ltd',
  },
  stats: {
    factoryWeeks: 4, // "factory-built in as little as 4 weeks"
    installDays: 7, // "installed on-site in under a week"
    guaranteeYears: 20, // "up to 20-year structural guarantee"
  },
} as const

/** Canonical 5-step process (home hero + What We Do timeline). */
export const PROCESS_STEPS = ['Concept', 'Design', 'Build', 'Interior', 'Completion'] as const

/** 8-step order journey (What We Do detail). */
export const ORDER_STEPS = [
  'Discovery Call',
  'Quotation',
  'Survey',
  'Design',
  'Manufacture',
  'Delivery',
  'Installation',
  'Quality Check',
] as const

export type AreaRegion = 'north-west' | 'london'

/** Area pages: slug = /areas/{slug}; oldSlug = live-site URL to 301 from. */
export const AREAS: { slug: string; name: string; region: AreaRegion; oldSlug: string | null; hub?: boolean }[] = [
  { slug: 'north-west', name: 'North West', region: 'north-west', oldSlug: 'north-west-modular-home-extensions', hub: true },
  { slug: 'blackburn', name: 'Blackburn', region: 'north-west', oldSlug: null }, // NEW page
  { slug: 'blackpool', name: 'Blackpool', region: 'north-west', oldSlug: 'blackpool-modular-home-extensions' },
  { slug: 'manchester', name: 'Manchester', region: 'north-west', oldSlug: 'manchester-modular-home-extensions' },
  { slug: 'preston', name: 'Preston', region: 'north-west', oldSlug: 'preston-modular-home-extensions' },
  { slug: 'warrington', name: 'Warrington', region: 'north-west', oldSlug: 'warrington-modular-home-extensions' },
  { slug: 'liverpool', name: 'Liverpool', region: 'north-west', oldSlug: 'liverpool-modular-home-extensions' },
  { slug: 'chester', name: 'Chester', region: 'north-west', oldSlug: 'chester-modular-home-extensions' },
  { slug: 'london', name: 'London', region: 'london', oldSlug: 'london-modular-home-extensions', hub: true },
  { slug: 'wembley', name: 'Wembley', region: 'london', oldSlug: 'wembley-modular-home-extensions' },
  { slug: 'harrow', name: 'Harrow', region: 'london', oldSlug: 'harrow-modular-home-extensions' },
  { slug: 'edgware', name: 'Edgware', region: 'london', oldSlug: 'edgware-modular-home-extensions' },
  { slug: 'watford', name: 'Watford', region: 'london', oldSlug: 'watford-modular-home-extensions' },
  { slug: 'twickenham', name: 'Twickenham', region: 'london', oldSlug: 'twickenham-modular-home-extensions' },
  { slug: 'richmond', name: 'Richmond', region: 'london', oldSlug: 'richmond-modular-home-extensions' },
  { slug: 'hayes', name: 'Hayes', region: 'london', oldSlug: 'hayes-modular-home-extensions' },
  { slug: 'enfield', name: 'Enfield', region: 'london', oldSlug: 'enfield-modular-home-extensions' },
]
