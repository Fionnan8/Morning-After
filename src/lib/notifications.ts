import { Platform } from 'react-native';

/**
 * Local/scheduled notifications only — this is the Expo Go (SDK 54) reality:
 * remote push needs a dev build. We use:
 *   - an evening nudge ("going out tonight?") to restart the loop, and
 *   - a morning reveal alert when a night unlocks.
 * All guarded so the web build never crashes.
 */

function mod() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export function configureNotificationHandler() {
  const Notifications = mod();
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // older/newer signature differences — non-fatal
  }
}

export async function ensurePermission(): Promise<boolean> {
  const Notifications = mod();
  if (!Notifications) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

/** Morning reveal alert for a specific night. */
export async function scheduleRevealNotification(args: {
  nightId: string;
  nightName: string;
  revealAt: number;
}): Promise<void> {
  const Notifications = mod();
  if (!Notifications) return;
  if (!(await ensurePermission())) return;
  const seconds = Math.max(1, Math.round((args.revealAt - Date.now()) / 1000));
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Last night just unlocked',
        body: `“${args.nightName}” is ready. See what everyone captured.`,
        data: { type: 'reveal', nightId: args.nightId },
      },
      trigger: { seconds, channelId: 'reveal' },
    });
  } catch (e) {
    console.warn('scheduleRevealNotification failed', e);
  }
}

/** Weekend evening nudge to start a night (retention hook). */
export async function scheduleEveningNudge(): Promise<void> {
  const Notifications = mod();
  if (!Notifications) return;
  if (!(await ensurePermission())) return;
  try {
    // Fire daily at 20:00; weekend-leaning copy keeps it feeling like a night-out prompt.
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Going out tonight? 🌃',
        body: 'Start a night, invite your crew, and let the morning surprise you.',
        data: { type: 'nudge' },
      },
      trigger: { hour: 20, minute: 0, repeats: true, channelId: 'nudge' },
    });
  } catch (e) {
    console.warn('scheduleEveningNudge failed', e);
  }
}

export type NotificationRoute = { type: 'reveal'; nightId: string } | { type: 'nudge' };

/**
 * Subscribe to notification taps. Returns an unsubscribe fn.
 * Also handles the cold-start case (app launched by tapping a notification).
 */
export function addResponseListener(handler: (route: NotificationRoute) => void): () => void {
  const Notifications = mod();
  if (!Notifications) return () => {};
  try {
    Notifications.getLastNotificationResponseAsync?.().then((res: any) => {
      const data = res?.notification?.request?.content?.data;
      if (data?.type) handler(data as NotificationRoute);
    });
    const sub = Notifications.addNotificationResponseReceivedListener((res: any) => {
      const data = res?.notification?.request?.content?.data;
      if (data?.type) handler(data as NotificationRoute);
    });
    return () => sub?.remove?.();
  } catch {
    return () => {};
  }
}

export async function setupAndroidChannels(): Promise<void> {
  const Notifications = mod();
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('reveal', {
      name: 'Reveals',
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync('nudge', {
      name: 'Nudges',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    // non-fatal
  }
}
