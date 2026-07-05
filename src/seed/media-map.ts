/**
 * Curated subset (~30) of the crawled site images to import into the Media
 * collection. Filenames refer to the crawl assets directory passed to the seed
 * script. Alt text written from visual review of the photos; categories map
 * gallery images to GalleryItems.
 *
 * role:
 *  - 'gallery'  → also creates a GalleryItem in `category`
 *  - 'logo' | 'award' | 'hero' → media only (used by SiteSettings/Awards/heroes)
 */

export type MediaCategory = 'exterior' | 'interior' | 'build-progress'

export type MediaMapEntry = {
  file: string
  alt: string
  role: 'gallery' | 'logo' | 'award' | 'hero'
  category?: MediaCategory
}

export const MEDIA_MAP: MediaMapEntry[] = [
  // --- Brand / trust assets (media only) ------------------------------------
  {
    file: 'Logo-Top-Desktop.png',
    alt: 'EazyBase Extensions logo — green modular-block house mark',
    role: 'logo',
  },
  {
    file: 'Northern-Enterprise-Awards.jpg',
    alt: 'Northern Enterprise Awards certificate — Best Nationwide Modular Home Construction Company 2023',
    role: 'award',
  },
  {
    file: 'HeaderSlider.jpg',
    alt: 'Bright dining space with floor-to-ceiling glazing looking onto the garden',
    role: 'hero',
  },

  // --- Finished exteriors ----------------------------------------------------
  {
    file: 'Photo-02-06-2023-09-30-58.jpg',
    alt: 'Finished flat-roof modular extension in cream render with dark-framed windows',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-17-11-2021-11-58-25.jpg',
    alt: 'Completed rear extension with full-width bifold doors opening onto the garden',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Set1_0002_IMG_5467.jpg',
    alt: 'Brick-built modular extension corner with white uPVC window and exterior wall lights',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-07-05-2023-15-45-46.jpg',
    alt: 'Brick rear extension with dark-framed glazed door on a terraced home',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-04-10-2021-08-44-41.jpg',
    alt: 'Rendered rear extension with bifold doors and downlights on a semi-detached house',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-19-02-2022-18-25-01.jpg',
    alt: 'Brick modular extension with glazed doors photographed at dusk',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-25-06-2021-16-27-38.jpg',
    alt: 'White rendered rear extension with dark glazing, homeowners looking on',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-25-06-2021-16-28-39.jpg',
    alt: 'Rear extension and loft dormer combination on a semi-detached home',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-31-12-2020-15-19-38.jpg',
    alt: 'Newly installed modular extension with dark glazing in winter snow',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-14-11-2022-14-51-28.jpg',
    alt: 'Stone cottage extension with white cottage-style windows and garden swing',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-14-11-2022-14-57-15.jpg',
    alt: 'Stone-clad extension with composite door matching the original cottage',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-02-02-2022-17-01-08.jpg',
    alt: 'Brick side extension with rooflight photographed at dusk',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-29-11-2021-13-59-11.jpg',
    alt: 'White garden room with black trim, sliding doors and exterior wall lights',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'IMG_0937-1.jpg',
    alt: 'Finished white garden room with corner glazing in a landscaped garden',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Set2_0000_IMG_0960.jpg',
    alt: 'Finished modular extension exterior with grey sliding patio doors',
    role: 'gallery',
    category: 'exterior',
  },
  {
    file: 'Photo-22-03-2020-18-18-36.jpg',
    alt: 'EazyBase installation team with homeowners outside a completed extension',
    role: 'gallery',
    category: 'exterior',
  },

  // --- Finished interiors ------------------------------------------------------
  {
    file: 'EZB-_0001_38ac2f1c-ba3f-469a-a9c8-b188f6f8d790.jpg',
    alt: 'Inside the flagship EazyBase extension — roof lantern, media wall and dining area',
    role: 'gallery',
    category: 'interior',
  },
  {
    file: 'Photo-17-11-2021-11-53-21.jpg',
    alt: 'Furnished living room inside a modular extension with roof lantern above',
    role: 'gallery',
    category: 'interior',
  },
  {
    file: 'Photo-17-11-2021-11-53-49.jpg',
    alt: 'Glazed roof lantern viewed from inside a finished extension',
    role: 'gallery',
    category: 'interior',
  },
  {
    file: 'Photo-13-11-2022-15-00-29.jpg',
    alt: 'Roof lantern flooding a newly plastered extension interior with light',
    role: 'gallery',
    category: 'interior',
  },

  // --- Build progress ---------------------------------------------------------
  {
    file: 'Set2_0006_IMG_0608.jpg',
    alt: 'Two EazyBase team members in branded jackets reviewing an extension build on site',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Set2_0015_IMG_0320.jpg',
    alt: 'Prefabricated extension module arriving on a delivery lorry for installation',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Set1_0019_IMG_5302.jpg',
    alt: 'Installation team assembling the modular frame on the prepared base',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Set1_0009_IMG_5370.jpg',
    alt: 'Installer fitting a window into the modular extension frame',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Set1_0005_IMG_5433.jpg',
    alt: 'Insulation being fitted inside a modular wall panel during factory build',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Photo-22-03-2020-18-11-03.jpg',
    alt: 'Extension shell during fit-out with glazed doors installed and floor prepared',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Photo-08-08-2021-17-31-45.jpg',
    alt: 'Freshly plastered extension interior with sliding doors before decoration',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Photo-06-01-2021-11-29-21.jpg',
    alt: 'Extension interior mid-build with roof lantern installed and walls boarded',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Photo-29-11-2021-13-06-37.jpg',
    alt: 'Flat roof with skylight on a nearly complete modular extension, viewed from above',
    role: 'gallery',
    category: 'build-progress',
  },
  {
    file: 'Set2_0010_IMG_0480.jpg',
    alt: 'Rendered garden room under construction with access ladder in place',
    role: 'gallery',
    category: 'build-progress',
  },
]
