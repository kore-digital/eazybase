/**
 * JSON-LD builders shared across the site. Each function returns a plain
 * schema.org node (no @context) — wrap one or more with `jsonLdScript()` and
 * render via:
 *
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: jsonLdScript(organization(), website()) }}
 *   />
 */
import { BASE_URL } from '@/lib/base-url'
import { SITE } from '@/lib/site'
import type { Area } from '@/payload-types'

const ORG_ID = `${BASE_URL}/#organization`
const WEBSITE_ID = `${BASE_URL}/#website`

type SchemaNode = Record<string, unknown>

/** Eazybase Extensions Ltd — the canonical Organization node. */
export function organization(): SchemaNode {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: `${BASE_URL}/`,
    logo: `${BASE_URL}/logo.png`,
    telephone: SITE.phone,
    email: SITE.email,
    slogan: SITE.tagline,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Blackburn',
      addressRegion: 'Lancashire',
      addressCountry: 'GB',
    },
    award: `${SITE.award} — ${SITE.awardBody}`,
    sameAs: [
      SITE.social.facebook,
      SITE.social.instagram,
      SITE.social.tiktok,
      SITE.social.yell,
      SITE.social.google,
    ],
  }
}

/** The WebSite node (home page / sitewide). */
export function website(): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${BASE_URL}/`,
    name: SITE.name,
    description: SITE.tagline,
    publisher: { '@id': ORG_ID },
  }
}

/**
 * Local-service node for an area page: a HomeAndConstructionBusiness serving
 * the given town, a branch of Eazybase Extensions Ltd in Blackburn (expressed
 * via parentOrganization — `provider` is not a valid LocalBusiness property).
 */
export function localBusinessService(area: Pick<Area, 'slug' | 'name' | 'seo' | 'isHub'>): SchemaNode {
  return {
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${BASE_URL}/areas/${area.slug}#localbusiness`,
    name: `${SITE.name} Modular Home Extensions — ${area.name}`,
    description:
      area.seo?.metaDescription ??
      `Factory-built modular home extensions for ${area.name}, built in Blackburn and installed on-site in under a week.`,
    url: `${BASE_URL}/areas/${area.slug}`,
    image: `${BASE_URL}/logo.png`,
    telephone: SITE.phone,
    email: SITE.email,
    priceRange: '££',
    areaServed: {
      '@type': area.isHub ? 'AdministrativeArea' : 'City',
      name: area.name,
    },
    parentOrganization: { '@id': ORG_ID },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Blackburn',
      addressRegion: 'Lancashire',
      addressCountry: 'GB',
    },
  }
}

type FaqLike = { q: string; a: string } | { question: string; answer: string }

/** FAQPage node — accepts area-style {q,a} or FAQs-collection {question,answer}. */
export function faqPage(faqs: FaqLike[]): SchemaNode {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => {
      const q = 'q' in faq ? faq.q : faq.question
      const a = 'a' in faq ? faq.a : faq.answer
      return {
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      }
    }),
  }
}

/**
 * Serialise one or more nodes into a single @graph JSON-LD payload.
 * '<' is escaped so editor-controlled CMS strings (FAQ answers, meta
 * descriptions) can never terminate the <script> tag they're injected into.
 */
export function jsonLdScript(...nodes: SchemaNode[]): string {
  return JSON.stringify(
    nodes.length === 1
      ? { '@context': 'https://schema.org', ...nodes[0] }
      : { '@context': 'https://schema.org', '@graph': nodes },
  ).replace(/</g, '\\u003c')
}
