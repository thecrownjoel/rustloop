# RustLoop — Current Progress

**Date:** 2026-05-16
**Session time:** ~12:00 AM - 3:47 AM EST

## What Was Built

### Platform
- **CMS:** Emdash (Cloudflare's new WordPress successor) — SSR on Cloudflare Workers
- **Database:** Cloudflare D1 (`rustloop-db`)
- **Media storage:** Cloudflare R2 (`rustloop-media`)
- **Sessions:** Cloudflare KV (auto-provisioned)
- **Domain:** rustloop.ai (Worker routes, DNS via Cloudflare)
- **Repo:** https://github.com/thecrownjoel/rustloop
- **Auto-deploy:** GitHub Actions on push to `main`

### Admin Panel
- Accessible at rustloop.ai/admin (redirects to /_emdash/admin)
- Passkey-first auth with OAuth (GitHub, Google) fallback
- Roles: Admin, Editor, Author, Contributor, Subscriber
- Community signups supported (domain-filtered)
- **NOTE:** Admin account has NOT been created yet — visit rustloop.ai/admin to set up

### Brand
- **Background:** #111111
- **Body text:** #ffbd39 (gold)
- **Headlines/links:** #f5793b (flame)
- **Logo:** /public/rustloop-logo.png (128px in header, 40px in footer)

### Homepage (rustloop.ai)
1. **Header:** Large RustLoop logo (128px), nav (About, Blog, Events), Join button
2. **Hero:** "Youngstown · Cleveland · Pittsburgh" subtitle, two-color headline, two CTAs
3. **What is RustLoop?** — Steel/cities body copy + mission statement (two paragraphs)
4. **Who is RustLoop for?** — Long list of professions ending with "...shaped by Artificial Intelligence!"
5. **Three Cities, One Mission** — 6 feature cards with ember glow hover
6. **Common Questions** — FAQ accordion (4 items)
7. **Sponsors** section — "Sponsors" heading with 45Press logo (linked to 45press.com, target _blank)
8. **Footer** — Logo, tagline, Community/Cities/Connect columns, "Brought to you by 45Press"
9. **Molten steel effect** — Canvas overlay with glowing orange drops falling from top
10. **Scroll reveal animations** — Hero fades up, feature cards stagger in, FAQ slides in

### About Page (rustloop.ai/about)
- Same content sections as homepage: hero, What is RustLoop, Who is RustLoop for, Three Cities

### SEO
- **Title format:** "RustLoop - Youngstown, Cleveland, Pittsburgh AI Collective"
- **sitemap.xml** at rustloop.ai/sitemap.xml (dynamic, lists all pages)
- **robots.txt** at rustloop.ai/robots.txt (points to sitemap)
- OpenGraph and structured data via Emdash's EmDashHead component

### Other Pages
- /events — placeholder (hero only, "Upcoming Meetups")
- /contact — from Emdash template
- /pricing — from Emdash template (may want to remove)
- /signup — Emdash user registration
- /blog — Emdash blog (empty, needs posts)
- /admin — redirects to /_emdash/admin

## Known Issues

### BLOCKER: 45Press sponsor logo not rendering
- The "Sponsors" section heading appears but the logo does not display
- Attempted approaches that all failed:
  1. `<img src="/sponsors/45press.png">` — low quality PNG with white bg, didn't show
  2. `<img src="/sponsors/45press.svg">` — SVG served (200 OK) but invisible on page
  3. `<img src="/sponsors/45p-logo.svg">` — same issue, SVG serves but doesn't render
  4. Inline SVG with extracted paths and `fill="#ffbd39"` — HTML is in the DOM (verified via curl) but still not visible in browser
  5. Added `!important` on visibility, opacity, display, height, width — no change
- The SVG paths are confirmed in the live HTML source
- The `fill="#ffbd39"` (gold) should be visible on `#111111` background
- **Suspected cause:** Astro's scoped CSS `data-astro-cid` attributes or base layer CSS cascade may be hiding/collapsing the SVG element. Needs browser DevTools inspection to determine which CSS rule is responsible.
- **File:** `src/layouts/Base.astro` (sponsors section around line 99)
- **CSS:** `src/styles/theme.css` (`.sponsor-logo` rules)

## Cloudflare Credentials Used
- **Account:** Joel@45press.com (ID: ece401f47370ecab76cbc85bf2a7054c)
- **Zone:** rustloop.ai (ID: 1c33402086210619ecb9cac2aa284c51)
- **D1 Database:** rustloop-db (ID: 16c3ad9a-0893-48c2-b5ff-e103bbe53728)
- **R2 Bucket:** rustloop-media
- **KV Namespace:** SESSION (auto-provisioned)
- **API Token:** rustloop token (scoped: Pages, Workers, D1, R2, KV, DNS)
- **Global API Key** was used for deploy (token had permission gaps)
- **IMPORTANT:** API token was exposed in conversation — should be rotated
- GitHub secrets set: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, EMDASH_ENCRYPTION_KEY

## Next Steps
1. Fix the 45Press sponsor logo (inspect with browser DevTools)
2. Create admin account at rustloop.ai/admin
3. Remove /pricing and /contact pages (not needed for community site)
4. Add blog posts through admin panel
5. Add real event listings
6. Write About page copy (currently has homepage content duplicated)
7. Set up email signup integration
8. Rotate the Cloudflare API token
9. Consider adding blog and events pages with proper Emdash collection templates
