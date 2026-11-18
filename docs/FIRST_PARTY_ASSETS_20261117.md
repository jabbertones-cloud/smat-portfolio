# First-party render dependencies (2026-11-17)

## Scope and donors

`smatdesigns.com` is a Cloudflare Pages project named `smatdesigns` (manual deployments, production branch `main`). Its HTML relied on third-party Google Fonts, GSAP `3.12.5`, GSAP ScrollTrigger `3.12.5`, and Lenis `1.1.18`. Interface Lab's exact-origin read-only audit held all 17 viewports because those assets were blocked; blocked Cloudflare analytics is classified as non-UI telemetry. The business contact, project pages, payments, Stripe/CommerceOS hub bridge and `_worker.js` are explicitly out of scope.

We retained the exact original Google Fonts CSS face declarations and all 10 original referenced WOFF2 binaries for `Bebas Neue`, `DM Sans` and `JetBrains Mono`, replacing only URLs with same-origin `assets/fonts/` paths. The Google source CSS and each binary are hash-receipted in `docs/self-hosted-fonts-receipt.json`. OFL-1.1 license notices from pinned Fontsource `@fontsource/*@5.3.0` are retained under `docs/licenses`. The original CDNs' exact minified JavaScript bundles are copied to `assets/vendor` with byte hashes in `docs/vendor-scripts-receipt.json`. GSAP uses its standard no-charge commercial license rather than an invented MIT claim; Lenis is MIT.

Donors: [Fontsource installation](https://fontsource.org/docs/getting-started/install), [GSAP 3.12.5 CDN](https://cdnjs.com/libraries/gsap/3.12.5), [GSAP licensing](https://gsap.com/standard-license), and [Lenis package](https://www.npmjs.com/package/lenis). Retain exact pinned versions for behavioral parity; assess upgrading separately.

## Baseline and candidate

- Prior Interface Lab 102-cell fleet run `7d15fef8-5c15-4cd4-b31a-aca857cc8acf`, SMAT: all 17 cells held for external source assets.
- Same M3 strict exact-origin Chrome candidate: 280, 390, 1440 have 0 non-telemetry blocked requests, 0 page exceptions and 0 horizontal overflow. GSAP, ScrollTrigger and Lenis globals are present; all three font families load.
- Normal live baseline versus first-party candidate: 48 DOM text-width/height measurements at both 390 and 1440, maximum difference **0px**.
- `python3 scripts/check_site.py` passes all 10 public pages, local source links and metadata.
- `node scripts/test_firstparty_assets.mjs` verifies 10 WOFF2 hashes, three pinned original CDN JavaScript hashes, notices and no external render scripts.
- `node scripts/package_pages.mjs <empty-directory>` builds a curated static Pages output excluding `sites/gurlbye`, private docs and tooling, and emits `_release.json` containing exact source Git SHA plus homepage and bridge source hashes.

## Release contract

On exact HEAD, rerun source and browser checks. Merge and repeat from exact MAIN. Stage via `wrangler pages deploy <build-dir> --project-name smatdesigns --branch fix-firstparty-render` and independently test the emitted preview URL, full navigation, responsive text/layout, first-party fonts, GSAP/Lenis interactions, and `_release.json` before changing production. Then publish from the exact merged MAIN build to Pages production branch `main` and verify the custom domain with fresh Chrome plus preserved contact and CommerceOS hub routes. Keep previous production Pages deployment ID `fa975314-7f1b-4a7e-ae6a-3dfaf346dcf8` available for rollback.

Do not enable GitHub Actions. A successful visual audit is automated evidence, not human visual certification or a verified first-time customer conversion.
