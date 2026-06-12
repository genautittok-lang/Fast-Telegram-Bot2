---
name: OG image font shipping
description: Why /og/*.png silently 503s in production unless fonts are resolved from cwd AND copied into dist/.
---

Dynamic OG images (satori + @resvg/resvg-js) need the Inter .woff fonts at runtime. Two
constraints must stay in lockstep or every `/og/*.png` returns 503 and all social/link
previews silently break (the headline share feature):

1. **Resolve fonts from `process.cwd()` only.** esbuild bundles the server to CJS, where
   `import.meta` is empty and `__dirname` points into the bundle — neither locates the fonts.
   The loader tries `cwd/server/fonts`, `cwd/fonts`, `cwd/dist/fonts`.

2. **The build must copy fonts into `dist/fonts`.** The Docker runtime stage (and any deploy
   target) only copies `dist/`, never `server/`. So `script/build.ts` copies
   `server/fonts → dist/fonts`, which matches the loader's `cwd/dist/fonts` candidate.

**Why:** It works on Replit dev only because the whole repo sits at cwd. In Docker/Railway
the repo isn't present — only `dist/` — so without the copy step `FONTS_OK=false`.

**How to apply:** If you change the font loader candidate paths, the build copy target, or
the Dockerfile's COPY list, keep all three consistent. The OG render routes are also
unauthenticated and CPU-bound — they rate-limit only the cache-miss (fresh render) path per IP.
