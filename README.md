# SMAT Designs — smatdesigns.com

Next.js App Router site for **SMAT Designs** (Tempe, AZ): work index, case studies, services, about, and contact (Resend).

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and set:

- `RESEND_API_KEY` — required for the contact form in production.
- `CONTACT_TO_EMAIL` — where inquiries are delivered (default `sm@smatdesigns.com`).
- `CONTACT_FROM_EMAIL` — must be a sender Resend allows (verify `smatdesigns.com` in Resend, then use e.g. `hello@smatdesigns.com`).

Without `RESEND_API_KEY`, `POST /api/contact` returns 503 (email intentionally disabled).

## Case study images

Hero paths are set in `src/content/cases.ts` and point at files under `public/images/` (exported from studio archives). Add or swap assets there, then update the `heroImage` field per case.

## Deploy (Vercel + domain)

1. Import this repo in [Vercel](https://vercel.com) (project name e.g. `smat-portfolio`).
2. Add environment variables from `.env.example` (production + preview as needed).
3. Connect domain **smatdesigns.com**: Vercel → Project → Settings → Domains → add `smatdesigns.com` and `www.smatdesigns.com`; set DNS per Vercel’s records (A/AAAA or CNAME).
4. Production URL and `metadataBase` in `src/app/layout.tsx` are set to `https://smatdesigns.com`.

Preview deployments work for PRs; production uses the custom domain once DNS propagates.

## Scripts

| Command   | Purpose        |
| --------- | -------------- |
| `npm run dev`   | Local dev      |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint`  | ESLint         |
