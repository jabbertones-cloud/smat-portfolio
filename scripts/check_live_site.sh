#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-https://smatdesigns.com}"
BASE="${BASE%/}"
REVISION='2026-10-08-amazon-website-verification'

# A 200 status is insufficient: old Pages setups can return the homepage
# for every unknown path. Test distinct real page content and TLS as well.
paths=("/" "/software/" "/services/" "/case-studies/" "/contact/" "/privacy/" "/terms/")
# The expected title text differs for every page, preventing fallback 200s from passing.
needles=(
  "SMAT Designs | Software, Ecommerce & Design Studio"
  "Software Products & Seller Tools"
  "Services, Capabilities & Pricing"
  "Case Studies & Verifiable Portfolio"
  "Company & Contact Information"
  "Privacy Policy"
  "Terms of Service"
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

if [[ "$fail" -ne 0 ]]; then
  echo "HTTP route acceptance FAILED"
  exit 1
fi
echo "HTTP route acceptance PASS: 7 unique pages, release marker, sitemap and robots"
