import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CreateNightSheet } from '@/components/create-night-sheet';
import { Icon } from '@/components/icon';
import { InputModal } from '@/components/input-modal';
import { Button, Card, Pill, Screen, Txt } from '@/components/kit';
import { GradDir, HeroGradient, Night, Radius, Space, SunriseGradient } from '@/constants/night';
import { countdownTo } from '@/lib/format';
import { scheduleEveningNudge, scheduleRevealNotification, setupAndroidChannels } from '@/lib/notifications';
import { createNight, joinNight, useActiveNight, useIdentity } from '@/lib/store';
import { useNow } from '@/lib/use-now';

export function TonightPage() {
  const identity = useIdentity();
  const active = useActiveNight();
  const router = useRouter();
  const now = useNow();
  const [modal, setModal] = useState<'create' | 'join' | null>(null);
  const [busy, setBusy] = useState(false);

  const greeting = identity ? `Hey ${identity.name.split(' ')[0]}` : 'Hey there';

  const onCreate = async (name: string, revealHour: number) => {
    setBusy(true);
    const night = await createNight(name, revealHour);
    setModal(null);
    setBusy(false);
    await setupAndroidChannels();
    scheduleRevealNotification({ nightId: night.id, nightName: night.name, revealAt: night.revealAt });
    scheduleEveningNudge();
    router.push(`/night/${night.id}`);
  };

  const onJoin = async (code: string) => {
    setBusy(true);
    const night = await joinNight(code);
    setModal(null);
    setBusy(false);
    router.push(`/night/${night.id}`);
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Txt variant="caption" color={Night.textMuted}>
          {greeting}
        </Txt>
        <Txt variant="title">Morning After</Txt>
      </View>

      {active ? (
        <ActiveNightCard
          name={active.name}
          photoCount={active.photoCount}
          memberCount={active.members.length}
          revealReady={now >= active.revealAt}
          countdownLabel={countdownTo(active.revealAt, now).label}
          onOpen={() => router.push(`/night/${active.id}`)}
          onReveal={() => router.push(`/reveal/${active.id}`)}
        />
      ) : (
        <EmptyState onCreate={() => setModal('create')} onJoin={() => setModal('join')} busy={busy} />
      )}

      <View style={styles.footer}>
        <Icon name="lock-closed" size={13} color={Night.textMuted} />
        <Txt variant="caption" color={Night.textMuted} center>
          Locked till morning · revealed together
        </Txt>
      </View>

      <CreateNightSheet visible={modal === 'create'} onCancel={() => setModal(null)} onConfirm={onCreate} />
      <InputModal
        visible={modal === 'join'}
        title="Join a night"
        subtitle="Enter the invite code your friend shared."
        placeholder="GLOW-4827"
        confirmLabel="Join"
        autoCapitalize="characters"
        onCancel={() => setModal(null)}
        onConfirm={onJoin}
      />
    </Screen>
  );
}

/** Visual centerpiece: a tilted stack of "locked" photo cards waiting for the reveal. */
function LockedStack() {
  return (
    <View style={styles.stack}>
      <LinearGradient colors={HeroGradient} {...GradDir.diagonal} style={[styles.stackCard, styles.cardBack]} />
      <LinearGradient colors={SunriseGradient} {...GradDir.diagonalUp} style={[styles.stackCard, styles.cardMid]} />
      <LinearGradient colors={HeroGradient} {...GradDir.vertical} style={[styles.stackCard, styles.cardFront]}>
        <View style={styles.lockBadge}>
          <Icon name="lock-closed" size={30} color="#fff" />
        </View>
        <View style={styles.moonBadge}>
          <Icon name="moon" size={16} color="#fff" />
        </View>
      </LinearGradient>
    </View>
  );
}

function ActiveNightCard(props: {
  name: string;
  photoCount: number;
  memberCount: number;
  revealReady: boolean;
  countdownLabel: string;
  onOpen: () => void;
  onReveal: () => void;
}) {
  return (
    <View style={styles.body}>
      <Card style={styles.activeCard}>
        <Pill label={props.revealReady ? 'Reveal ready' : 'Locked'} color={props.revealReady ? Night.pink : Night.locked} />
        <Txt variant="title" style={{ marginTop: Space.sm }}>
          {props.name}
        </Txt>
        <Txt variant="body">
          {props.memberCount} {props.memberCount === 1 ? 'person' : 'people'} · {props.photoCount}{' '}
          {props.photoCount === 1 ? 'moment' : 'moments'} locked
        </Txt>

        {props.revealReady ? (
          <Pressable onPress={props.onReveal} style={{ marginTop: Space.lg }}>
            <LinearGradient colors={SunriseGradient} {...GradDir.horizontal} style={styles.revealBanner}>
              <Icon name="sunny" size={20} color="#1a1206" />
              <Txt variant="heading" color="#1a1206" center>
                Tap to reveal last night
              </Txt>
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={styles.countdownBox}>
            <Txt variant="caption" color={Night.textMuted}>
              Unlocks in
            </Txt>
            <Txt variant="display" color={Night.pink}>
              {props.countdownLabel}
            </Txt>
          </View>
        )}
      </Card>

      {!props.revealReady && <Button title="Open the night" onPress={props.onOpen} />}
    </View>
  );
}

function EmptyState({ onCreate, onJoin, busy }: { onCreate: () => void; onJoin: () => void; busy: boolean }) {
  return (
    <View style={styles.body}>
      <View style={styles.heroArt}>
        <LockedStack />
        <Txt variant="heading" center style={{ marginTop: Space.xl }}>
          Going out tonight?
        </Txt>
        <Txt variant="body" center style={{ maxWidth: 280 }}>
          Start a night, invite your crew, and capture it all. Nobody sees a thing until
          you unlock it together in the morning.
        </Txt>
      </View>
      <View style={{ gap: Space.sm }}>
        <Button title="Start a night" icon={<Icon name="sparkles" size={18} color="#fff" />} onPress={onCreate} disabled={busy} />
        <Button title="Join with a code" variant="secondary" icon={<Icon name="enter-outline" size={18} color="#fff" />} onPress={onJoin} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Space.md, gap: 2 },
  body: { flex: 1, justifyContent: 'center', gap: Space.lg },
  footer: { paddingBottom: Space.md, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  activeCard: { gap: 2 },
  countdownBox: { marginTop: Space.lg, alignItems: 'center', gap: 2 },
  revealBanner: {
    borderRadius: Radius.md,
    paddingVertical: Space.lg,
    paddingHorizontal: Space.md,
    flexDirection: 'row',
    gap: Space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArt: { alignItems: 'center', gap: Space.sm },
  // Locked-card stack
  stack: { width: 180, height: 168, alignItems: 'center', justifyContent: 'center' },
  stackCard: {
    position: 'absolute',
    width: 128,
    height: 148,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardBack: { transform: [{ rotate: '-11deg' }, { translateX: -22 }], opacity: 0.5 },
  cardMid: { transform: [{ rotate: '8deg' }, { translateX: 22 }], opacity: 0.75 },
  cardFront: { transform: [{ rotate: '-2deg' }], alignItems: 'center', justifyContent: 'center' },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonBadge: { position: 'absolute', top: 10, right: 10, opacity: 0.9 },
});
