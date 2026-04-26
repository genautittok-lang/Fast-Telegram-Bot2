# DARKSHARE Mobile Assets

Drop these files here, then run `npx capacitor-assets generate`:

| File                       | Size        | Purpose                              |
|----------------------------|-------------|--------------------------------------|
| `icon.png`                 | 1024×1024   | App icon master                      |
| `icon-foreground.png`      | 432×432     | Android adaptive icon foreground     |
| `icon-background.png`      | 432×432     | Android adaptive icon background (solid #0a0a0a) |
| `splash.png`               | 2732×2732   | Splash screen (centered logo on #0a0a0a) |
| `splash-dark.png`          | 2732×2732   | Same as splash (we are dark-only)    |

**Brand colors** (must match):
- Background: `#0a0a0a` (zinc-950)
- Cyan accent: `#22d3ee` (cyan-400)
- Logo glow:   `#06b6d4` (cyan-500)

You can generate these from the SVG logo at `client/public/logo.svg` (if present) or
the PWA icons at `client/public/icon-512.png` upscaled.
