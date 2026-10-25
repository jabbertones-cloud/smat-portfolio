#!/usr/bin/env python3
"""Rebuild the first-party SMAT Designs Open Graph cover (requires Pillow on macOS).

Sources are existing SMAT portfolio product images; no licensed external images.
The deployed file is committed so CI and production do not require Pillow.
"""
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance
from pathlib import Path

root = Path(__file__).resolve().parent.parent
W, H = 1200, 630
img = Image.new("RGB", (W,H), "#050505")
d = ImageDraw.Draw(img)

def font(name, size):
    return ImageFont.truetype("/System/Library/Fonts/Supplemental/" + name, size)

def panel(path, box):
    photo = Image.open(root/"images"/path).convert("RGB")
    x,y,w,h=box
    photo = ImageOps.fit(photo, (w,h), method=Image.Resampling.LANCZOS, centering=(0.5,0.47))
    photo = ImageEnhance.Contrast(photo).enhance(1.07)
    img.paste(photo,(x,y))

# A restrained cross-section of original studio portfolio visuals.
panel("skynpatch-grace-product.webp",(742,0,223,310))
panel("plushtrap-satin-jacket-1.webp",(973,0,227,310))
panel("bws-box.webp",(742,318,458,312))

# Grid rhythm; wide dark brand field keeps copy legible at mobile share sizes.
d.rectangle((732,0,741,H),fill="#FF8C00")
d.rectangle((963,0,972,318),fill="#050505")
d.rectangle((742,309,1200,317),fill="#050505")
d.rectangle((60,75,685,77),fill="#393939")
d.rectangle((60,447,690,451),fill="#FF8C00")

d.text((60,38),"INDEPENDENT STUDIO   /   TEMPE, ARIZONA",font=font("Arial Bold.ttf",19),fill="#BDBDBD")
d.text((56,128),"SMAT",font=font("Impact.ttf",186),fill="#F2F2EE",stroke_width=0)
d.text((60,330),"DESIGNS",font=font("Arial Bold.ttf",83),fill="#FF8C00")
d.text((60,481),"SOFTWARE   /   ECOMMERCE   /   DESIGN",font=font("Arial Bold.ttf",23),fill="#EAEAEA")
d.text((60,567),"smatdesigns.com",font=font("Arial.ttf",23),fill="#A2A2A2")
d.rectangle((60,604,123,609),fill="#FF8C00")
out=root/"images"/"og-image.webp"
img.save(out, "WEBP", quality=85, method=6)
with Image.open(out) as check:
    assert check.size == (1200,630) and check.format=="WEBP"
print("CREATED",out, out.stat().st_size,"bytes; 1200x630")
print("TITLE_BOX",d.textbbox((60,330),"DESIGNS",font=font("Arial Bold.ttf",83)))
