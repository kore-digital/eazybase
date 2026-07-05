# EazyBase.co.uk — Content Migration Audit (Single Source for Rebuild)

Audit of all 25 crawled pages. Everything below is derived verbatim from the extraction JSON.

---

## 1. FULL SITEMAP (old URL slugs)

### Core pages (8)
| # | Slug | Old URL | Title tag | True H1? |
|---|------|---------|-----------|----------|
| 1 | `home` | `https://www.eazybase.co.uk/` | Affordable Modular Home Extensions \| EazyBase Prefab Extensions UK | **TWO H1s** ("Get a Modular Home Extension" + "Recent Northern Enterprise Award Winner!") |
| 2 | `about-us` | `/about-us/` | About Our Company \| Learn About The Team And Our Quality Services | **No H1** (banner is a styled `<p>`) |
| 3 | `what-we-do` | `/what-we-do/` | What We Do \| We Explain What We Can Do For Our Loyal Customers | **No H1** |
| 4 | `faq` | `/faq/` | Frequently Asked Questions \| We Show You Our Company FAQ | Yes — "Frequently Asked Questions" |
| 5 | `gallery` | `/gallery/` | Our Company Gallery \| Take A Look At Our Staff, Work & Project Images | **No H1, no headings at all** |
| 6 | `social` | `/social/` | Let's Get Social \| We Show You Our Social Platforms And Online Reviews! | Yes — "Time To Get Social!" |
| 7 | `get-a-quote` | `/get-a-quote/` | Get A Quote With Our Contact Form \| Quick Quotes 7 Days A Week | **No H1** |
| 8 | `instant-quote` | `/instant-quote/` | (identical to #7) | **DUPLICATE — see below** |

### Area hub + area pages (17)
| # | Slug | Old URL | Region | True H1? |
|---|------|---------|--------|----------|
| 9 | `areas` | `/areas/` | hub | **TWO H1s** ("Areas Served" + "Towns & Cities Served") |
| 10 | `north-west-modular-home-extensions` | `/north-west-modular-home-extensions/` | NW regional | No H1 |
| 11 | `blackpool-modular-home-extensions` | `/blackpool-modular-home-extensions/` | NW | No H1 |
| 12 | `manchester-modular-home-extensions` | `/manchester-modular-home-extensions/` | NW | No H1 |
| 13 | `preston-modular-home-extensions` | `/preston-modular-home-extensions/` | NW | No H1 |
| 14 | `warrington-modular-home-extensions` | `/warrington-modular-home-extensions/` | NW | No H1 |
| 15 | `liverpool-modular-home-extensions` | `/liverpool-modular-home-extensions/` | NW | No H1 |
| 16 | `chester-modular-home-extensions` | `/chester-modular-home-extensions/` | NW | No H1 |
| 17 | `london-modular-home-extensions` | `/london-modular-home-extensions/` | London regional | No H1 |
| 18 | `wembley-modular-home-extensions` | `/wembley-modular-home-extensions/` | London | No H1 |
| 19 | `harrow-modular-home-extensions` | `/harrow-modular-home-extensions/` | London | No H1 |
| 20 | `edgware-modular-home-extensions` | `/edgware-modular-home-extensions/` | London | No H1 |
| 21 | `watford-modular-home-extensions` | `/watford-modular-home-extensions/` | London | No H1 |
| 22 | `twickenham-modular-home-extensions` | `/twickenham-modular-home-extensions/` | London | No H1 |
| 23 | `richmond-modular-home-extensions` | `/richmond-modular-home-extensions/` | London | No H1 |
| 24 | `hayes-modular-home-extensions` | `/hayes-modular-home-extensions/` | London | No H1 |
| 25 | `enfield-modular-home-extensions` | `/enfield-modular-home-extensions/` | London | No H1 — **ORPHAN, see below** |

### Sitemap anomalies (must resolve in rebuild)
- **`/instant-quote/` is NOT a distinct page.** The crawl of `instant-quote` returned the Get A Quote document: canonical `https://www.eazybase.co.uk/get-a-quote/`, body class `page-id-117`, og:url and breadcrumb both "Get A Quote", nav marks Get A Quote as `current_page_item`. Same WPForms ID 825, same intro copy. The nav lists "Instant Quote" as a separate menu item (menu-item-454) but it redirects/serves the same content. **Rebuild action: 301 `/instant-quote/` → `/get-a-quote/`; do not migrate as a page.**
- **Blackburn has NO page.** The "Blackburn Modular Home Extensions" nav item and the "Blackburn" town link on `/areas/` both point to the **homepage** (`https://www.eazybase.co.uk/`) — the homepage doubles as the Blackburn page. This is flagged on every crawled page. Rebuild action: create a real `/blackburn-modular-home-extensions/` page (the company's Yell listing is Blackburn-based, so this is their home town — highest local-SEO priority).
- **Enfield is orphaned.** `/enfield-modular-home-extensions/` exists (WP page ID 615, published 2022-02-02) but Enfield does not appear in the `/areas/` Towns & Cities list (London list = Wembley, Harrow, Edgware, Watford, Twickenham, Richmond, Hayes) and is not mentioned in the nav inventories quoted on other pages. Rebuild action: either add it to the Areas hub and nav, or drop it.
- On `/areas/`, only **North West and London** region entries are linked; regions 2–9 and 11–13 (Southeast, Hampshire/Dorset/Wiltshire, Oxfordshire & Cotswolds, Bristol/Bath/Somerset, Devon & Cornwall, East Anglia, West Midlands/Peak District, East Midlands, Cumbria & Lakes, Yorkshire, Northeast) are **plain unlinked text** — no pages exist for them.

---

## 2. SHARED vs UNIQUE CONTENT BLOCKS

### Shared (site-wide chrome — build once)
- **Hero banner background** `uploads/2017/11/HeaderSlider.jpg` — used as the CSS background on every page except home (home uses a 3-image SB Background Slider). Banner title on every non-home page is a styled `<p>` (30px uppercase white on rgba(102,139,0,0.8) green box), never a heading.
- **Header:** logo `Logo-Top-Desktop-300x210.png` (empty alt), "Call Us On 03302 290 775" text, "Call Us" nav link `tel:03302290775`, "Get A Quote" nav item, Areas mega-menu (~14 location pages), Blackburn item mislinked to `/`.
- **Footer:** H3 "Call 0330 229 0775", logo, social links — Facebook `facebook.com/EazyBase`, Instagram `instagram.com/eazybaseextensions`, Yell listing (`yell.com/biz/eazybase-extensions-ltd-blackburn-9070825`), Google Business `g.page/eazybase-extensions-ltd`.
- **WhatsApp chat widget (QuadLayers)** on every page — account `data-phone` **447845655113** (UK) but toggle `data-phone` **12057948080** (US number, unconfigured plugin default). Greeting "How can we help you?", prefill "Please Type Your Message To EazyBase Customer Support Here:", avatar `uploads/2022/01/cartoon-person.jpg`. **Fix the number on rebuild.**
- **Anti-spam boilerplate** (do not migrate): WP Armour honeypot field `pzhvga3849` + inline jQuery appending hidden fields `SgRElGzoC` / `_IjeFi` to every POST form; `bmi-version 1.1.9` meta. Flagged as benign anti-bot but noted repeatedly given the site's malware history.
- **Yoast JSON-LD** on every page: WebSite (+SearchAction, tagline "Modular Home Extensions at an Affordable Price"), WebPage, BreadcrumbList. **Nothing else** — no LocalBusiness, no FAQPage, no Review/AggregateRating schema anywhere.

### Shared content blocks (appear on multiple pages, not chrome)
1. **"ORDER PROCESS" 8-step block** — identical on `what-we-do` + all 16 area pages (17 pages): H2 "ORDER PROCESS" (olive #808000) + eight bare centred `<h3><strong>` steps: **Discovery Call / Quotation / Survey / Design / Manufacture / Delivery / Installation / Quality Check.** Always a two-column row with photo `Set2_0006_IMG_0608-300x300.jpg` (empty alt) on the left. Rebuild as one reusable ordered-list component.
2. **Area boilerplate Template A ("NW template")** — 7 pages: north-west, blackpool, manchester, preston, warrington, liverpool, chester. Full text in §3.
3. **Area boilerplate Template B ("London template")** — 9 pages: london, wembley, harrow, edgware, watford, twickenham, richmond, hayes, enfield. Full text in §3. Contains the "brick and motor" [sic] typo on all 9.
4. **"Call 0330 229 0775" H3 CTA** — closes the intro copy on all 16 area pages (plain text, never a `tel:` link or button).
5. **Shared area-page imagery** — every area page uses the identical pair: `uploads/2019/03/EZB-_0001_38ac2f1c-ba3f-469a-a9c8-b188f6f8d790.jpg` (1200×900, alt "modular home extensions") + `Set2_0006_IMG_0608-300x300.jpg`.
6. **"design, build and install… fragment of the time" intro** — near-duplicate between home ("Hire EazyBase" section) and what-we-do (what-we-do version is longer, adds the free 3D visual and weather/site-access points; both contain the same "compete/competing with electric(al) sockets" typo family).

### Unique content (exists on exactly one page)
- **Home:** hero, "Hire EazyBase" intro, 4 use-case tabs, DHVC form 119, 5-slide process slider copy, "Prefab Extensions UK" H3 block, awards section.
- **About Us:** "About EazyBase" copy (roofing 40-year guarantee, smart-tech electricians), 8 feature badges, closing paragraphs, 8-image example-layouts grid.
- **What We Do:** extended intro (3D visual, factory build, weather point) — the only page with the "compete with electrical sockets" variant.
- **FAQ:** 8 Q&A pairs (verbatim in the JSON's faqs array — migrate as-is + add FAQPage schema).
- **Gallery:** 87 images across 4 grids (21 + 16 + 17 + 33), zero text, zero alt attributes.
- **Social:** 5 testimonials + 3 platform images + external review CTAs.
- **Get A Quote:** one intro paragraph + WPForms 825.
- **Areas:** map image + 13-region list + two town columns.
- **Area pages:** effectively nothing — see §3.

---

## 3. UNIQUE COPY PER AREA PAGE — the honest answer: ~one sentence each

Every area page = hero banner (town name) + H2 "Modular Home Extensions In {Town}" + one of two boilerplate templates with **only the town name swapped** + "Call 0330 229 0775" H3 + shared ORDER PROCESS block. The **only unique text per page** is the localized opening line and headings:

**Template A pages — unique line is:** "Affordable Prefabricated Modular Home Extensions In {Town}! Do you want to add more living space to your home or increase the value of your property?" — where {Town} = **North West, Blackpool, Manchester, Preston, Warrington, Liverpool, Chester** (town styled teal #008080).

**Template A shared body (verbatim, after the opening line):**
> "If so, we are experts at providing prefab extensions and will help you to design, create and build a modular home extension at affordable prices! Prefabricated modular home extensions are the ideal way to extend your home or garden office space at a fraction of the cost of traditional types of extensions.
>
> On average homeowners choose to extend their home to include another bedroom, a family bathroom and an additional living room. They usually extend the house because they want to increase the size of the main bedroom, add a family bathroom, or they need more space to entertain guests. You can choose to add a conservatory or an orangery or maybe would like to add an extra garden office space or a playroom.
>
> Home extensions are becoming more and more common these days. They are an inexpensive way to boost your home's value and can help it succeed in the modern housing market. But before you reach out to a professional architect or start the design process, consider a prefabricated modular home extension. We'll cover the advantages of prefabricated modular home extensions.
>
> If you are looking for the best way to expand your home, then you should consider looking at prefabricated modular home extensions. There are a lot of advantages to this method of expanding your home and prefabricated modular home extensions are changing the residential landscape in a positive way. Whether you're planning to stay for a long time and want to remodel, or you're looking to expand your home to fit your growing family, precut and assembled modular home additions are the way to go.
>
> There are so many advantages to using prefabricated modular home extensions. They are cost-effective and efficient. We know that every homeowner wants an extension to be built to a high standard and as swiftly as possible.
>
> For those that are curious about the benefits of modular extensions and wants to find out more give us a call at EazyBase today!" *(grammar error "wants" preserved in source; "EazyBase" links to homepage)*

**Template B pages — unique line is:** "Affordable Prefabricated Modular Home Extensions In {Town}! So you would like a home or garden extension at the fraction of the cost of a traditional extension?…" — where {Town} = **London, Wembley, Harrow, Edgware, Watford, Twickenham, Richmond, Hayes, Enfield.**

**Template B shared body (verbatim, after the opening line):**
> "Well, we at Eazybase can help with a prefabricated modular home extension that can be built in a fraction of the time it takes to build an old-fashioned brick and motor property extension! In our modular house extensions website, we explore the importance of modular home extensions. Modular home extensions are prefabricated which means we can build your home extension quickly and for less money.
>
> Prefabricated modular home extensions are something that a lot of people are looking into when they are looking to add to their homes. If you have ever thought about doing this, then you know that there are a lot of choices. We are going to look at some of the advantages of using prefabricated modular home extensions.
>
> A lot of people consider modular homes an eyesore. They think it's just one lone rectangular box that's easy to put up in a day. However, what a lot of people don't know is that there are a lot of advantages to using prefabricated modular home extensions. If a prefabricated modular home extension is installed, you can enjoy a lot of advantages. Some of these advantages include: The cost of prefabricated modular home extensions is significantly lower compared to the cost of traditional housing.
>
> Prefabricated modular home extensions can give you that added space in your home. They are great in the sense that they can be used to expand the living area of your home or can be used as an extra room for guests, meetings, or general dwelling needs. Prefabricated modular home extensions is not a new concept to most people, but it is still new to a lot of people. Most people are still not aware of this concept, but there are a lot of people who know about this concept. On this info page, we will discuss the different reasons why you should use prefabricated modular home extensions. We will also talk about different things that you need to consider before getting the prefabricated modular home extensions.
>
> The average new-build home is 18% smaller than a newly sold one 10 years ago – but your family is likely to be larger. If you're living in a space that's much too small for your family, the quality of your life will suffer. We can solve that problem for you. We design and build prefabricated extensions for houses, whether you're in your existing home or in a new build. We can even add a second storey if you need it."

**Verdict:** 16 area pages contain **zero genuinely unique paragraphs** — each is a town-name find-and-replace of one of two spun SEO templates. Nothing on these pages except the town name and metadata is worth preserving; write new copy per §9. Note "brick and motor" [sic → mortar] appears on all 9 Template B pages; the "18% smaller" statistic is the only substantive claim in Template B (verify before reuse). The London page is not even differentiated from its own child towns — it's Template B verbatim.

---

## 4. THE "DINING ROOMS" / KITCHENS MISTITLE — CONFIRMED, WITH A CORRECTION

**Confirmed, but the precise facts are:** it occurs on **one page only — the homepage** — not "some pages." On the home tabbed section:

- **Tab 3** — tab button "Dining Rooms", on-page H2 "Dining Rooms", copy about dining rooms. ✔ correct.
- **Tab 4** — tab button says **"Kitchens"**, copy is entirely about kitchens ("Kitchens are one of the most popular choices…"), but the **on-page H2 mistakenly reads "Dining Rooms"** — a duplicate of tab 3's heading.

So the heading "Dining Rooms" appears **twice on the homepage** (once correctly on tab 3, once incorrectly on tab 4). The mistitle itself occurs **once**, on the homepage Kitchens tab. No other page carries the use-case tabs, so it cannot occur elsewhere. **Rebuild action: retitle tab 4's heading "Kitchens".**

---

## 5. THE 5-STEP PROCESS SLIDER — VERBATIM (home page, Smart Slider 3, data-ssid=2)

1. **Concept** — "We map out your design after an in-depth consultation with the customer to ascertain the best module extension suited to your home."
2. **Design** — "After the consultation on the concept, we plan out the design of the modular house extension. The design will be fully signed off by our customers before the build to the specifications agreed."
3. **Build** — "We build your extension from the ground up to the specifications of our architects and use only the best materials available. We will build everything, from the foundations to the brickwork and the roof-line."
4. **Interior** — "We even carry out all the interior work like plastering, doors, flooring, ceilings, electrics and much more! EazyBase is the one-stop-shop for modular home extensions across the country."
5. **Completion** — "Before the final completion finish date, we will carry out a full snagging checklist. This procedure is when one of our more experienced engineers, checks for any imperfections so we can rectify them before handed over."

Slide backgrounds: Depositphotos stock images `163085550 / 163085382 / 163085580 / 162982142 / 163085892` (check stock licensing before reuse). Note this 5-step **Concept→Completion** slider (home) is a *different* process from the 8-step **Discovery Call→Quality Check** ORDER PROCESS list (what-we-do + area pages) — the rebuild should reconcile these into one canonical process.

---

## 6. THE FOUR USE-CASES — VERBATIM (home page tabs)

**Kids Playrooms** (tab label "Playrooms"):
> "Many parents have used an EazyBase modular extension to create a stunning kids playroom, that not only provides a great environment for the imagination to flourish but also keeps the noise and mess contained in one room! Ask one of our team for a free quotation today, by filling out our quote request form below and we will send one of our professional, friendly surveyors out to meet with you and discuss the wide range of options available."

**Home Office:**
> "EazyBase modular extensions are perfect for home offices or extra workspaces! We design, build and install prefabricated modular extensions to suit any need for more space in your home, including for work and also at very affordable prices. If you are looking for a prefab extension in the UK, then EazyBase is the reliable company to call… Get in touch today to realise your dreams with a totally free and no-obligation quotation for a home office modular extension!"

**Dining Rooms:**
> "There are many varying uses within your home when installing a modular extension to give you more space and a better architectural design. One of those uses with the extra space given is a dining room. Imagine being given a totally new space to decorate as you wish and model from scratch! Dining rooms are the perfect choice for a prefab extension and will transform your living and eating space for a fraction of the normal cost associated with traditional extensions."

**Kitchens** (H2 mistitled "Dining Rooms" — see §4):
> "Kitchens are one of the most popular choices for an EazyBase modular extension in UK homes. That's because it works out much better than your more conventional kitchen extension for both cost and ease of build. With a prefabricated modular home extension, there are so many different designs and types of structures to build with. The choice is endless and gives you that freedom of design that more orthodox kitchen extensions do not give you!"

(A fifth tab, "Get A Quote", holds the DHVC form — see §8.)

---

## 7. TRUST SIGNALS INVENTORY

**Awards (home page only):**
- **Northern Enterprise Awards — "Best Nationwide Modular Home Construction Company 2023"** — second H1 "Recent Northern Enterprise Award Winner!" + certificate image `uploads/2023/12/Northern-Enterprise-Awards.jpg` (640×449).
- "More Awards & Accreditations" H2 — badge image only, `uploads/2024/04/Attachment-1-300x300.png` (full 1080×1080; also the site's og:image, alt "modular home company"). The specific accreditations are not named in text — get the list from the client for the rebuild.

**Testimonials (Social page only — 5 total, verbatim):**
1. **Google** — "What a team!" — Adam Sanders: "Brilliant results and so quick. We couldn't be happier with our build. I highly recommend Amir, Sol, Jess and the Eazybase team!"
2. **Yell** — "Outstanding" — ShahinaY: "I couldn't believe that I got an extension built in 6 days. Absolutely amazing service. Good clean job.very professional." *(typo verbatim)*
3. **Facebook** — "Fast And Reliable" — Danni: "Great quality… I can not believe how quickly the guys at Eazybase put the extension up… Thank you very much!"
4. **Facebook** — "Best Work" — Salim Patel: "I've had an extension built with Eazybase Extensions, the best building work I've ever invested in."
5. **Facebook** — "Recommended" — Nielsen: "Had an extension, doors including a skylight by EazyBase. It was completed in 7 days to a very high standard."

**Review-platform links (Social page CTAs, all external, new tab):** Google Maps review page (EAZYBASE EXTENSIONS LTD); `yell.com/biz/eazybase-extensions-ltd-blackburn-9070825/#reviews`; `facebook.com/EazyBase/reviews` (this button duplicated 3×). Platform logo images: `google.jpg`, `Yell.png`, `facebook.png` (2021/10, all empty alt).

**Other trust claims scattered in copy:** About Us — 8 badge H2s (Professional / Free Surveys / Experienced / Highly Trained / Fully Insured / Health & Safety / Manufacturers / Fully Certified); "up to a 40 year guarantee" on roofing; "decades of experience"; "fully insured / certified staff". FAQ — nationwide coverage, 4–8 week manufacture. Footer — Facebook, Instagram, Yell, Google Business profiles.

**Missing on rebuild:** no Review/AggregateRating schema, no FAQPage schema, no LocalBusiness schema anywhere — add all three. No testimonials appear on the homepage or area pages — surface them there.

---

## 8. FORM FIELD LISTS

### A. `/get-a-quote/` — WPForms Lite v1.8.0.1, form ID 825 (AJAX POST to `/get-a-quote/`)
Intro: "Please complete the form below to give us a few brief details about your project. Once submitted, one of our team will be in touch soon to discuss your project further and provide you with an accurate quote."

| # | Label | Type | Required | Name attr |
|---|-------|------|----------|-----------|
| 1 | Name (sublabels First / Last) | 2× text | Yes | `wpforms[fields][0][first]` / `[last]` |
| 2 | Email | email | Yes | `wpforms[fields][1]` |
| 3 | Phone Number | **number** (pattern `\d*`) | Yes | `wpforms[fields][3]` |
| 4 | Your Postcode | text | Yes | `wpforms[fields][5]` |
| 5 | Your Message (Get a quote, estimate or advice) | textarea | Yes | `wpforms[fields][2]` |

Submit: "Submit" (busy text "Sending..."). Hidden: `wpforms[id]=825`, `wpforms[author]=1`, `wpforms[post_id]=117`. No selects/radios/checkboxes/uploads. **Bug to fix: Phone is `type=number` — strips leading zeros; use `type=tel`.**

### B. `/instant-quote/` — **identical form (same WPForms ID 825)** because the URL serves the Get A Quote page. No separate form exists; despite the name there is **no calculator/configurator** anywhere on the site (WP_Estimation_Form JS loads site-wide but renders nothing). Dedupe.

### C. Home page "Get A Quote" tab — DHVC Form #119 (AJAX to admin-ajax.php, `action=dhvc_form_ajax`)
| # | Field | Type | Required | Placeholder |
|---|-------|------|----------|-------------|
| 1 | first_name | text | Yes | "First Name" |
| 2 | surname | text | Yes | "Surname" |
| 3 | email | email | Yes | "Your Email Address" |
| 4 | phone | text (number-validated, maxlength 12) | Yes | "Phone Number" |
| 5 | house_street | text | Yes | "House No. & Street" |
| 6 | address_2 | text | No | "Address Line 2" |
| 7 | town_city | text | Yes | "Town or City" |
| 8 | postcode | text | Yes | "Postcode" |
| 9 | comments | textarea | Yes | "Please provide us with some brief details of your project" |
| 10 | Google reCAPTCHA v2 | — | Yes | site key `6Lds-j8UAAAAALBvs6vWOVzdKP7bmvfTL2X0lBj5` |

Submit: "Send Your Quote Request". Hidden: `_dhvc_form_id=119`, `_dhvc_form_post_id=5`, nonce. Placeholder-only labels (no `<label>` elements — accessibility fix needed). **Rebuild decision: consolidate the two different quote forms (5-field WPForms vs 10-field DHVC) into one canonical form.**

---

## 9. THIN/DUPLICATE PAGES + NEW UNIQUE-CONTENT ANGLES PER AREA PAGE

### Thin/duplicate register
| Page | Problem |
|------|---------|
| `instant-quote` | 100% duplicate of get-a-quote (same document, same title/meta). **Kill + 301.** |
| All 16 area pages | Two spun templates, town-name-swap only; identical images; identical titles/metas except town; ~2–3 min "reading time" of boilerplate. Duplicate-content risk across 7 (Template A) and 9 (Template B) URLs respectively. |
| `areas` | No paragraph copy at all — two heading lists + a map. Two H1s. 11 of 13 regions unlinked. |
| `get-a-quote` | One paragraph + form; no H1. Acceptable if enriched. |
| `gallery` | Zero text, zero headings, 87 empty-alt images. |
| All area-page meta descriptions | Identical sentence with town swapped ("Do you want to add more living space…") — including on Template B pages whose copy doesn't match it. |

### New unique content angle per area page (local landmarks / housing stock / planning context)

**North West (regional hub):** position as EazyBase's home region (HQ/factory is Blackburn-side — Yell listing confirms). Angle: factory proximity = fastest install windows in the NW; link down to the 7 town pages; NW terraced/semi housing stock overview; showcase real NW gallery projects (Set1/Set2 shoots).

**Blackburn (NEW page — currently the homepage):** home-town page. Angles: Victorian terraces and stone-built semis of Blackburn & Darwen; rear-yard infill and single-storey rear extensions on terraces; Blackburn with Darwen Council permitted development guidance; proximity to the factory = shortest lead time; landmarks: Corporation Park, Ewood Park, Darwen Tower; local case studies from the 2023/06 dated site photos.

**Blackpool:** coastal weather angle — factory off-site build avoids the inclement-weather delays that plague seafront builds; salt-air-resistant render/cladding finishes; 1930s semis of Bispham/Marton and guest-house conversions off the Promenade; Fylde coast catchment (Lytham St Annes, Cleveleys, Fleetwood).

**Manchester:** red-brick terraces (Levenshulme, Chorlton, Didsbury) and garden-office demand from hybrid workers; conservation areas (Didsbury, Victoria Park) vs permitted development; rising £/sqft making extension-vs-move the key argument; landmarks/catchment: Trafford, Salford, Stockport.

**Preston:** commuter-belt family homes (Fulwood, Penwortham, Longton); newer estates with generous plots suited to modular rear extensions; Preston City Council PD notes; M6/M65 access = quick installs from the factory.

**Warrington:** new-town housing stock (Birchwood, Great Sankey estates) — regular plots ideal for standardised modules; Manchester–Liverpool commuter growth; Warrington Borough Council planning context; garden-room offices for tech/logistics workers.

**Liverpool:** Victorian terraces (Wavertree, Anfield) vs suburban semis (Childwall, Woolton, Crosby); conservation areas around Sefton Park/Georgian Quarter needing pre-planning advice; side-return and rear extension patterns on terraces.

**Chester:** the sensitive-planning page — city conservation area and listed buildings mean modular garden rooms/outbuildings under PD are the low-friction route; Handbridge, Hoole, Upton stock; Cheshire West & Chester Council context; affluent detached homes = orangery/second-storey upsell.

**London (regional hub):** the space-crisis page — build out the "18% smaller new-builds" statistic properly (with a source); London £/sqft makes a modular extension the cheapest sqft they'll ever buy; side-return terraces, loft-vs-rear comparisons, London PD nuances (Article 4 directions common); hub linking to the 7–8 town pages.

**Wembley:** 1930s Metroland semis around Wembley Park/Sudbury — classic rear-extension stock; multigenerational households needing extra bedrooms/annexe space; Brent Council PD/Article 4 notes; landmark hook: Wembley Stadium regeneration raising values.

**Harrow:** Metroland semis and Harrow-on-the-Hill conservation area contrast; large family homes in Pinner/Stanmore; Harrow Council householder-extension guidance; school-catchment families extending instead of moving.

**Edgware:** 1930s suburban semis along the Northern line; loft + rear-extension combos; Barnet/Harrow boundary planning quirks; growing multigenerational household demand.

**Watford:** just-outside-London value angle (Herts pricing vs London); terraces near the Junction vs Cassiobury's larger detacheds; Watford Borough Council PD; commuter garden offices (Euston 20 min).

**Twickenham:** rugby-town Victorian/Edwardian terraces and riverside semis; St Margarets/Strawberry Hill conservation areas — PD caveats; Richmond borough's strict design expectations; kitchen-diner rear extensions as the dominant local project.

**Richmond:** premium borough angle — high-spec finishes, Richmond Park/Kew conservation context, strictest planning in the set (flag Article 4 and pre-apps); period terraces and townhouses; garden studios as the PD-friendly product.

**Hayes:** Heathrow-corridor growth area; interwar terraces/semis in Hayes Town/Yeading; Hillingdon Council PD; first-time-buyer families extending starter homes; Crossrail/Elizabeth line value uplift.

**Enfield (if kept):** outer-London value angle; Edwardian terraces (Palmers Green side) vs post-war semis; Enfield Council PD and Green Belt fringe considerations; add to Areas hub + nav, or 301 to the London hub.

**Every rebuilt area page should also get:** unique title/meta (not the shared sentence), a real `<h1>`, town-specific project photos with descriptive alts (mine the 87 gallery images), 1–2 relevant testimonials, LocalBusiness/Service schema with areaServed, a linked `tel:` CTA button (not a bare H3), and the ORDER PROCESS as a proper `<ol>`.

---

## Cross-site defect register (fix during rebuild — every item sourced from the crawl)

1. **Headings:** 2 pages with duplicate H1s (home, areas); 21 pages with **no H1** (banner titles are styled `<p>`); About Us uses 8 empty H2 badges; ORDER PROCESS abuses 8 H3s as a list on 17 pages; "Call 0330 229 0775" is an H3 CTA on 16 pages.
2. **Typos:** home — "Your extension will be **competing** with electric sockets" (→ complete); what-we-do — "will be **compete** with electrical sockets"; 9× Template B — "**brick and motor**" (→ mortar); Template A — "For those that are curious … and **wants**"; Yell review "job.very".
3. **Phone formats:** header "03302 290 775" / `tel:03302290775` vs body/footer "0330 229 0775" — standardise.
4. **WhatsApp widget:** toggle number 12057948080 (US) vs account 447845655113 — every page.
5. **Alt text:** empty on essentially all content images (87 gallery + 8 about grid + hero sliders + process photos); only `EZB-_0001…jpg` ("modular home extensions") and the awards badge have alts.
6. **Schema gaps:** no FAQPage (on an FAQ page), no LocalBusiness, no Review schema.
7. **Gallery grid 4** lightboxes to -1024x768 crops, not originals (except `Photo-17-11-2021-11-58-25`); grid 3 missing `4.jpg`; relink originals on migration.
8. **Layout-dependent copy:** About Us "click on the images to the right" — reword or preserve two-column layout.
9. **Legacy inline colors** (#99ccff/#ccffcc hero text, teal #008080 town names, olive #808000 accents) vs brand green **#96c11f** — normalise to brand.
10. **Stock-photo licensing:** 5 Depositphotos slider images — verify license before reuse.
11. **Nav:** Blackburn item → homepage; Instant Quote item → duplicate page; "Get A Quote" duplicated in three menus.
12. **Reconcile the two process models** (5-step Concept…Completion vs 8-step Discovery Call…Quality Check) into one.
13. **Two different quote forms** (WPForms 825 vs DHVC 119) with different field sets — consolidate; change phone field to `type=tel`; add real `<label>`s.
14. **Verify the "18% smaller new-build" and "40 year guarantee" claims** before carrying them over.