import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button, Screen, Txt } from '@/components/kit';
import { Icon } from '@/components/icon';
import { GradDir, HeroGradient, Night, Radius, Space } from '@/constants/night';
import { saveIdentity } from '@/lib/store';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const onContinue = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await saveIdentity(name);
    // The root gate will route us home once identity exists.
    router.replace('/');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <LinearGradient colors={HeroGradient} {...GradDir.diagonalUp} style={styles.badge}>
            <Icon name="moon" size={48} color="#fff" />
          </LinearGradient>
          <Txt variant="title" center>
            Morning After
          </Txt>
          <Txt variant="body" center style={{ maxWidth: 300 }}>
            Take photos on your night out. They stay locked for everyone — until you
            all unlock them together in the morning.
          </Txt>
        </View>

        <View style={styles.form}>
          <Txt variant="caption" color={Night.textMuted}>
            What should your friends call you?
          </Txt>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Night.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="go"
            maxLength={24}
            onSubmitEditing={onContinue}
          />
          <Button title="Let’s go" onPress={onContinue} loading={saving} disabled={!name.trim()} />
          <Txt variant="caption" color={Night.textMuted} center>
            No sign-up. No password. Just a name.
          </Txt>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.sm,
  },
  form: { gap: Space.md, paddingBottom: Space.xl },
  input: {
    backgroundColor: Night.bgElevated,
    borderColor: Night.cardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    height: 56,
    color: Night.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
