import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { colors, serif } from '@/lib/theme';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function Streak() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [active, setActive] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);

  useFocusEffect(useCallback(() => {
    api.getGarden().then((g) => { setActive(new Set(g.active_days ?? [])); setStreak(g.streak ?? 0); }).catch(() => {});
  }, []));

  // Last 35 days as 5 week-rows (Mon-Sun), oldest first.
  const today = new Date();
  const todayIso = iso(today);
  const start = new Date(today);
  start.setDate(today.getDate() - 34);
  // back up to Monday
  const sd = start.getDay();
  start.setDate(start.getDate() - (sd === 0 ? 6 : sd - 1));
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + w * 7 + i); row.push(d); }
    weeks.push(row);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable>
        <Text style={styles.title}>Your streak</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.big}>{streak}</Text>
        <Text style={styles.bigLabel}>{streak === 1 ? 'day' : 'days'} returning</Text>

        <View style={styles.dowRow}>{DOW.map((d, i) => <Text key={i} style={styles.dow}>{d}</Text>)}</View>
        {weeks.map((row, w) => (
          <View key={w} style={styles.weekRow}>
            {row.map((d) => {
              const k = iso(d);
              const on = active.has(k);
              const future = k > todayIso;
              const isToday = k === todayIso;
              return (
                <View key={k} style={styles.cell}>
                  <View style={[styles.dot, on && styles.dotOn, isToday && !on && styles.dotToday, future && styles.dotFuture]}>
                    {on && <Ionicons name="leaf" size={13} color="#fff" />}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        <Text style={styles.footer}>Miss a day and nothing wilts — your streak simply waits for you.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  title: { flex: 1, textAlign: 'center', fontFamily: serif, fontSize: 17, color: colors.ink },
  big: { fontFamily: serif, fontSize: 48, color: colors.accent, textAlign: 'center', marginTop: 6 },
  bigLabel: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 22 },
  dowRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  dow: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  cell: { flex: 1, alignItems: 'center' },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardAlt },
  dotOn: { backgroundColor: colors.accent },
  dotToday: { borderWidth: 1.5, borderColor: colors.accent, backgroundColor: 'transparent' },
  dotFuture: { backgroundColor: 'transparent' },
  footer: { fontSize: 12.5, color: colors.muted, fontStyle: 'italic', fontFamily: serif, textAlign: 'center', marginTop: 20, paddingHorizontal: 20, lineHeight: 18 },
});
