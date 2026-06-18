import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Screen, Txt } from '@/components/kit';
import { Icon } from '@/components/icon';
import { PhotoViewer } from '@/components/photo-viewer';
import { Night, Radius, Space, SunriseGradient } from '@/constants/night';
import { countdownTo } from '@/lib/format';
import { revealNight, useNightById, usePhotos } from '@/lib/store';
import { useNow } from '@/lib/use-now';

function haptic() {
  if (Platform.OS === 'web') return;
  try {
    const H = require('expo-haptics');
    H.notificationAsync(H.NotificationFeedbackType.Success);
  } catch {
    /* non-fatal */
  }
}

export default function RevealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const night = useNightById(id);
  const allPhotos = usePhotos(id);
  const router = useRouter();
  const now = useNow();

  const [phase, setPhase] = useState<'intro' | 'gallery'>('intro');
  const visiblePhotos = allPhotos.filter((p) => !p.flagged);

  if (!night) {
    return (
      <Screen>
        <View style={styles.center}>
          <Txt variant="heading">Night not found.</Txt>
          <Button title="Home" variant="secondary" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const cd = countdownTo(night.revealAt, now);

  // Still locked — show the anticipation gate.
  if (!cd.done) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingVertical: Space.sm }}>
          <Txt variant="heading">‹ Back</Txt>
        </Pressable>
        <View style={styles.center}>
          <Icon name="lock-closed" size={64} color={Night.locked} />
          <Txt variant="heading" center>
            Not yet…
          </Txt>
          <Txt variant="body" center>
            “{night.name}” unlocks in
          </Txt>
          <Txt variant="display" color={Night.pink}>
            {cd.label}
          </Txt>
        </View>
      </Screen>
    );
  }

  if (phase === 'intro') {
    return (
      <RevealIntro
        nightName={night.name}
        count={visiblePhotos.length}
        onReveal={() => {
          haptic();
          revealNight(night.id);
          setPhase('gallery');
        }}
      />
    );
  }

  return (
    <View style={styles.galleryRoot}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.galleryHeader}>
          <Pressable onPress={() => router.replace('/')} hitSlop={12}>
            <Txt variant="label" color={Night.purple}>
              ‹ Home
            </Txt>
          </Pressable>
          <Txt variant="heading" numberOfLines={1} style={styles.galleryTitle}>
            {night.name}
          </Txt>
          <Pressable onPress={() => router.replace({ pathname: '/', params: { page: 'library' } })} hitSlop={12}>
            <Txt variant="label" color={Night.purple}>
              Library
            </Txt>
          </Pressable>
        </View>
        <PhotoViewer photos={visiblePhotos} nightId={night.id} />
      </SafeAreaView>
    </View>
  );
}

function RevealIntro({ nightName, count, onReveal }: { nightName: string; count: number; onReveal: () => void }) {
  const sun = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(sun, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sun, pulse]);

  const translateY = sun.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });
  const opacity = sun.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.4, 1] });

  return (
    <View style={styles.introRoot}>
      <LinearGradient colors={SunriseGradient} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      {/* fades the sunrise up from the bottom */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.introScrim, { opacity: sun.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }) }]} />

      <SafeAreaView style={styles.introBody}>
        <Animated.View style={[styles.sun, { transform: [{ translateY }], opacity }]}>
          <Icon name="sunny" size={96} color="#FFF1C2" />
        </Animated.View>

        <Animated.View style={{ opacity }}>
          <Txt variant="title" center color="#1a1206">
            Good morning
          </Txt>
          <Txt variant="body" center color="rgba(26,18,6,0.8)" style={{ marginTop: Space.sm }}>
            “{nightName}” is ready. You captured{'\n'}
            <Txt variant="heading" color="#1a1206">
              {count} {count === 1 ? 'moment' : 'moments'}
            </Txt>{' '}
            last night.
          </Txt>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: pulse }], alignSelf: 'stretch' }}>
          <Pressable onPress={onReveal} style={styles.revealBtn}>
            {count > 0 && <Icon name="sparkles" size={18} color="#1a1206" />}
            <Txt variant="heading" color="#1a1206">
              {count > 0 ? 'Reveal them' : 'See the night'}
            </Txt>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.sm },
  galleryRoot: { flex: 1, backgroundColor: Night.bg },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    gap: Space.sm,
  },
  galleryTitle: { flex: 1, textAlign: 'center' },
  introRoot: { flex: 1, backgroundColor: '#1a1206' },
  introScrim: { backgroundColor: '#0B0614' },
  introBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.xl, padding: Space.lg },
  sun: { alignItems: 'center' },
  revealBtn: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    height: 60,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
