#!/usr/bin/env python3
"""Read-only production sitemap/link/media audit using Python's standard library.

Tests actual deployed HTTP responses; does not require Ahrefs or browser scripting.
External links, DNS preconnect hints and user-intent schemes are not treated
as broken internal URLs. Outputs concise structured evidence; uploads nothing.
"""
import argparse
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import json
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urldefrag, urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree

USER_AGENT = "SMAT-Site-Production-Resource-Check/1.0"
PAGE_LIMIT = 50
DOWNLOAD_LIMIT = 12 * 1024 * 1024
CSS_URL = re.compile(r"""url\(\s*['"]?([^)'"\s]+)""", re.IGNORECASE)
SOCIAL_IMAGE_KEYS = {"og:image", "og:image:url", "twitter:image", "msapplication-tileimage"}
MEDIA_RELS = {"stylesheet", "icon", "apple-touch-icon", "image_src", "preload", "manifest"}
IGNORE_RELS = {"dns-prefetch", "preconnect", "preload-module"}
SKIP_SCHEMES = ("mailto:", "tel:", "data:", "blob:", "javascript:")
EXPECTED_PATHS = {
    "/", "/software/", "/services/", "/case-studies/", "/contact/",
    "/a-plus-content/", "/security/", "/privacy/", "/terms/",
}


def http_get(url, timeout=18):
    try:
        req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
        with urlopen(req, timeout=timeout) as response:
            return {
                "status": response.status,
                "url": response.geturl(),
                "content_type": response.headers.get("Content-Type", ""),
                "x_robots": response.headers.get("X-Robots-Tag", ""),
                "data": response.read(DOWNLOAD_LIMIT + 1),
            }
    except HTTPError as exc:
        return {"status": exc.code, "url": exc.geturl(), "content_type": "", "data": b""}
    except (URLError, OSError, TimeoutError) as exc:
        return {"error": f"{type(exc).__name__}: {exc}"}


class DocumentLinks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []
        self.ids = set()
        self.canonicals = []
        self.robot_directives = []
        self.og_images = []
        self.preconnects = []
        self.styling = False

    def add(self, value, kind):
        if value is not None and value.strip():
            self.refs.append((value.strip(), kind))

    def handle_starttag(self, tag, attributes):
        props = dict(attributes)
        if props.get("id"):
            self.ids.add(props["id"])
        if props.get("style"):
            for value in CSS_URL.findall(props["style"]):
                self.add(value, "inline_css")
        if tag == "style":
            self.styling = True
        if tag == "a":
            self.add(props.get("href"), "anchor")
        if tag == "link":
            rels = set(props.get("rel", "").lower().split())
            if rels & IGNORE_RELS:
                self.preconnects.append(props.get("href", ""))
            elif "canonical" in rels:
                self.canonicals.append(props.get("href", ""))
                self.add(props.get("href"), "canonical")
            elif rels & MEDIA_RELS:
                self.add(props.get("href"), "link_asset")
        if tag in {"img", "source", "script", "audio", "video", "iframe"}:
            self.add(props.get("src"), tag)
            if tag == "video":
                self.add(props.get("poster"), "poster")
        if tag in {"img", "source"}:
            for key in ("srcset", "data-srcset"):
                if props.get(key):
                    for entry in props[key].split(","):
                        self.add(entry.strip().split(" ")[0], "srcset")
        if tag == "meta":
            key = (props.get("property") or props.get("name") or "").lower()
            if key in SOCIAL_IMAGE_KEYS:
                self.add(props.get("content"), key)
                if key == "og:image":
                    self.og_images.append(props.get("content", ""))
            elif key == "robots":
                self.robot_directives.append(props.get("content", ""))

    def handle_endtag(self, tag):
        if tag == "style":
            self.styling = False

    def handle_data(self, data):
        if self.styling:
            for value in CSS_URL.findall(data):
                self.add(value, "css_url")


def sitemap_pages(base, issues):
    xml_url = base + "/sitemap.xml"
    response = http_get(xml_url)
    if response.get("status") != 200:
        issues.append({"url": xml_url, "issue": "sitemap unavailable", "response": str(response)})
        return []
    try:
        tree = ElementTree.fromstring(response["data"])
        pages = [
            (entry.text or "").strip()
            for entry in tree.findall(".//{*}loc")
            if entry.text and entry.text.strip()
        ]
    except ElementTree.ParseError as exc:
        issues.append({"url": xml_url, "issue": f"invalid XML: {exc}"})
        return []
    if not pages or len(pages) > PAGE_LIMIT:
        issues.append({"url": xml_url, "issue": "unexpected sitemap URL count", "count": len(pages)})
        return []
    if {urlsplit(url).path for url in pages} != EXPECTED_PATHS:
        issues.append({
            "url": xml_url,
            "issue": "sitemap page inventory differs from the public routes contract",
            "paths": sorted({urlsplit(url).path for url in pages}),
        })
    for url in pages:
        if urlsplit(url).netloc != urlsplit(base).netloc or urlsplit(url).scheme != "https":
            issues.append({"url": xml_url, "issue": "non-canonical sitemap destination", "destination": url})
    return pages


def collect(base, pages, issues):
    refs = defaultdict(list)
    page_ids = {}
    count_external = 0
    ignored_preconnect = 0
    for page in pages:
        resp = http_get(page)
        if resp.get("status") != 200:
            issues.append({"url": page, "issue": "public page HTTP failure", "response": str(resp)})
            continue
        if len(resp["data"]) > DOWNLOAD_LIMIT:
            issues.append({"url": page, "issue": "oversized HTML"})
            continue
        if any(directive in resp.get("x_robots", "").lower() for directive in ("noindex", "nofollow")):
            issues.append({"url": page, "issue": "public page accidentally has noindex/nofollow HTTP header"})
        if "text/html" not in resp["content_type"].lower():
            issues.append({"url": page, "issue": "public page not HTML", "type": resp["content_type"]})
            continue
        parser = DocumentLinks()
        parser.feed(resp["data"].decode("utf-8", "replace"))
        page_ids[page] = parser.ids
        ignored_preconnect += len(parser.preconnects)
        if parser.canonicals != [page]:
            issues.append({"url": page, "issue": "canonical mismatch", "actual": parser.canonicals})
        if len(parser.og_images) != 1:
            issues.append({"url": page, "issue": "missing or duplicate social-preview image", "images": parser.og_images})
        if any("noindex" in directive.lower() or "nofollow" in directive.lower()
               for directive in parser.robot_directives):
            issues.append({"url": page, "issue": "public page accidentally set noindex/nofollow"})
        for raw, kind in parser.refs:
            lower = raw.lower()
            if lower.startswith(SKIP_SCHEMES):
                continue
            target, fragment = urldefrag(urljoin(page, raw))
            parsed = urlsplit(target)
            if parsed.scheme not in ("https", "http"):
                continue
            if parsed.hostname not in ("smatdesigns.com", "www.smatdesigns.com"):
                count_external += 1
                continue
            if parsed.scheme != "https":
                issues.append({"url": page, "issue": "non-HTTPS internal reference", "target": target})
            if parsed.path.startswith("/cdn-cgi/l/email-protection"):
                issues.append({"url": page, "issue": "crawler-visible Cloudflare email 404", "target": target})
            refs[target].append({"source": page, "kind": kind, "fragment": fragment})
    return refs, page_ids, count_external, ignored_preconnect


def run(base):
    issues = []
    pages = sitemap_pages(base, issues)
    refs, page_ids, external, preconnect = collect(base, pages, issues)
    statuses = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(http_get, url): url for url in refs}
        for fut in as_completed(futures):
            statuses[futures[fut]] = fut.result()
    for url, result in sorted(statuses.items()):
        if result.get("status") != 200:
            issues.append({
                "url": url,
                "issue": "linked internal page or resource is not HTTP 200",
                "response": {key: value for key, value in result.items() if key != "data"},
                "sources": refs[url],
            })
            continue
        if urlsplit(result["url"]).hostname not in ("smatdesigns.com", "www.smatdesigns.com"):
            issues.append({"url": url, "issue": "internal link redirects outside public website", "final": result["url"]})
        kinds = {ref["kind"] for ref in refs[url]}
        image_kinds = SOCIAL_IMAGE_KEYS | {"img", "srcset", "poster"}
        if kinds & image_kinds and not result["content_type"].lower().startswith("image/"):
            issues.append({
                "url": url, "issue": "image link returned non-image content",
                "type": result["content_type"], "sources": refs[url],
            })
        if len(result["data"]) > DOWNLOAD_LIMIT:
            issues.append({"url": url, "issue": "resource exceeds audit response limit"})
        for record in refs[url]:
            if record["fragment"] and url in page_ids and record["fragment"] not in page_ids[url]:
                issues.append({
                    "url": url + "#" + record["fragment"],
                    "issue": "missing internal fragment",
                    "source": record["source"],
                })
    report = {
        "base": base,
        "sitemap_pages": len(pages),
        "unique_internal_targets": len(refs),
        "external_references_excluded_from_internal_4xx": external,
        "preconnect_hints_ignored": preconnect,
        "issues": issues,
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if not issues else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="https://smatdesigns.com", help="canonical production HTTPS origin")
    args = parser.parse_args()
    base = args.base.rstrip("/")
    if base != "https://smatdesigns.com":
        parser.error("production audit accepts only https://smatdesigns.com")
    return run(base)


if __name__ == "__main__":
    sys.exit(main())
