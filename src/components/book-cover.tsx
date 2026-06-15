import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, serif, typeColors, typeSoftColors } from '@/lib/theme';
import type { ItemType } from '@/lib/types';

// A book-cover with a type-colored binding down the left edge — so you can read
// the content type at a glance, like the spine of a real book. The remaining
// area is a 2:3 panel holding the real `cover` art (no crop) or, when art is
// missing, a soft typographic fallback.

type CoverItem = { type: ItemType; title?: string | null; author?: string | null; cover?: string | null };

const TYPE_LABEL: Record<string, string> = { byte: 'BYTE', summary: 'SUMMARY', journey: 'JOURNEY' };
const MOTIF: Record<string, keyof typeof Ionicons.glyphMap> = {
  byte: 'flash-outline',
  summary: 'reorder-three-outline',
  journey: 'git-commit-outline',
};

export function BookCover({ item, w = 64, r = 8 }: { item: CoverItem; w?: number; r?: number }) {
  const spineW = Math.max(8, Math.round(w * 0.11));
  const imgW = w - spineW;
  const h = Math.round(imgW * 1.5); // 2:3 image panel, so art is never cropped
  const type = item.type;
  const bind = typeColors[type] ?? colors.muted;
  const showLabel = h >= 84 && spineW >= 9;

  return (
    <View style={{ width: w, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
      <View style={{ width: w, height: h, borderRadius: r, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.cardAlt }}>
        {/* type-colored binding */}
        <View style={{ width: spineW, height: h, backgroundColor: bind, alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(0,0,0,0.22)' }}>
          {showLabel && (
            <Text style={{ color: '#FFFFFF', fontSize: Math.min(7, spineW * 0.62), fontWeight: '700', textAlign: 'center', lineHeight: Math.min(8.5, spineW * 0.74), opacity: 0.95 }}>
              {(TYPE_LABEL[type] ?? '').split('').join('\n')}
            </Text>
          )}
        </View>
        {/* image / typographic fallback (2:3) */}
        {item.cover ? (
          <Image source={{ uri: item.cover }} style={{ width: imgW, height: h }} contentFit="cover" transition={150} />
        ) : (
          <View style={{ width: imgW, height: h, backgroundColor: typeSoftColors[type] ?? colors.cardAlt, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Ionicons name={MOTIF[type] ?? 'book-outline'} size={Math.round(imgW * 0.26)} color={bind} style={{ opacity: 0.5, marginBottom: 4 }} />
            {imgW >= 54 && (
              <Text numberOfLines={3} style={{ fontFamily: serif, fontSize: Math.max(9, Math.round(imgW * 0.13)), lineHeight: Math.max(11, Math.round(imgW * 0.155)), color: colors.ink, textAlign: 'center' }}>
                {item.title ?? ''}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// A book spine for the Living Library shelf. Height is passed in; width and
// colour encode the type.
export function Spine({ item, h, onPress }: { item: CoverItem; h: number; onPress?: () => void }) {
  const title = item.title ?? '';
  const bg = typeColors[item.type] ?? colors.muted;
  const width = item.type === 'journey' ? 30 : item.type === 'summary' ? 23 : 17;
  return (
    <View onTouchEnd={onPress} style={{ width, height: h, borderRadius: 3, backgroundColor: bg, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.band, { top: 7 }]} />
      <View style={[styles.band, { bottom: 7 }]} />
      {width >= 23 && (
        <Text numberOfLines={1} style={{ transform: [{ rotate: '90deg' }], width: h - 26, fontFamily: serif, fontSize: width >= 30 ? 9 : 8, color: '#FFFFFF', textAlign: 'center', opacity: 0.92 }}>
          {title}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
});
