import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { CTA, OnboardingFrame, Sub, Title } from '@/components/onboarding-ui';
import { Mode, usePrefs } from '@/lib/prefs';
import { colors, serif } from '@/lib/theme';

const OPTIONS: { key: Mode; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { key: 'read', icon: 'book-outline', title: 'Read', sub: 'Follow the text, highlight as you go' },
  { key: 'listen', icon: 'headset-outline', title: 'Listen', sub: 'Narrated in English and हिंदी by real voice artists' },
];

export default function ModePicker() {
  const router = useRouter();
  const prefs = usePrefs();
  const [mode, setMode] = useState<Mode>(prefs.mode);

  return (
    <OnboardingFrame step={3}>
      <Title>Read, or listen?</Title>
      <Sub>Every page in Kitab exists as both. This just sets your default.</Sub>
      {OPTIONS.map((o) => {
        const active = mode === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => setMode(o.key)}
            style={[styles.card, active && { borderColor: colors.accent, borderWidth: 1.5 }]}>
            <Ionicons name={o.icon} size={24} color={active ? colors.accent : colors.muted} />
            <Text style={styles.cardTitle}>{o.title}</Text>
            <Text style={styles.cardSub}>{o.sub}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.note}>You can switch anytime — even mid-page.</Text>
      <CTA
        label="Continue"
        onPress={() => {
          prefs.set({ mode });
          router.push('/onboarding/shelf');
        }}
      />
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  cardTitle: { fontFamily: serif, fontSize: 17, color: colors.ink, marginTop: 6 },
  cardSub: { fontSize: 11.5, color: colors.muted, marginTop: 2, textAlign: 'center' },
  note: { fontSize: 11.5, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
