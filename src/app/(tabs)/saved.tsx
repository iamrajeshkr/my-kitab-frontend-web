import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '@/components/book-cover';
import { Skeleton } from '@/components/skeleton';
import { api, type CatalogRef, type HighlightItem, type SavedSummary } from '@/lib/api';
import { colors, serif } from '@/lib/theme';

export default function Saved() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<SavedSummary | null>(null);
  const [lines, setLines] = useState<HighlightItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const load = useCallback(() => {
    api.getSaved().then(setData).catch(() => {}).finally(() => setLoaded(true));
    api.getHighlights().then((r) => setLines(r.items)).catch(() => {});
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    const n = name.trim();
    if (!n) return;
    try { await api.createPlaylist(n); setName(''); setCreating(false); load(); } catch { /* */ }
  };
  const openItem = (it: CatalogRef) => router.push({ pathname: '/item/[type]/[id]', params: { type: it.kind, id: it.id } });

  const collections = data?.collections ?? [];
  const recent = data?.recent ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 96 }}>
      <Text style={styles.h1}>Saved</Text>
      <Text style={styles.lede}>The things you set aside to return to.</Text>

      {/* collections */}
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Your collections</Text>
        <Pressable onPress={() => setCreating((v) => !v)} hitSlop={8}>
          <Text style={styles.new}>{creating ? 'Cancel' : '+ New'}</Text>
        </Pressable>
      </View>
      {creating && (
        <View style={styles.createRow}>
          <TextInput value={name} onChangeText={setName} placeholder="Collection name" placeholderTextColor={colors.muted}
            style={styles.input} autoFocus maxLength={60} returnKeyType="done" onSubmitEditing={create} />
          <Pressable onPress={create} style={styles.createBtn}><Text style={styles.createBtnText}>Create</Text></Pressable>
        </View>
      )}

      {!loaded ? (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <Skeleton width={150} height={86} radius={16} /><Skeleton width={150} height={86} radius={16} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
          {collections.map((c) => (
            <Pressable key={c.id} style={styles.collCard} onPress={() => router.push(`/collection/${c.id}` as Href)}>
              <Ionicons name="bookmarks-outline" size={18} color={colors.accent} />
              <Text style={styles.collName} numberOfLines={2}>{c.name}</Text>
              <Text style={styles.collCount}>{c.count} saved</Text>
            </Pressable>
          ))}
          {/* commonplace as a collection */}
          <Pressable style={[styles.collCard, { backgroundColor: colors.indigoSoft }]} onPress={() => router.push('/commonplace' as Href)}>
            <Ionicons name="text-outline" size={18} color={colors.indigo} />
            <Text style={styles.collName} numberOfLines={2}>Quotes I kept</Text>
            <Text style={styles.collCount}>{data?.highlights_count ?? 0} lines</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* saved lines — capped so a long underline can't take over */}
      {lines.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.section}>Lines you kept</Text>
            <Pressable onPress={() => router.push('/commonplace' as Href)} hitSlop={8} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.muted} />
            </Pressable>
          </View>
          {lines.slice(0, 2).map((l) => (
            <Pressable key={l.id} style={styles.quoteCard} onPress={() => router.push('/commonplace' as Href)}>
              <Text style={styles.quote} numberOfLines={3}>“{l.quote}”</Text>
              <Text style={styles.quoteFrom} numberOfLines={1}>From {l.title}</Text>
            </Pressable>
          ))}
        </>
      )}

      {/* recently saved */}
      {recent.length > 0 && (
        <>
          <Text style={[styles.section, { marginTop: 22 }]}>Recently saved</Text>
          {recent.map((it) => (
            <Pressable key={`${it.kind}-${it.id}`} style={styles.recentRow} onPress={() => openItem(it)}>
              <BookCover item={{ type: it.kind, title: it.title, author: it.author, cover: it.cover }} w={44} r={6} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.recentTitle} numberOfLines={2}>{it.title}</Text>
                {!!it.author && <Text style={styles.recentMeta} numberOfLines={1}>{it.author}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          ))}
        </>
      )}

      {loaded && collections.length === 0 && lines.length === 0 && recent.length === 0 && (
        <Text style={styles.empty}>Nothing saved yet. Bookmark a read or underline a line to start a collection.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: serif, fontSize: 26, color: colors.ink },
  lede: { fontSize: 13, color: colors.muted, fontStyle: 'italic', fontFamily: serif, marginTop: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  section: { fontFamily: serif, fontSize: 16, color: colors.ink },
  new: { fontSize: 13, color: colors.indigo, fontWeight: '600' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, color: colors.muted },
  createRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, color: colors.ink, backgroundColor: colors.card },
  createBtn: { backgroundColor: colors.indigo, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
  collCard: { width: 150, backgroundColor: colors.cardAlt, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14, gap: 8 },
  collName: { fontFamily: serif, fontSize: 15, color: colors.ink, lineHeight: 19 },
  collCount: { fontSize: 11.5, color: colors.muted },
  quoteCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 14, marginBottom: 10, maxHeight: 110, overflow: 'hidden' },
  quote: { fontFamily: serif, fontSize: 14.5, lineHeight: 21, color: colors.ink, fontStyle: 'italic' },
  quoteFrom: { fontSize: 11, color: colors.muted, marginTop: 8, letterSpacing: 0.3 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  recentTitle: { fontFamily: serif, fontSize: 14.5, color: colors.ink, lineHeight: 19 },
  recentMeta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  empty: { color: colors.muted, fontStyle: 'italic', fontFamily: serif, fontSize: 13.5, textAlign: 'center', marginTop: 40, lineHeight: 20 },
});
