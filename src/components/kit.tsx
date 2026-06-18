import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackdropGradient, GradDir, HeroGradient, Night, Radius, Space } from '@/constants/night';

/** Full-bleed dark gradient background used on every screen. */
export function Backdrop({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={BackdropGradient} style={StyleSheet.absoluteFill}>
      {children}
    </LinearGradient>
  );
}

export function Screen({
  children,
  scroll,
  edges,
  style,
}: PropsWithChildren<{
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: StyleProp<ViewStyle>;
}>) {
  return (
    <View style={styles.flex}>
      <Backdrop />
      <SafeAreaView style={styles.flex} edges={edges ?? ['top', 'bottom']}>
        <View style={[styles.screenBody, style]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

type TxtVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'mono' | 'caption';

export function Txt({
  variant = 'body',
  color,
  center,
  style,
  ...rest
}: TextProps & { variant?: TxtVariant; color?: string; center?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        styles.txtBase,
        txt[variant],
        color ? { color } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}

export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  icon,
  ...rest
}: PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const isPrimary = variant === 'primary';
  const content = (
    <View style={styles.btnInner}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : Night.text} />
      ) : (
        <>
          {icon}
          <Txt variant="label" color={variant === 'ghost' ? Night.textSecondary : '#fff'}>
            {title}
          </Txt>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        (disabled || loading) && styles.btnDisabled,
        pressed && styles.btnPressed,
        style,
      ]}
      {...rest}
    >
      {isPrimary ? (
        <LinearGradient colors={HeroGradient} {...GradDir.horizontal} style={StyleSheet.absoluteFill} />
      ) : null}
      {content}
    </Pressable>
  );
}

export function Pill({ label, color = Night.purple }: { label: string; color?: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Txt variant="caption" color={color}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenBody: {
    flex: 1,
    paddingHorizontal: Space.lg,
  },
  txtBase: { color: Night.text },
  card: {
    backgroundColor: Night.card,
    borderColor: Night.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Space.lg,
  },
  btn: {
    height: 56,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.lg,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  btnSecondary: {
    backgroundColor: Night.bgElevated,
    borderColor: Night.cardBorder,
    borderWidth: 1,
  },
  btnGhost: { backgroundColor: 'transparent', height: 44 },
  btnDanger: { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: Night.danger, borderWidth: 1 },
  btnDisabled: { opacity: 0.45 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  pill: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Space.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});

const txt = StyleSheet.create({
  display: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400', color: Night.textSecondary, lineHeight: 22 },
  label: { fontSize: 16, fontWeight: '700' },
  mono: { fontSize: 22, fontWeight: '800', letterSpacing: 4 },
  caption: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
});
