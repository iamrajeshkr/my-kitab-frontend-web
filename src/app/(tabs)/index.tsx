import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCard } from '@/components/content-card';
import { usePrefs } from '@/lib/prefs';
import { colors, serif } from '@/lib/theme';
import { useCatalog } from '@/lib/use-catalog';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Shelf() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prefs = usePrefs();
  const { items, error, loading } = useCatalog();

  // Pick today's byte deterministically by day so it rotates daily
  const bytes = items?.filter((i) => i.type === 'byte') ?? [];
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const todaysByte = bytes.length ? bytes[dayIndex % bytes.length] : null;
  const savedItems = items?.filter((i) => prefs.saved.includes(i.id)) ?? [];
  const cont = prefs.continueState;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 32 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>{greeting()}</Text>
          <Text style={styles.h1}>Your Shelf</Text>
        </View>
        <View style={styles.streak}>
          <Text style={styles.streakText}>{prefs.daysUsed.length} {prefs.daysUsed.length === 1 ? 'day' : 'days'} with Kitab</Text>
        </View>
      </View>

      {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      {error && <Text style={styles.error}>Couldn't reach your library — {error}</Text>}

      {todaysByte && (
        <Pressable
          style={styles.today}
          onPress={() => router.push({ pathname: '/item/[type]/[id]', params: { type: 'byte', id: todaysByte.id } })}>
          <Text style={[styles.tag, { color: colors.accent }]}>Today's page · Byte · {todaysByte.durationLabel}</Text>
          <View style={styles.todayRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.todayTitle}>{todaysByte.title}</Text>
              <Text style={styles.meta}>
                {[todaysByte.author, todaysByte.category].filter(Boolean).join(' · ')}
              </Text>
              <Text style={[styles.meta, { marginTop: 6 }]}>Read · Listen · EN / हिंदी</Text>
            </View>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={20} color="#FFFFFF" />
            </View>
          </View>
        </Pressable>
      )}

      {cont && (
        <>
          <Text style={styles.section}>Continue</Text>
          <Pressable
            style={[styles.today, { backgroundColor: colors.cardAlt }]}
            onPress={() => router.push({ pathname: '/item/[type]/[id]', params: { type: 'journey', id: cont.id } })}>
            <Text style={[styles.tag, { color: colors.indigo }]}>
              Journey · chapter {cont.chapterSeq} of {cont.totalChapters}
            </Text>
            <Text style={[styles.todayTitle, { fontSize: 15.5, marginBottom: 8 }]}>{cont.title}</Text>
            <View style={styles.trackBg}>
              <View style={[styles.trackFill, { width: `${(cont.chapterSeq / cont.totalChapters) * 100}%` }]} />
            </View>
            {cont.nextTitle && <Text style={[styles.meta, { marginTop: 5 }]}>Next: {cont.nextTitle}</Text>}
          </Pressable>
        </>
      )}

      {savedItems.length > 0 && (
        <>
          <Text style={styles.section}>Saved</Text>
          {savedItems.map((i) => (
            <ContentCard key={i.id} item={i} />
          ))}
        </>
      )}

      {!loading && !error && (
        <Text style={styles.endNote}>— That's your page for today —</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  kicker: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.muted, fontWeight: '500' },
  h1: { fontFamily: serif, fontSize: 24, color: colors.ink, marginTop: 2 },
  streak: { backgroundColor: colors.cardAlt, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  streakText: { fontSize: 11, color: colors.ink },
  today: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayTitle: { fontFamily: serif, fontSize: 18, color: colors.ink, marginTop: 3 },
  tag: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '500' },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { fontFamily: serif, fontSize: 16, color: colors.ink, marginTop: 8, marginBottom: 8 },
  trackBg: { height: 5, borderRadius: 3, backgroundColor: colors.track },
  trackFill: { height: 5, borderRadius: 3, backgroundColor: colors.indigo },
  error: { color: colors.accent, fontSize: 12.5, marginVertical: 12 },
  endNote: {
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 12.5,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
  },
});
