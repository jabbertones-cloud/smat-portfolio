#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-https://smatdesigns.com}"
BASE="${BASE%/}"
REVISION='2026-10-08-amazon-website-verification'

# A 200 status is insufficient: old Pages setups can return the homepage
# for every unknown path. Test distinct real page content and TLS as well.
paths=("/" "/software/" "/services/" "/case-studies/" "/contact/" "/privacy/" "/terms/" "/a-plus-content/" "/security/")
# The expected title text differs for every page, preventing fallback 200s from passing.
needles=(
  "SMAT Designs | Software, Ecommerce & Design Studio"
  "Software Products & Seller Tools"
  "Services, Capabilities & Pricing"
  "Case Studies & Verifiable Portfolio"
  "Company & Contact Information"
  "Privacy Policy"
  "Terms of Service"
  "Amazon A+ Content Services"
  "Security and Incident Reporting"
)

fail=0
for i in "${!paths[@]}"; do
  path="${paths[i]}"
  expected="${needles[i]}"
  body="$(mktemp)"
  status="$(curl -fsSL --max-time 20 --retry 3 --retry-delay 2 -o "$body" -w '%{http_code}' "$BASE$path" || true)"
  if [[ "$status" != "200" ]]; then
    echo "FAIL $path status=$status"; fail=1
  elif ! grep -Fq "$REVISION" "$body"; then
    echo "FAIL $path missing release marker"; fail=1
  elif ! grep -Fq "$expected" "$body"; then
    echo "FAIL $path has incorrect page body or title"; fail=1
  else
    echo "PASS $path status=200 revision=$REVISION"
  fi
  rm -f "$body"
done

for path in /sitemap.xml /robots.txt; do
  status="$(curl -sSL --max-time 20 -o /dev/null -w '%{http_code}' "$BASE$path" || true)"
  if [[ "$status" != "200" ]]; then
    echo "FAIL $path status=$status"; fail=1
  else
    echo "PASS $path status=200"
  fi
done

# Production-only controls that a static build cannot prove.
canonical="$(curl -sSL --max-time 15 "$BASE/" | grep -F '<link rel="canonical" href="https://smatdesigns.com/">' || true)"
if [[ -z "$canonical" ]]; then echo "FAIL homepage canonical missing"; fail=1; else echo "PASS homepage canonical"; fi
if curl -sSL --max-time 15 "$BASE/" | grep -Fq 'class="preloader"'; then echo "FAIL blocking preloader still shipped"; fail=1; else echo "PASS homepage no blocking preloader"; fi
www_code="$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' https://www.smatdesigns.com/ || true)"
www_location="$(curl -sSI --max-time 15 https://www.smatdesigns.com/ | tr -d '\r' | grep -i '^location:' | head -n 1 || true)"
if [[ "$www_code" != "301" || "$www_location" != *"https://smatdesigns.com/"* ]]; then
  echo "FAIL www canonical redirect code=$www_code location=$www_location"; fail=1
else echo "PASS www -> apex 301"; fi
aiscent_code="$(curl -sSL --max-time 20 -o /dev/null -w '%{http_code}' https://aiscentmcp.com/ || true)"
if [[ "$aiscent_code" != "200" ]]; then echo "FAIL linked AiSCent homepage status=$aiscent_code"; fail=1; else echo "PASS linked AiSCent website"; fi
image_headers="$(curl -sSI --max-time 15 "$BASE/images/skynpatch-grace-perfect.webp")"
if ! echo "$image_headers" | grep -qi 'max-age=31536000, immutable'; then echo "FAIL image immutable cache"; fail=1; else echo "PASS immutable image cache"; fi

if [[ "$fail" -ne 0 ]]; then
  echo "HTTP route acceptance FAILED"
  exit 1
fi
echo "HTTP route acceptance PASS: 9 unique pages, canonical redirect, images, linked site, release marker, sitemap and robots"
