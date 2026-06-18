import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { EditNightSheet } from '@/components/edit-night-sheet';
import { Icon } from '@/components/icon';
import { Pill, Screen, Txt } from '@/components/kit';
import { GradDir, HeroGradient, Night, Radius, Space } from '@/constants/night';
import { formatNightDate } from '@/lib/format';
import { deleteNight, useNightById, useNights, usePhotos } from '@/lib/store';
import type { Night as NightType } from '@/lib/types';

export function LibraryPage() {
  const nights = useNights();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const editingNight = useNightById(editingId ?? undefined);
  const editingPhotos = usePhotos(editingId ?? undefined);
  const deletingNight = useNightById(deletingId ?? undefined);

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Txt variant="title">Library</Txt>
        <Txt variant="body">Every night you’ve captured.</Txt>
      </View>

      {nights.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="images-outline" size={56} color={Night.textMuted} />
          <Txt variant="heading" center>
            No nights yet
          </Txt>
          <Txt variant="body" center style={{ maxWidth: 260 }}>
            Start a night from Tonight. Once it unlocks, it’ll live here forever.
          </Txt>
        </View>
      ) : (
        <FlatList
          data={nights}
          keyExtractor={(n) => n.id}
          numColumns={2}
          columnWrapperStyle={{ gap: Space.md }}
          contentContainerStyle={{ gap: Space.md, paddingBottom: Space.xl }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <NightCard night={item} onEdit={() => setEditingId(item.id)} />}
        />
      )}

      <EditNightSheet
        visible={!!editingId}
        night={editingNight}
        photos={editingPhotos}
        onClose={() => setEditingId(null)}
        onRequestDelete={() => {
          setDeletingId(editingId);
          setEditingId(null);
        }}
      />

      <ConfirmDialog
        visible={!!deletingId}
        title={`Delete “${deletingNight?.name ?? 'this night'}”?`}
        message="This permanently removes the night and all its photos for you. This can’t be undone."
        confirmLabel="Delete forever"
        destructive
        onCancel={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) await deleteNight(deletingId);
          setDeletingId(null);
        }}
      />
    </Screen>
  );
}

function NightCard({ night, onEdit }: { night: NightType; onEdit: () => void }) {
  const photos = usePhotos(night.id);
  const router = useRouter();
  const locked = night.status === 'active';
  const cover =
    photos.find((p) => p.id === night.coverPhotoId && !p.flagged) ?? photos.find((p) => !p.flagged);

  const onPress = () => {
    if (locked) router.push(`/night/${night.id}`);
    else router.push(`/library/${night.id}`);
  };

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cover}>
        {cover && !locked ? (
          <Image source={{ uri: cover.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={HeroGradient} style={StyleSheet.absoluteFill} {...GradDir.diagonalUp}>
            <View style={styles.coverCenter}>
              <Icon name={locked ? 'lock-closed' : 'moon'} size={34} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>
        )}
        {locked && (
          <View style={styles.lockedTag}>
            <Pill label="Locked" color={Night.pink} />
          </View>
        )}
        <Pressable testID="edit-night" onPress={onEdit} hitSlop={8} style={styles.editBtn}>
          <Icon name="create-outline" size={18} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.meta}>
        <Txt variant="label" numberOfLines={1}>
          {night.name}
        </Txt>
        <Txt variant="caption" color={Night.textMuted}>
          {formatNightDate(night.createdAt)}
        </Txt>
        <Txt variant="caption" color={Night.textMuted}>
          {night.photoCount} {night.photoCount === 1 ? 'moment' : 'moments'}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Space.sm, paddingBottom: Space.md, gap: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.sm },
  card: { flex: 1, gap: Space.sm, marginBottom: Space.sm },
  cover: { aspectRatio: 1, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Night.bgElevated },
  coverCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockedTag: { position: 'absolute', top: Space.sm, left: Space.sm },
  editBtn: {
    position: 'absolute',
    top: Space.sm,
    right: Space.sm,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { gap: 2 },
});
