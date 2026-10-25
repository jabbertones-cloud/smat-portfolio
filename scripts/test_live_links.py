#!/usr/bin/env python3
"""Pure-stdlib tests to guard live audit classification and negative outcomes."""
import io
from contextlib import redirect_stdout
from unittest import TestCase, main
from unittest.mock import patch
from urllib.parse import urlsplit
from xml.sax.saxutils import escape

from audit_live_links import DocumentLinks, EXPECTED_PATHS, run


BASE = "https://smatdesigns.com"
OG = BASE + "/images/og-image.webp"
PAGE_URLS = {BASE + path for path in EXPECTED_PATHS}
SITEMAP = (
    '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    + "".join(f"<url><loc>{escape(url)}</loc></url>" for url in sorted(PAGE_URLS))
    + "</urlset>"
).encode()


class AuditTests(TestCase):
    def test_preconnect_and_scalar_metadata_are_not_links(self):
        parser = DocumentLinks()
        parser.feed(
            '<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link rel="dns-prefetch" href="https://fonts.gstatic.com">'
            '<meta property="og:image" content="/images/og-image.webp">'
            '<meta property="og:image:width" content="1200">'
            '<meta property="og:image:height" content="630">'
            '<meta property="og:image:alt" content="Sample image">'
            '<meta name="twitter:image" content="/images/og-image.webp">'
            '<style>.x{background-image:url("/images/hero.webp")}</style>'
            '<img srcset="/images/m.webp 1x, /images/large.webp 2x">'
        )
        urls = [url for url, _ in parser.refs]
        self.assertEqual(len(parser.preconnects), 2)
        self.assertIn("/images/og-image.webp", urls)
        self.assertIn("/images/hero.webp", urls)
        self.assertIn("/images/m.webp", urls)
        self.assertIn("/images/large.webp", urls)
        for non_url in ("1200", "630", "Sample image", "https://fonts.googleapis.com"):
            self.assertNotIn(non_url, urls)

    def provider(self, bad=False):
        def get(url, timeout=18):
            if url == BASE + "/sitemap.xml":
                return {"status": 200, "url": url, "content_type": "application/xml", "data": SITEMAP}
            if url in PAGE_URLS:
                path = urlsplit(url).path
                suffix = '<div id="inquiries"></div>' if path == "/contact/" else ""
                bad_link = '<a href="/does-not-exist">Broken</a>' if bad and path == "/" else ""
                html = (
                    f'<html><head><link rel="canonical" href="{url}">'
                    f'<meta property="og:image" content="{OG}">'
                    '<meta property="og:image:width" content="1200">'
                    '<link rel="preconnect" href="https://fonts.googleapis.com">'
                    '<style>div{background:url(/images/bg.webp)}</style></head>'
                    f'<body><a href="/contact/#inquiries">Contact</a>{suffix}{bad_link}</body></html>'
                )
                return {"status": 200, "url": url, "content_type": "text/html", "data": html.encode()}
            if url in (OG, BASE + "/images/bg.webp"):
                return {"status": 200, "url": url, "content_type": "image/webp", "data": b"RIFFpreview"}
            return {"status": 404, "url": url, "content_type": "text/html", "data": b""}
        return get

    def test_healthy_site_is_accepted(self):
        with patch("audit_live_links.http_get", side_effect=self.provider()), redirect_stdout(io.StringIO()) as output:
            self.assertEqual(run(BASE), 0)
        self.assertIn('"issues": []', output.getvalue())
        self.assertIn('"preconnect_hints_ignored": 9', output.getvalue())

    def test_disguised_image_and_noindex_fail(self):
        normal = self.provider()
        def wrong(url, timeout=18):
            response = normal(url, timeout=timeout)
            if url == OG:
                response = dict(response, content_type="text/html")
            if url == BASE + "/":
                response = dict(response, x_robots="noindex, nofollow")
            return response
        with patch("audit_live_links.http_get", side_effect=wrong), redirect_stdout(io.StringIO()) as output:
            self.assertEqual(run(BASE), 1)
        self.assertIn("image link returned non-image content", output.getvalue())
        self.assertIn("noindex/nofollow HTTP header", output.getvalue())

    def test_real_broken_internal_link_fails(self):
        with patch("audit_live_links.http_get", side_effect=self.provider(bad=True)), redirect_stdout(io.StringIO()) as output:
            self.assertEqual(run(BASE), 1)
        self.assertIn("does-not-exist", output.getvalue())
        self.assertIn('"status": 404', output.getvalue())


if __name__ == "__main__":
    main()
