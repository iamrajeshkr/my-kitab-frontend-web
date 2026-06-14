import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, serif } from '@/lib/theme';

function clock() {
  const d = new Date();
  const h = d.getHours();
  const hr = ((h + 11) % 12) + 1;
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ampm = h < 12 ? 'am' : 'pm';
  const phrase = h < 6 ? 'a still hour' : h < 12 ? 'a fresh hour' : h < 17 ? 'a full hour' : h < 21 ? 'a quiet hour' : 'a restful hour';
  return `${hr}:${mm} ${ampm} · ${phrase}`;
}

// The Threshold — an anti-feed front door. One breath before the world.
export default function Threshold() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.22, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [scale, opacity]);

  const enter = () => router.replace('/(tabs)' as Href);

  return (
    <Pressable style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]} onPress={enter}>
      <Text style={styles.kicker}>{clock()}</Text>

      <View style={styles.center}>
        <View style={styles.bloom}>
          <Animated.View style={[styles.ring, styles.ringOuter, { transform: [{ scale }], opacity }]} />
          <Animated.View style={[styles.ring, styles.ringMid, { transform: [{ scale }] }]} />
          <View style={styles.core}>
            <Ionicons name="leaf-outline" size={22} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.line}>Before the world,{'\n'}a breath.</Text>
        <Text style={styles.guide}>Breathe in as it grows… out as it settles</Text>
      </View>

      <Text style={styles.tap}>Tap when you're here</Text>
    </Pressable>
  );
}

const RING = 'rgba(199,91,57,'; // terracotta

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 24, alignItems: 'center' },
  kicker: { alignSelf: 'flex-start', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.mutedOnDark, opacity: 0.7 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  bloom: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999 },
  ringOuter: { width: 200, height: 200, borderWidth: 1, borderColor: RING + '0.35)' },
  ringMid: { width: 130, height: 130, borderWidth: 1, borderColor: RING + '0.6)' },
  core: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  line: { fontFamily: serif, fontSize: 23, lineHeight: 32, color: colors.inkInverse, textAlign: 'center' },
  guide: { fontSize: 12.5, color: colors.mutedOnDark },
  tap: { fontSize: 12.5, color: colors.inkInverse, borderColor: 'rgba(248,244,235,0.3)', borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 22, overflow: 'hidden' },
});
