#!/usr/bin/env python3
"""Static acceptance checks for the public SMAT Designs business and software website.

No third-party Python dependencies or network calls. Production validation is separate.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "software/index.html", "services/index.html", "case-studies/index.html",
         "contact/index.html", "privacy/index.html", "terms/index.html"]
REQUIRED = {
 "index.html": ["SMAT Designs", "EzSeller", "AiSCent", "info@smatdesigns.com"],
 "software/index.html": ["EzSeller", "AiSCent", "LocalizeShots", "$39", "$99", "$249", "Amazon", "authorization", "WWDC MCP"],
 "services/index.html": ["Software", "automation", "pricing", "custom quote"],
 "case-studies/index.html": ["First-party", "EzSeller", "AiSCent", "public GitHub repository"],
 "contact/index.html": ["Tempe", "Arizona", "SMAT Designs", "info@smatdesigns.com", "Scott Manthey", "Ariel Tourner"],
 "privacy/index.html": ["Retention and Deletion", "Selling Partner", "Security", "Privacy"],
 "terms/index.html": ["Terms", "pricing", "Amazon", "Privacy"],
}
BANNED = ["calendly.com/smatdesigns", "Sarah Chen", "Marcus Johnson", "Elena Rodriguez",
          "formsubmit.co", "alert('Sign up flow would be here')", "0% rejection rate",
          "Best app", "#1 app"]

class Parser(HTMLParser):
 def __init__(self):
  super().__init__()
  self.links = []
  self.images = []
  self.ids = set()
  self.titles = []
  self.in_title = False
 def handle_starttag(self, tag, attrs):
  props = dict(attrs)
  if "id" in props: self.ids.add(props["id"])
  if tag == "a": self.links.append(props.get("href", ""))
  if tag == "img": self.images.append(props.get("src", ""))
  if tag == "title": self.in_title = True
 def handle_endtag(self, tag):
  if tag == "title": self.in_title = False
 def handle_data(self, data):
  if self.in_title: self.titles.append(data)

def check():
 errors = []
 for rel in PAGES:
  path = ROOT / rel
  if not path.is_file(): errors.append(f"{rel}: missing"); continue
  content = path.read_text(encoding="utf-8")
  p = Parser(); p.feed(content)
  if not "".join(p.titles).strip(): errors.append(f"{rel}: missing title")
  for expected in REQUIRED[rel]:
   if expected.lower() not in content.lower(): errors.append(f"{rel}: missing {expected!r}")
  for banned in BANNED:
   if banned.lower() in content.lower(): errors.append(f"{rel}: forbidden copy {banned!r}")
  if rel != "index.html" and '<link rel="canonical"' not in content: errors.append(f"{rel}: no canonical URL")
  for url in p.links + p.images:
   if not url or url.startswith("javascript:"): errors.append(f"{rel}: empty or javascript link {url!r}"); continue
   if url.startswith(("mailto:", "https:", "http:", "data:")): continue
   parts = urlsplit(url)
   if parts.path.startswith("/"): candidate = ROOT / parts.path.lstrip("/")
   elif parts.path: candidate = path.parent / parts.path
   else: candidate = path
   if candidate.is_dir(): candidate /= "index.html"
   if not candidate.exists(): errors.append(f"{rel}: broken local path {url!r}")
   if url.startswith("#") and parts.fragment not in p.ids: errors.append(f"{rel}: missing anchor {url!r}")
  print(f"OK {rel}: links={len(p.links)}, images={len(p.images)}, title={''.join(p.titles)}")
 if not (ROOT/"sitemap.xml").exists(): errors.append("missing sitemap")
 if not (ROOT/"robots.txt").exists(): errors.append("missing robots")
 if errors:
  for error in errors: print("FAIL",error)
  raise SystemExit(f"{len(errors)} website acceptance check(s) failed")
 print("PASS: all public page assertions, local link targets, source claims, and metadata")
if __name__ == "__main__": check()
