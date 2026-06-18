import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Backdrop } from '@/components/kit';
import { Night } from '@/constants/night';
import { addResponseListener, configureNotificationHandler } from '@/lib/notifications';
import { getNight, hydrate, useIdentity, useLoaded } from '@/lib/store';

configureNotificationHandler();

function useOnboardingGate() {
  const loaded = useLoaded();
  const identity = useIdentity();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;
    const onOnboarding = segments[0] === 'onboarding';
    if (!identity && !onOnboarding) {
      router.replace('/onboarding');
    } else if (identity && onOnboarding) {
      router.replace('/');
    }
  }, [loaded, identity, segments, router]);
}

export default function RootLayout() {
  const loaded = useLoaded();

  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, []);

  useOnboardingGate();

  // Route on notification taps (reveal alert → that night; nudge → Tonight).
  useEffect(() => {
    return addResponseListener((route) => {
      if (route.type === 'reveal') {
        const night = getNight(route.nightId);
        if (!night) return router.push('/');
        router.push(night.status === 'active' ? `/reveal/${night.id}` : `/library/${night.id}`);
      } else {
        router.push('/');
      }
    });
  }, [router]);

  if (!loaded) {
    return (
      <View style={{ flex: 1 }}>
        <Backdrop />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Night.purple} size="large" />
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      {/* On web, letterbox the app into a centered portrait phone column so it
          looks/behaves like a phone instead of stretching across the browser. */}
      <View style={styles.frame}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Night.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="night/[id]" />
          <Stack.Screen
            name="camera"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="reveal/[id]"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#000' : Night.bg,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web'
      ? { maxWidth: 440, overflow: 'hidden', backgroundColor: Night.bg }
      : null),
  },
});
