import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraCapture } from '@/components/camera-capture';
import { Icon } from '@/components/icon';
import { Backdrop, Txt } from '@/components/kit';
import { LibraryPage } from '@/components/library-page';
import { TonightPage } from '@/components/tonight-page';
import { GradDir, HeroGradient, Night, Radius } from '@/constants/night';
import { useActiveNight } from '@/lib/store';

const TONIGHT = 0;
const CAMERA = 1;
const LIBRARY = 2;

export default function HomePager() {
  const params = useLocalSearchParams<{ page?: string }>();
  const active = useActiveNight();
  const insets = useSafeAreaInsets();

  const [size, setSize] = useState({ w: 0, h: 0 });
  const w = size.w;
  const [page, setPage] = useState(TONIGHT);
  const scrollRef = useRef<ScrollView>(null);
  const didInit = useRef(false);

  const initialIndex = params.page === 'library' ? LIBRARY : params.page === 'camera' ? CAMERA : TONIGHT;

  // Jump to the requested page once we know the width (no animation on first paint).
  useEffect(() => {
    if (w > 0 && !didInit.current) {
      didInit.current = true;
      if (initialIndex !== TONIGHT) {
        scrollRef.current?.scrollTo({ x: initialIndex * w, animated: false });
        setPage(initialIndex);
      }
    }
  }, [w, initialIndex]);

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * w, animated: true });
    setPage(i);
  };

  return (
    <View style={styles.root}>
      <Backdrop />
      <View
        style={styles.flex}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
        }}
      >
        {w > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / w);
              setPage((prev) => (prev === i ? prev : i));
            }}
            style={styles.flex}
          >
            <View style={{ width: size.w, height: size.h }}>
              <TonightPage />
            </View>
            <View style={{ width: size.w, height: size.h }}>
              <CameraCapture nightId={active?.id} isActive={page === CAMERA} onNeedNight={() => goTo(TONIGHT)} />
            </View>
            <View style={{ width: size.w, height: size.h }}>
              <LibraryPage />
            </View>
          </ScrollView>
        )}
      </View>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <BarItem
          label="Tonight"
          icon={page === TONIGHT ? 'moon' : 'moon-outline'}
          active={page === TONIGHT}
          onPress={() => goTo(TONIGHT)}
        />
        <Pressable onPress={() => goTo(CAMERA)} style={styles.centerWrap} accessibilityLabel="Camera">
          <LinearGradient
            colors={HeroGradient}
            {...GradDir.diagonal}
            style={[styles.cameraCircle, page === CAMERA && styles.cameraCircleActive]}
          >
            <Icon name="camera" size={24} color="#fff" />
          </LinearGradient>
        </Pressable>
        <BarItem
          label="Library"
          icon={page === LIBRARY ? 'albums' : 'albums-outline'}
          active={page === LIBRARY}
          onPress={() => goTo(LIBRARY)}
        />
      </View>
    </View>
  );
}

function BarItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof Icon>['name'];
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? Night.purple : Night.textMuted;
  return (
    <Pressable onPress={onPress} style={styles.barItem} accessibilityLabel={label}>
      <Icon name={icon} size={24} color={color} />
      <Txt variant="caption" color={color}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Night.bg },
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    backgroundColor: Night.bgElevated,
    borderTopColor: Night.cardBorder,
    borderTopWidth: 1,
  },
  barItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Night.bgElevated,
  },
  cameraCircleActive: { borderColor: Night.purple },
});
