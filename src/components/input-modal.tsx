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

export function InputModal({
  visible,
  title,
  subtitle,
  placeholder,
  initialValue = '',
  confirmLabel = 'Done',
  autoCapitalize = 'sentences',
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  autoCapitalize?: 'none' | 'characters' | 'sentences';
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Txt variant="heading">{title}</Txt>
            {subtitle ? (
              <Txt variant="body" style={{ marginTop: 4 }}>
                {subtitle}
              </Txt>
            ) : null}
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={Night.textMuted}
              style={styles.input}
              autoFocus
              autoCapitalize={autoCapitalize}
              returnKeyType="done"
              onSubmitEditing={() => value.trim() && onConfirm(value.trim())}
            />
            <View style={styles.row}>
              <Button title="Cancel" variant="ghost" onPress={onCancel} style={styles.flex} />
              <Button
                title={confirmLabel}
                onPress={() => value.trim() && onConfirm(value.trim())}
                disabled={!value.trim()}
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
  row: { flexDirection: 'row', gap: Space.sm },
  flex: { flex: 1 },
});
