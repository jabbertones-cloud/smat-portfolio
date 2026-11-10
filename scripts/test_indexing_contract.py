"""Guard the nine public URLs against silent deindexing configuration changes.

This is a source contract, not evidence about Google's reported 401 URLs.
"""
import unittest
from html.parser import HTMLParser
from xml.etree import ElementTree as ET

from check_site import PAGES, ROOT

ORIGIN = "https://smatdesigns.com"


class IndexingMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = []
        self.robots = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical.append(attrs.get("href"))
        if tag == "meta" and attrs.get("name") == "robots":
            self.robots.append((attrs.get("content") or "").replace(" ", "").lower())


class PublicIndexingContractTests(unittest.TestCase):
    def test_all_public_pages_have_self_canonical_and_index_follow(self):
        for rel in PAGES:
            with self.subTest(page=rel):
                path = "/" if rel == "index.html" else "/" + rel.split("/")[0] + "/"
                metadata = IndexingMetadata()
                metadata.feed((ROOT / rel).read_text(encoding="utf-8"))
                self.assertEqual([ORIGIN + path], metadata.canonical)
                self.assertEqual(["index,follow"], metadata.robots)

    def test_sitemap_matches_public_pages_and_only_public_pages(self):
        ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
        root = ET.parse(ROOT / "sitemap.xml").getroot()
        actual = [(el.text or "").strip() for el in root.findall(".//" + ns + "loc")]
        expected = [ORIGIN + ("/" if p == "index.html" else "/" + p.split("/")[0] + "/") for p in PAGES]
        self.assertEqual(sorted(expected), sorted(actual))

    def test_robots_references_public_sitemap(self):
        content = (ROOT / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: " + ORIGIN + "/sitemap.xml", content)


if __name__ == "__main__":
    unittest.main()
