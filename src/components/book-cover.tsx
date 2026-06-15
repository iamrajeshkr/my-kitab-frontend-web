import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { serif } from '@/lib/theme';
import type { ItemType } from '@/lib/types';

// A book-cover look for any item: render the real `cover` art when present,
// otherwise a typographic cover (palette + motif by type) so the shelf still
// reads like real books before art lands.

type CoverItem = { type: ItemType; title?: string | null; author?: string | null; cover?: string | null };

const TONES: Record<string, { bg: string; ink: string; accent: string }> = {
  byte: { bg: '#A8452A', ink: '#F6E7CF', accent: '#E8B45E' },
  summary: { bg: '#43395E', ink: '#EDE7F6', accent: '#C4A6E8' },
  journey: { bg: '#1F4A45', ink: '#E9EFDF', accent: '#E2A24A' },
};
const MOTIF: Record<string, keyof typeof Ionicons.glyphMap> = {
  byte: 'sunny-outline',
  summary: 'sparkles-outline',
  journey: 'water-outline',
};
// a few background variants for typographic variety, chosen by title hash
const VARIANTS = ['#2A3B22', '#13233A', '#43395E', '#1F4A45', '#7C5A2E', '#5E6B4F', '#A8452A'];
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export function BookCover({ item, w = 64, r = 9 }: { item: CoverItem; w?: number; r?: number }) {
  const h = Math.round(w * 1.34);

  if (item.cover) {
    return <Image source={{ uri: item.cover }} style={{ width: w, height: h, borderRadius: r, backgroundColor: '#00000010' }} contentFit="cover" transition={150} />;
  }

  const tone = TONES[item.type] ?? TONES.summary;
  const title = item.title ?? '';
  const bg = item.type === 'summary' || item.type === 'journey' ? VARIANTS[hash(title) % VARIANTS.length]! : tone.bg;
  const titleSize = Math.max(8, Math.round(w * 0.135));
  const pad = w * 0.07;

  return (
    <View style={{ width: w, height: h, borderRadius: r, overflow: 'hidden', backgroundColor: bg, justifyContent: 'center' }}>
      {/* keyline frame */}
      <View style={{ position: 'absolute', top: pad, left: pad, right: pad, bottom: pad, borderWidth: 1, borderColor: `${tone.accent}66`, borderRadius: r * 0.5 }} />
      {/* motif */}
      <View style={{ position: 'absolute', top: '16%', left: 0, right: 0, alignItems: 'center' }}>
        <Ionicons name={MOTIF[item.type] ?? 'book-outline'} size={Math.round(w * 0.3)} color={tone.accent} />
      </View>
      {/* title */}
      <Text
        numberOfLines={3}
        style={{ position: 'absolute', top: '44%', left: w * 0.13, right: w * 0.13, fontFamily: serif, fontSize: titleSize, lineHeight: titleSize * 1.15, color: tone.ink, fontWeight: '600', textAlign: 'center' }}>
        {title}
      </Text>
      {item.author && w >= 72 && (
        <Text numberOfLines={1} style={{ position: 'absolute', left: 6, right: 6, bottom: '10%', textAlign: 'center', fontSize: Math.max(6.5, w * 0.07), letterSpacing: 1, textTransform: 'uppercase', color: `${tone.ink}cc` }}>
          {item.author}
        </Text>
      )}
    </View>
  );
}

// A book spine for the Living Library shelf. Height is passed in; width and
// colour encode the type. Wider spines show a rotated title.
export function Spine({ item, h, onPress }: { item: CoverItem; h: number; onPress?: () => void }) {
  const tone = TONES[item.type] ?? TONES.summary;
  const title = item.title ?? '';
  const bg = item.type === 'summary' || item.type === 'journey' ? VARIANTS[hash(title) % VARIANTS.length]! : tone.bg;
  const width = item.type === 'journey' ? 30 : item.type === 'summary' ? 23 : 17;
  return (
    <View onTouchEnd={onPress} style={{ width, height: h, borderRadius: 3, backgroundColor: bg, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.band, { top: 7, backgroundColor: `${tone.accent}99` }]} />
      <View style={[styles.band, { bottom: 7, backgroundColor: `${tone.accent}99` }]} />
      {width >= 23 && (
        <Text numberOfLines={1} style={{ transform: [{ rotate: '90deg' }], width: h - 26, fontFamily: serif, fontSize: width >= 30 ? 9 : 8, color: tone.ink, textAlign: 'center' }}>
          {title}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, height: 2 },
});
