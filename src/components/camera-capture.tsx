import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Button, Txt } from '@/components/kit';
import { Night, Radius, Space } from '@/constants/night';
import { formatClock } from '@/lib/format';
import { addPhoto, useNightById, usePhotos } from '@/lib/store';

function haptic() {
  if (Platform.OS === 'web') return;
  try {
    require('expo-haptics').impactAsync(require('expo-haptics').ImpactFeedbackStyle.Medium);
  } catch {
    /* non-fatal */
  }
}

/**
 * The camera UI. Used both as a full-screen modal (with onClose) and as a page
 * inside the home pager (embedded). `isActive` controls whether the live camera
 * is mounted — the pager passes false for off-screen pages so the webcam isn't
 * always on.
 */
export function CameraCapture({
  nightId,
  isActive = true,
  onClose,
  onNeedNight,
}: {
  nightId?: string;
  isActive?: boolean;
  onClose?: () => void;
  onNeedNight?: () => void;
}) {
  const night = useNightById(nightId);
  const photos = usePhotos(nightId);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const lockedCount = photos.length;

  const playFlash = () => {
    flashAnim.setValue(0.9);
    Animated.timing(flashAnim, { toValue: 0, duration: 320, useNativeDriver: Platform.OS !== 'web' }).start();
  };

  const onCapture = async () => {
    if (!cameraRef.current || capturing || !nightId) return;
    setCapturing(true);
    try {
      const wantBase64 = Platform.OS === 'web';
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: wantBase64 });
      if (photo?.uri) {
        haptic();
        playFlash();
        await addPhoto({ nightId, uri: photo.uri, base64: photo.base64 });
      }
    } catch (e) {
      console.warn('capture failed', e);
    } finally {
      setCapturing(false);
    }
  };

  // Embedded with no active night → prompt to start one.
  if (!nightId) {
    return (
      <View style={styles.black}>
        <SafeAreaView style={styles.permission}>
          <Icon name="moon" size={48} color={Night.purple} />
          <Txt variant="title" center>
            No night yet
          </Txt>
          <Txt variant="body" center>
            Start a night to capture photos. They’ll stay locked for everyone until the morning.
          </Txt>
          {onNeedNight && <Button title="Start a night" icon={<Icon name="sparkles" size={18} color="#fff" />} onPress={onNeedNight} />}
        </SafeAreaView>
      </View>
    );
  }

  if (!permission) return <View style={styles.black} />;

  if (!permission.granted) {
    return (
      <View style={styles.black}>
        <SafeAreaView style={styles.permission}>
          <Icon name="camera" size={48} color={Night.purple} />
          <Txt variant="title" center>
            Camera access
          </Txt>
          <Txt variant="body" center>
            Morning After needs your camera to capture the night. Photos stay locked for
            everyone until the reveal.
          </Txt>
          <Button title="Allow camera" onPress={requestPermission} />
          {onClose && <Button title="Not now" variant="ghost" onPress={onClose} />}
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.black}>
      {isActive ? (
        // key={facing} forces a remount so the camera actually switches devices.
        <CameraView key={facing} ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />
      ) : (
        <View style={StyleSheet.absoluteFill} />
      )}

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashAnim }]} />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          {onClose ? (
            <Pressable onPress={onClose} hitSlop={12} style={styles.iconBtn}>
              <Icon name="close" size={26} color="#fff" />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
          <View style={styles.lockedBadge}>
            <Icon name="lock-closed" size={13} color="#fff" />
            <Txt variant="caption" color="#fff">
              {lockedCount} locked
            </Txt>
          </View>
          <Pressable onPress={() => setFlash((f) => (f === 'on' ? 'off' : 'on'))} hitSlop={12} style={styles.iconBtn}>
            <Icon name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.controls}>
          <Txt variant="caption" color="rgba(255,255,255,0.8)" center>
            {night?.name ?? 'Night'} · locked until {night ? formatClock(night.revealAt) : 'morning'}
          </Txt>
          <View style={styles.shutterRow}>
            {onClose ? (
              <Pressable onPress={onClose} hitSlop={12} style={styles.sideBtn}>
                <Txt variant="label" color="#fff">
                  Done
                </Txt>
              </Pressable>
            ) : (
              <View style={styles.sideBtn} />
            )}

            <Pressable testID="shutter" onPress={onCapture} disabled={capturing} style={styles.shutterOuter}>
              <View style={[styles.shutterInner, capturing && styles.shutterInnerActive]} />
            </Pressable>

            <Pressable testID="flip" onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} hitSlop={12} style={styles.sideBtn}>
              <Icon name="camera-reverse" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000' },
  flash: { backgroundColor: '#fff' },
  permission: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Space.lg, gap: Space.md },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.md,
    paddingTop: Space.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.pill,
    paddingHorizontal: Space.md,
    paddingVertical: 6,
  },
  controls: { paddingBottom: Space.lg, gap: Space.md },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Space.lg,
  },
  sideBtn: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: Radius.pill,
    borderWidth: 5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 64, height: 64, borderRadius: Radius.pill, backgroundColor: '#fff' },
  shutterInnerActive: { backgroundColor: Night.pink, transform: [{ scale: 0.9 }] },
});
