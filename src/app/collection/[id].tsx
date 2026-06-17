import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Modal, ActivityIndicator, Platform } from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '@/components/book-cover';
import { Skeleton } from '@/components/skeleton';
import { SwipeRow } from '@/components/swipe-row';
import { api, type CatalogRef } from '@/lib/api';
import { colors, serif } from '@/lib/theme';

export default function Collection() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [items, setItems] = useState<CatalogRef[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeletingApi, setIsDeletingApi] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.getPlaylist(Number(id)).then((r) => { setName(r.name); setItems(r.items); }).catch(() => {}).finally(() => setLoaded(true));
    }, [id])
  );

  const performDelete = async () => {
    setIsDeletingApi(true);
    try {
      await api.deletePlaylist(Number(id));
      setDeleting(false);
      router.back();
    } catch {
      setIsDeletingApi(false);
    }
  };

  return (
    <Animated.View
      entering={Platform.OS === 'web' ? SlideInRight.duration(280) : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable>
          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            <Text style={styles.title} numberOfLines={1}>{name || 'Collection'}</Text>
            <Text style={styles.count}>{items.length} saved</Text>
          </View>
          <Pressable onPress={() => setDeleting(true)} hitSlop={12}><Ionicons name="trash-outline" size={19} color={colors.muted} /></Pressable>
        </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        {!loaded && <View style={{ gap: 10 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={76} radius={14} />)}</View>}
        {loaded && items.map((it) => {
          const open = () => router.push({ pathname: '/item/[type]/[id]', params: { type: it.kind, id: it.id } });
          const del = async () => {
            setItems((prev) => prev.filter((x) => !(x.kind === it.kind && x.id === it.id)));
            try { await api.removeFromPlaylist(Number(id), it.kind, it.id); } catch { /* */ }
          };
          return (
            <SwipeRow key={`${it.kind}-${it.id}`} height={76} onPress={open} onDelete={del}>
              <View style={styles.row}>
                <BookCover item={{ type: it.kind, title: it.title, author: it.author, cover: it.cover }} w={44} r={6} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={2}>{it.title}</Text>
                  {!!it.author && <Text style={styles.rowMeta} numberOfLines={1}>{it.author}</Text>}
                </View>
              </View>
            </SwipeRow>
          );
        })}
        {loaded && items.length === 0 && <Text style={styles.empty}>Nothing here yet — add reads with the bookmark button.</Text>}
        {loaded && items.length > 0 && <Text style={styles.swipeHint}>Swipe a read left to remove it</Text>}
      </View>
      </ScrollView>

      <Modal visible={deleting} transparent animationType="slide" onRequestClose={() => setDeleting(false)}>
        <Pressable style={styles.backdrop} onPress={() => !isDeletingApi && setDeleting(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Delete collection?</Text>
          <Text style={styles.sheetDesc}>
            “{name}” will be permanently deleted. The reads you saved inside it will stay in your library.
          </Text>

          <Pressable style={[styles.btn, styles.btnDestructive]} onPress={performDelete} disabled={isDeletingApi}>
            {isDeletingApi ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnTextDestructive}>Delete Collection</Text>
            )}
          </Pressable>

          <Pressable style={[styles.btn, styles.btnCancel]} onPress={() => setDeleting(false)} disabled={isDeletingApi}>
            <Text style={styles.btnTextCancel}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontFamily: serif, fontSize: 19, color: colors.ink },
  count: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  empty: { color: colors.muted, fontStyle: 'italic', fontFamily: serif, fontSize: 13.5, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 10, marginBottom: 10 },
  rowTitle: { fontFamily: serif, fontSize: 14.5, color: colors.ink, lineHeight: 19 },
  rowMeta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  swipeHint: { fontSize: 11.5, color: colors.muted, fontStyle: 'italic', fontFamily: serif, textAlign: 'center', marginTop: 6 },

  backdrop: { flex: 1, backgroundColor: 'rgba(20,15,10,0.4)' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontFamily: serif, fontSize: 18, color: colors.ink, marginBottom: 8, fontWeight: '600' },
  sheetDesc: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 20 },
  btn: { borderRadius: 999, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  btnDestructive: { backgroundColor: colors.accent },
  btnCancel: { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  btnTextDestructive: { color: '#FFFFFF', fontWeight: '600', fontSize: 14.5 },
  btnTextCancel: { color: colors.ink, fontWeight: '500', fontSize: 14.5 },
});
