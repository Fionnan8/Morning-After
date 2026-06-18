import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Screen, Txt } from '@/components/kit';
import { PhotoViewer } from '@/components/photo-viewer';
import { Night, Space } from '@/constants/night';
import { formatNightDate } from '@/lib/format';
import { useNightById, usePhotos } from '@/lib/store';

export default function NightDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const night = useNightById(id);
  const photos = usePhotos(id).filter((p) => !p.flagged);
  const router = useRouter();

  if (!night) {
    return (
      <Screen>
        <View style={styles.center}>
          <Txt variant="heading">Night not found.</Txt>
          <Button title="Back to Library" variant="secondary" onPress={() => router.replace({ pathname: '/', params: { page: 'library' } })} />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Txt variant="heading">‹</Txt>
          </Pressable>
          <View>
            <Txt variant="heading" numberOfLines={1}>
              {night.name}
            </Txt>
            <Txt variant="caption" color={Night.textMuted}>
              {formatNightDate(night.createdAt)}
            </Txt>
          </View>
          <View style={{ width: 20 }} />
        </View>
        <PhotoViewer photos={photos} nightId={night.id} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: Night.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    gap: Space.md,
  },
});
