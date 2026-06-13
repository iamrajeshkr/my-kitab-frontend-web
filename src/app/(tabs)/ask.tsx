import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCard } from '@/components/content-card';
import { askKitab } from '@/lib/gemini';
import { usePrefs } from '@/lib/prefs';
import { colors, serif } from '@/lib/theme';
import { useCatalog } from '@/lib/use-catalog';

interface Turn {
  role: 'user' | 'model';
  text: string;
  itemIds?: string[];
}

export default function Ask() {
  const insets = useSafeAreaInsets();
  const prefs = usePrefs();
  const { items } = useCatalog();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async () => {
    const query = input.trim();
    if (!query || busy || !items) return;
    setInput('');
    setTurns((t) => [...t, { role: 'user', text: query }]);
    setBusy(true);
    try {
      const history = turns.map((t) => ({ role: t.role, text: t.text }));
      // Keep the prompt small: all journeys plus a slice of bytes/summaries
      const pool = [
        ...items.filter((i) => i.type === 'journey'),
        ...items.filter((i) => i.type === 'byte').slice(0, 150),
        ...items.filter((i) => i.type === 'summary').slice(0, 80),
      ];
      const result = await askKitab(query, pool, prefs.language, history);
      setTurns((t) => [...t, { role: 'model', text: result.reply, itemIds: result.itemIds }]);
    } catch (e: any) {
      setTurns((t) => [...t, { role: 'model', text: `Something went wrong — ${e?.message ?? e}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const addPathToShelf = (ids: string[]) => {
    prefs.set({ saved: [...new Set([...prefs.saved, ...ids])] });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={15} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.h1}>Ask Kitab</Text>
          <Text style={styles.sub}>Your librarian</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {turns.length === 0 && (
          <Text style={styles.empty}>
            Tell Kitab how you feel, or what you want to become — it will pick a path from the library
            for you.{'\n\n'}Try: "I feel restless all the time"
          </Text>
        )}
        {turns.map((t, i) =>
          t.role === 'user' ? (
            <View key={i} style={styles.userBubble}>
              <Text style={styles.userText}>{t.text}</Text>
            </View>
          ) : (
            <View key={i}>
              <Text style={styles.reply}>{t.text}</Text>
              {t.itemIds?.map((id) => {
                const item = items?.find((c) => c.id === id);
                return item ? <ContentCard key={id} item={item} /> : null;
              })}
              {!!t.itemIds?.length && (
                <Pressable style={styles.cta} onPress={() => addPathToShelf(t.itemIds!)}>
                  <Text style={styles.ctaText}>Add this path to my Shelf</Text>
                </Pressable>
              )}
            </View>
          )
        )}
        {busy && <ActivityIndicator color={colors.indigo} style={{ marginVertical: 12 }} />}
      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="I feel restless all the time…"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={styles.sendBtn} onPress={send} disabled={busy || !input.trim()}>
          <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 12 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { fontFamily: serif, fontSize: 19, color: colors.ink },
  sub: { fontSize: 11, color: colors.muted },
  empty: {
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.muted,
    marginTop: 28,
    textAlign: 'center',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.ink,
    borderRadius: 14,
    borderTopRightRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 10,
    maxWidth: '80%',
  },
  userText: { color: colors.inkInverse, fontSize: 13.5 },
  reply: { fontFamily: serif, fontSize: 15, lineHeight: 23, color: colors.ink, marginBottom: 12 },
  cta: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 11, alignItems: 'center', marginBottom: 12 },
  ctaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  inputRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 13.5,
    color: colors.ink,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
