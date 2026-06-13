import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, serif } from '@/lib/theme';

export function OnboardingFrame({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.frame, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.brand}>Kitab</Text>
        <Text style={styles.step}>{step} / 4</Text>
      </View>
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}

export function CTA({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.cta, (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 }]}>
      <Text style={styles.ctaText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  brand: { fontFamily: serif, fontSize: 20, color: colors.ink },
  step: { fontSize: 11, color: colors.muted },
  title: { fontFamily: serif, fontSize: 26, lineHeight: 34, color: colors.ink, marginBottom: 8 },
  sub: { fontSize: 13.5, lineHeight: 20, color: colors.muted, marginBottom: 16 },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  ctaText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '500' },
});
