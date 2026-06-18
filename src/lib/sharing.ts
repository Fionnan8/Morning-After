import * as Clipboard from 'expo-clipboard';
import { Linking, Platform, Share } from 'react-native';

import { formatClock } from '@/lib/format';
import type { Night } from '@/lib/types';

const APP_NAME = 'Morning After';

export function buildInviteMessage(night: Night): string {
  return `Join my ${APP_NAME} night “${night.name}” 🌙\nUse code ${night.code} — photos unlock at ${formatClock(night.revealAt)}.`;
}

/** Open an external url/scheme, opening a new tab on web. */
async function openExternal(url: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      (window as any).open(url, '_blank');
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export type InviteChannel = 'whatsapp' | 'instagram' | 'snapchat' | 'messages' | 'copy' | 'more';

/**
 * Invite via a specific app. WhatsApp/SMS accept prefilled text via deep link,
 * so those open straight to a composed message. Instagram/Snapchat have no public
 * text-prefill deep link, so we copy the invite and open the app for the user to
 * paste — returns 'copied' so the UI can tell them.
 */
export async function inviteVia(channel: InviteChannel, night: Night): Promise<'shared' | 'copied'> {
  const text = buildInviteMessage(night);
  const enc = encodeURIComponent(text);

  switch (channel) {
    case 'whatsapp':
      await openExternal(`https://wa.me/?text=${enc}`);
      return 'shared';
    case 'messages': {
      const sep = Platform.OS === 'ios' ? '&' : '?';
      await openExternal(`sms:${sep}body=${enc}`);
      return 'shared';
    }
    case 'instagram':
      await Clipboard.setStringAsync(text);
      await openExternal(Platform.OS === 'web' ? 'https://www.instagram.com/' : 'instagram://app');
      return 'copied';
    case 'snapchat':
      await Clipboard.setStringAsync(text);
      await openExternal(Platform.OS === 'web' ? 'https://www.snapchat.com/' : 'snapchat://');
      return 'copied';
    case 'copy':
      await Clipboard.setStringAsync(text);
      return 'copied';
    case 'more':
    default:
      return shareInvite(night);
  }
}

/** System share sheet (the "More" option). */
export async function shareInvite(night: Night): Promise<'shared' | 'copied'> {
  const message = buildInviteMessage(night);

  if (Platform.OS === 'web') {
    const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title: APP_NAME, text: message });
        return 'shared';
      } catch {
        /* user cancelled or unsupported — fall through to copy */
      }
    }
    await Clipboard.setStringAsync(message);
    return 'copied';
  }

  try {
    await Share.share({ message });
    return 'shared';
  } catch {
    await Clipboard.setStringAsync(message);
    return 'copied';
  }
}

export async function copyCode(code: string): Promise<void> {
  await Clipboard.setStringAsync(code);
}

/**
 * Draw the photo onto a canvas with a "Morning After" watermark and return a data url.
 * Web only (Chrome is our local test target). Returns null elsewhere.
 */
async function watermarkWeb(uri: string): Promise<string | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new (window as any).Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);

      const pad = Math.round(img.width * 0.04);
      const fontSize = Math.max(18, Math.round(img.width * 0.045));
      ctx.font = `800 ${fontSize}px sans-serif`;
      ctx.textBaseline = 'bottom';
      // soft shadow for legibility
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = fontSize * 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`🌙 ${APP_NAME}`, pad, img.height - pad);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

/**
 * Share a single photo. On web we add a real watermark via canvas and use the
 * Web Share API (falling back to a download). On native we open the OS share
 * sheet with the file via expo-sharing and a branded message.
 *
 * NOTE (Expo Go / SDK 54): a baked-in pixel watermark on native, and direct
 * "Add to Instagram/TikTok Story" deep-links, require a custom dev build
 * (react-native-share). Those are intentionally stubbed here.
 */
export async function sharePhoto(uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    const watermarked = (await watermarkWeb(uri)) ?? uri;
    const nav: any = navigator;
    try {
      const res = await fetch(watermarked);
      const blob = await res.blob();
      const file = new (window as any).File([blob], 'morning-after.jpg', { type: 'image/jpeg' });
      if (nav?.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: APP_NAME });
        return;
      }
    } catch {
      /* fall through to download */
    }
    const a = document.createElement('a');
    a.href = watermarked;
    a.download = 'morning-after.jpg';
    a.click();
    return;
  }

  try {
    const Sharing = require('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        dialogTitle: `Share from ${APP_NAME}`,
        mimeType: 'image/jpeg',
        UTI: 'public.jpeg',
      });
    }
  } catch (e) {
    console.warn('sharePhoto failed', e);
  }
}

/** Save a photo to the device camera roll. No-op on web (no media library). */
export async function savePhotoToCameraRoll(uri: string): Promise<'saved' | 'denied' | 'unsupported'> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    const MediaLibrary = require('expo-media-library');
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) return 'denied';
    await MediaLibrary.saveToLibraryAsync(uri);
    return 'saved';
  } catch (e) {
    console.warn('savePhotoToCameraRoll failed', e);
    return 'denied';
  }
}
