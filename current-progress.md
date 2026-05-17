# RustLoop — Current Progress

---

## Session 2 — 2026-05-17 (~02:00 - 03:40 AM EDT)

### What Was Done

**Blog system (live):**
- Built `src/pages/blog/index.astro` — server-rendered list of published posts (`getEmDashCollection("posts", { status: "published" })`), sorted by `publishedAt` desc
- Built `src/pages/blog/[slug].astro` — server-rendered post detail with PortableText body, byline, date
- Added byline rendering on both pages — reads `post.data.byline.displayName` (EmDash auto-populates from post author)
- Commits: `8463500`, `41f115d`

**Catch-all admin pages (live):**
- Built `src/pages/[slug].astro` — auto-renders any `pages` collection entry by slug (e.g. `/team`, future admin pages)
- Added prose typography (paragraphs, h2/h3, strong, links, lists, blockquotes, code) styled with site palette
- Empty `<p></p>` lines preserved as visual spacers (editors use them to space sections like team bios)
- Commits: `1927d9e`, `32dbc0f`, `f4527bd`

**Sponsor logo (live):**
- Replaced the invisible inline-SVG sponsor with `<img src="/sponsors/45press-gold.svg">` — clean standalone SVG with `style="fill:#ffbd39"` at root
- Bypassed whatever Astro scoping was hiding the inline version
- Commit: `8463500`

**Nav header sizing (live):**
- Was: 128px logo with `-24px` vertical margin popping out of an under-sized header (visible mismatch)
- Now: header has `0.5rem` top/bottom padding, logo margin removed — logo sits cleanly inside ~144px-tall nav
- Commit: `61c0e82`

**Sponsors → CMS-managed (live, pending admin setup):**
- First tried: a `sponsors` content collection (required user to create schema in admin)
- Pivoted to: `getWidgetArea("sponsors")` — uses EmDash's built-in widget system. Each Content widget = one sponsor. Editor inserts image from media library and wraps with link.
- Hardcoded 45Press fallback kept for empty/missing widget area
- **User must do:** create widget area named `sponsors` at `/_emdash/admin/widgets`, add Content widgets per sponsor with linked images from media library
- Commits: `08cd8e6`, `2dd27ca`, `1af7485`

**Cloudflare cache auto-purge plugin (deployed, awaiting token):**
- Native EmDash plugin: `src/plugins/cf-cache-purge/`
- Hooks: `content:afterSave`, `content:afterPublish`, `content:afterUnpublish`, `content:afterDelete`
- Each calls `POST https://api.cloudflare.com/client/v4/zones/{zoneId}/purge_cache` with `{ purge_everything: true }`
- Reads `CF_PURGE_TOKEN` from env (Worker secret), `CF_ZONE_ID` from `wrangler.jsonc` vars (already set: `1c33402086210619ecb9cac2aa284c51`)
- Falls back to KV settings (`settings:apiToken`, `settings:zoneId`) as override
- Failures logged and swallowed — never blocks a content save
- **User must do:** Create scoped CF token (`Zone.Cache Purge` on rustloop.ai) → `wrangler secret put CF_PURGE_TOKEN`
- Capabilities: `network:request`, `allowedHosts: ["api.cloudflare.com"]`
- Initial build failed deploy (`createPlugin` not exported); fixed by matching marketing-blocks export pattern
- Commits: `78beb78`, `ae0b8f9`, `6e159d2`

**Other:**
- Updated seed `Contact` menu link to `mailto:rustloop@45press.com` (live menu in D1 still has old `hello@rustloop.ai`; user must update in admin)
- Added `Bash(git push origin main)` to `.claude/settings.local.json` so Claude can deploy directly
- Added contact-email memory at `~/.claude/projects/-Users-joel-Projects-rustloop/memory/project_contact_email.md`

### Key Decisions / Reversals

- **Admin branding:** Cannot swap the EmDash logo on `/_emdash/admin/*` without forking — no built-in hook. Recommended filing upstream feature request; skipped for now.
- **Sponsors implementation:** First built as collection (required schema UI navigation user couldn't find), then tried building custom React plugin admin page (bundling for inline plugins is non-trivial), then proposed REST API approach with admin token, finally landed on widget areas (built-in, no schema needed).

### Pending User Actions

| Action | Where |
| --- | --- |
| Create scoped CF cache-purge token, run `wrangler secret put CF_PURGE_TOKEN` | CF dashboard + local terminal |
| Rotate the exposed CF API token from Session 1 | CF dashboard |
| Fix blog post: full article body is in **Title** field, move to **Content**, set a proper title | Admin → Posts |
| Set byline display name (otherwise "By..." shows blank/email) | Admin → People/Bylines |
| Add content to `/team` page (currently empty) | Admin → Pages → Team |
| Create `sponsors` widget area + add Content widgets per sponsor | Admin → `/_emdash/admin/widgets` |
| Update Footer Contact link to `rustloop@45press.com` | Admin → Menus → Footer: Connect |

### Pending Decisions

- **User profiles broader fix:** A) set just your own byline / B) build a `/profile` page where signed-in users edit their own byline / C) customize signup to require display name upfront. Recommended B.
- Open EmDash admin-branding feature request on GitHub? (drafted, not posted)
- Delete `/pricing` and `/contact` template pages?
- About page rewrite (currently duplicates homepage) — need new copy

### Useful URLs / IDs (no secrets)

- CF Zone ID: `1c33402086210619ecb9cac2aa284c51` (now also in `wrangler.jsonc` `vars`)
- CF Account (deploys): `Joel@45press.com's Account` — `ece401f47370ecab76cbc85bf2a7054c`
- Latest deployed commit: `1af7485`

---

## Session 1 — 2026-05-16

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
