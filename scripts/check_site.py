#!/usr/bin/env python3
"""Static acceptance checks for the public SMAT Designs business and software website.

No third-party Python dependencies or network calls. Production validation is separate.
"""
from pathlib import Path
from html.parser import HTMLParser
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "software/index.html", "services/index.html", "case-studies/index.html",
         "contact/index.html", "privacy/index.html", "terms/index.html", "a-plus-content/index.html", "security/index.html"]
REQUIRED = {
 "index.html": ["SMAT Designs", "EzSeller", "AiSCent", "info@smatdesigns.com"],
 "software/index.html": ["EzSeller", "AiSCent", "LocalizeShots", "$39", "$99", "$249", "Amazon", "authorization", "WWDC MCP", "ezseller.smatdesigns.com", "aiscentmcp.com", "wwdcmcp.smatdesigns.com"],
 "services/index.html": ["Software", "automation", "pricing", "custom quote"],
 "case-studies/index.html": ["First-party", "EzSeller", "AiSCent", "public GitHub repository"],
 "contact/index.html": ["Tempe", "Arizona", "SMAT Designs", "info@smatdesigns.com", "Scott Manthey", "Ariel Tourner"],
 "privacy/index.html": ["Retention and Deletion", "Selling Partner", "Security", "Privacy"],
 "terms/index.html": ["Terms", "pricing", "Amazon", "Privacy"],
 "a-plus-content/index.html": ["Enhanced Brand Content", "A+ Content", "Seller Central", "SkynPatch", "sm@smatdesigns.com"],
 "security/index.html": ["incident", "risk", "24 hours", "sm@smatdesigns.com", "Amazon"],
}
SITE_REVISION = "2026-10-25-ahrefs-social-asset"
CSS_URL = re.compile(r'url\(\s*[\"\']?([^\)\"\'\s]+)')
MAILTO_ANCHOR = re.compile(r'<a\b[^>]*\bhref="mailto:[^"]+"[^>]*>.*?</a>', re.IGNORECASE | re.DOTALL)
BANNED = ["calendly.com/smatdesigns", "Sarah Chen", "Marcus Johnson", "Elena Rodriguez",
          "formsubmit.co", "alert('Sign up flow would be here')", "0% rejection rate",
          "Best app", "#1 app", "ezamazon.smatdesigns.com", "aiscent.smatdesigns.com"]

class Parser(HTMLParser):
 def __init__(self):
  super().__init__()
  self.links = []
  self.images = []
  self.media = []
  self.og_images = []
  self.in_style = False
  self.ids = set()
  self.titles = []
  self.in_title = False
 def handle_starttag(self, tag, attrs):
  props = dict(attrs)
  if "id" in props: self.ids.add(props["id"])
  if tag == "a": self.links.append(props.get("href", ""))
  if tag == "img": self.images.append(props.get("src", ""))
  if tag == "img" and props.get("src"): self.media.append(props["src"])
  if tag in ("source", "script", "audio", "video", "iframe") and props.get("src"):
   self.media.append(props["src"])
  if tag == "video" and props.get("poster"): self.media.append(props["poster"])
  if tag in ("source", "img") and props.get("srcset"):
   self.media.extend(part.strip().split(" ")[0] for part in props["srcset"].split(","))
  if tag == "link" and props.get("rel", "").lower() in ("icon", "apple-touch-icon", "image_src", "stylesheet", "preload"):
   if props.get("href"): self.media.append(props["href"])
  if tag == "meta":
   kind = (props.get("property") or props.get("name") or "").lower()
   if kind in ("og:image", "og:image:url", "twitter:image", "msapplication-tileimage"):
    if props.get("content"): self.media.append(props["content"])
    if kind.startswith("og:image"): self.og_images.append(props.get("content", ""))
  if props.get("style"): self.media.extend(CSS_URL.findall(props["style"]))
  if tag == "style": self.in_style = True
  if tag == "title": self.in_title = True
 def handle_endtag(self, tag):
  if tag == "title": self.in_title = False
  if tag == "style": self.in_style = False
 def handle_data(self, data):
  if self.in_title: self.titles.append(data)
  if self.in_style: self.media.extend(CSS_URL.findall(data))

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
  if '<link rel="canonical"' not in content: errors.append(f"{rel}: no canonical URL")
  if f'<meta name="smat-site-revision" content="{SITE_REVISION}">' not in content:
   errors.append(f"{rel}: incorrect public release marker")
  for anchor in MAILTO_ANCHOR.finditer(content):
   preceding = content[:anchor.start()].rstrip()
   following = content[anchor.end():].lstrip()
   if not preceding.endswith("<!--email_off-->") or not following.startswith("<!--/email_off-->"):
    errors.append(f"{rel}: public mailto link is not shielded from Cloudflare HTML rewriting")

  canonical_url = "https://smatdesigns.com/" + (rel.split("/")[0] + "/" if rel != "index.html" else "")
  if p.og_images != ["https://smatdesigns.com/images/og-image.webp"]:
   errors.append(f"{rel}: incomplete or missing canonical Open Graph image")
  if '<meta name="twitter:image" content="https://smatdesigns.com/images/og-image.webp">' not in content:
   errors.append(f"{rel}: Twitter image missing or inconsistent")
  if f'<meta property="og:url" content="{canonical_url}">' not in content:
   errors.append(f"{rel}: Open Graph canonical URL missing or inconsistent")
  if rel == "index.html" and ('.preloader' in content or 'heroTl' in content): errors.append("homepage is blocked by preloader or deferred hero")
  if rel == "software/index.html" and content.find('<section class="hero">') > content.find('id="service-separation"'): errors.append("software hero is buried after authorization copy")
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
  # Unlike ordinary outbound links, local media may be hidden in <meta>,
  # <source>, preloads or CSS background URLs. Check them before deployment.
  # Preconnect DNS hints are deliberately NOT treated as navigable URLs.
  for url in set(p.media):
   if not url or url.startswith(("data:", "blob:")): continue
   parts = urlsplit(url)
   if parts.scheme in ("https", "http") and parts.hostname not in ("smatdesigns.com", "www.smatdesigns.com"):
    continue
   if parts.scheme and parts.scheme not in ("https", "http"):
    errors.append(f"{rel}: unexpected media URL scheme {url!r}")
    continue
   if not parts.path: continue
   candidate = ROOT / parts.path.lstrip("/") if parts.path.startswith("/") else path.parent / parts.path
   if not candidate.is_file(): errors.append(f"{rel}: missing local media resource {url!r}")
  print(f"OK {rel}: links={len(p.links)}, images={len(p.images)}, media={len(p.media)}, title={''.join(p.titles)}")
 if not (ROOT/"sitemap.xml").exists(): errors.append("missing sitemap")
 if not (ROOT/"robots.txt").exists(): errors.append("missing robots")
 if not (ROOT/".well-known/security.txt").exists(): errors.append("missing security.txt")
 if errors:
  for error in errors: print("FAIL",error)
  raise SystemExit(f"{len(errors)} website acceptance check(s) failed")
 print("PASS: all public page assertions, local link targets, source claims, and metadata")
if __name__ == "__main__": check()
