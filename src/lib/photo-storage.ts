import { Platform } from 'react-native';

/**
 * Persist a freshly captured photo so its uri survives app restarts.
 *
 * - Native: expo-camera writes to the cache dir (which the OS can evict). We copy
 *   it into the document dir under /photos so it sticks around for the reveal.
 * - Web: takePictureAsync gives us a base64 payload; we keep it as a data uri
 *   (blob: object urls don't survive a reload).
 *
 * This is the local-first storage boundary — Phase 2 (Supabase) would upload here.
 */
export async function persistPhoto(args: {
  id: string;
  uri: string;
  base64?: string | null;
}): Promise<string> {
  if (Platform.OS === 'web') {
    const { uri, base64 } = args;
    // expo-camera web may return base64 already prefixed with `data:` — don't double-prefix.
    if (base64) {
      return base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
    }
    // uri may itself be a data:/blob:/http URL we can use directly.
    if (uri) return uri;
    return uri;
  }

  // Lazy-require so the web bundle never pulls in the native module.
  const FileSystem = require('expo-file-system/legacy');
  const dir = `${FileSystem.documentDirectory}photos/`;
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    const dest = `${dir}${args.id}.jpg`;
    await FileSystem.copyAsync({ from: args.uri, to: dest });
    return dest;
  } catch (e) {
    // If the copy fails for any reason, fall back to the original uri.
    console.warn('persistPhoto: falling back to original uri', e);
    return args.uri;
  }
}

export async function deletePhotoFile(uri: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!uri.startsWith('file://')) return;
  try {
    const FileSystem = require('expo-file-system/legacy');
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // best-effort cleanup
  }
}
