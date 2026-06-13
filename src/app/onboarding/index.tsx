import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CTA, OnboardingFrame, Sub, Title } from '@/components/onboarding-ui';
import { usePrefs } from '@/lib/prefs';
import { colors, serif } from '@/lib/theme';
import type { Lang } from '@/lib/types';

const CHIPS = ['a calmer mind', 'better focus', 'deeper sleep', 'less anxious'];

export default function LanguageIntent() {
  const router = useRouter();
  const prefs = usePrefs();
  const [lang, setLang] = useState<Lang>(prefs.language);
  const [intent, setIntent] = useState(prefs.intent);

  return (
    <OnboardingFrame step={1}>
      <View style={styles.langRow}>
        {(['en', 'hi'] as Lang[]).map((l) => (
          <Pressable
            key={l}
            onPress={() => setLang(l)}
            style={[styles.langToggle, lang === l ? styles.langActive : styles.langIdle]}>
            <Text style={[styles.langText, lang === l && { color: colors.inkInverse }]}>
              {l === 'en' ? 'English' : 'हिंदी'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Title>What are you trying to become?</Title>
      <Sub>Tell Kitab in your own words. This shapes everything we show you.</Sub>
      <TextInput
        style={styles.input}
        multiline
        placeholder={'"I feel restless all the time…"'}
        placeholderTextColor={colors.muted}
        value={intent}
        onChangeText={setIntent}
      />
      <Text style={styles.orLabel}>OR START WITH</Text>
      <View style={styles.chips}>
        {CHIPS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setIntent(c)}
            style={[styles.chip, intent === c && { borderColor: colors.accent, borderWidth: 1.5 }]}>
            <Text style={styles.chipText}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <CTA
        label="Continue"
        disabled={!intent.trim()}
        onPress={() => {
          prefs.set({ language: lang, intent: intent.trim() });
          router.push('/onboarding/rhythm');
        }}
      />
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  langRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  langToggle: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18 },
  langActive: { backgroundColor: colors.ink },
  langIdle: { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  langText: { fontSize: 13, color: colors.ink },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    minHeight: 92,
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  orLabel: { fontSize: 11, letterSpacing: 1.2, color: colors.muted, fontWeight: '500', marginVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 12.5, color: colors.ink },
});
