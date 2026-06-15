import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCard } from '@/components/content-card';
import { Skeleton } from '@/components/skeleton';
import { api, type CatalogRef, type ThreadGroup } from '@/lib/api';
import { usePrefs } from '@/lib/prefs';
import { colors, serif } from '@/lib/theme';
import type { CatalogItem } from '@/lib/types';

const toCard = (it: CatalogRef): CatalogItem =>
  ({ type: it.kind, id: it.id, title: it.title, author: it.author, cover: it.cover, category: null, durationLabel: '' } as CatalogItem);

export default function Room() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prefs = usePrefs();
  const [room, setRoom] = useState<ThreadGroup | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.getThreads(prefs.language)
        .then((r) => setRoom(r.threads.find((t) => t.slug === slug) ?? null))
        .catch(() => {})
        .finally(() => setLoaded(true));
    }, [slug, prefs.language])
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 96 }}>
      <View style={[styles.hero, { paddingTop: insets.top + 12, backgroundColor: room?.bg ?? colors.ink }]}>
        <View style={[styles.glow, { backgroundColor: `${room?.accent ?? '#E2A24A'}33` }]} />
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#F2ECDC" />
        </Pressable>
        {room && (
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.kicker, { color: room.accent ?? '#E2A24A' }]}>Reading room</Text>
            <Text style={styles.title}>{room.title}</Text>
            {!!room.note && <Text style={styles.note}>{room.note}</Text>}
          </View>
        )}
      </View>

      <View style={{ padding: 20 }}>
        {!loaded && (
          <View style={{ gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={92} radius={14} />)}
          </View>
        )}
        {loaded && room?.items.map((it) => <ContentCard key={`${it.kind}-${it.id}`} item={toCard(it)} />)}
        {loaded && (!room || room.items.length === 0) && <Text style={styles.empty}>This room is quiet right now.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 22, overflow: 'hidden' },
  glow: { position: 'absolute', top: -40, right: -30, width: 200, height: 200, borderRadius: 100 },
  kicker: { fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' },
  title: { fontFamily: serif, fontSize: 25, color: '#F2ECDC', marginTop: 6, lineHeight: 30 },
  note: { fontSize: 13, color: '#E4DCC9', fontStyle: 'italic', fontFamily: serif, lineHeight: 19, marginTop: 8, maxWidth: 300 },
  empty: { color: colors.muted, fontSize: 13, marginTop: 24, textAlign: 'center' },
});
