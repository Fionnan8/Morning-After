import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button, Txt } from '@/components/kit';
import { Icon } from '@/components/icon';
import { Night, Radius, Space } from '@/constants/night';
import { renameNight, setNightCover } from '@/lib/store';
import type { Night as NightType, Photo } from '@/lib/types';

export function EditNightSheet({
  visible,
  night,
  photos,
  onClose,
  onRequestDelete,
}: {
  visible: boolean;
  night: NightType | undefined;
  photos: Photo[];
  onClose: () => void;
  onRequestDelete: () => void;
}) {
  const [name, setName] = useState('');
  const [cover, setCover] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible && night) {
      setName(night.name);
      setCover(night.coverPhotoId ?? photos.find((p) => !p.flagged)?.id);
    }
  }, [visible, night, photos]);

  if (!night) return null;
  const visiblePhotos = photos.filter((p) => !p.flagged);

  const onSave = async () => {
    await renameNight(night.id, name);
    if (cover) await setNightCover(night.id, cover);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Txt variant="heading">Edit night</Txt>

            <View style={{ gap: Space.sm }}>
              <Txt variant="caption" color={Night.textMuted}>
                Name
              </Txt>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Night name"
                placeholderTextColor={Night.textMuted}
                style={styles.input}
                maxLength={40}
              />
            </View>

            {visiblePhotos.length > 0 && (
              <View style={{ gap: Space.sm }}>
                <Txt variant="caption" color={Night.textMuted}>
                  Cover photo
                </Txt>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.sm }}>
                  {visiblePhotos.map((p) => {
                    const selected = p.id === cover;
                    return (
                      <Pressable key={p.id} onPress={() => setCover(p.id)} style={[styles.thumb, selected && styles.thumbSelected]}>
                        <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        {selected && (
                          <View style={styles.check}>
                            <Icon name="checkmark-circle" size={22} color={Night.purple} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <Button title="Save changes" onPress={onSave} disabled={!name.trim()} />
            <Button title="Delete night" variant="danger" onPress={onRequestDelete} icon={<Icon name="trash" size={18} color={Night.danger} />} />
            <Button title="Cancel" variant="ghost" onPress={onClose} />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: Space.lg,
  },
  sheet: {
    backgroundColor: Night.bgElevated,
    borderColor: Night.cardBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Space.lg,
    gap: Space.md,
    width: '100%',
    maxWidth: 408,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: Night.bg,
    borderColor: Night.cardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    height: 52,
    color: Night.text,
    fontSize: 17,
    fontWeight: '600',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Night.bg,
  },
  thumbSelected: { borderColor: Night.purple },
  check: { position: 'absolute', right: 2, bottom: 2 },
});
