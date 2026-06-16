import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCard } from '@/components/content-card';
import { Skeleton } from '@/components/skeleton';
import { api, type CatalogRef } from '@/lib/api';
import { colors, serif } from '@/lib/theme';
import type { CatalogItem } from '@/lib/types';

const toCard = (it: CatalogRef): CatalogItem =>
  ({ type: it.kind, id: it.id, title: it.title, author: it.author, cover: it.cover, category: null, durationLabel: '' } as CatalogItem);

export default function Collection() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [items, setItems] = useState<CatalogRef[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.getPlaylist(Number(id)).then((r) => { setName(r.name); setItems(r.items); }).catch(() => {}).finally(() => setLoaded(true));
    }, [id])
  );

  const remove = () =>
    Alert.alert('Delete collection?', `"${name}" will be removed. The reads themselves stay.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.deletePlaylist(Number(id)); } catch {} router.back(); } },
    ]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 96 }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable>
        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <Text style={styles.title} numberOfLines={1}>{name || 'Collection'}</Text>
          <Text style={styles.count}>{items.length} saved</Text>
        </View>
        <Pressable onPress={remove} hitSlop={12}><Ionicons name="trash-outline" size={19} color={colors.muted} /></Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        {!loaded && <View style={{ gap: 10 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={92} radius={14} />)}</View>}
        {loaded && items.map((it) => <ContentCard key={`${it.kind}-${it.id}`} item={toCard(it)} />)}
        {loaded && items.length === 0 && <Text style={styles.empty}>Nothing here yet — add reads with the bookmark button.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontFamily: serif, fontSize: 19, color: colors.ink },
  count: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  empty: { color: colors.muted, fontStyle: 'italic', fontFamily: serif, fontSize: 13.5, textAlign: 'center', marginTop: 40 },
});
