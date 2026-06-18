import { ComponentProps } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import { BrandIcon, Icon } from '@/components/icon';
import { Txt } from '@/components/kit';
import { Night, Radius, Space } from '@/constants/night';
import { copyCode, type InviteChannel, inviteVia } from '@/lib/sharing';
import type { Night as NightType } from '@/lib/types';

type Channel = { key: InviteChannel; label: string; tint: string } & (
  | { brand: true; icon: ComponentProps<typeof BrandIcon>['name'] }
  | { brand?: false; icon: ComponentProps<typeof Icon>['name'] }
);

const CHANNELS: Channel[] = [
  { key: 'whatsapp', label: 'WhatsApp', tint: '#25D366', brand: true, icon: 'whatsapp' },
  { key: 'instagram', label: 'Instagram', tint: '#E1306C', brand: true, icon: 'instagram' },
  { key: 'snapchat', label: 'Snapchat', tint: '#F7D000', brand: true, icon: 'snapchat-ghost' },
  { key: 'messages', label: 'Messages', tint: '#34D399', icon: 'chatbubble-ellipses' },
  { key: 'copy', label: 'Copy link', tint: Night.textSecondary, icon: 'link' },
  { key: 'more', label: 'More…', tint: Night.textSecondary, icon: 'ellipsis-horizontal' },
];

export function InviteSheet({
  visible,
  night,
  onClose,
}: {
  visible: boolean;
  night: NightType | undefined;
  onClose: () => void;
}) {
  const onPick = async (channel: InviteChannel) => {
    if (!night) return;
    const result = await inviteVia(channel, night);
    onClose();
    if (result === 'copied' && (channel === 'instagram' || channel === 'snapchat')) {
      Alert.alert('Invite copied', 'We opened the app — paste the invite into a chat or your story.');
    } else if (result === 'copied') {
      Alert.alert('Copied', 'Invite copied to your clipboard.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          <Txt variant="heading">Invite your crew</Txt>
          <Txt variant="body">
            Code <Txt variant="label" color={Night.purple}>{night?.code}</Txt> · share it however you like.
          </Txt>

          <View style={styles.grid}>
            {CHANNELS.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => onPick(c.key)}
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}
              >
                <View style={[styles.glyphCircle, { borderColor: c.tint }]}>
                  {c.brand ? (
                    <BrandIcon name={c.icon} size={26} color={c.tint} />
                  ) : (
                    <Icon name={c.icon} size={26} color={c.tint} />
                  )}
                </View>
                <Txt variant="caption" color={Night.textSecondary}>
                  {c.label}
                </Txt>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => night && copyCode(night.code).then(onClose)} hitSlop={8} style={styles.codeRow}>
            <Txt variant="caption" color={Night.textMuted}>
              Tap to copy just the code
            </Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md, marginTop: Space.sm },
  item: { alignItems: 'center', gap: 6, width: '28%' },
  glyphCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    backgroundColor: Night.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeRow: { alignSelf: 'center', paddingTop: Space.sm },
});
