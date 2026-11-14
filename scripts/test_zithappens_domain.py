"""Offline checks for Zit Happens' independent Plushtrap subdomain site."""
from pathlib import Path
from html.parser import HTMLParser
from unittest import TestCase
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parent.parent / "sites" / "zithappens-plushtrap"
URL = "https://zithappens.plushtrap.com/"


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.canonical, self.ids = [], [], set()

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if attr.get("id"):
            self.ids.add(attr["id"])
        if tag == "a":
            self.links.append(attr.get("href"))
        if tag == "link" and attr.get("rel") == "canonical":
            self.canonical.append(attr.get("href"))


class ZitDomainTests(TestCase):
    def test_canonical_and_brand_claims(self):
        page = (ROOT / "index.html").read_text()
        self.assertIn("Zit Happens", page)
        self.assertNotIn("zithappens.co", page)
        self.assertIn("plushtrap.com/shop/zit-happens-killa-bunny", page)
        self.assertIn("info@smatdesigns.com", page)
        links = Links()
        links.feed(page)
        self.assertEqual(links.canonical, [URL])
        self.assertTrue(all(
            u.startswith(("https://", "mailto:")) or
            (u.startswith("#") and u[1:] in links.ids)
            for u in links.links
        ))

    def test_static_discovery_and_headers(self):
        urls = [x.text for x in ElementTree.parse(ROOT / "sitemap.xml").findall(".//{*}loc")]
        self.assertEqual(urls, [URL])
        self.assertIn(URL + "sitemap.xml", (ROOT / "robots.txt").read_text())
        self.assertIn("X-Content-Type-Options: nosniff", (ROOT / "_headers").read_text())
