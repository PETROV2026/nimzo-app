"""Generates every derived brand asset from the original logos in packages/brand/source/.

    python3 packages/brand/scripts/generate.py      (requires Pillow: pip install pillow)

Outputs:
  packages/brand/logos/*.png           trimmed logos for use inside the apps
  apps/mobile/assets/images/*.png      app icon, Android adaptive icon layers, splash, web favicon
  apps/admin/public/favicon.png        browser tab icon

Run it again whenever a file in source/ changes, and commit the results.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "packages/brand/source"
LOGOS = ROOT / "packages/brand/logos"
MOBILE_IMAGES = ROOT / "apps/mobile/assets/images"
ADMIN_PUBLIC = ROOT / "apps/admin/public"

WHITE = (255, 255, 255, 255)


def load(name: str) -> Image.Image:
    return Image.open(SOURCE / f"{name}.png").convert("RGBA")


def trim(image: Image.Image, padding_ratio: float = 0.02) -> Image.Image:
    """Crops the transparent margin, keeping a small even padding."""
    box = image.getchannel("A").getbbox()
    content = image.crop(box)
    pad = round(max(content.size) * padding_ratio)
    out = Image.new("RGBA", (content.width + 2 * pad, content.height + 2 * pad), (0, 0, 0, 0))
    out.paste(content, (pad, pad))
    return out


def place(content: Image.Image, size: int, max_ratio: float, background=(0, 0, 0, 0)) -> Image.Image:
    """Centers `content` on a square canvas, scaled so its longest side is `max_ratio` of the canvas."""
    content = trim(content, padding_ratio=0)
    scale = size * max_ratio / max(content.size)
    resized = content.resize(
        (round(content.width * scale), round(content.height * scale)), Image.Resampling.LANCZOS
    )
    canvas = Image.new("RGBA", (size, size), background)
    canvas.paste(resized, ((size - resized.width) // 2, (size - resized.height) // 2), resized)
    return canvas


def main() -> None:
    LOGOS.mkdir(exist_ok=True)
    for path in sorted(SOURCE.glob("*.png")):
        trim(load(path.stem)).save(LOGOS / path.name, optimize=True)

    icon_color = load("icon-color")
    icon_black = load("icon-black")

    # App icon (iOS and legacy Android): opaque, the system applies the rounded mask.
    place(icon_color, 1024, 0.62, WHITE).convert("RGB").save(MOBILE_IMAGES / "icon.png", optimize=True)
    # Android adaptive icon: the foreground must fit the 66% safe zone; the background is a flat color
    # (android.adaptiveIcon.backgroundColor in app.json). The monochrome layer is used for themed icons.
    place(icon_color, 1024, 0.56).save(MOBILE_IMAGES / "android-icon-foreground.png", optimize=True)
    place(icon_black, 1024, 0.56).save(MOBILE_IMAGES / "android-icon-monochrome.png", optimize=True)
    # Splash screen image: transparent, shown over the splash background color.
    trim(icon_color, padding_ratio=0).save(MOBILE_IMAGES / "splash-icon.png", optimize=True)
    # Favicons (Expo web and the admin panel).
    place(icon_color, 48, 0.9).save(MOBILE_IMAGES / "favicon.png", optimize=True)
    place(icon_color, 64, 0.9).save(ADMIN_PUBLIC / "favicon.png", optimize=True)

    print("Brand assets generated.")


if __name__ == "__main__":
    main()
