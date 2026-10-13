"""Generates every derived brand asset from the original logos in packages/brand/source/.

    python3 packages/brand/scripts/generate.py      (requires Pillow: pip install pillow)

Outputs:
  packages/brand/logos/*.webp          trimmed logos for use inside the apps
  apps/mobile/assets/images/*.png      app icon, Android adaptive icon layers, splash, web favicon
  apps/admin/public/favicon.png        browser tab icon

Size optimizations (the logos are flat colors, so none of this is visible):
  - in-app logos are capped at 960 px on their longest side (enough for 3x screens at ~320 pt)
  - every output is reduced to a 128-color palette
  - in-app logos are lossless WebP; app icons and the splash stay PNG because Expo requires it

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
LOGO_MAX_SIZE = 960
SPLASH_MAX_SIZE = 600
PALETTE_COLORS = 128


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


def fit(image: Image.Image, max_size: int) -> Image.Image:
    image = image.copy()
    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    return image


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


def palette(image: Image.Image) -> Image.Image:
    return image.quantize(colors=PALETTE_COLORS, method=Image.Quantize.FASTOCTREE)


def save_png(image: Image.Image, path: Path) -> None:
    palette(image).save(path, optimize=True)


def save_webp(image: Image.Image, path: Path) -> None:
    palette(image).convert("RGBA").save(path, lossless=True, method=6)


def main() -> None:
    LOGOS.mkdir(exist_ok=True)
    for old in LOGOS.glob("*.png"):
        old.unlink()
    for path in sorted(SOURCE.glob("*.png")):
        save_webp(fit(trim(load(path.stem)), LOGO_MAX_SIZE), LOGOS / f"{path.stem}.webp")

    icon_color = load("icon-color")
    icon_black = load("icon-black")

    # App icon (iOS and legacy Android): opaque, the system applies the rounded mask.
    save_png(place(icon_color, 1024, 0.62, WHITE).convert("RGB"), MOBILE_IMAGES / "icon.png")
    # Android adaptive icon: the foreground must fit the 66% safe zone; the background is a flat color
    # (android.adaptiveIcon.backgroundColor in app.json). The monochrome layer is used for themed icons.
    save_png(place(icon_color, 1024, 0.56), MOBILE_IMAGES / "android-icon-foreground.png")
    save_png(place(icon_black, 1024, 0.56), MOBILE_IMAGES / "android-icon-monochrome.png")
    # Splash screen image: transparent, shown over the splash background color.
    save_png(fit(trim(icon_color, padding_ratio=0), SPLASH_MAX_SIZE), MOBILE_IMAGES / "splash-icon.png")
    # Favicons (Expo web and the admin panel).
    save_png(place(icon_color, 48, 0.9), MOBILE_IMAGES / "favicon.png")
    save_png(place(icon_color, 64, 0.9), ADMIN_PUBLIC / "favicon.png")

    print("Brand assets generated.")


if __name__ == "__main__":
    main()
