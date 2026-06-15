import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, type FinishedItem } from '@/lib/api';
import { colors, serif, typeColors } from '@/lib/theme';

// ── Spine dimensions ────────────────────────────────────────────────────────
// Wider slots + taller heights → title text is readable at a glance.
const SLOT = 38;
const BOOK_W = 34;

// Heights per content type — tall enough that ~4 words of the title are visible.
const hFor = (t: string, seed: number) =>
  (t === 'journey' ? 220 : t === 'summary' ? 200 : 180) + ((seed * 7) % 12) - 6;

// Width per content type — journeys are the fattest spines.
const wFor = (t: string) => (t === 'journey' ? 42 : t === 'summary' ? 34 : 28);

// ── Category config ─────────────────────────────────────────────────────────
type CategoryKey = 'journey' | 'byte' | 'summary';
const CATEGORIES: { key: CategoryKey; label: string; accent: string }[] = [
  { key: 'journey', label: 'Journeys', accent: colors.indigo },
  { key: 'byte',    label: 'Bites',    accent: colors.accent },
  { key: 'summary', label: 'Summaries', accent: colors.muted },
];

// ── One book spine ──────────────────────────────────────────────────────────
// Leans away from the focused book; the focused book peeks up.
// A second tap topples it open.
function Book({ item, idx, focus, lift, openRot, onPress }: {
  item: FinishedItem; idx: number; focus: SharedValue<number>; lift: SharedValue<number>; openRot: SharedValue<number>; onPress: () => void;
}) {
  const h = hFor(item.kind, item.title.length);
  const w = wFor(item.kind);
  const bg = typeColors[item.kind] ?? colors.muted;
  const isJourney = item.kind === 'journey';

  const st = useAnimatedStyle(() => {
    'worklet';
    const f = focus.value;
    let rot = 4, ty = 0, sc = 1, z = 1;
    if (f >= 0) {
      if (Math.abs(f - idx) < 0.5) { rot = openRot.value; ty = -20 + lift.value; sc = 1.07; z = 30; }
      else rot = idx < f ? -12 : 12;
    }
    return { zIndex: z, transform: [{ perspective: 600 }, { translateY: ty }, { rotateZ: `${rot}deg` }, { scale: sc }] };
  });

  return (
    <Pressable onPress={onPress} style={{ width: SLOT, alignItems: 'center' }}>
      <Animated.View style={[{
        width: w, height: h, borderRadius: 3, backgroundColor: bg,
        overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        transformOrigin: 'bottom',
      }, st]}>
        <View style={[styles.band, { top: 8 }]} />
        <View style={[styles.band, { bottom: 8 }]} />
        {isJourney ? (
          // Journey spines are wide enough for horizontal multi-line text —
          // reads naturally like a real thick book spine.
          <Text numberOfLines={4} style={{
            fontFamily: serif, fontSize: 9, lineHeight: 11.5,
            color: '#FFFFFF', opacity: 0.92, textAlign: 'center',
            paddingHorizontal: 3, width: w - 4,
          }}>
            {item.title}
          </Text>
        ) : (
          // Non-journey: rotated 90° single-line (wider spine = more visible text).
          <Text numberOfLines={1} style={{
            transform: [{ rotate: '90deg' }],
            width: h - 18, fontFamily: serif, fontSize: 10,
            color: '#FFFFFF', opacity: 0.9, textAlign: 'center',
          }}>
            {item.title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function Library() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<FinishedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [focusJS, setFocusJS] = useState(-1);

  const focus = useSharedValue(-1);
  const lift = useSharedValue(0);
  const openRot = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      api.getGarden().then((g) => setItems(g.finished ?? [])).catch(() => {}).finally(() => setLoaded(true));
    }, [])
  );

  // Group by kind → only show non-empty categories, in the order defined above.
  const perRack = Math.max(5, Math.floor((Dimensions.get('window').width - 48) / SLOT));

  const categoryRacks = useMemo(() => {
    const byKind: Record<string, FinishedItem[]> = {};
    for (const it of items) {
      (byKind[it.kind] ??= []).push(it);
    }
    // Build a flat index so each book has a unique absolute index across all racks.
    let absStart = 0;
    const result: { key: CategoryKey; label: string; accent: string; racks: { items: FinishedItem[]; absStart: number }[] }[] = [];
    for (const cat of CATEGORIES) {
      const group = byKind[cat.key];
      if (!group || group.length === 0) continue;
      const racks: { items: FinishedItem[]; absStart: number }[] = [];
      for (let i = 0; i < group.length; i += perRack) {
        racks.push({ items: group.slice(i, i + perRack), absStart });
        absStart += Math.min(perRack, group.length - i);
      }
      result.push({ ...cat, racks });
    }
    return result;
  }, [items, perRack]);

  // Build flat array for index → item lookup (for focusInfo).
  const flatItems = useMemo(() => {
    const arr: FinishedItem[] = [];
    for (const cat of categoryRacks) for (const rack of cat.racks) arr.push(...rack.items);
    return arr;
  }, [categoryRacks]);

  // ── Interactions ────────────────────────────────────────────────────────
  const setFocus = (i: number) => {
    focus.value = withTiming(i, { duration: 280 });
    setFocusJS(i);
    Haptics.selectionAsync().catch(() => {});
  };
  const open = (it: FinishedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    openRot.value = withTiming(14, { duration: 300 });
    lift.value = withTiming(200, { duration: 320 }, (done) => {
      if (done) runOnJS(go)(it);
    });
  };
  const go = (it: FinishedItem) => {
    lift.value = 0; openRot.value = 0; focus.value = -1; setFocusJS(-1);
    router.push({ pathname: '/item/[type]/[id]', params: { type: it.kind, id: it.id } });
  };
  const pressBook = (absIdx: number, it: FinishedItem) => {
    if (focusJS === absIdx) open(it);
    else setFocus(absIdx);
  };

  // Riffle: drag across a rack to sweep the focus along it.
  const rackPan = (start: number, count: number, width: number) =>
    Gesture.Pan().activeOffsetX([-10, 10]).onUpdate((e) => {
      'worklet';
      const rel = Math.max(0, Math.min(count - 1, Math.floor((e.x / width) * count)));
      focus.value = start + rel;
    }).onEnd((e) => {
      'worklet';
      const rel = Math.max(0, Math.min(count - 1, Math.floor((e.x / width) * count)));
      runOnJS(setFocusJS)(start + rel);
    });

  return (
    <View style={{ flex: 1, backgroundColor: '#241B12' }}>
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-down" size={24} color="#E8DCC6" /></Pressable>
        <Text style={styles.topTitle}>Your library</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 40 }} onScrollBeginDrag={() => focusJS >= 0 && setFocus(-1)}>
        {loaded && items.length === 0 && <Text style={styles.empty}>Finish a read and its spine appears here.</Text>}

        {categoryRacks.map((cat) => (
          <View key={cat.key} style={styles.catSection}>
            {/* Category label */}
            <View style={styles.catHeader}>
              <View style={[styles.catDot, { backgroundColor: cat.accent }]} />
              <Text style={[styles.catLabel, { color: cat.accent }]}>{cat.label}</Text>
              <Text style={styles.catCount}>{cat.racks.reduce((s, r) => s + r.items.length, 0)}</Text>
            </View>

            {cat.racks.map((rack, r) => {
              const width = rack.items.length * SLOT;
              return (
                <View key={r} style={styles.rackWrap}>
                  <GestureDetector gesture={rackPan(rack.absStart, rack.items.length, width)}>
                    <View style={[styles.rackRow, { width, height: cat.key === 'journey' ? 236 : cat.key === 'summary' ? 216 : 196 }]}>
                      {rack.items.map((it, j) => {
                        const absIdx = rack.absStart + j;
                        return (
                          <Book
                            key={`${it.kind}-${it.id}`}
                            item={it} idx={absIdx}
                            focus={focus} lift={lift} openRot={openRot}
                            onPress={() => pressBook(absIdx, it)}
                          />
                        );
                      })}
                    </View>
                  </GestureDetector>
                  <View style={styles.plank}>
                    {/* Engraved label on the first plank of each category */}
                    {r === 0 && (
                      <Text style={styles.plankLabel}>{cat.label.toLowerCase()}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Floating peek label — shows title + "tap again to open" for focused book */}
        {focusJS >= 0 && flatItems[focusJS] && (
          <View style={styles.focusInfo}>
            <Text style={styles.focusTitle}>{flatItems[focusJS]!.title}</Text>
            <Text style={styles.focusHint}>Tap again to open</Text>
          </View>
        )}

        {loaded && items.length > 0 && (
          <Text style={styles.hint}>Tap a book to lift it · tap again to open · slide across a rack to browse</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  topTitle: { flex: 1, textAlign: 'center', fontFamily: serif, fontSize: 17, color: '#F4ECDC' },
  count: { width: 24, textAlign: 'right', fontSize: 13, color: '#B6A589' },

  catSection: { marginBottom: 6 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 24, marginBottom: 6, marginTop: 10 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  catCount: { fontSize: 11, color: '#8C7B60', marginLeft: 2 },

  rackWrap: { alignItems: 'center', marginBottom: 8 },
  rackRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  band: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.32)' },

  plank: {
    height: 14, borderRadius: 3, alignSelf: 'stretch', marginHorizontal: 14,
    backgroundColor: '#7C5C38',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 5 },
    justifyContent: 'center', overflow: 'hidden',
  },
  plankLabel: {
    position: 'absolute', right: 12,
    fontSize: 7.5, letterSpacing: 1.8, textTransform: 'uppercase',
    color: 'rgba(244,236,220,0.28)', fontWeight: '700',
  },

  focusInfo: { alignItems: 'center', marginTop: 10, paddingHorizontal: 20 },
  focusTitle: { fontFamily: serif, fontSize: 16, color: '#F4ECDC', textAlign: 'center' },
  focusHint: { fontSize: 11, color: '#C9A24A', marginTop: 3 },

  empty: { color: '#B6A589', textAlign: 'center', marginTop: 60, fontFamily: serif, fontStyle: 'italic' },
  hint: { color: '#8C7B60', fontSize: 11, textAlign: 'center', marginTop: 18, paddingHorizontal: 30, lineHeight: 16 },
});
