# @nimzo/brand

Nimzo logos and brand images, shared by `apps/mobile` and `apps/admin`.

```
packages/brand/
├── images/       background photos, optimized WebP (see "Images")
├── source/       original logos (2000×2000, transparent). Edit or replace these only.
├── logos/        optimized versions for use inside the apps: trimmed, ≤960 px, WebP (generated)
└── scripts/
    └── generate.py   regenerates logos/, the mobile app icons and the favicons
```

## Which logo to use

| File (`logos/`) | Use |
|---|---|
| `logo-horizontal-color.webp` | Default logo on light backgrounds: headers, login, admin sidebar |
| `logo-horizontal-black.webp` | Single-color contexts on light backgrounds (print, PDF) |
| `logo-horizontal-white.webp` | On dark or colored backgrounds |
| `logo-stacked-color.webp` | Square-ish spaces: splash-like screens, empty states |
| `logo-stacked-black.webp` / `logo-stacked-white.webp` | Stacked variant for single-color / dark backgrounds |
| `logo-stacked-yellow.webp` | Stacked variant with yellow icon and white text, for dark backgrounds |
| `icon-color.webp` | Icon without the name: app icon, favicon, small spaces |
| `icon-black.webp` / `icon-white.webp` | Single-color icon (Android themed icon, dark backgrounds) |

## Using a logo

```tsx
// apps/admin (Vite)
import logo from '@nimzo/brand/logos/logo-horizontal-color.webp';
<img src={logo} alt="Nimzo" height={40} />;

// apps/mobile (Expo)
import { Image } from 'expo-image';
<Image
  source={require('@nimzo/brand/logos/logo-horizontal-color.webp')}
  style={{ width: 160, height: 62 }}
  contentFit="contain"
  accessibilityLabel="Nimzo"
/>;
```

Always give the logo an accessible name (`alt` / `accessibilityLabel`) and don't stretch it: keep its aspect ratio (`contentFit="contain"` or set only one dimension on the web).

Logos are WebP (much lighter than PNG; supported by Expo and every modern browser). App icons and the splash stay PNG because Expo requires it.

## Images

`images/` holds photos used as decorative backgrounds. They are WebP, ≤1800 px wide and stripped of metadata (`cwebp -q 70 -m 6 -resize 1800 0 -metadata none`), so each one stays around 100 KB.

| File (`images/`) | Use | Source |
|---|---|---|
| `login-panel.webp` | Admin login brand panel, under a teal overlay | Photo by [Valentin Lacoste](https://unsplash.com/@valentinlacoste) on [Unsplash](https://unsplash.com/photos/YkPY2Awkra8) ([Unsplash License](https://unsplash.com/license)) |

Always show these photos under a brand-color overlay when text sits on top, and check that the text still meets WCAG contrast.

## Changing the logo

1. Replace the files in `source/` (keep the file names).
2. Run `pnpm brand:assets` (requires Python 3 and Pillow: `pip3 install pillow`).
3. Commit `source/`, `logos/` and the regenerated files in `apps/mobile/assets/images/` and `apps/admin/public/`.
