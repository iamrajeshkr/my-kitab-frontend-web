import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ContentCard } from '@/components/content-card';
import { CTA, OnboardingFrame, Sub, Title } from '@/components/onboarding-ui';
import { usePrefs } from '@/lib/prefs';
import { colors } from '@/lib/theme';
import { useCatalog } from '@/lib/use-catalog';

export default function FirstShelf() {
  const router = useRouter();
  const prefs = usePrefs();
  const { items, error, loading } = useCatalog();

  // One journey, one byte, one summary — the first path
  const picks = items
    ? (['journey', 'byte', 'summary'] as const)
        .map((t) => items.find((i) => i.type === t))
        .filter((i) => i != null)
    : [];

  const finish = () => {
    prefs.set({ onboarded: true, saved: [...new Set([...prefs.saved, ...picks.map((p) => p.id)])] });
    router.replace('/(tabs)');
  };

  return (
    <OnboardingFrame step={4}>
      <Title>{prefs.intent ? `For "${prefs.intent}", start here` : 'Start here'}</Title>
      <Sub>A path picked from your words. No account needed yet.</Sub>
      {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />}
      {error && <Text style={styles.error}>Couldn't load your shelf — {error}</Text>}
      <View>
        {picks.map((p) => (
          <ContentCard key={p.id} item={p} />
        ))}
      </View>
      <Text style={styles.note}>Sign in later to keep your place</Text>
      <CTA label="Start with Kitab" disabled={loading} onPress={finish} />
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.accent, fontSize: 12.5, marginVertical: 12 },
  note: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 'auto', marginBottom: 8 },
});
