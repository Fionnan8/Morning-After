# 🌙 Morning After

Take photos on your night out — they stay **locked for everyone** until the next morning, when you all unlock them together.

Morning After turns a night out into a shared, anticipated event. You create a group for the night, everyone captures candid photos in-app, and nothing is visible to anyone until the **reveal** the following morning. No instant gratification, no curating in the moment — just the unfiltered story of last night, revealed together.

## How it works

1. **Start a night** — name it, pick when it unlocks (default 10 AM), and share the invite code with your friends.
2. **Capture** — take photos in the app all night. They drop straight into a sealed vault. Nobody can see them yet — not even you.
3. **The reveal** — when the unlock time hits, the vault opens with a sunrise animation and everyone swipes through the night.
4. **Keep it** — every night lands in your Library to rename, set a cover, save favourites, or share.

## The design framework

The app is built around five deliberate pillars:

- **Core function** — locked in-app photo capture.
- **Core loop** — the morning reveal (the moment the whole app exists for).
- **Accessory features** — group create/join, save to camera roll, share, offline capture, privacy controls (hide/remove yourself from a photo).
- **Surface-area check** — three swipeable surfaces (Tonight · Camera · Library) and a handful of focused modals. No menu sprawl.
- **Retention hook** — a permanent Library of past nights plus evening "going out tonight?" nudges so it's never a one-time use.

## Tech

- **Expo SDK 54** · React Native 0.81 · React 19.1 · TypeScript
- **expo-router** (file-based routing, root at `src/app`)
- **expo-camera**, **expo-media-library**, **expo-sharing**, **expo-notifications**, **expo-image**, **expo-linear-gradient**
- Local-first state in a small `useSyncExternalStore` store persisted with AsyncStorage

It runs in **Expo Go** (iOS/Android) and in the **browser** (web is letterboxed into a portrait phone column for a phone-like preview).

> **Status: local-first prototype.** There is no backend yet — state lives on-device and photos don't sync across phones. A Supabase backend with frictionless (anonymous-first) auth for real cross-device groups is the planned next phase; the store/identity layer is the swap point.

## Getting started

> Uses `npx expo install` (not plain `npm install <pkg>`) so dependency versions stay SDK-54-compatible.

```bash
npm install          # install dependencies
npx expo start       # start the dev server
```

From the dev server: press `w` for web, `i` / `a` for simulators, or scan the QR code with **Expo Go** on your phone (a physical device is best for the camera).

### Useful commands

```bash
npx expo start --web              # run in the browser
npx tsc --noEmit                  # typecheck (primary correctness gate — no test suite)
npm run lint                      # lint (expo lint)
npx expo export --platform web    # production web bundle (also surfaces build errors)
```

### Testing the reveal without waiting

In a live night room there's a **dev "simulate morning"** shortcut that sets the unlock time ~5 seconds out, so you can experience the full reveal immediately. (It's a development-only affordance.)

## Notes & limitations

- **Expo Go scope:** local/scheduled notifications only (no remote push), and the OS share sheet for photos. Direct Instagram/TikTok "Story" sharing and remote push require a custom dev build and are intentionally stubbed.
- More detailed architecture and conventions for contributors live in [CLAUDE.md](CLAUDE.md).
