# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [3.0.1] - 2026-09-24

### Fixed

- **Live preview produced no live updates on articles.** The SDK was installed
  and draft mode worked, but `ContentfulLivePreviewProvider` existed only
  inside the page-model preview component, so article, listing, topic and
  search routes had no subscription to the editor. The provider now wraps the
  app in draft mode, and the article's own fields (title, summary, body) render
  through a client island that calls `useContentfulLiveUpdates`, while
  breadcrumbs, child articles, related and the TOC stay server-rendered.
  Regression introduced when the article route moved from `[slug]` to
  `[...slug]` and its preview client was deleted with the old directory
- Component preview URLs pointed at `/api/draft/articles?id=...`, which expects
  a slug and rejected every component. They now use `/api/draft/entries`, and
  the config covers the current 23-type model instead of nine deleted types
- `/api/draft/entries` echoed the configured preview secret in its 401 body
- Removed the now-nested provider from `page-preview-client` so the SDK is not
  initialised twice

## [3.0.0] - 2026-09-24

Demo corpus rebuilt around a ZoomInfo knowledge-center use case.

### Added

- New org taxonomy scheme `cs-zoominfo-products` with 10 product areas
  (Search & Filters, Contacts & Companies, Intent, Copilot, Engage, Enrich,
  Integrations, Chrome Extension, API & Webhooks, Admin & Credits), bound to
  the `article` content type
- 20 articles across all 10 areas and 5 record types, each embedding the
  reusable components: info panels, accordions, card collections, code
  snippets, a video embed, a diagram, and a PDF download
- ZoomInfo logo, header/footer navigation, and a "Browse topics" dropdown
- `commands/seed-zoominfo-taxonomy.py` and `commands/seed-zoominfo-demo.py`,
  with their media in `commands/assets/`. Both are idempotent

### Fixed

- The external-link icon was driven purely by the reference type, so an
  `externalLink` holding a same-origin path (`/topics/intent`) showed an
  "opens in new window" icon. It is now decided by whether the URL is
  absolute — "external" should mean "leaves this site"

### Notes

- The intent diagram ships as PNG, not SVG: Next's image optimizer rejects SVG
  unless `dangerouslyAllowSVG` is set, which is not worth loosening for every
  asset in the space
- Search still points at `KA_Brightline_KB`, whose corpus is unrelated to this
  content, so every hit is unresolvable. See the note in the handover

## [2.5.0] - 2026-09-23

### Added

- Pagination on `/articles` and `/topics/[slug]`, 15 per page. Server-rendered
  links rather than a click handler: these are Server Components, and a crawler
  following the site can reach every article this way. Active filters are
  carried across page links, and a `1-15 of 100` range is shown

### Changed

- `ArticleListingConfig.ArticlesLimit` 12 -> 15

### Fixed

- An out-of-range page (`?page=8` of 7) rendered an empty list — an endless
  supply of crawlable empty pages. It now 404s, while page 1 of a genuinely
  empty filter still renders its "no articles" message

## [2.4.1] - 2026-09-23

### Changed

- `/articles` is now search, filters and the listing only. "Browse by product"
  tiles were removed from it — category browse belongs on the homepage, and
  `/articles` is where you narrow rather than discover. The hero subtitle was
  reworded to match, since it still pointed at tiles that are no longer there

## [2.4.0] - 2026-09-23

Homepage is now the knowledge-base landing, and categories have real pages.

### Added

- `/topics/[slug]` — category listing per taxonomy concept. Slug is derived
  from the concept label (`/topics/partner-api`), with the raw concept id also
  accepted. Includes breadcrumbs, article-type filter, child-concept chips, and
  404s on an unknown topic
- `KnowledgeLanding` — the shared search-then-browse landing, used by the
  homepage and by `/articles`
- Category pages added to `sitemap.xml`, so they are in the search index's
  crawl scope alongside articles

### Changed

- The homepage renders the knowledge-base landing by default. Authoring a
  `page` with `specialtyPage: Homepage` overrides it and renders that page's
  body instead — the default is a fallback, not something to delete around
- "Browse by product" tiles link to `/topics/{slug}` instead of a filtered
  `/articles` query

### Fixed

- `RootLayout` typed `params` as a plain object; Next 15 passes a promise, and
  a clean build failed on it
- Concept definitions are migration provenance ("Salesforce Knowledge data
  category Products > Invoices"), which was rendering on the category page and,
  worse, as its meta description. Only authored-looking definitions show now

## [2.3.0] - 2026-09-23

Real Knowledge content, and search filterable by taxonomy topic.

### Added

- `npm run import-knowledge` — imports published Salesforce Knowledge articles
  into Contentful. Maps `UrlName` -> `slug`, record type -> `recordType`,
  data-category selections -> taxonomy concepts, and HTML bodies -> rich text.
  Idempotent on `sf-<KnowledgeArticleId>`; `--dry` previews, `--limit N` samples
- Topic filter on the search page: facets are the taxonomy concepts carried by
  the articles the search actually returned, counted before filtering so the
  list does not collapse to the selected topic
- `News` added to the `article.recordType` enum — 31 of the 100 Salesforce
  articles are News, and mapping them to another value would misdescribe them

### Changed

- Search hits resolve to Contentful articles by **slug or title**. The index is
  built from Knowledge records whose ids were archived during the migration
  swap, so those ids no longer resolve in Salesforce; title matches 99 of 100
  articles today, and slug takes over once the sitemap-built index lands

### Fixed

- `SEARCH_CONCEPTS_PARAM` was exported from a `"use client"` module, so the
  Server Component received a client reference instead of the string and the
  topic filter silently never applied

### Notes

- 99 articles imported; `resetting-your-password` was skipped because the
  hand-authored demo article already owns that slug and is the richer page
- Browse and search topic counts are capped at `ArticleListingConfig.ArticlesLimit`
  (12) — there is no pagination UI yet, so Partner API shows 12 of its 18

## [2.2.0] - 2026-09-23

Knowledge search now runs on the Salesforce Data 360 Vector Database instead of
Contentful's `_contains` filters.

### Added

- `@aces/salesforce` client — server-only Data 360 vector search with cached
  client-credentials tokens; chunks are collapsed to one hit per source article
- `GET /api/search` — thin HTTP wrapper for client components; server
  components call `searchKnowledgeIndex` directly with no HTTP hop
- `searchKnowledge()` — joins index ranking to Contentful content by slug, so
  Salesforce ranks and Contentful remains the source of truth
- `sitemap.xml` generated from Contentful, and `robots.txt` — the sitemap *is*
  the index scope for the Web Content (Sitemap) connector
- `SF_DOMAIN`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, `SF_SEARCH_INDEX` in
  `.env.example`

### Removed

- Contentful full-text search: `search-queries.tsx`, the `ArticleSearchQuery`,
  `searchArticles()`, `SearchableContentTypes`, the content-type tabs, and the
  page/article split in the search UI

### Fixed

- Locale middleware rewrote `/sitemap.xml` to `/en-US/sitemap.xml`, so the
  canonical path 404'd — which would have silently produced an empty index

### Notes

- Search degrades explicitly: with no Salesforce credentials the page says so
  rather than rendering an empty result set
- The current index (`KA_Brightline_KB`) is built from Salesforce Knowledge and
  returns record ids, not URLs, so hits cannot resolve to a slug. Results still
  render from the indexed chunk, marked "Not published on this site"

## [2.1.0] - 2026-09-23

Visual overhaul: the accelerator now reads as a help center rather than a
marketing site.

### Changed

- **Typography**: Gotham/Beausite local faces replaced with Inter. The scale
  was rebuilt from marketing sizes (h1 100px, h2 80px) to help-center sizes
  (h1 32px, h2 22px, body 15-16px at 1.6-1.7 leading)
- **Palette**: Zendesk Garden-style ink (#2f3941), greys and blue (#1f73b7);
  explicit `warning` and `info` palettes so callouts stop inheriting MUI's
  saturated orange
- Cards are defined by a hairline border rather than a drop shadow
- Buttons default to a 4px rectangle instead of a pill, with 1px borders
- Header navigation is sentence case, not uppercase tracked
- Article listings render as scannable rows rather than a grid of cards
- Default search content type is Articles

### Added

- Search-led hero on the Knowledge Base landing page, with popular searches
- "Browse by product" concept tiles, linking into the same filtered listing
  the sidebar facets produce
- Sticky site header and a visible keyboard focus ring

### Fixed

- Ordered lists in article bodies rendered without numbers: the stylesheet set
  `list-style: none` on both list types but only drew a marker for `ul`
- In-body links rendered black; they now use the accent colour
- Code snippets rendered through `dangerouslySetInnerHTML`, which collapsed
  newlines and would execute pasted markup — now escaped text in a `<pre>`
- Filter checkboxes drew a border on the Checkbox root (which wraps the icon),
  so every box appeared as an empty square inside another empty square with
  the check never visible
- Video embeds are a responsive 16:9 frame instead of a fixed iframe size
- Embedded and card images are height-capped so an oversized asset cannot
  dominate the page
- Removed a `theme -> ui -> theme` import cycle from the inputs customizations

## [2.0.0] - 2026-09-23

Reworked from the ACES web accelerator into a Salesforce Service Cloud
Knowledge Base accelerator. Frontend now targets the 23-type content model.

### Added

- Taxonomy data layer (`@aces/contentful` → `lib/taxonomy/`)
  - Concept dictionary from the CDA REST taxonomy endpoints, cached under the
    `taxonomy` tag; GraphQL only returns concept ids
  - Hierarchy-aware filtering via the `descendants` concepts filter
  - `KnowledgeTaxonomySchemes` config — one facet group per scheme
- Knowledge Base Center (`@aces/features` → `lib/knowledge/`)
  - Article card / list, taxonomy facet sidebar, record-type filter
  - Breadcrumbs, table of contents, child articles
  - Thumbs up/down feedback widget
- Nested article routing at `/articles/{parent}/{child}` with canonical
  redirects and `parentArticle` chain validation
- `POST /api/article-feedback` — CMA write + auto-publish, with 409 retry
- `cf-collection`, `cf-info-panel`, `cf-external-link` components
- Full-text article search including `bodyCopy_contains`
- Seed content: one "Resetting your password" How-To article exercising every
  reusable body component (info panel, image, code snippet, video embed,
  accordions, collection of cards) plus a PDF download offered as both an
  inline hyperlink and a button, and an external link inside the info panel

### Changed

- `link` / `externalLink` are separate content types; the external-link icon is
  derived from the reference's `__typename` rather than an authored boolean
- Channel visibility enforced in queries, not at render
- Copy recast for a support context

### Removed

- Marketing components: testimonials, team listing, logo farm, feature
  highlight, forms (Pardot), grid, header, hero, callout, list item, button list
- `categories`, `teamMember`, `testimonial` queries and the socials footer

### Fixed

- Broke `features → cf → utils → features` import cycle that crashed module
  init once resolvers used module-level component maps
- Aliased `ExternalLink.link` → `url`; it collided with `Link.link`
- Search excerpts mapped `seo.metaDescription`; the field is `description`
- Navigation services now degrade instead of crashing when no Apps entry matches
- Added missing `@mui/system` and `@types/react-transition-group` deps
- Rich-text headings now carry `slugify`d anchor ids, so the table of contents
  actually links to them
- Card, collection and info panel split into server and client renderers;
  inline entries embedded in their rich text were previously invisible to SSR
- Article feedback retries on 429 as well as 409, with jittered backoff — a
  dropped rate-limit response silently lost the vote
- Default search content type is Articles, not Pages

## [1.0.0] - 2025-02-24

Production Release

### Added

- App Shell
  - Drawers
    - Globale Navigations Drawer
    - Globale Search Drawer
  - Footer
  - Header
  - Logo
  - Socials
- Articles
  - Article Cards
  - Article Listing
  - Related Articles
- Draft Mode
- Forms
  - HubSpot Forms
  - Pardot Forms
- Metadata
- Navigations
  - Footer Navigation
  - Main Navigation
  - Menus
    - 2 Level
    - Dropdown Menu
    - Menu Link
  - Privacy Navigation
  - Sedcondary Navigation
- Page Body
  - 15 CF Components
- Page Hero
  - 1 CF Page Hero

## [x.x.x] - yyyy-mm-dd

Description of release.

### Added

### Changed

### Fixed
