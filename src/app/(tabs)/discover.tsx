import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCard } from '@/components/content-card';
import { colors, serif } from '@/lib/theme';
import { useCatalog } from '@/lib/use-catalog';
import type { ItemType } from '@/lib/types';

const FILTERS: { key: 'all' | ItemType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'byte', label: 'Bytes' },
  { key: 'summary', label: 'Summaries' },
  { key: 'journey', label: 'Journeys' },
];

export default function Discover() {
  const insets = useSafeAreaInsets();
  const { items, error, loading } = useCatalog();
  const [filter, setFilter] = useState<'all' | ItemType>('all');

  const filtered = (items ?? []).filter((i) => filter === 'all' || i.type === filter);

  // Group by category; journeys/summaries without category go to themed shelves
  const groups = new Map<string, typeof filtered>();
  for (const item of filtered) {
    const key =
      item.category ??
      (item.type === 'journey' ? 'Journeys' : item.type === 'summary' ? 'Heartfulness wisdom' : 'More');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 32 }}>
      <Text style={styles.h1}>Discover</Text>
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filter, active ? styles.filterActive : styles.filterIdle]}>
              <Text style={[styles.filterText, active && { color: colors.inkInverse }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      {error && <Text style={styles.error}>Couldn't load the library — {error}</Text>}

      {[...groups.entries()].map(([category, list]) => (
        <View key={category}>
          <Text style={styles.section}>{category}</Text>
          {list.slice(0, 6).map((i) => (
            <ContentCard key={`${i.type}-${i.id}`} item={i} />
          ))}
          {list.length > 6 && (
            <Text style={styles.more}>+ {list.length - 6} more in {category}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: serif, fontSize: 24, color: colors.ink, marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  filter: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  filterActive: { backgroundColor: colors.ink },
  filterIdle: { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  filterText: { fontSize: 12, color: colors.ink },
  section: { fontFamily: serif, fontSize: 16, color: colors.ink, marginTop: 8, marginBottom: 8 },
  error: { color: colors.accent, fontSize: 12.5, marginVertical: 12 },
  more: { fontSize: 11.5, color: colors.muted, marginBottom: 12, marginLeft: 2 },
});
