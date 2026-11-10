# November 10, 2026: Search Console HTTP 401 investigation

**Status: source-level audit completed; URL-level Search Console adjudication blocked. Not merged or deployed.**

## Reported signals

- Google Search Console email of November 9 names `Blocked due to unauthorized request (401)`, but provides **no example URLs**. The property is the connected **domain** property `sc-domain:smatdesigns.com`, which can include subdomains.
- Ahrefs email of November 8 describes **68 internal URLs**, health score **94**, and **10 noindex/nofollow** pages, including noindex and nofollow in both HTML and HTTP headers. The email does not include the 10 URLs. The connected Site Audit API returns `Insufficient plan`.
- **Do not equate these signals.** No evidence establishes an overlap.

## Grounded current implementation and production

- Base repo: `jabbertones-cloud/smat-portfolio`, main `68ab54db5c9e206d03c0c1698c1c178f7fd4c095`.
- Cloudflare Pages `smatdesigns` latest production deployment `582ef35c-bca2-4dbd-91a7-136f4b2dbb8a` was successful Nov. 1 and reports the same main SHA. No deployment drift in commit metadata was found.
- `sitemap.xml` lists exactly nine public HTML routes. `robots.txt` allows the site and points to that sitemap.
- From an authenticated Mac, `python3 scripts/check_site.py` passed and `python3 -m unittest discover -s scripts -p 'test_*.py'` passed **7 tests**.
- The existing production auditor `python3 scripts/audit_live_links.py --base https://smatdesigns.com` found **9/9** sitemap pages, **19** unique internal resources, and **0 issues**. It checks canonical mismatches, HTTP failures and noindex/nofollow in both HTML and response headers.
- Live Googlebot-user-agent GET checks returned **200** for the homepage, `/software/`, and the canonical Hub `/hub`; **301** for `www` to apex; **401** for two private intelligence API endpoints; **404** for `/hub/`. The nine sitemap HTML responses carry correct self-canonicals and index/follow metadata.
- The API responses `/api/intelligence/hub-funnel` and `/api/intelligence/hub-conversions` return unauthenticated **401**, by design. These endpoints are absent from the sitemap. **Do not remove auth or publish private response bodies to satisfy a crawl report.**
- A separately routed `/blog/` currently returns **404**, despite appearing in an older GSC search-performance row; there is no evidence whether this was intentionally retired or is an unwanted broken URL. The `/intent/` namespace is also a separately routed Cloudflare Worker, not a Pages static directory.

## Confirmed separate routing mismatch

The repository's `_worker.js` promises `/hub/` -> `/hub` with HTTP **308**, but the live URL `https://smatdesigns.com/hub/?probe=indexing-20261110` returns **404**, without a redirect.

Cloudflare's read-only Workers routes API confirms `smatdesigns.com/hub*` is bound to Worker **commerce-os**. This Worker route takes precedence over the Pages site's `_worker.js`. Therefore the redirect in the portfolio repository **cannot** repair the live route. A remedy belongs in the CommerceOS Worker or a separately approved Cloudflare routing adjustment. Do not alter the route as part of this audit.

Cloudflare official background: https://developers.cloudflare.com/workers/configuration/routing/routes/ and https://developers.cloudflare.com/pages/configuration/serving-pages/ .

## Change on this audit branch

`scripts/check_live_site.sh` now:
1. Requests `/hub/?probe=indexing-20261110` without following redirects; requires **308** to `/hub?probe=indexing-20261110`.
2. Asserts unauthenticated **401** remains enforced for `/api/intelligence/hub-funnel` and `/api/intelligence/hub-conversions`.

**Before change** the existing live checker passed despite the wrong `/hub/` response. **After change** it fails only on the observed Hub regression; both protected API checks pass. Static acceptance, Bash syntax, and seven Python unit tests pass. This is a new red guard, **not** proof of a deployed fix.

## Outstanding gates

1. Recover the **example URLs and last crawl dates** for the Page Indexing 401 report from the authorized Google Search Console UI. The CommerceOS GSC integration exposes **search performance**, not Page Indexing exclusion examples. No affected URL list has been retrieved.
2. Recover Ahrefs' **ten exact URLs**, HTTP statuses, and HTML/HTTP robots directives, or obtain an authorized Site Audit tier. The API's `Insufficient plan` is an access limitation, not zero issues.
3. Classify each real URL as a public page requiring an accessible 200 canonical, a deliberately restricted API/app route, or a retired URL. Private paths remain protected.
4. Fix the `/hub/` redirect in the **owning CommerceOS Worker** under a separately approved source/release change, then run the exact live regression until green. Confirm Cloudflare route precedence and the live response after release.
5. Keep this audit branch and its live-negative-control test unmerged until the owner route is corrected. Re-run exact-head, then require approval before merge and deployment. Do not request Google's `Validate Fix` without the affected-URL set and corresponding corrected live responses.

## Research provenance and limitations

- SMAT Research README and prior donor audit consulted; repository searches for `sitemap`, `robots.txt`, `SEO`, `401`, and `Search Console` found no matching prior indexed issue. The prior handrolled audit contains unrelated security component findings and is not treated as an SEO fix.
- GitHub Research MCP CLI at pinned source `382adba9595447180834781ec8837de42688fbe6`: Pattern Card search returned only score-0 irrelevant cards, FTS library search returned empty, and the TaskMap output contained unrelated general tests. **No validated donor was selected**, and this branch adds no new primitive.
- Research Fabric jobs were started; the last observed status was queued/running, not completed. Do not cite them as completed research.
- No SMAT Expert MCP specialized audit was available for the Search Console Page Indexing exclusion list. The CommerceOS connector is a live GSC-performance read only.
- Cloudflare official read-only route and Pages deployment API results are the authoritative ownership/deployment evidence above. Secrets and session cookies have not been retained in this note.
