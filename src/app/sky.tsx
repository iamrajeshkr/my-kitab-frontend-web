import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, type FinishedItem } from '@/lib/api';
import { serif } from '@/lib/theme';

const RADIUS: Record<string, number> = { byte: 3, summary: 5, journey: 8 }; // size = type
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export default function Sky() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [items, setItems] = useState<FinishedItem[]>([]);
  const [active, setActive] = useState<number | null>(null);

  useFocusEffect(useCallback(() => { api.getGarden().then((g) => setItems(g.finished ?? [])).catch(() => {}); }, []));

  const fieldH = Dimensions.get('window').height - insets.top - insets.bottom - 120;
  // Cluster by theme — same-theme reads sit near each other (the constellations).
  const stars = useMemo(() => {
    const cats = [...new Set(items.map((i) => i.category || 'misc'))];
    const center = new Map<string, { cx: number; cy: number }>();
    cats.forEach((cat, k) => {
      const cols = Math.ceil(Math.sqrt(cats.length));
      const col = k % cols, row = Math.floor(k / cols);
      const rows = Math.ceil(cats.length / cols);
      center.set(cat, { cx: ((col + 0.5) / cols) * width, cy: ((row + 0.5) / Math.max(1, rows)) * fieldH });
    });
    const spread = Math.min(width, fieldH) / (cats.length > 1 ? 5 : 2.4);
    return items.map((it, i) => {
      const c = center.get(it.category || 'misc')!;
      const a = (hash(it.id) % 360) * (Math.PI / 180);
      const d = (hash(it.id + 'r') % 100) / 100 * spread;
      const x = Math.max(16, Math.min(width - 16, c.cx + Math.cos(a) * d));
      const y = Math.max(20, Math.min(fieldH - 20, c.cy + Math.sin(a) * d));
      return { it, x, y, r: RADIUS[it.kind] ?? 4 };
    });
  }, [items, width, fieldH]);

  const pan = Gesture.Pan().onBegin((e) => pick(e.x, e.y)).onUpdate((e) => pick(e.x, e.y));
  const tap = Gesture.Tap().onEnd((e, ok) => { if (ok) pick(e.x, e.y); });
  function pick(x: number, y: number) {
    let best = -1, bd = 1e9;
    stars.forEach((s, i) => { const d = (s.x - x) ** 2 + (s.y - y) ** 2; if (d < bd) { bd = d; best = i; } });
    if (best >= 0 && bd < 60 * 60) setActive(best);
  }
  const sel = active != null ? stars[active] : null;

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-down" size={24} color="#E8DCC6" /></Pressable>
        <Text style={styles.title}>Your sky</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>

      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <View style={{ flex: 1 }}>
          {stars.map((s, i) => (
            <View key={`${s.it.kind}-${s.it.id}`} style={{ position: 'absolute', left: s.x - s.r, top: s.y - s.r }}>
              <View style={{ position: 'absolute', left: -s.r, top: -s.r, width: s.r * 4, height: s.r * 4, borderRadius: s.r * 2, backgroundColor: '#F4ECDC', opacity: i === active ? 0.28 : 0.12 }} />
              <View style={{ width: s.r * 2, height: s.r * 2, borderRadius: s.r, backgroundColor: '#F8F1DE', opacity: i === active ? 1 : 0.85 }} />
            </View>
          ))}
          {items.length === 0 && <Text style={styles.empty}>Finish a read to light your first star.</Text>}
        </View>
      </GestureDetector>

      {sel && (
        <Pressable style={[styles.label, { bottom: insets.bottom + 18 }]} onPress={() => router.push({ pathname: '/item/[type]/[id]', params: { type: sel.it.kind, id: sel.it.id } })}>
          <Text style={styles.labelTitle} numberOfLines={1}>{sel.it.title}</Text>
          <Text style={styles.labelMeta}>{sel.it.category || sel.it.kind} · tap to open</Text>
        </Pressable>
      )}
      {!sel && items.length > 0 && <Text style={[styles.hint, { bottom: insets.bottom + 18 }]}>Slide across the sky to trace a star</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0E0B1E' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 6 },
  title: { flex: 1, textAlign: 'center', fontFamily: serif, fontSize: 17, color: '#F4ECDC' },
  count: { width: 24, textAlign: 'right', fontSize: 13, color: '#8B85A0' },
  empty: { position: 'absolute', top: '44%', left: 0, right: 0, textAlign: 'center', color: '#8B85A0', fontStyle: 'italic', fontFamily: serif },
  label: { position: 'absolute', left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  labelTitle: { fontFamily: serif, fontSize: 16, color: '#F4ECDC' },
  labelMeta: { fontSize: 11, color: '#9A8FD8', marginTop: 3, textTransform: 'capitalize' },
  hint: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: '#6E6886', fontSize: 12, fontStyle: 'italic', fontFamily: serif },
});
