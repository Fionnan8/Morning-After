import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Pill, Screen, Txt } from '@/components/kit';
import { Icon } from '@/components/icon';
import { InputModal } from '@/components/input-modal';
import { InviteSheet } from '@/components/invite-sheet';
import { GradDir, HeroGradient, Night, Radius, Space, SunriseGradient } from '@/constants/night';
import { countdownTo, formatClock } from '@/lib/format';
import { renameNight, simulateMorning, useNightById, usePhotos } from '@/lib/store';
import type { Member } from '@/lib/types';
import { useNow } from '@/lib/use-now';

export default function NightRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const night = useNightById(id);
  const photos = usePhotos(id);
  const router = useRouter();
  const now = useNow();
  const [showInvite, setShowInvite] = useState(false);
  const [showRename, setShowRename] = useState(false);

  if (!night) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Txt variant="heading">This night has ended.</Txt>
          <Button title="Back" variant="secondary" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const cd = countdownTo(night.revealAt, now);
  const ready = cd.done;

  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
          <Icon name="chevron-back" size={22} color={Night.text} />
          <Txt variant="label">Back</Txt>
        </Pressable>
        <Pill label={ready ? 'Reveal ready' : 'Live'} color={ready ? Night.pink : Night.success} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Space.lg, paddingBottom: Space.xl }}>
        <View>
          {/* Tap the name to rename — works any time, even after creation. */}
          <Pressable onPress={() => setShowRename(true)} style={styles.titleRow} hitSlop={6}>
            <Txt variant="title">{night.name}</Txt>
            <Icon name="create-outline" size={18} color={Night.textMuted} />
          </Pressable>
          <Txt variant="body">
            Started {formatClock(night.createdAt)} · unlocks at {formatClock(night.revealAt)}
          </Txt>
        </View>

        {/* Invite */}
        <Card style={{ gap: Space.md }}>
          <Txt variant="caption" color={Night.textMuted}>
            Invite code
          </Txt>
          <Txt variant="mono" color={Night.purple}>
            {night.code}
          </Txt>
          <Button
            title="Share invite"
            icon={<Icon name="share-social" size={18} color="#fff" />}
            onPress={() => setShowInvite(true)}
          />
        </Card>

        {/* Members */}
        <View style={{ gap: Space.sm }}>
          <Txt variant="caption" color={Night.textMuted}>
            Who’s here ({night.members.length})
          </Txt>
          <View style={styles.members}>
            {night.members.map((m) => (
              <MemberChip key={m.id} member={m} />
            ))}
          </View>
        </View>

        {/* Locked vault */}
        <Card style={{ gap: Space.md, alignItems: 'center' }}>
          {ready ? (
            <>
              <View style={styles.rowCenter}>
                <Icon name="sunny" size={22} color={Night.pink} />
                <Txt variant="heading" center>
                  The vault is ready
                </Txt>
              </View>
              <Txt variant="body" center>
                {photos.length} {photos.length === 1 ? 'moment' : 'moments'} from last night.
              </Txt>
              <Pressable onPress={() => router.push(`/reveal/${night.id}`)} style={{ alignSelf: 'stretch' }}>
                <LinearGradient colors={SunriseGradient} {...GradDir.horizontal} style={styles.revealBanner}>
                  <Txt variant="heading" color="#1a1206" center>
                    Reveal the morning after
                  </Txt>
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.vaultGrid}>
                {photos.length === 0 ? (
                  <Txt variant="body" center>
                    No moments yet — start capturing
                  </Txt>
                ) : (
                  photos.slice(0, 9).map((p) => (
                    <View key={p.id} style={styles.lockTile}>
                      <Icon name="lock-closed" size={22} color={Night.locked} />
                    </View>
                  ))
                )}
              </View>
              <Txt variant="title" color={Night.pink}>
                {photos.length}
              </Txt>
              <Txt variant="caption" color={Night.textMuted}>
                {photos.length === 1 ? 'moment' : 'moments'} locked · unlocks in {cd.label}
              </Txt>
            </>
          )}
        </Card>

        <View style={styles.rowCenter}>
          <Icon name="cloud-offline-outline" size={14} color={Night.textMuted} />
          <Txt variant="caption" color={Night.textMuted} center>
            Works offline — syncs when you’re back online
          </Txt>
        </View>
      </ScrollView>

      {/* Capture CTA */}
      {!ready && (
        <View style={styles.captureBar}>
          <Button
            title="Take a photo"
            icon={<Icon name="camera" size={20} color="#fff" />}
            onPress={() => router.push(`/camera?nightId=${night.id}`)}
          />
          <Pressable onPress={() => simulateMorning(night.id)} hitSlop={8} style={styles.devLink}>
            <Icon name="construct-outline" size={12} color={Night.textMuted} />
            <Txt variant="caption" color={Night.textMuted}>
              Dev: simulate morning (reveals in 5s)
            </Txt>
          </Pressable>
        </View>
      )}

      <InviteSheet visible={showInvite} night={night} onClose={() => setShowInvite(false)} />
      <InputModal
        visible={showRename}
        title="Rename night"
        placeholder="Night name"
        initialValue={night.name}
        confirmLabel="Save"
        onCancel={() => setShowRename(false)}
        onConfirm={(name) => {
          renameNight(night.id, name);
          setShowRename(false);
        }}
      />
    </Screen>
  );
}

function MemberChip({ member }: { member: Member }) {
  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={styles.memberChip}>
      <LinearGradient colors={HeroGradient} {...GradDir.vertical} style={styles.avatar}>
        <Txt variant="label" color="#fff">
          {initials}
        </Txt>
      </LinearGradient>
      <Txt variant="caption" color={Night.textSecondary}>
        {member.isYou ? 'You' : member.name}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Space.sm,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  memberChip: { alignItems: 'center', gap: 4, width: 64 },
  avatar: { width: 48, height: 48, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  vaultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
    justifyContent: 'center',
    minHeight: 64,
    alignItems: 'center',
  },
  lockTile: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    backgroundColor: Night.bg,
    borderColor: Night.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealBanner: { borderRadius: Radius.md, paddingVertical: Space.lg, paddingHorizontal: Space.md },
  captureBar: { gap: Space.sm, paddingTop: Space.sm, paddingBottom: Space.sm },
  devLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', paddingVertical: 4 },
});
