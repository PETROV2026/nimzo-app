# @nimzo/brand

Nimzo logos, shared by `apps/mobile` and `apps/admin`.

```
packages/brand/
├── source/       original logos (2000×2000, transparent). Edit or replace these only.
├── logos/        trimmed versions for use inside the apps (generated)
└── scripts/
    └── generate.py   regenerates logos/, the mobile app icons and the favicons
```

## Which logo to use

| File | Use |
|---|---|
| `logo-horizontal-color.png` | Default logo on light backgrounds: headers, login, admin sidebar |
| `logo-horizontal-black.png` | Single-color contexts on light backgrounds (print, PDF) |
| `logo-horizontal-white.png` | On dark or colored backgrounds |
| `logo-stacked-color.png` | Square-ish spaces: splash-like screens, empty states |
| `logo-stacked-black.png` / `logo-stacked-white.png` | Stacked variant for single-color / dark backgrounds |
| `logo-stacked-yellow.png` | Stacked variant with yellow icon and white text, for dark backgrounds |
| `icon-color.png` | Icon without the name: app icon, favicon, small spaces |
| `icon-black.png` / `icon-white.png` | Single-color icon (Android themed icon, dark backgrounds) |

## Using a logo

```tsx
// apps/admin (Vite)
import logo from '@nimzo/brand/logos/logo-horizontal-color.png';
<img src={logo} alt="Nimzo" height={40} />;

// apps/mobile (Expo)
import { Image } from 'expo-image';
<Image
  source={require('@nimzo/brand/logos/logo-horizontal-color.png')}
  style={{ width: 160, height: 62 }}
  contentFit="contain"
  accessibilityLabel="Nimzo"
/>;
```

Always give the logo an accessible name (`alt` / `accessibilityLabel`) and don't stretch it: keep its aspect ratio (`contentFit="contain"` or set only one dimension on the web).

## Changing the logo

1. Replace the files in `source/` (keep the file names).
2. Run `pnpm brand:assets` (requires Python 3 and Pillow: `pip3 install pillow`).
3. Commit `source/`, `logos/` and the regenerated files in `apps/mobile/assets/images/` and `apps/admin/public/`.
