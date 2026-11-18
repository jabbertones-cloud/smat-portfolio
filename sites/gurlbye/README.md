# Gurlbye website recovered production source and narrow-mobile repair

**Source:** `https://gurlbye.smatdesigns.com` is a public artist website on the Cloudflare custom-domain Worker `smat-gurlbye`. The original authored site repository was not established from the GitHub and local-repository searches. On 2026-11-17, the current first-party site was retrieved without customer authentication: 28 HTML/CSS/JS/media files (34,534,342 bytes). Exact original SHA-256 hashes are in `RECOVERY.json`. The current deployed Worker module was downloaded from Cloudflare's authenticated Scripts API and preserved as `worker.mjs`; its extracted source SHA-256 was `e8562a33376bd46d7d502c8266fb677a52f19a49dea52925a95256123c1c5c5e`.

## Corrective change

The site's 280px responsive header placed the fifth navigation link beyond the right edge at approximately 304px. Five live Chrome widths were inspected. We append only one `@media(max-width:320px)` native CSS rule to `dist/site.css`, changing the nav to a stacked/logo-centered and flex-wrap layout. All five links remain visible and at least 44px high. Artist artwork, image files, original music/video assets, JavaScript, and the recovered form Worker are unchanged.

**Do not count it as repaired unless deployed and independently verified.** `npm test` checks the original 27 file hashes, 280/320/360/390/414px responsive navigation in real Chrome, 5 visible links, tap height and recovered API endpoint behavior. Set `CHROME_BIN` to your existing supported Chrome executable.

## Guarded release

The `wrangler.jsonc` reproduces the live Worker bindings discovered with authenticated Cloudflare settings readback: asset-backed `ASSETS`, email binding `EMAIL` with the existing owner destination, and `FORM_RATE_LIMITER` namespace `301133` at 5/60sec. It preserves the original 2026-11-03 compatibility date and does not declare or modify DNS routes. `run_worker_first:true` keeps the Worker in the request path for security headers and `/api/join`.

Check exact HEAD, run native tests, bundle dry-run, merge, and independently test exact merged main. Then stage a Cloudflare Worker **Version**, not an immediate deployment. In its preview: verify the 28 original routes return 200 and the 27 non-CSS file bytes match the original live SHA-256 values; verify 5 viewport widths and artwork, `/__health` and invalid `/api/join` method 405. Do not submit an actual registration as a smoke test. Only after preview passes, deploy that immutable version at 100% while preserving the previous version ID for rollback. Check live Chrome again, compare exact image/video bytes, verify route continuity and original email/rate-limiter settings.

The `linkbeam` route overlays for analytics and feedback are a separate Worker service and must not be changed here. This is an artist site, not a claim of ticket sales, merchandise fulfillment, or completion of registration deliveries.
