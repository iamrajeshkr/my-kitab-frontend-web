import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { api, type SitPlan } from '@/lib/api';
import { usePrefs } from '@/lib/prefs';
import { colors, serif, typeColors } from '@/lib/theme';
import type { Weather } from '@/lib/weather';

// The Daily Sit — one tap, ~6 minutes: Arrive → Read → Reflect → Carry.
export default function SitScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prefs = usePrefs();
  const { weather } = useLocalSearchParams<{ weather: Weather }>();

  const [sit, setSit] = useState<SitPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflected, setReflected] = useState(false);
  const [kept, setKept] = useState(false);
  const [busy, setBusy] = useState<'reflect' | 'carry' | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .dailySit({ weather, lang: prefs.language })
      .then((s) => alive && setSit(s))
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [weather, prefs.language]);

  const plan = sit?.plan;

  const doReflect = async () => {
    const text = reflection.trim();
    if (!text || busy) return;
    setBusy('reflect');
    try {
      await api.reflect({ text, lang: prefs.language, context: { sit_id: sit?.id } });
      setReflected(true);
      setReflection('');
    } finally {
      setBusy(null);
    }
  };

  const doCarry = async () => {
    if (!plan?.carry || kept || busy) return;
    setBusy('carry');
    try {
      await api.createPractice({
        text: plan.carry,
        source_kind: plan.read?.kind,
        source_id: plan.read?.id,
        keep: true,
      });
      setKept(true);
    } finally {
      setBusy(null);
    }
  };

  const finish = async () => {
    api.logEvents([{ type: 'sit_complete', payload: { sit_id: sit?.id } }]).catch(() => {});
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Tonight's sit · {weather}</Text>
            <Text style={styles.h1}>Six minutes</Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </Pressable>
        </View>

        {!sit && !error && <ActivityIndicator color={colors.indigo} style={{ marginTop: 40 }} />}
        {error && <Text style={styles.error}>Couldn't shape your sit — {error}</Text>}

        {plan && (
          <View style={{ marginTop: 8 }}>
            <Beat icon="leaf-outline" color={colors.indigo} step="Arrive">
              <Text style={styles.beatBody}>{plan.arrive}</Text>
            </Beat>

            <Beat icon="book-outline" color={colors.accent} step="Read">
              {plan.read ? (
                <Pressable
                  style={styles.readCard}
                  onPress={() =>
                    router.push({ pathname: '/item/[type]/[id]', params: { type: plan.read!.kind, id: plan.read!.id } })}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.readTag, { color: typeColors[plan.read.kind] }]}>
                      {plan.read.kind}
                    </Text>
                    <Text style={styles.readTitle}>{plan.read.title}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={colors.muted} />
                </Pressable>
              ) : (
                <Text style={styles.beatBody}>A short page, your pick.</Text>
              )}
            </Beat>

            <Beat icon="pencil-outline" color={colors.muted} step="Reflect">
              <Text style={styles.beatBody}>{plan.reflect}</Text>
              {reflected ? (
                <View style={styles.doneRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.indigo} />
                  <Text style={styles.doneText}>Kept privately</Text>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="One line back…"
                    placeholderTextColor={colors.muted}
                    value={reflection}
                    onChangeText={setReflection}
                    multiline
                  />
                  <Pressable
                    style={[styles.smallBtn, (!reflection.trim() || busy === 'reflect') && { opacity: 0.4 }]}
                    onPress={doReflect}
                    disabled={!reflection.trim() || busy === 'reflect'}>
                    <Text style={styles.smallBtnText}>{busy === 'reflect' ? 'Saving…' : 'Keep'}</Text>
                  </Pressable>
                </>
              )}
            </Beat>

            <Beat icon="sunny-outline" color={colors.ink} step="Carry" last>
              <Text style={[styles.beatBody, { fontFamily: serif, fontSize: 15 }]}>{plan.carry}</Text>
              <Pressable
                style={[styles.carryBtn, (kept || busy === 'carry') && { opacity: kept ? 1 : 0.4 }]}
                onPress={doCarry}
                disabled={kept || busy === 'carry'}>
                <Ionicons name={kept ? 'checkmark' : 'leaf'} size={15} color="#FFFFFF" />
                <Text style={styles.carryText}>
                  {kept ? 'In your garden' : busy === 'carry' ? 'Keeping…' : 'Keep this practice'}
                </Text>
              </Pressable>
            </Beat>

            <Pressable style={styles.finishBtn} onPress={finish}>
              <Text style={styles.finishText}>Close the sit</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Beat({
  icon,
  color,
  step,
  last,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  step: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.beatRow}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: color }]}>
          <Ionicons name={icon} size={13} color="#FFFFFF" />
        </View>
        {!last && <View style={styles.line} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 18 }}>
        <Text style={styles.step}>{step}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  kicker: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.muted, fontWeight: '500' },
  h1: { fontFamily: serif, fontSize: 24, color: colors.ink, marginTop: 3 },
  error: { color: colors.accent, fontSize: 12.5, marginTop: 20 },
  beatRow: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 24 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 1.5, backgroundColor: colors.track, marginTop: 2 },
  step: { fontFamily: serif, fontSize: 16, color: colors.ink, marginBottom: 4 },
  beatBody: { fontSize: 13.5, lineHeight: 20, color: colors.muted },
  readCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  readTag: { fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '500' },
  readTitle: { fontFamily: serif, fontSize: 14.5, color: colors.ink, marginTop: 2 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    minHeight: 52,
    fontFamily: serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.ink,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  smallBtn: { alignSelf: 'flex-start', backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18, marginTop: 8 },
  smallBtnText: { color: colors.inkInverse, fontSize: 12.5, fontWeight: '500' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  doneText: { fontSize: 12.5, color: colors.indigo },
  carryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    marginTop: 10,
  },
  carryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  finishBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 10 },
  finishText: { fontSize: 13, color: colors.muted },
});
