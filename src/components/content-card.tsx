import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookCover } from '@/components/book-cover';
import { colors, serif, typeColors } from '@/lib/theme';
import type { CatalogItem } from '@/lib/types';

const TYPE_LABEL: Record<string, string> = {
  byte: 'Byte',
  journey: 'Journey',
  summary: 'Summary',
};

export function ContentCard({ item, subtitle }: { item: CatalogItem; subtitle?: string }) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
      onPress={() => router.push({ pathname: '/item/[type]/[id]', params: { type: item.type, id: item.id } })}>
      <BookCover item={item} w={52} r={8} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.tag, { color: typeColors[item.type] }]}>
          {[TYPE_LABEL[item.type], item.durationLabel].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {subtitle ?? [item.author, item.category].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cover: { width: 52, height: 68, borderRadius: 8, backgroundColor: colors.cardAlt },
  tag: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  title: { fontFamily: serif, fontSize: 15.5, color: colors.ink, marginTop: 3 },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
});
