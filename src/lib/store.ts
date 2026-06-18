import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { nextTimeAt } from '@/lib/format';
import { deletePhotoFile, persistPhoto } from '@/lib/photo-storage';
import type { Identity, Night, Photo } from '@/lib/types';

/** Reveal happens at 10:00 AM the next morning. */
export const REVEAL_HOUR = 10;
export const REVEAL_MINUTE = 0;

const KEYS = {
  identity: 'ma:identity',
  nights: 'ma:nights',
  photos: 'ma:photos',
};

type State = {
  loaded: boolean;
  identity: Identity | null;
  nights: Night[];
  photosByNight: Record<string, Photo[]>;
};

let state: State = {
  loaded: false,
  identity: null,
  nights: [],
  photosByNight: {},
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function set(partial: Partial<State>) {
  state = { ...state, ...partial };
  emit();
}

// ---- ids -------------------------------------------------------------------

function uid(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

const CODE_WORDS = ['GLOW', 'NEON', 'HAZE', 'RIOT', 'VIBE', 'DUSK', 'GOLD', 'WILD'];
function inviteCode(): string {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

// ---- persistence -----------------------------------------------------------

async function persistNights() {
  await AsyncStorage.setItem(KEYS.nights, JSON.stringify(state.nights));
}
async function persistPhotos() {
  await AsyncStorage.setItem(KEYS.photos, JSON.stringify(state.photosByNight));
}

export async function hydrate(): Promise<void> {
  if (state.loaded) return;
  try {
    const [idRaw, nightsRaw, photosRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.identity),
      AsyncStorage.getItem(KEYS.nights),
      AsyncStorage.getItem(KEYS.photos),
    ]);
    set({
      loaded: true,
      identity: idRaw ? JSON.parse(idRaw) : null,
      nights: nightsRaw ? JSON.parse(nightsRaw) : [],
      photosByNight: photosRaw ? JSON.parse(photosRaw) : {},
    });
  } catch (e) {
    console.warn('hydrate failed', e);
    set({ loaded: true });
  }
}

// ---- identity --------------------------------------------------------------

export async function saveIdentity(name: string): Promise<Identity> {
  const identity: Identity = state.identity
    ? { ...state.identity, name: name.trim() }
    : { id: uid('u_'), name: name.trim() };
  set({ identity });
  await AsyncStorage.setItem(KEYS.identity, JSON.stringify(identity));
  return identity;
}

// ---- nights ----------------------------------------------------------------

export function getActiveNight(): Night | undefined {
  return state.nights.find((n) => n.status === 'active');
}

export function getNight(id: string): Night | undefined {
  return state.nights.find((n) => n.id === id);
}

export async function createNight(name: string, revealHour: number = REVEAL_HOUR): Promise<Night> {
  const me = state.identity;
  const now = Date.now();
  const night: Night = {
    id: uid('n_'),
    name: name.trim() || 'Tonight',
    code: inviteCode(),
    createdAt: now,
    revealAt: nextTimeAt(revealHour, REVEAL_MINUTE, now),
    status: 'active',
    members: me ? [{ id: me.id, name: me.name, isYou: true }] : [],
    photoCount: 0,
  };
  set({ nights: [night, ...state.nights] });
  await persistNights();
  return night;
}

/**
 * Join by code. In this local prototype there's no shared server, so if the code
 * isn't one we created we fabricate a night with the same code + a couple of
 * simulated friends so the flow is demoable end-to-end on one device.
 */
export async function joinNight(code: string): Promise<Night> {
  const me = state.identity;
  const trimmed = code.trim().toUpperCase();
  const existing = state.nights.find((n) => n.code === trimmed && n.status === 'active');
  if (existing) return existing;

  const now = Date.now();
  const night: Night = {
    id: uid('n_'),
    name: 'Friends’ night',
    code: trimmed,
    createdAt: now,
    revealAt: nextTimeAt(REVEAL_HOUR, REVEAL_MINUTE, now),
    status: 'active',
    members: [
      ...(me ? [{ id: me.id, name: me.name, isYou: true }] : []),
      { id: uid('f_'), name: 'Sam' },
      { id: uid('f_'), name: 'Alex' },
    ],
    photoCount: 0,
  };
  set({ nights: [night, ...state.nights] });
  await persistNights();
  return night;
}

export async function renameNight(id: string, name: string): Promise<void> {
  set({
    nights: state.nights.map((n) => (n.id === id ? { ...n, name: name.trim() || n.name } : n)),
  });
  await persistNights();
}

export async function setNightCover(id: string, coverPhotoId: string): Promise<void> {
  set({
    nights: state.nights.map((n) => (n.id === id ? { ...n, coverPhotoId } : n)),
  });
  await persistNights();
}

export async function deleteNight(id: string): Promise<void> {
  const photos = state.photosByNight[id] ?? [];
  const { [id]: _removed, ...rest } = state.photosByNight;
  set({
    nights: state.nights.filter((n) => n.id !== id),
    photosByNight: rest,
  });
  await Promise.all([persistNights(), persistPhotos()]);
  // Best-effort cleanup of the underlying image files.
  await Promise.all(photos.map((p) => deletePhotoFile(p.uri)));
}

export async function revealNight(id: string): Promise<void> {
  set({
    nights: state.nights.map((n) => (n.id === id ? { ...n, status: 'revealed' } : n)),
  });
  await persistNights();
}

/** Dev/testing tool: bring the reveal time to ~5 seconds out so the magic moment is testable now. */
export async function simulateMorning(id: string): Promise<void> {
  set({
    nights: state.nights.map((n) =>
      n.id === id ? { ...n, revealAt: Date.now() + 5000 } : n,
    ),
  });
  await persistNights();
}

// ---- photos ----------------------------------------------------------------

export function getPhotos(nightId: string): Photo[] {
  return state.photosByNight[nightId] ?? [];
}

export async function addPhoto(args: {
  nightId: string;
  uri: string;
  base64?: string | null;
}): Promise<Photo> {
  const me = state.identity;
  const id = uid('p_');
  const storedUri = await persistPhoto({ id, uri: args.uri, base64: args.base64 });
  const photo: Photo = {
    id,
    nightId: args.nightId,
    uri: storedUri,
    takenAt: Date.now(),
    takenById: me?.id ?? 'unknown',
    takenByName: me?.name ?? 'You',
    flagged: false,
  };
  const list = [...(state.photosByNight[args.nightId] ?? []), photo];
  set({
    photosByNight: { ...state.photosByNight, [args.nightId]: list },
    nights: state.nights.map((n) =>
      n.id === args.nightId ? { ...n, photoCount: list.length } : n,
    ),
  });
  await Promise.all([persistPhotos(), persistNights()]);
  return photo;
}

export async function flagPhoto(nightId: string, photoId: string): Promise<void> {
  const list = (state.photosByNight[nightId] ?? []).map((p) =>
    p.id === photoId ? { ...p, flagged: !p.flagged } : p,
  );
  set({ photosByNight: { ...state.photosByNight, [nightId]: list } });
  await persistPhotos();
}

export async function deletePhoto(nightId: string, photoId: string): Promise<void> {
  const target = (state.photosByNight[nightId] ?? []).find((p) => p.id === photoId);
  const list = (state.photosByNight[nightId] ?? []).filter((p) => p.id !== photoId);
  set({
    photosByNight: { ...state.photosByNight, [nightId]: list },
    nights: state.nights.map((n) =>
      n.id === nightId ? { ...n, photoCount: list.length } : n,
    ),
  });
  await Promise.all([persistPhotos(), persistNights()]);
  if (target) await deletePhotoFile(target.uri);
}

// ---- React bindings --------------------------------------------------------

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function useIdentity() {
  return useStore((s) => s.identity);
}
export function useLoaded() {
  return useStore((s) => s.loaded);
}
export function useActiveNight() {
  return useStore((s) => s.nights.find((n) => n.status === 'active'));
}
export function useNights() {
  return useStore((s) => s.nights);
}
export function useNightById(id: string | undefined) {
  return useStore((s) => s.nights.find((n) => n.id === id));
}
// Stable reference so useSyncExternalStore doesn't see a new [] every render
// (returning a fresh array literal causes an infinite re-render loop).
const EMPTY_PHOTOS: Photo[] = [];
export function usePhotos(nightId: string | undefined) {
  return useStore((s) => (nightId ? (s.photosByNight[nightId] ?? EMPTY_PHOTOS) : EMPTY_PHOTOS));
}
