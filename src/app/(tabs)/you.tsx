import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrefs } from '@/lib/prefs';
import { colors, serif } from '@/lib/theme';
import type { Lang } from '@/lib/types';

const RHYTHM_LABEL = { morning: 'Morning pages', commute: 'Commute', winddown: 'Wind-down' };
const MODE_LABEL = { read: 'Read', listen: 'Listen' };

export default function You() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prefs = usePrefs();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 32 }}>
      <Text style={styles.h1}>You</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{prefs.daysUsed.length}</Text>
          <Text style={styles.statLabel}>days with Kitab</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{prefs.saved.length}</Text>
          <Text style={styles.statLabel}>on your shelf</Text>
        </View>
      </View>

      {!!prefs.intent && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOUR INTENT</Text>
          <Text style={styles.intent}>"{prefs.intent}"</Text>
        </View>
      )}

      <Text style={styles.section}>Preferences</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>LANGUAGE</Text>
        <View style={styles.toggleRow}>
          {(['en', 'hi'] as Lang[]).map((l) => {
            const active = prefs.language === l;
            return (
              <Pressable
                key={l}
                onPress={() => prefs.set({ language: l })}
                style={[styles.toggle, active ? styles.toggleActive : styles.toggleIdle]}>
                <Text style={[styles.toggleText, active && { color: colors.inkInverse }]}>
                  {l === 'en' ? 'English' : 'हिंदी'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>DEFAULT MODE</Text>
        <View style={styles.toggleRow}>
          {(['read', 'listen'] as const).map((m) => {
            const active = prefs.mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => prefs.set({ mode: m })}
                style={[styles.toggle, active ? styles.toggleActive : styles.toggleIdle]}>
                <Text style={[styles.toggleText, active && { color: colors.inkInverse }]}>
                  {MODE_LABEL[m]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>DAILY RHYTHM</Text>
        <View style={styles.toggleRow}>
          {(['morning', 'commute', 'winddown'] as const).map((r) => {
            const active = prefs.rhythm === r;
            return (
              <Pressable
                key={r}
                onPress={() => prefs.set({ rhythm: r })}
                style={[styles.toggle, active ? styles.toggleActive : styles.toggleIdle]}>
                <Text style={[styles.toggleText, active && { color: colors.inkInverse }]}>
                  {RHYTHM_LABEL[r]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={styles.redo}
        onPress={() => {
          prefs.set({ onboarded: false });
          router.replace('/onboarding');
        }}>
        <Ionicons name="refresh-outline" size={15} color={colors.muted} />
        <Text style={styles.redoText}>Redo onboarding</Text>
      </Pressable>

      <Text style={styles.note}>Guest mode — sign in coming soon to sync your shelf across devices.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: serif, fontSize: 24, color: colors.ink, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statNum: { fontFamily: serif, fontSize: 26, color: colors.ink },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardLabel: { fontSize: 10.5, letterSpacing: 1.2, color: colors.muted, fontWeight: '500', marginBottom: 8 },
  intent: { fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: colors.ink },
  section: { fontFamily: serif, fontSize: 16, color: colors.ink, marginTop: 8, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  toggle: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  toggleActive: { backgroundColor: colors.ink },
  toggleIdle: { backgroundColor: colors.bg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  toggleText: { fontSize: 12.5, color: colors.ink },
  redo: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  redoText: { fontSize: 12.5, color: colors.muted },
  note: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 4 },
});
