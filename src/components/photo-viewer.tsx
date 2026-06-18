import { Image } from 'expo-image';
import { ComponentProps, useEffect, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { Txt } from '@/components/kit';
import { Night, Radius, Space } from '@/constants/night';
import { formatClock } from '@/lib/format';
import { savePhotoToCameraRoll, sharePhoto } from '@/lib/sharing';
import { deletePhoto, flagPhoto } from '@/lib/store';
import type { Photo } from '@/lib/types';

export function PhotoViewer({
  photos,
  nightId,
  startIndex = 0,
}: {
  photos: Photo[];
  nightId: string;
  startIndex?: number;
}) {
  const [index, setIndex] = useState(startIndex);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (photos.length === 0) {
    return (
      <View style={styles.empty}>
        <Txt variant="heading" center>
          Nothing to show here
        </Txt>
        <Txt variant="body" center>
          No moments were captured — or they’ve all been removed.
        </Txt>
      </View>
    );
  }

  const onSave = async (uri: string) => {
    const result = await savePhotoToCameraRoll(uri);
    if (result === 'saved') setToast('Saved to your camera roll');
    else if (result === 'denied') setToast('Allow photo access to save');
    else setToast('On web, use Share to download');
  };

  const current = photos[Math.min(index, photos.length - 1)];
  const w = size.w;

  return (
    <View style={styles.flex}>
      <View
        style={styles.flex}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
        }}
      >
        {w > 0 && (
          <FlatList
            key={w}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.min(startIndex, photos.length - 1)}
            getItemLayout={(_, i) => ({ length: w, offset: w * i, index: i })}
            keyExtractor={(p) => p.id}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / w);
              setIndex((prev) => (prev === i ? prev : i));
            }}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / w))}
            renderItem={({ item }) => (
              <View style={[styles.page, { width: w }]}>
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: w - Space.lg * 2, height: Math.round(size.h * 0.92), borderRadius: Radius.md }}
                  contentFit="contain"
                  transition={250}
                />
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.captionRow} pointerEvents="none">
        <Txt variant="caption" color="rgba(255,255,255,0.85)">
          {current.takenByName} · {formatClock(current.takenAt)}
        </Txt>
        <Txt variant="caption" color="rgba(255,255,255,0.85)">
          {index + 1} / {photos.length}
        </Txt>
      </View>

      <View style={styles.actions}>
        <Action icon="download-outline" label="Save" onPress={() => onSave(current.uri)} />
        <Action icon="share-social-outline" label="Share" onPress={() => sharePhoto(current.uri)} />
        <Action icon="ellipsis-horizontal" label="More" onPress={() => setMenuFor(current.id)} />
      </View>
      {Platform.OS === 'web' && (
        <Txt variant="caption" color={Night.textMuted} center style={{ paddingBottom: 4 }}>
          Tip: swipe / drag sideways to move between photos
        </Txt>
      )}

      {/* Per-photo manage sheet */}
      <Modal visible={!!menuFor} transparent animationType="slide" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.scrim} onPress={() => setMenuFor(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.grabber} />
            <Txt variant="heading">This photo</Txt>
            <SheetRow
              icon="eye-off-outline"
              label="Hide from the group"
              hint="If you’re in it and don’t want it shared"
              onPress={() => {
                if (menuFor) flagPhoto(nightId, menuFor);
                setMenuFor(null);
                setToast('Hidden from the group');
              }}
            />
            <SheetRow
              icon="trash-outline"
              label="Delete photo"
              hint="Removes it permanently"
              danger
              onPress={() => {
                setConfirmDelete(menuFor);
                setMenuFor(null);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={!!confirmDelete}
        title="Delete this photo?"
        message="It’ll be removed from this night permanently. This can’t be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deletePhoto(nightId, confirmDelete);
            if (index >= photos.length - 1) setIndex(Math.max(0, index - 1));
          }
          setConfirmDelete(null);
          setToast('Photo deleted');
        }}
      />

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Txt variant="label" color="#fff">
            {toast}
          </Txt>
        </View>
      )}
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={26} color={Night.text} />
      <Txt variant="caption" color={Night.textSecondary}>
        {label}
      </Txt>
    </Pressable>
  );
}

function SheetRow({
  icon,
  label,
  hint,
  danger,
  onPress,
}: {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  hint?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const color = danger ? Night.danger : Night.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sheetRow, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={22} color={color} />
      <View style={{ flex: 1 }}>
        <Txt variant="label" color={color}>
          {label}
        </Txt>
        {hint ? (
          <Txt variant="caption" color={Night.textMuted}>
            {hint}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.sm, padding: Space.lg },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    paddingBottom: Space.md,
  },
  action: { alignItems: 'center', gap: 4, minWidth: 72 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Night.bgElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderColor: Night.cardBorder,
    borderWidth: 1,
    padding: Space.lg,
    paddingBottom: Space.xl,
    gap: Space.md,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Night.textMuted,
    marginBottom: Space.sm,
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: Space.sm },
  toast: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderColor: Night.cardBorder,
    borderWidth: 1,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    borderRadius: Radius.pill,
  },
});
