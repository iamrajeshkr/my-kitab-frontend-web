import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '@/lib/player';
import { colors, serif } from '@/lib/theme';

// Tab routes sit above the tab bar; everything else sits near the bottom edge.
const TAB_ROUTES = new Set(['/', '/discover', '/you']);
// Hide entirely on these (clean input screens, immersive screens, the full player).
const HIDDEN_EXACT = new Set(['/ask']);
const HIDDEN_PREFIX = ['/player', '/auth', '/onboarding', '/threshold'];

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { nowPlaying, current, playing, positionSec, durationSec, toggle } = usePlayer();

  if (!nowPlaying || !current) return null;
  if (HIDDEN_EXACT.has(pathname) || HIDDEN_PREFIX.some((p) => pathname.startsWith(p))) return null;

  const bottom = insets.bottom + (TAB_ROUTES.has(pathname) ? 52 : 12);
  const pct = durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0;
  const sub = nowPlaying.kind === 'journey' ? nowPlaying.title : nowPlaying.author ?? '';

  return (
    <Pressable style={[styles.wrap, { bottom }]} onPress={() => router.push('/player' as Href)}>
      <View style={styles.cover}>
        {nowPlaying.cover ? (
          <Image source={{ uri: nowPlaying.cover }} style={styles.coverImg} contentFit="cover" />
        ) : (
          <Ionicons name="musical-notes" size={16} color={colors.mutedOnDark} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
        <View style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
      </View>
      <Ionicons name="chevron-up" size={15} color={colors.mutedOnDark} />
      <Pressable hitSlop={12} onPress={toggle} style={styles.btn}>
        <Ionicons name={playing ? 'pause' : 'play'} size={22} color="#FFFFFF" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    // subtle lift
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cover: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverImg: { width: 40, height: 40 },
  title: { fontFamily: serif, fontSize: 13.5, color: colors.inkInverse },
  sub: { fontSize: 10.5, color: colors.mutedOnDark, marginTop: 1 },
  track: { height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 5, overflow: 'hidden' },
  fill: { height: 2, borderRadius: 2, backgroundColor: colors.accent },
  btn: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center' },
});
