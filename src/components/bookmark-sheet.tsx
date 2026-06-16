import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, type Playlist } from '@/lib/api';
import { colors, serif } from '@/lib/theme';
import type { ItemType } from '@/lib/types';

// Bottom sheet to add/remove an item to/from collections. Opens from any
// bookmark control. onClose reports whether the item ends up in ≥1 collection.
export function BookmarkSheet({ item, onClose }: { item: { kind: ItemType; id: string } | null; onClose: (saved: boolean) => void }) {
  const [lists, setLists] = useState<Playlist[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!item) { setLists(null); setCreating(false); setName(''); return; }
    api.getPlaylists(item).then((r) => setLists(r.playlists)).catch(() => setLists([]));
  }, [item?.kind, item?.id]);

  const anySaved = (lists ?? []).some((l) => l.has);
  const close = () => onClose(anySaved);

  const toggle = async (l: Playlist) => {
    if (!item) return;
    setLists((prev) => prev?.map((x) => (x.id === l.id ? { ...x, has: !x.has, count: x.count + (x.has ? -1 : 1) } : x)) ?? null);
    try {
      if (l.has) await api.removeFromPlaylist(l.id, item.kind, item.id);
      else await api.addToPlaylist(l.id, item.kind, item.id);
    } catch {
      api.getPlaylists(item).then((r) => setLists(r.playlists)).catch(() => {});
    }
  };

  const create = async () => {
    const n = name.trim();
    if (!n || !item) return;
    try {
      const p = await api.createPlaylist(n);
      await api.addToPlaylist(p.id, item.kind, item.id);
      setLists((prev) => [...(prev ?? []), { id: p.id, name: p.name, count: 1, has: true }]);
      setName(''); setCreating(false);
    } catch { /* ignore */ }
  };

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Save to collection</Text>
        {lists === null ? (
          <ActivityIndicator color={colors.indigo} style={{ marginVertical: 28 }} />
        ) : (
          <>
            {lists.length === 0 && !creating && <Text style={styles.empty}>No collections yet — make your first.</Text>}
            {lists.map((l) => (
              <Pressable key={l.id} style={styles.row} onPress={() => toggle(l)}>
                <Ionicons name={l.has ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={l.has ? colors.accent : colors.muted} />
                <Text style={styles.rowName} numberOfLines={1}>{l.name}</Text>
                <Text style={styles.rowCount}>{l.count}</Text>
              </Pressable>
            ))}
            {creating ? (
              <View style={styles.createRow}>
                <TextInput value={name} onChangeText={setName} placeholder="Collection name" placeholderTextColor={colors.muted} style={styles.input} autoFocus onSubmitEditing={create} returnKeyType="done" maxLength={60} />
                <Pressable onPress={create} style={styles.createBtn}><Text style={styles.createBtnText}>Create</Text></Pressable>
              </View>
            ) : (
              <Pressable style={styles.newRow} onPress={() => setCreating(true)}>
                <Ionicons name="add" size={20} color={colors.indigo} />
                <Text style={styles.newText}>New collection</Text>
              </Pressable>
            )}
          </>
        )}
        <Pressable style={styles.done} onPress={close}><Text style={styles.doneText}>Done</Text></Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,15,10,0.4)' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: serif, fontSize: 18, color: colors.ink, marginBottom: 12 },
  empty: { color: colors.muted, fontStyle: 'italic', fontFamily: serif, fontSize: 13, marginVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowName: { flex: 1, fontSize: 15, color: colors.ink },
  rowCount: { fontSize: 12, color: colors.muted },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, marginTop: 4 },
  newText: { fontSize: 15, color: colors.indigo, fontWeight: '500' },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, color: colors.ink, backgroundColor: colors.card },
  createBtn: { backgroundColor: colors.indigo, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
  done: { marginTop: 16, backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 13, alignItems: 'center' },
  doneText: { color: colors.inkInverse, fontWeight: '600', fontSize: 14 },
});
