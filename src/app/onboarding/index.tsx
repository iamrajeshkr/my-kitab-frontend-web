import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
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
import { api } from '@/lib/api';
import { usePrefs, type Mode, type Rhythm } from '@/lib/prefs';
import { colors, serif } from '@/lib/theme';
import type { Lang } from '@/lib/types';

type Step = 'lang' | 'intent' | 'reflect' | 'rhythm' | 'mode' | 'done';
interface Msg { from: 'kitab' | 'you'; text: string }

const INTENT_CHIPS = ['a calmer mind', 'better focus', 'deeper sleep', 'less anxious'];
const RHYTHMS: { key: Rhythm; label: string }[] = [
  { key: 'morning', label: 'Mornings' },
  { key: 'commute', label: 'On the move' },
  { key: 'winddown', label: 'Wind-down' },
];
const MODES: { key: Mode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'read', label: 'Read', icon: 'book-outline' },
  { key: 'listen', label: 'Listen', icon: 'headset-outline' },
];

export default function ConversationalOnboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prefs = usePrefs();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Msg[]>([
    { from: 'kitab', text: "Hello — I'm Kitab. Before we begin, which language feels like home?" },
  ]);
  const [step, setStep] = useState<Step>('lang');
  const [draft, setDraft] = useState('');
  const picks = useRef<{ language: Lang; intent: string; rhythm: Rhythm; mode: Mode }>({
    language: prefs.language, intent: '', rhythm: 'morning', mode: 'listen',
  });

  const say = (m: Msg) => {
    setMessages((prev) => [...prev, m]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  const pickLang = (l: Lang) => {
    picks.current.language = l;
    say({ from: 'you', text: l === 'en' ? 'English' : 'हिंदी' });
    say({ from: 'kitab', text: 'Lovely. So tell me — what’s stirring in you these days, or what do you want to become? In your own words.' });
    setStep('intent');
  };

  const submitIntent = async (text: string) => {
    const intent = text.trim();
    if (!intent) return;
    picks.current.intent = intent;
    setDraft('');
    say({ from: 'you', text: intent });
    setStep('reflect');
    // Let the companion respond from minute one — grounded, with a gentle fallback.
    try {
      const { reply } = await api.ask({ query: intent, lang: picks.current.language });
      say({ from: 'kitab', text: reply });
    } catch {
      say({ from: 'kitab', text: 'Thank you for trusting me with that. We’ll build something gentle around it, a little each day.' });
    }
    say({ from: 'kitab', text: 'When does Kitab fit your day best?' });
    setStep('rhythm');
  };

  const pickRhythm = (r: Rhythm) => {
    picks.current.rhythm = r;
    say({ from: 'you', text: RHYTHMS.find((x) => x.key === r)!.label });
    say({ from: 'kitab', text: 'And would you rather read, or listen? You can always switch — even mid-page.' });
    setStep('mode');
  };

  const pickMode = (m: Mode) => {
    picks.current.mode = m;
    say({ from: 'you', text: MODES.find((x) => x.key === m)!.label });
    say({ from: 'kitab', text: 'That’s all I need. Your first page is waiting whenever you are.' });
    setStep('done');
  };

  const finish = () => {
    prefs.set({ ...picks.current, onboarded: true });
    router.replace('/(tabs)' as Href);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.avatar}><Ionicons name="sparkles" size={15} color="#FFFFFF" /></View>
        <Text style={styles.brand}>Kitab</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {messages.map((m, i) =>
          m.from === 'kitab' ? (
            <View key={i} style={styles.kitabBubble}>
              <Text style={styles.kitabText}>{m.text}</Text>
            </View>
          ) : (
            <View key={i} style={styles.youBubble}>
              <Text style={styles.youText}>{m.text}</Text>
            </View>
          )
        )}
        {step === 'reflect' && <ActivityIndicator color={colors.indigo} style={{ alignSelf: 'flex-start', marginVertical: 10 }} />}
      </ScrollView>

      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 10 }]}>
        {step === 'lang' && (
          <View style={styles.chipRow}>
            {(['en', 'hi'] as Lang[]).map((l) => (
              <Pressable key={l} style={styles.chip} onPress={() => pickLang(l)}>
                <Text style={styles.chipText}>{l === 'en' ? 'English' : 'हिंदी'}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 'intent' && (
          <>
            <View style={styles.chipRow}>
              {INTENT_CHIPS.map((c) => (
                <Pressable key={c} style={styles.chipSm} onPress={() => submitIntent(c)}>
                  <Text style={styles.chipSmText}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="In your own words…"
                placeholderTextColor={colors.muted}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => submitIntent(draft)}
                returnKeyType="send"
                multiline
              />
              <Pressable style={styles.send} onPress={() => submitIntent(draft)} disabled={!draft.trim()}>
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </>
        )}

        {step === 'rhythm' && (
          <View style={styles.chipRow}>
            {RHYTHMS.map((r) => (
              <Pressable key={r.key} style={styles.chip} onPress={() => pickRhythm(r.key)}>
                <Text style={styles.chipText}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 'mode' && (
          <View style={styles.chipRow}>
            {MODES.map((m) => (
              <Pressable key={m.key} style={styles.chip} onPress={() => pickMode(m.key)}>
                <Ionicons name={m.icon} size={15} color={colors.ink} />
                <Text style={styles.chipText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 'done' && (
          <Pressable style={styles.cta} onPress={finish}>
            <Text style={styles.ctaText}>Begin with Kitab</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 14 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: serif, fontSize: 20, color: colors.ink },
  kitabBubble: { alignSelf: 'flex-start', backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, borderTopLeftRadius: 4, paddingVertical: 11, paddingHorizontal: 14, marginVertical: 7, maxWidth: '86%' },
  kitabText: { fontFamily: serif, fontSize: 15, lineHeight: 22, color: colors.ink },
  youBubble: { alignSelf: 'flex-end', backgroundColor: colors.ink, borderRadius: 16, borderTopRightRadius: 4, paddingVertical: 9, paddingHorizontal: 13, marginVertical: 7, maxWidth: '80%' },
  youText: { fontSize: 13.5, color: colors.inkInverse },
  inputArea: { paddingHorizontal: 20, paddingTop: 10, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  chipText: { fontSize: 13.5, color: colors.ink },
  chipSm: { backgroundColor: colors.cardAlt, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13, marginBottom: 8 },
  chipSmText: { fontSize: 12.5, color: colors.ink },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 2 },
  input: { flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 16, fontSize: 14, color: colors.ink, maxHeight: 100 },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
  cta: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '500' },
});
