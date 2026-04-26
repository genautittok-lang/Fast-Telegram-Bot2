# DARKSHARE Mobile App — Build Instructions

This project is wrapped with **Capacitor** to ship as a native Android & iOS app
without rewriting the existing web client. Follow these steps on your local machine.

---

## Prerequisites

| Platform | Required tool                                                                 |
|----------|-------------------------------------------------------------------------------|
| Android  | [Android Studio](https://developer.android.com/studio) (Hedgehog or newer) + JDK 17 |
| iOS      | macOS + [Xcode 15+](https://developer.apple.com/xcode/) + CocoaPods (`sudo gem install cocoapods`) |
| Both     | Node 20+, npm 10+                                                             |

---

## 1. Pull this repo locally

```bash
git clone <your-repo-url> darkshare
cd darkshare
npm install
```

## 2. Build the web bundle

Capacitor reads from `dist/public/`, which is what `npm run build` produces.

```bash
npm run build
```

## 3. Add native platforms (one-time)

```bash
# Android — creates android/ directory
npx cap add android

# iOS (only on macOS) — creates ios/ directory
npx cap add ios
```

## 4. Sync your latest web build into native projects

Run this **every time** you change web code:

```bash
npx cap sync
```

## 5. Open the native project

```bash
# Android Studio
npx cap open android

# Xcode
npx cap open ios
```

---

## App Icons & Splash Screen

Premium DARKSHARE assets (cyan-on-black) live in `mobile/assets/`.
Use [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) to regenerate
all required sizes:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor "#0a0a0a" --splashBackgroundColor "#0a0a0a"
```

Required source files (1024×1024 for icon, 2732×2732 for splash):
- `mobile/assets/icon.png`
- `mobile/assets/splash.png`
- `mobile/assets/icon-foreground.png` (Android adaptive icon)
- `mobile/assets/icon-background.png` (Android adaptive icon)

---

## Config knobs (`capacitor.config.ts`)

- **`appId`**: `app.darkshare.osint` — change BEFORE first store submission, never after.
- **`appName`**: shown under the icon.
- **`server.allowNavigation`**: domains the in-app webview is allowed to navigate to. Add your custom domain here.
- **`backgroundColor`**: `#0a0a0a` (zinc-950 brand).
- **`spinnerColor`**: `#22d3ee` (cyan-400 brand).

---

## Connecting to backend

The app loads the bundled `dist/public/` HTML and points its API requests at
`window.location.origin` (relative URLs). For native builds you have two options:

### Option A — bundle the web client + remote API (recommended)
Set `server.url` in `capacitor.config.ts` to your production API:
```ts
server: { url: "https://api.darkshare.app", androidScheme: "https" }
```
Then in `client/src/lib/queryClient.ts` make sure base URLs use the same origin.

### Option B — fully remote PWA wrap
Point `server.url` directly at your live web app:
```ts
server: { url: "https://darkshare.app", androidScheme: "https" }
```
Trade-off: faster updates (no store re-submission for UI changes) but Apple may
reject "browser wrapper" apps on first review.

---

## Publishing checklist

### Google Play Store ($25 one-time)
1. Sign up: https://play.google.com/console — pay $25, verify identity (1-3 days)
2. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**
3. Save your keystore in a vault — losing it means losing app ownership
4. Play Console → Create app → upload `.aab` → fill listing → submit
5. Review takes 1-7 days (often <24h for first release)

### Apple App Store ($99/year)
1. Sign up: https://developer.apple.com/programs/ — pay $99, identity check
2. Create App ID matching `app.darkshare.osint` in **Certificates, Identifiers & Profiles**
3. In Xcode: **Product → Archive → Distribute App → App Store Connect**
4. App Store Connect → My Apps → fill metadata, screenshots (6.7", 6.1", 5.5", iPad)
5. Submit for review — typically 1-3 days. First review is the strictest.

### Common rejection reasons (pre-empt these)
- **Apple 4.2 "Minimum Functionality"**: don't ship as pure browser wrapper. We have native push + share + status bar — good.
- **Privacy Nutrition Label**: declare data collection in App Store Connect (analytics, account info).
- **Account deletion**: required by Apple as of 2022 — DARKSHARE has `/data-deletion` route, link it.
- **PRO subscription**: Apple takes 30% (15% after year one). Use **In-App Purchase** instead of Telegram Stars/Stripe inside iOS app.

---

## Local development with hot reload

For testing on a real device against your dev server:

```bash
# Start the Replit dev server (already running)
# Then in capacitor.config.ts temporarily set:
#   server: { url: "http://YOUR-LAN-IP:5000", cleartext: true, androidScheme: "http" }

npx cap sync
npx cap run android   # or: npx cap run ios
```

⚠️ Revert `cleartext: false` and remove `server.url` before any release build.

---

## Troubleshooting

| Symptom                                 | Fix                                                                        |
|-----------------------------------------|----------------------------------------------------------------------------|
| White screen on launch                   | Run `npm run build` then `npx cap sync` again — `dist/public/` was stale  |
| `Cleartext HTTP traffic not permitted`   | Set `androidScheme: "https"` and use HTTPS API URL                        |
| Push notifications don't arrive          | Add Firebase config (Android) and APNs cert (iOS); see `@capacitor/push-notifications` docs |
| Splash screen stuck                      | `SplashScreen.hide()` is auto-called; check `launchAutoHide: true` in config |

---

**Status as of 2026-04:** Capacitor scaffold + config is committed. Native folders
(`android/`, `ios/`) are NOT committed (per Capacitor convention) — you generate
them locally with `npx cap add`.
