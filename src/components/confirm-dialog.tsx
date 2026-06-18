import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button, Txt } from '@/components/kit';
import { Night, Radius, Space } from '@/constants/night';

/**
 * Themed confirmation dialog. Used instead of React Native's Alert.alert, whose
 * button callbacks don't fire on react-native-web (so on web the buttons did
 * nothing). This works on web and native.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Txt variant="heading">{title}</Txt>
          {message ? <Txt variant="body">{message}</Txt> : null}
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="ghost" onPress={onCancel} style={styles.flex} />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.flex}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    maxWidth: 380,
    alignSelf: 'center',
  },
  actions: { flexDirection: 'row', gap: Space.sm, marginTop: Space.sm },
  flex: { flex: 1 },
});
