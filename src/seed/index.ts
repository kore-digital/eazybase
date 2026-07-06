/**
 * Idempotent seed script — run with `npm run seed` (payload run src/seed/index.ts).
 * Each section checks for existing data and skips itself if already seeded.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload'
import sharp from 'sharp'

import config from '../payload.config'
import { AREAS, ORDER_STEPS, SITE } from '../lib/site'
import { MEDIA_MAP } from './media-map'
import { toRichText } from './richtext'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** Crawl assets directory (override with EAZYBASE_ASSETS_DIR). */
const ASSETS_DIR =
  process.env.EAZYBASE_ASSETS_DIR ||
  'C:/Users/info/AppData/Local/Temp/claude/C--Users-info/767f10ba-6bcb-4a70-8561-5ac51de8640f/scratchpad/eazybase-crawl/assets'

const AREA_COPY_DIR = path.resolve(dirname, '../../docs/area-copy')

/* ------------------------------------------------------------------ helpers */

const mimeFor = (file: string) => (file.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')

/* -------------------------------------------------------------------- media */

async function seedMedia(payload: Payload): Promise<Record<string, number | string>> {
  const idByFile: Record<string, number | string> = {}

  const existing = await payload.count({ collection: 'media' })
  if (existing.totalDocs > 0) {
    console.log(`— media: ${existing.totalDocs} docs already exist, skipping import`)
    // still build the map so later sections can link
    for (const entry of MEDIA_MAP) {
      const found = await payload.find({
        collection: 'media',
        where: { filename: { like: path.parse(entry.file).name } },
        limit: 1,
      })
      if (found.docs[0]) idByFile[entry.file] = found.docs[0].id
    }
    return idByFile
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    console.warn(`— media: assets dir not found (${ASSETS_DIR}) — skipping media import`)
    return idByFile
  }

  for (const entry of MEDIA_MAP) {
    const filePath = path.join(ASSETS_DIR, entry.file)
    if (!fs.existsSync(filePath)) {
      console.warn(`  ! missing asset ${entry.file}, skipped`)
      continue
    }
    // Bake in correct EXIF orientation (iPhone photos) before upload.
    const data = await sharp(filePath).rotate().toBuffer()
    const doc = await payload.create({
      collection: 'media',
      data: { alt: entry.alt },
      file: {
        data,
        mimetype: mimeFor(entry.file),
        name: entry.file,
        size: data.length,
      },
    })
    idByFile[entry.file] = doc.id
  }
  console.log(`✔ media: imported ${Object.keys(idByFile).length} images`)
  return idByFile
}

async function seedGalleryItems(payload: Payload, mediaIds: Record<string, number | string>) {
  const existing = await payload.count({ collection: 'gallery-items' })
  if (existing.totalDocs > 0) {
    console.log(`— gallery-items: ${existing.totalDocs} docs already exist, skipping`)
    return
  }
  let order = 1
  let created = 0
  for (const entry of MEDIA_MAP) {
    if (entry.role !== 'gallery' || !entry.category) continue
    const imageId = mediaIds[entry.file]
    if (imageId === undefined) continue
    await payload.create({
      collection: 'gallery-items',
      data: {
        image: imageId as number,
        alt: entry.alt,
        category: entry.category,
        order: order++,
      },
    })
    created++
  }
  console.log(`✔ gallery-items: ${created} created`)
}

/* --------------------------------------------------------------------- faqs */

// 8 site-wide FAQs — verbatim from docs/extracted-pages.json (faq page).
const FAQ_ROWS: { q: string; a: string }[] = [
  {
    q: 'What does a home extension look like?',
    a: 'We have many design types and your own design will be developed on AutoCAD and shown to you before installation. There are also many other additional options like the type of windows, doors and render finish.',
  },
  {
    q: 'Do you supply home extensions nationwide?',
    a: 'Yes, to every city, town and village throughout the country!',
  },
  {
    q: 'What kind of external wall finishes can I have?',
    a: 'Many types of finishes to the exterior walls are available including brickwork, render and cladding!',
  },
  {
    q: 'Do I need to arrange my own builder?',
    a: 'No, we have a fully dedicated and highly trained team that works nationwide to build the extension at a very high standard for you.',
  },
  {
    q: 'Why are your extensions so affordable?',
    a: 'We have a very efficient team that is trained to work in a manner that helps to keep wastage down, thus passing on the cost efficiencies to you! Because our technicians are able to work at speed as well as being professional in the work carried out, we are able to pass savings onto you the customer.',
  },
  {
    q: 'How long does a house extension build take?',
    a: 'There are two factors to this… The manufacture of the prefab modular extension and the actual build process of the extension. The design and manufacture can take anywhere from 4 weeks to 8 weeks and builds can vary depending on factors like the weather, building regulations and the type of extension.',
  },
  {
    q: 'Do I need planning permission?',
    a: 'As a general rule, no! Most extensions are allowed under permitted development rules. A rough guide is that houses up to and including semi-detached properties can extend for a 3-metre projection or 4 metres for detached homes. This simplifies the process and it gives you an idea but our technician that carries out the quote will go into more detail with you on what is needed to start the build.',
  },
  {
    q: 'Why are your extensions quicker to build?',
    a: 'Traditional extensions are more cumbersome and time-consuming than our system. We build most of the construction in our state-of-the-art manufacturing premises, where we can build faster and more efficiently! This procedure cuts the time down dramatically for the builders on-site at your home, giving you more savings, less hassle and limited mess or wastage compared to more conventional extension builds.',
  },
]

async function seedFaqs(payload: Payload) {
  const existing = await payload.count({ collection: 'faqs' })
  if (existing.totalDocs > 0) {
    console.log(`— faqs: ${existing.totalDocs} docs already exist, skipping`)
    return
  }
  let order = 1
  for (const row of FAQ_ROWS) {
    await payload.create({
      collection: 'faqs',
      data: { question: row.q, answer: row.a, order: order++ },
    })
  }
  console.log(`✔ faqs: ${FAQ_ROWS.length} created`)
}

/* ------------------------------------------------------------- testimonials */

const TESTIMONIAL_ROWS = [
  {
    platform: 'google' as const,
    title: 'What a team!',
    author: 'Adam Sanders',
    quote:
      'Brilliant results and so quick. We couldn’t be happier with our build. I highly recommend Amir, Sol, Jess and the Eazybase team!',
    featured: true,
  },
  {
    platform: 'yell' as const,
    title: 'Outstanding',
    author: 'ShahinaY',
    quote:
      'I couldn’t believe that I got an extension built in 6 days. Absolutely amazing service. Good clean job, very professional.',
    featured: true,
  },
  {
    platform: 'facebook' as const,
    title: 'Fast And Reliable',
    author: 'Danni',
    quote:
      'Great quality… I can not believe how quickly the guys at Eazybase put the extension up… Thank you very much!',
    featured: false,
  },
  {
    platform: 'facebook' as const,
    title: 'Best Work',
    author: 'Salim Patel',
    quote:
      'I’ve had an extension built with Eazybase Extensions, the best building work I’ve ever invested in.',
    featured: false,
  },
  {
    platform: 'facebook' as const,
    title: 'Recommended',
    author: 'Nielsen',
    quote:
      'Had an extension, doors including a skylight by EazyBase. It was completed in 7 days to a very high standard.',
    featured: true,
  },
]

async function seedTestimonials(payload: Payload) {
  const existing = await payload.count({ collection: 'testimonials' })
  if (existing.totalDocs > 0) {
    console.log(`— testimonials: ${existing.totalDocs} docs already exist, skipping`)
    return
  }
  for (const row of TESTIMONIAL_ROWS) {
    await payload.create({ collection: 'testimonials', data: row })
  }
  console.log(`✔ testimonials: ${TESTIMONIAL_ROWS.length} created`)
}

/* -------------------------------------------------------------------- award */

async function seedAward(payload: Payload, mediaIds: Record<string, number | string>) {
  const existing = await payload.count({ collection: 'awards' })
  if (existing.totalDocs > 0) {
    console.log(`— awards: ${existing.totalDocs} docs already exist, skipping`)
    return
  }
  const imageId = mediaIds['Northern-Enterprise-Awards.jpg']
  await payload.create({
    collection: 'awards',
    data: {
      title: SITE.award,
      body: SITE.awardBody,
      year: 2023,
      ...(imageId !== undefined ? { image: imageId as number } : {}),
      featured: true,
    },
  })
  console.log('✔ awards: 1 created')
}

/* ------------------------------------------------------------------ globals */

async function seedGlobals(payload: Payload) {
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  if (settings?.phone) {
    console.log('— site-settings: already seeded, skipping')
  } else {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        phone: SITE.phone,
        whatsappNumber: SITE.whatsappNumber,
        email: SITE.email,
        tagline: SITE.tagline,
        awardLine: `${SITE.award} — ${SITE.awardBody}`,
        socials: { ...SITE.social },
        stats: { ...SITE.stats },
      },
    })
    console.log('✔ site-settings seeded')
  }

  const nav = await payload.findGlobal({ slug: 'navigation' })
  if (nav?.mainNav && nav.mainNav.length > 0) {
    console.log('— navigation: already seeded, skipping')
  } else {
    await payload.updateGlobal({
      slug: 'navigation',
      data: {
        mainNav: [
          { label: 'Home', href: '/' },
          { label: 'About Us', href: '/about-us' },
          { label: 'What We Do', href: '/what-we-do' },
          { label: 'Gallery', href: '/gallery' },
          { label: 'Areas', href: '/areas' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Get a Quote', href: '/get-a-quote' },
        ],
        footerNav: [
          { label: 'About Us', href: '/about-us' },
          { label: 'What We Do', href: '/what-we-do' },
          { label: 'Gallery', href: '/gallery' },
          { label: 'Areas We Serve', href: '/areas' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Reviews & Social', href: '/social' },
          { label: 'Instant Quote', href: '/instant-quote' },
          { label: 'Get a Quote', href: '/get-a-quote' },
        ],
      },
    })
    console.log('✔ navigation seeded')
  }
}

/* -------------------------------------------------------------------- pages */

async function seedPages(payload: Payload, mediaIds: Record<string, number | string>) {
  const existing = await payload.count({ collection: 'pages' })
  if (existing.totalDocs > 0) {
    console.log(`— pages: ${existing.totalDocs} docs already exist, skipping`)
    return
  }

  const teamPhoto = mediaIds['Photo-22-03-2020-18-18-36.jpg']

  const ctaBand = (heading: string, body?: string) => ({
    blockType: 'ctaBand' as const,
    heading,
    body:
      body ??
      `Call ${SITE.phone}, message us on WhatsApp, or request your free no-obligation quote today.`,
    buttonLabel: 'Get a Quote',
    buttonHref: '/get-a-quote',
  })

  const statsCounters = {
    blockType: 'statsCounters' as const,
    heading: 'Factory-built speed, without the compromise',
    stats: [
      // Leading space in word suffixes — the counters render {value}{suffix} tight.
      { value: SITE.stats.factoryWeeks, suffix: ' weeks', label: 'Factory build, in as little as' },
      { value: SITE.stats.installDays, suffix: ' days', label: 'Installed on-site in under' },
      { value: SITE.stats.guaranteeYears, suffix: '-year', label: 'Guarantee on roofing, up to' },
    ],
  }

  // Copy tightened from the extraction; typos fixed per the audit defect register:
  // 'competing with electric sockets' → 'complete with electric sockets'.
  const homeIntro =
    'EazyBase design, build and install modular extensions and outbuildings in a fraction of the time of a traditional build. We design the building with you, tailoring it to your requirements — as many doors, windows and roof lights as you like.\n\n' +
    'We then build your extension in our Blackburn factory, off-site from your home, in as little as four weeks. Once the build is finished we arrive on-site with your extension in segments and piece it together in less than a week — complete with electric sockets, LED downlights, plastering and building control sign-off.'

  const pages = [
    {
      slug: 'home',
      title: 'Home',
      heroHeading: 'Get a Modular Home Extension',
      heroSub: 'Creating more space for what matters — factory-built in Blackburn, installed in under a week.',
      seo: {
        metaTitle: 'Affordable Modular Home Extensions | EazyBase Prefab Extensions UK',
        metaDescription:
          'Affordable prefab modular home extensions designed, built and installed by EazyBase. Factory-built in as little as 4 weeks, installed in under a week.',
      },
      sections: [
        {
          blockType: 'richText' as const,
          heading: 'Hire EazyBase for Modular Home Extensions',
          content: toRichText(homeIntro),
        },
        statsCounters,
        {
          blockType: 'useCaseTabs' as const,
          heading: 'One extension, endless uses',
          tabs: [
            {
              label: 'Playrooms',
              heading: 'Kids Playrooms',
              body: 'Many parents have used an EazyBase modular extension to create a stunning kids playroom — a great environment for the imagination to flourish that also keeps the noise and mess contained in one room! Ask our team for a free quotation today and we will send one of our professional, friendly surveyors out to discuss the wide range of options available.',
            },
            {
              label: 'Home Office',
              heading: 'Home Office',
              body: 'EazyBase modular extensions are perfect for home offices and extra workspaces. We design, build and install prefabricated modular extensions to suit any need for more space in your home — including for work — at very affordable prices. Get in touch today for a totally free, no-obligation quotation for a home office extension.',
            },
            {
              label: 'Dining Rooms',
              heading: 'Dining Rooms',
              body: 'A dining room is one of the most popular uses for the extra space a modular extension gives you. Imagine a totally new space to decorate as you wish and model from scratch. Dining rooms are a perfect choice for a prefab extension and will transform your living and eating space for a fraction of the cost of a traditional extension.',
            },
            {
              // Mistitled "Dining Rooms" on the old site — fixed per audit §4.
              label: 'Kitchens',
              heading: 'Kitchens',
              body: 'Kitchens are one of the most popular choices for an EazyBase modular extension in UK homes — it works out much better than a conventional kitchen extension for both cost and ease of build. With a prefabricated modular extension there are so many designs and structures to choose from, giving you a freedom of design that more orthodox kitchen extensions simply don’t.',
            },
          ],
        },
        {
          blockType: 'processTimeline' as const,
          heading: 'Our 5-step process',
          steps: [
            {
              title: 'Concept',
              body: 'We map out your design after an in-depth consultation to find the modular extension best suited to your home.',
            },
            {
              title: 'Design',
              body: 'We plan the design of your extension in detail. It is fully signed off by you before the build, to the agreed specification.',
            },
            {
              title: 'Build',
              body: 'We build your extension from the ground up to our architects’ specification using only the best materials — foundations, brickwork and roof-line.',
            },
            {
              title: 'Interior',
              body: 'We carry out all the interior work too: plastering, doors, flooring, ceilings, electrics and much more. EazyBase is the one-stop shop for modular home extensions.',
            },
            {
              title: 'Completion',
              body: 'Before handover we complete a full snagging checklist — an experienced engineer checks for any imperfections so we can put them right before completion.',
            },
          ],
        },
        {
          blockType: 'galleryStrip' as const,
          heading: 'Recent projects',
          category: 'exterior' as const,
        },
        { blockType: 'testimonialStrip' as const, heading: 'What our customers say' },
        {
          blockType: 'awardBadge' as const,
          heading: 'Recent Northern Enterprise Award winner',
        },
        ctaBand('Ready to create more space?'),
      ],
    },
    {
      slug: 'about-us',
      title: 'About Us',
      heroHeading: 'About EazyBase',
      heroSub: 'Decades of experience. Factory-built in Blackburn. Fully insured, certified teams.',
      seo: {
        metaTitle: 'About Us | EazyBase Modular Home Extensions',
        metaDescription:
          'Meet the EazyBase team — experienced, fully insured and highly trained. We design, factory-build and install modular home extensions at affordable prices.',
      },
      sections: [
        {
          blockType: 'richText' as const,
          heading: 'About EazyBase',
          content: toRichText(
            'EazyBase brings decades of construction experience to modular home extensions. Our teams are professional, highly trained, fully insured and fully certified, and we carry out free surveys before every project.\n\n' +
              'Because we manufacture your extension ourselves in our Blackburn factory, we control quality at every stage — right down to smart-technology electrics and roofing covered by a guarantee of up to 40 years. Health and safety runs through everything we do, on the factory floor and on site at your home.',
          ),
        },
        {
          blockType: 'imageText' as const,
          heading: 'A team you can trust in your home',
          body: toRichText(
            'From the first survey to the final quality check, you deal with the same dedicated EazyBase team. We design your extension with you, build it off-site to protect your home from months of disruption, then install and finish everything — so you get one point of contact and one accountable builder from start to finish.',
          ),
          ...(teamPhoto !== undefined ? { image: teamPhoto as number } : {}),
          imageSide: 'right' as const,
        },
        statsCounters,
        ctaBand('Talk to the team today'),
      ],
    },
    {
      slug: 'what-we-do',
      title: 'What We Do',
      heroHeading: 'What We Do',
      heroSub: 'Design, factory build and installation — one company, one process, one price.',
      seo: {
        metaTitle: 'What We Do | EazyBase Modular Home Extensions',
        metaDescription:
          'How EazyBase works: free 3D design visual, factory build in as little as 4 weeks, and on-site installation in under a week — whatever the weather.',
      },
      sections: [
        {
          blockType: 'richText' as const,
          heading: 'Modular extensions, from concept to completion',
          content: toRichText(
            // 'will be compete with electrical sockets' → 'complete with electrical sockets' (audit defect register).
            'EazyBase design, build and install modular extensions and outbuildings in a fraction of the time of a traditional build. We start with a free consultation and a free 3D visual of your design, so you can see exactly what you are getting before a single panel is made.\n\n' +
              'Your extension is then manufactured in our factory, away from your home, in as little as four weeks — unaffected by weather or site access. Finally we install it on-site in under a week, complete with electrical sockets, LED downlights, plastering and building control sign-off.',
          ),
        },
        {
          blockType: 'processTimeline' as const,
          heading: 'Order process',
          steps: ORDER_STEPS.map((title) => ({ title })),
        },
        statsCounters,
        {
          blockType: 'galleryStrip' as const,
          heading: 'From factory to finished',
          category: 'build-progress' as const,
        },
        ctaBand('Start with a free discovery call'),
      ],
    },
    {
      slug: 'faq',
      title: 'FAQ',
      heroHeading: 'Frequently Asked Questions',
      heroSub: 'Everything homeowners ask us about modular extensions, answered.',
      seo: {
        metaTitle: 'Frequently Asked Questions | EazyBase',
        metaDescription:
          'Answers to the questions we hear most about modular home extensions — planning permission, build times, finishes, and why our extensions cost less.',
      },
      sections: [
        { blockType: 'faqList' as const, heading: 'Frequently Asked Questions' },
        ctaBand('Still have a question?', `Call ${SITE.phone} or send us a message — our team answers quote requests seven days a week.`),
      ],
    },
    {
      slug: 'gallery',
      title: 'Gallery',
      heroHeading: 'Our Project Gallery',
      heroSub: 'Real EazyBase projects — from factory build to finished extension.',
      seo: {
        metaTitle: 'Project Gallery | EazyBase Modular Home Extensions',
        metaDescription:
          'Browse real EazyBase projects: finished exteriors, bright interiors and behind-the-scenes build progress from our modular extension installs.',
      },
      sections: [
        { blockType: 'galleryStrip' as const, heading: 'Finished exteriors', category: 'exterior' as const },
        { blockType: 'galleryStrip' as const, heading: 'Interiors', category: 'interior' as const },
        {
          blockType: 'galleryStrip' as const,
          heading: 'Build progress',
          category: 'build-progress' as const,
        },
        ctaBand('Like what you see?'),
      ],
    },
    {
      slug: 'social',
      title: 'Social',
      heroHeading: 'Time to Get Social',
      heroSub: 'Read our reviews and follow our latest projects.',
      seo: {
        metaTitle: 'Reviews & Social | EazyBase',
        metaDescription:
          'See what EazyBase customers say on Google, Yell and Facebook, and follow our latest modular extension projects on social media.',
      },
      sections: [
        { blockType: 'testimonialStrip' as const, heading: 'What our customers say' },
        ctaBand('Join our happy customers'),
      ],
    },
    {
      slug: 'get-a-quote',
      title: 'Get a Quote',
      heroHeading: 'Get a Quote',
      heroSub: 'Quick quotes, seven days a week.',
      seo: {
        metaTitle: 'Get a Quote | EazyBase Modular Home Extensions',
        metaDescription:
          'Tell us about your project and get a fast, accurate quote for your modular home extension. Our team responds seven days a week.',
      },
      sections: [
        {
          blockType: 'richText' as const,
          content: toRichText(
            'Please complete the form below to give us a few brief details about your project. Once submitted, one of our team will be in touch soon to discuss your project further and provide you with an accurate quote.',
          ),
        },
      ],
    },
    {
      slug: 'instant-quote',
      title: 'Instant Quote',
      heroHeading: 'Instant Quote',
      heroSub: 'Get an indicative price for your extension in under a minute.',
      seo: {
        metaTitle: 'Instant Quote | EazyBase Modular Home Extensions',
        metaDescription:
          'Use our instant estimator to get an indicative price range for your modular home extension — then request a full, accurate quote from our team.',
      },
      sections: [
        {
          blockType: 'richText' as const,
          content: toRichText(
            'Choose your extension type, size and specification below to see an indicative price range straight away. When you are ready, send us your details and we will follow up with a full, accurate quotation.',
          ),
        },
        ctaBand('Prefer to talk it through?', `Call ${SITE.phone} — our team can give you a ballpark figure over the phone.`),
      ],
    },
  ]

  for (const page of pages) {
    await payload.create({
      collection: 'pages',
      // Blocks typed loosely — the generated types insist on ids we don't have pre-insert.
      data: { ...page, published: true } as unknown as RequiredDataFromCollectionSlug<'pages'>,
    })
  }
  console.log(`✔ pages: ${pages.length} created`)
}

/* -------------------------------------------------------------------- areas */

type AreaCopy = {
  slug: string
  heroHeading?: string
  metaTitle?: string
  metaDescription?: string
  intro?: string
  localAngles?: { heading: string; body: string }[]
  faqs?: { q: string; a: string }[]
}

async function seedAreas(payload: Payload) {
  const existing = await payload.count({ collection: 'areas' })
  if (existing.totalDocs > 0) {
    console.log(`— areas: ${existing.totalDocs} docs already exist, skipping`)
    return
  }

  let withCopy = 0
  for (const area of AREAS) {
    let copy: AreaCopy | null = null
    const copyPath = path.join(AREA_COPY_DIR, `${area.slug}.json`)
    if (fs.existsSync(copyPath)) {
      copy = JSON.parse(fs.readFileSync(copyPath, 'utf8')) as AreaCopy
      withCopy++
    }

    const regionLabel = area.region === 'london' ? 'London' : 'the North West'
    const placeholderIntro =
      `EazyBase designs, factory-builds and installs modular home extensions across ${regionLabel}, including ${area.name}. ` +
      'Your extension is manufactured in our Blackburn factory in as little as four weeks, then installed at your home in under a week — complete with electrics, plastering and building control sign-off.\n\n' +
      `Unique local copy for ${area.name} is being written and will appear here soon. In the meantime, request a free quote and we will talk you through recent projects near you.`

    await payload.create({
      collection: 'areas',
      data: {
        slug: area.slug,
        name: area.name,
        region: area.region,
        isHub: Boolean(area.hub),
        heroHeading: copy?.heroHeading ?? `Modular Home Extensions in ${area.name}`,
        intro: toRichText(copy?.intro ?? placeholderIntro) as unknown as Record<string, unknown>,
        localAngles: copy?.localAngles ?? [],
        faqs: copy?.faqs ?? [],
        seo: {
          metaTitle: copy?.metaTitle ?? `Modular Home Extensions in ${area.name} | EazyBase`,
          metaDescription:
            copy?.metaDescription ??
            `EazyBase designs and factory-builds modular home extensions for ${area.name} homes — installed on site in under a week. Get your free quote today.`,
        },
        published: true,
      } as unknown as RequiredDataFromCollectionSlug<'areas'>,
    })
  }
  console.log(`✔ areas: ${AREAS.length} created (${withCopy} with real local copy, ${AREAS.length - withCopy} placeholder)`)
}

/* --------------------------------------------------------------------- main */

// NOTE: `payload run` awaits the module import and then exits the process —
// this must be top-level await, not a floating promise.
try {
  const payload = await getPayload({ config })
  console.log('Seeding EazyBase CMS…')

  const mediaIds = await seedMedia(payload)
  await seedGalleryItems(payload, mediaIds)
  await seedFaqs(payload)
  await seedTestimonials(payload)
  await seedAward(payload, mediaIds)
  await seedGlobals(payload)
  await seedPages(payload, mediaIds)
  await seedAreas(payload)

  // Summary
  const collections = [
    'pages',
    'areas',
    'faqs',
    'testimonials',
    'gallery-items',
    'awards',
    'media',
    'quote-requests',
    'users',
  ] as const
  console.log('\nDocument counts:')
  for (const slug of collections) {
    const { totalDocs } = await payload.count({ collection: slug })
    console.log(`  ${slug}: ${totalDocs}`)
  }

  console.log('\nSeed complete.')
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
