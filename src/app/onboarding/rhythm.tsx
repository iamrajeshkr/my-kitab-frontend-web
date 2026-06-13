import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CTA, OnboardingFrame, Sub, Title } from '@/components/onboarding-ui';
import { Rhythm, usePrefs } from '@/lib/prefs';
import { colors, serif } from '@/lib/theme';

const OPTIONS: { key: Rhythm; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { key: 'morning', icon: 'sunny-outline', title: 'Morning pages', sub: 'Start the day with a clear head' },
  { key: 'commute', icon: 'train-outline', title: 'Commute', sub: 'Listen on the way, hands free' },
  { key: 'winddown', icon: 'moon-outline', title: 'Wind-down', sub: 'Slower pace, softer screen, sleep timer' },
];

export default function RhythmPicker() {
  const router = useRouter();
  const prefs = usePrefs();
  const [rhythm, setRhythm] = useState<Rhythm>(prefs.rhythm);

  return (
    <OnboardingFrame step={2}>
      <Title>When does Kitab fit your day?</Title>
      <Sub>This sets your daily page and one gentle reminder. Never more.</Sub>
      {OPTIONS.map((o) => {
        const active = rhythm === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => setRhythm(o.key)}
            style={[styles.card, active && styles.cardActive]}>
            <Ionicons name={o.icon} size={20} color={active ? colors.accent : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{o.title}</Text>
              <Text style={styles.cardSub}>{o.sub}</Text>
            </View>
            {active && <Ionicons name="checkmark" size={18} color={colors.accent} />}
          </Pressable>
        );
      })}
      <CTA
        label="Continue"
        onPress={() => {
          prefs.set({ rhythm });
          router.push('/onboarding/mode');
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
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardActive: { borderColor: colors.accent, borderWidth: 1.5 },
  cardTitle: { fontFamily: serif, fontSize: 16, color: colors.ink },
  cardSub: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
});
