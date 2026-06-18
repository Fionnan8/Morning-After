# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> **Version note:** pinned to **Expo SDK 54** (React Native 0.81, React 19.1) to keep running in the user's **Expo Go**. Do **not** upgrade the SDK; read the **v54** docs (https://docs.expo.dev/versions/v54.0.0/) for API details.

## The app

**Morning After** — friends create a group for a night out, take in-app photos that stay locked for everyone, then all unlock together the next morning (the "reveal"). It is a **local-first prototype**: there is **no backend**, no real auth, and no cross-device sync yet. A Supabase backend with anonymous-first auth is the planned Phase 2; the `store`/`identity` layer is the intended swap point.

## Environment & commands

- **Node lives at `~/.local/node`** and is not on the default PATH. Prefix shell commands: `export PATH="$HOME/.local/node/bin:$PATH"`. There is no `git` and no Xcode Command Line Tools available. The project path contains a space (`Claude Code/Example project`) — quote it.
- **Install packages with `npx expo install <pkg>`**, never plain `npm install <pkg>` — Expo pins SDK-54-compatible versions.
- **Run:** `npx expo start` (interactive: `w` web, `i`/`a` simulators, or scan the QR with Expo Go). Web-only: `npx expo start --web`.
- **Typecheck (primary correctness gate — there are no tests):** `npx tsc --noEmit`.
- **Lint:** `npm run lint` (`expo lint`).
- **Verify a change actually works:** there is no test suite. The established loop is `npx tsc --noEmit`, then bundle web with `npx expo export --platform web` to catch import/runtime errors, then drive the running web build in a real browser (the project has been verified by launching system Chrome via Playwright with `--use-fake-device-for-media-stream` to exercise the camera headlessly).

## Architecture (the parts that span files)

**State — single external store.** All app state lives in [src/lib/store.ts](src/lib/store.ts): one module-level `state` object, mutated through exported action functions, exposed to React via `useSyncExternalStore` hooks (`useActiveNight`, `useNights`, `usePhotos`, etc.). Persistence is `@react-native-async-storage/async-storage` (works on web via localStorage). Types are in [src/lib/types.ts](src/lib/types.ts): `Identity`, `Night` (has `revealAt`, `status`, `coverPhotoId`), `Photo`.
- **Gotcha:** store selectors must return **stable references**. Returning a fresh `[]`/object literal each call makes `useSyncExternalStore` loop infinitely ("Maximum update depth exceeded"). See the shared `EMPTY_PHOTOS` constant — reuse that pattern.

**Photo storage.** Metadata is in the store; image bytes go through [src/lib/photo-storage.ts](src/lib/photo-storage.ts). Native copies the capture into the document dir; **web uses a data URI** — and `expo-camera` on web returns base64 that is *already* `data:`-prefixed, so do not double-prefix it. `expo-file-system` is imported from the **`expo-file-system/legacy`** subpath (SDK 54 moved the old string API there).

**Navigation — custom pager, not tabs.** Routing is expo-router (file-based, root = `src/app`, alias `@/* → src/*`). [src/app/index.tsx](src/app/index.tsx) is **not** a tab navigator — it's a horizontal paged `ScrollView` (Tonight ◀ Camera ▶ Library) with a custom bottom bar. Other routes: `onboarding`, `night/[id]` (the live night room), `camera` (full-screen modal), `reveal/[id]` and `library/[id]` (both fullscreen). The root [src/app/_layout.tsx](src/app/_layout.tsx) hydrates the store, gates to onboarding when there's no identity, and routes notification taps.
- The pager measures its container with `onLayout` — **do not use `Dimensions.get('window').width`** for page width, because the web build is letterboxed (see below) so window width ≠ usable width. The photo viewer has the same requirement.

**Web is a first-class target and has sharp edges** (the app is regularly tested in desktop Chrome):
- The whole app is **letterboxed into a ~440px portrait phone column** on web in `_layout.tsx`. Layout code must not assume full window width.
- `Alert.alert` with buttons is a **no-op on react-native-web** — its callbacks never fire. Use the [src/components/confirm-dialog.tsx](src/components/confirm-dialog.tsx) `ConfirmDialog` (or a custom modal), never `Alert`, for anything actionable.
- React Native `Modal` portals to the document root, escaping the phone-frame, so every sheet/modal self-constrains with `maxWidth` + `alignSelf: 'center'`.
- A horizontal `ScrollView` can't be swiped with a desktop mouse (only touch/trackpad). Swipe gestures are a phone feature; bottom-bar taps are the web fallback.

**Camera.** [src/components/camera-capture.tsx](src/components/camera-capture.tsx) is shared by the `/camera` modal and the pager's camera page. `key={facing}` forces a `CameraView` remount so flipping front/back actually switches devices; `isActive` gates whether the live camera mounts (the pager passes `false` for off-screen pages so the webcam isn't always on).

**The reveal mechanic.** Each `Night.revealAt` is an epoch ms; the vault stays locked until `Date.now() >= revealAt` (`REVEAL_HOUR` defaults to 10 AM). `simulateMorning()` is a **dev-only shortcut** that sets `revealAt = now + 5s` — it is currently always visible in the night room and should be gated behind `__DEV__` before any real build.

**Expo Go constraints (already designed around — keep them in mind):** local/scheduled notifications only, no remote push ([src/lib/notifications.ts](src/lib/notifications.ts) is fully web/Expo-Go guarded). Invite sharing uses deep links + clipboard; photo sharing uses the OS share sheet (native) or a watermarked-canvas download (web) in [src/lib/sharing.ts](src/lib/sharing.ts). Direct Instagram/TikTok "Story" sharing and remote push need a custom dev build and are intentionally stubbed.

## Conventions

- **Dark theme only.** Colors, gradients (`HeroGradient`/`SunriseGradient`/`BackdropGradient`), gradient directions (`GradDir`), `Radius`, and `Space` come from [src/constants/night.ts](src/constants/night.ts). Vary `GradDir` across gradients so the UI isn't visually uniform.
- **No emoji in the UI.** Use the icon wrappers in [src/components/icon.tsx](src/components/icon.tsx) — `Icon` (Ionicons) for UI, `BrandIcon` (FontAwesome) for share-channel brand glyphs.
- Shared UI primitives (`Screen`, `Txt`, `Button`, `Card`, `Pill`, `Backdrop`) live in [src/components/kit.tsx](src/components/kit.tsx). Page screens use `<Screen edges={['top']}>` (the bottom bar handles the bottom inset — mismatched edges caused a visible layout jump).
