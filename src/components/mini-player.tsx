import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '@/lib/player';
import { colors, serif } from '@/lib/theme';

// Persistent bar that floats above the tab bar whenever something is playing.
export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { nowPlaying, current, playing, positionSec, durationSec, toggle } = usePlayer();
  if (!nowPlaying || !current) return null;

  const pct = durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0;
  const sub = nowPlaying.kind === 'journey' ? nowPlaying.title : nowPlaying.author ?? '';

  return (
    <Pressable style={[styles.wrap, { bottom: insets.bottom + 52 }]} onPress={() => router.push('/player' as Href)}>
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
    gap: 11,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cover: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverImg: { width: 40, height: 40 },
  title: { fontFamily: serif, fontSize: 13.5, color: colors.inkInverse },
  sub: { fontSize: 10.5, color: colors.mutedOnDark, marginTop: 1 },
  track: { height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 5, overflow: 'hidden' },
  fill: { height: 2, borderRadius: 2, backgroundColor: colors.accent },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
