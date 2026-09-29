# Sree Pranavam Yoga Vidyapeedom

Responsive yoga education website with an admin CMS, enquiry management, media storage and technical SEO. Built from the supplied Web Requirement Set.docx and the public brand reference at https://www.sreepranavam.yoga.

## Stack

Next.js 16 App Router source conventions, React 19, TypeScript, Tailwind CSS and shadcn components. The included Sites deployment runs the Next.js-compatible application through Vinext on Cloudflare Workers. It is not a Vercel/Node deployment. D1 stores content, leads and administrator identities; R2 stores uploaded images and PDFs. Database access is isolated in lib/server.ts. Migrating to another Next.js host requires replacing the Cloudflare bindings and dispatch-owned authentication with that host's database, object storage and admin identity integration.

## Admin

Open /admin while the Site remains owner-private. Sign in with ChatGPT and activate the admin panel. This binds the first administrator to the signed-in identity. Subsequent access and every mutation are checked on the server against this record. Do not change the Site to public or shared access before activation. Keep the same Site identity because authentication user IDs are scoped to the Site.

The content editor supports add, edit, delete, sort, drafts and publishing for courses, programs, services, events, instructors, galleries, resources, testimonials, FAQs, affiliation logos and pages. Published content is read server-side on each website request. Upload PDFs before publishing resources. New pages are available at their slug URL; add navigation links in components/site.tsx when introducing a new top-level section.

The enquiry view shows the newest 1,000 leads, contact details, enquiry type, chosen offering, submitted message, campaign/source URL, status and email delivery state. CSV export neutralizes spreadsheet formula prefixes. Leads remain stored beyond the display limit. No CRM data leaves the Site until an integration is configured.

## Email and integrations

Set RESEND_API_KEY as a hosted server secret. In Site settings → Integrations, set a verified sender address and the designated institution email. Every saved submission attempts an email containing the submitted details. Failed notifications remain visible and can be retried from admin. The database save succeeds even when email fails. No email delivery is represented as successful without a provider success response.

- Add the official WhatsApp number with country code; until supplied, the floating action opens a working contact form.
- Set GA4 measurement ID and Meta Pixel ID in SEO settings. They load only after analytics consent. Enquiry source URLs retain UTM campaign parameters. Clicks and successful form submissions emit conversion events.
- Add a Google Maps iframe src and a YouTube /embed/ URL to show the map and virtual tour.
- Set a Google reviews profile URL and optional review-provider HTTPS iframe URL for the live review widget. Provider setup and review account connection are external prerequisites. Manually approved testimonials are a separate CMS collection.
- Add Google Search Console's verification token and confirm the production domain.

## SEO

Server-rendered content; per-page title/description/canonical and noindex controls; Open Graph and Twitter metadata; LocalBusiness JSON-LD; dynamic XML sitemap; robots.txt; semantic headings; lazy image loading; explicit image dimensions; precompressed demo photography. Search indexing defaults to disabled for the private review. Enable it only after approved production content and domain setup. Uploaded files are limited to 10 MB, image/PDF magic bytes are checked, and SVG/HTML uploads are not accepted. Admin-uploaded PDFs are inaccessible without an administrator session or a one-hour lead download grant. External PDF URLs cannot provide the same object-store access enforcement; prefer R2 uploads.

## Review content and missing supplied assets

The original website is a client-rendered application. Its hero content could not be safely retrieved; exact preservation requires the user-provided hero screenshot/text/images. The current hero uses a single AI-generated conceptual yoga photograph, reused for course imagery, not a photograph of the actual institution or instructors. The existing public logo was obtained from the original page's favicon URL. The new official logo and tagline remain to be provided.

Draft curriculum, mission/vision and Acharya message are editorial starting points, not verified quotations or institution-approved claims. Replace with approved material. Course names and stated 36/200/400-hour durations are from the requirements document. Verify eligibility, certification bodies, logos and all course details before public launch.

No invented testimonials, student counts, rating figures, upcoming event dates or faculty achievements are published. Add verified figures, recent gallery photos, brochures, faculty photographs, signatures, contact details, policies and affiliation logos in admin. Legal pages are clearly marked drafts. The store is a coming-soon section. Login portal for students, payments, online learning, appointments, ecommerce, newsletter, AI assistant and CRM are future scope from the brief, not implemented features.

## Development and verification

Use the existing install, db:generate and build scripts. Schema changes belong in db/schema.ts; generate and inspect Drizzle migrations. Do not create schema at runtime. The hosting platform applies the migrations before the Worker deployment.

Checks: production compilation, TypeScript, and in-memory SQLite checks for the migration, single-admin bootstrap, publishing, rate-limit counters and enquiry defaults. No browser/end-to-end verification or live external email/analytics/provider test was performed because browser testing was not requested and provider credentials were not supplied.

## References

- Requirement source: Web Requirement Set.docx supplied in this conversation.
- Brand reference: https://www.sreepranavam.yoga
- Existing logo source: https://ik.imagekit.io/5ddohnvo2/logo%202.jpg
- Email provider documentation: https://resend.com/docs/dashboard/emails/idempotency-keys
- Google review integration documentation: https://developers.google.com/maps/documentation/places/web-service/place-details
