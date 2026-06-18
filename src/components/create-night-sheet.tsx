import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button, Txt } from '@/components/kit';
import { Night, Radius, Space } from '@/constants/night';

const TIME_OPTIONS = [
  { label: '7 AM', hour: 7 },
  { label: '8 AM', hour: 8 },
  { label: '9 AM', hour: 9 },
  { label: '10 AM', hour: 10 },
  { label: '11 AM', hour: 11 },
  { label: 'Noon', hour: 12 },
];

export function CreateNightSheet({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (name: string, revealHour: number) => void;
}) {
  const [name, setName] = useState('');
  const [hour, setHour] = useState(10);

  useEffect(() => {
    if (visible) {
      setName('');
      setHour(10);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Txt variant="heading">Start a night</Txt>

            <View style={{ gap: Space.sm }}>
              <Txt variant="caption" color={Night.textMuted}>
                Name it
              </Txt>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Friday chaos"
                placeholderTextColor={Night.textMuted}
                style={styles.input}
                autoFocus
                maxLength={40}
              />
            </View>

            <View style={{ gap: Space.sm }}>
              <Txt variant="caption" color={Night.textMuted}>
                Unlock the photos at
              </Txt>
              <View style={styles.chips}>
                {TIME_OPTIONS.map((opt) => {
                  const selected = opt.hour === hour;
                  return (
                    <Pressable
                      key={opt.hour}
                      onPress={() => setHour(opt.hour)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Txt variant="label" color={selected ? '#fff' : Night.textSecondary}>
                        {opt.label}
                      </Txt>
                    </Pressable>
                  );
                })}
              </View>
              <Txt variant="caption" color={Night.textMuted}>
                The morning after — everyone unlocks together.
              </Txt>
            </View>

            <View style={styles.row}>
              <Button title="Cancel" variant="ghost" onPress={onCancel} style={styles.flex} />
              <Button
                title="Create"
                onPress={() => onConfirm(name.trim() || 'Tonight', hour)}
                style={styles.flex}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: Space.lg,
  },
  sheet: {
    backgroundColor: Night.bgElevated,
    borderColor: Night.cardBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Space.lg,
    gap: Space.lg,
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  chip: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Night.cardBorder,
    backgroundColor: Night.bg,
  },
  chipSelected: { backgroundColor: Night.purple, borderColor: Night.purple },
  row: { flexDirection: 'row', gap: Space.sm },
  flex: { flex: 1 },
});
