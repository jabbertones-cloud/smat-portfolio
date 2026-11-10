# SMAT Designs indexing alert: bounded investigation (2026-11-10)

Status: **source regression guard proposed, alert unresolved**. No merge, Cloudflare deployment, authentication change, or Search Console "Validate fix" request.

## Scope and immutable baseline

- Target: `jabbertones-cloud/smat-portfolio`, public Cloudflare Pages site `https://smatdesigns.com`.
- Baseline `main`: `68ab54db5c9e206d03c0c1698c1c178f7fd4c095`.
- Google Search Console notification, 2026-11-09: **Blocked due to unauthorized request (401)**. The email supplies **no affected URL list**. Property `sc-domain:smatdesigns.com` is a Domain property, which covers subdomains; do not assume the alert belongs to this one Pages deployment.
- Ahrefs email, 2026-11-08: 68 internal URLs, health score 94, 10 noindex pages, 10 "Noindex in HTML and HTTP header", and 10 nofollow pages. The email also supplies no affected URLs. Connected Ahrefs Site Audit API returned `Insufficient plan`. Correlation with Google's 401 category is **unknown**.
- CommerceOS Google Search Console integration confirms this property is connected and recently synchronized, but the available tool returns **search performance**, not Page Indexing example URLs. The portfolio homepage and several internal pages have search impressions; that does not exonerate other URLs.

## Live evidence (unauthenticated, 2026-11-10 UTC)

| URL or route | Observed | Meaning |
| --- | --- | --- |
| Sitemap's nine HTML URLs | 200 and correct canonical/robots | Public portfolio route checks pass |
| `/sitemap.xml`, `/robots.txt` | 200 | Public discovery files accessible |
| `/this-route-must-not-exist-20261110` | 404 | No blanket 200 fallback |
| `www.smatdesigns.com/` | 301 to apex | Expected canonical host redirect |
| `/hub` | 200, canonical `/hub`, `index,follow` | Public CommerceOS Hub landing page |
| `/hub/` and `/hub/?x=1` | 404 | **Confirmed mismatch** with source `_worker.js`, which promises a query-preserving HTTP 308 to `/hub` |
| `/api/intelligence/hub-funnel` | 401, `x-hub-origin: smatdesigns-pages` | Protected intelligence API; **do not disable authentication** |
| `/api/intelligence/hub-conversions` | 401, same bridge marker | Protected intelligence API; **do not disable authentication** |
| `/blog/` | 404, HTML `noindex` | Nonindexable missing page, not evidence of an unauthorized public page |
| `/intent/product-renders-before-manufacturing/` | 200 with self-canonical | Public route observed beyond the current nine-page source sitemap; ownership/deployment path needs separate identification |

No observed public portfolio landing page returns 401. No sampled intelligence API appears in the source sitemap or public page anchors. **A live private 401 is not itself evidence that Google encountered that exact URL.**

## Reproduction and verification

From a clean checkout of baseline main, `python3 scripts/check_site.py` passed. `python3 -m unittest discover -s scripts -p 'test_*.py'` passed **7 tests**. `python3 scripts/audit_live_links.py --base https://smatdesigns.com` returned **9 sitemap pages, 19 unique internal targets, 0 issues**.

On the investigation branch, `bash -n scripts/check_live_site.sh` passed. The updated live acceptance script returned exit code **1** with only the new known drift failing: `/hub/?probe=indexing-20261110` returned **404**, where the checked-in Worker promises **308** to `/hub?probe=indexing-20261110`. Both protected intelligence endpoints correctly returned **401** and passed the guard. This is a **red regression witness**, not a claim of a repaired production route.

## Confirmed owner and production commit (Cloudflare read-only API)

- Zone `smatdesigns.com` has an explicit Cloudflare Worker route `smatdesigns.com/hub*` bound to script `commerce-os` (route ID `41446eb2da794da28e73369ce4f39346`). Cloudflare [Worker routing documentation](https://developers.cloudflare.com/workers/configuration/routing/routes/) establishes that an assigned Worker executes for matched requests. This **preempts** the Pages `_worker.js` for `/hub*`.
- Cloudflare Pages project `smatdesigns` latest successful production deployment ID `582ef35c-bca2-4dbd-91a7-136f4b2dbb8a`, created Nov. 1, reports commit `68ab54db5c9e206d03c0c1698c1c178f7fd4c095`, matching repository main. A stale Pages commit is **not** the identified cause of this Hub mismatch.
- `/hub/` redirection must be repaired in the owning `commerce-os` Worker or an explicitly reviewed route change. A patch only to the Pages `_worker.js` cannot fix the currently shadowed request. The unprotected API 401 responses are separately forwarded through Pages and must remain protected.
- Do not modify that Worker route from this portfolio audit. Its separate owner and release gates must be checked before any live change.

## Exact proposed source diff

- `scripts/check_live_site.sh`: assert a query-preserving 308 from `/hub/` to `/hub` and preserve 401 responses on two intentionally private intelligence APIs.
- `scripts/test_worker_routes.mjs`: Node's native test runner checks Pages Worker canonical redirect, static asset boundary, and upstream 401 forwarding with a synthetic upstream.
- `.github/workflows/verify-website.yml`: run source Worker tests for changes to `_worker.js` and `_headers` and the worker test file.
- `.github/workflows/deploy.yml`: run source Worker tests before publishing.
- This investigation note: evidence and release gates. No production Worker routing, SEO metadata, public page content, credentials, or authentication code is modified.

The source Worker unit test can be green while the live request is red because another Worker route owns the actual path. **Both gates are necessary.**

## Remaining gates

1. Obtain the affected URLs from Search Console **Page indexing → Blocked due to unauthorized request (401)** for the Domain property. If a subdomain is affected, locate **that app's** repository and preserve its private endpoints.
2. Confirm the identified `smatdesigns.com/hub*` route's `commerce-os` Worker owner can implement a `/hub/` -> `/hub` redirect, then separately authorize and test that Worker release. Pages source changes alone are ineffective.
3. Recover Ahrefs' ten noindex URLs through authorized Site Audit UI or an eligible plan. Compare exact URL lists with Search Console; the totals alone cannot establish overlap.
4. Reproduce a **public page** with unwanted 401 before writing a production authentication/routing correction. The observed 401 intelligence APIs are intentionally protected. Intentional private 401s should remain private.
5. Re-run source unit tests, exact-head CI, the full live route audit and the negative test; request merge/deploy approval only after explaining any remaining red acceptance gate.

## Research receipts / limitations

- First-party authority: Google Search Central indexability guidance and Cloudflare Pages advanced Worker routing; actual target source `_worker.js`, `sitemap.xml`, `robots.txt`, `scripts/audit_live_links.py`.
- SMAT Research issue/study search (`401`, `sitemap`, `SEO`, `robots.txt`, `Google Search Console`) yielded no directly applicable known verdict. The older handrolled-donor audit is unrelated to this route.
- GitHub Research CLI at `jabbertones-cloud/githubresearchmcp` commit `382adba9595447180834781ec8837de42688fbe6`: Pattern Cards scored zero for the query; local library had no match; generated TaskMap was not source-specific to this site. **No donor port or production code change was authorized by those results**.
- Research Fabric study was started and was still queued on final check; no Fabric evidence was promoted to measured. No live SMAT Expert SEO module was available; the repo corpus was not used as a live MCP.
