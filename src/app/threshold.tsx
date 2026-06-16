import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { serif } from '@/lib/theme';

// ── Brand constants (from the design file) ──────────────────────────────────
const BG = '#26203A';
const CORAL = '#FF6A3D';
const AMBER = '#FFB23E';
const INK_LIGHT = '#FFF1E6';
const LEAF_D = 'M44,84 C40,58 54,36 88,32 C84,66 70,84 44,84 Z';
const VEIN_D = 'M50,79 L83,41';

// ── Easing curves ───────────────────────────────────────────────────────────
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

// ── Animated SVG wrappers ───────────────────────────────────────────────────
const AnimPath = Animated.createAnimatedComponent(Path);

// ── The Bingent "Grow / Play" splash ────────────────────────────────────────
export default function Threshold() {
  const router = useRouter();

  // Animation drivers
  const tilePop = useRef(new Animated.Value(0)).current;
  const leafGrow = useRef(new Animated.Value(0)).current;
  const veinDraw = useRef(new Animated.Value(100)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const textRise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seq = Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        // 1. Tile pops in
        Animated.timing(tilePop, { toValue: 1, duration: 620, easing: BACK, useNativeDriver: false }),
        // 2. Leaf sprouts (540ms from start = 460ms after tile starts)
        Animated.sequence([
          Animated.delay(460),
          Animated.timing(leafGrow, { toValue: 1, duration: 680, easing: BACK, useNativeDriver: false }),
        ]),
        // 3. Vein draws on (880ms from start)
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(veinDraw, { toValue: 0, duration: 520, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        ]),
        // 4a. First ripple (740ms from start)
        Animated.sequence([
          Animated.delay(660),
          Animated.timing(ripple1, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        ]),
        // 4b. Second ripple (920ms from start)
        Animated.sequence([
          Animated.delay(840),
          Animated.timing(ripple2, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        ]),
        // 5. "Bingent" text rises (1100ms from start)
        Animated.sequence([
          Animated.delay(1020),
          Animated.timing(textRise, { toValue: 1, duration: 640, easing: EASE, useNativeDriver: false }),
        ]),
      ]),
    ]);
    seq.start();

    // Auto-navigate after the full animation completes
    const timer = setTimeout(() => router.replace('/(tabs)' as Href), 2400);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ──────────────────────────────────────────────────────

  // Tile: scale 0.5→1, opacity 0→1
  const tileScale = tilePop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const tileOpacity = tilePop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });

  // Leaf: scale+rotate wrapper
  const leafScale = leafGrow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const leafRotate = leafGrow.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '0deg'] });
  const leafOpacity = leafGrow.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] });

  // Ripples: scale+fade
  const r1Scale = ripple1.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.2] });
  const r1Opacity = ripple1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] });
  const r2Scale = ripple2.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.2] });
  const r2Opacity = ripple2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] });

  // Text: translateY 14→0, opacity 0→1
  const textY = textRise.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const textOpacity = textRise;

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        {/* ── Logo mark ─────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ scale: tileScale }], opacity: tileOpacity }}>
          <View style={{ width: 118, height: 118 }}>
            <Svg width={118} height={118} viewBox="0 0 120 120">
              <Defs>
                <LinearGradient id="bingentWarm" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={CORAL} />
                  <Stop offset="1" stopColor={AMBER} />
                </LinearGradient>
              </Defs>

              {/* Gradient rounded square */}
              <Rect x={6} y={6} width={108} height={108} rx={30} fill="url(#bingentWarm)" />
            </Svg>

            {/* Ripple circles — positioned absolutely over the SVG */}
            <Animated.View style={[styles.ripple, { transform: [{ scale: r1Scale }], opacity: r1Opacity }]}>
              <Svg width={118} height={118} viewBox="0 0 120 120">
                <Circle cx={60} cy={60} r={30} fill="none" stroke="#fff" strokeWidth={3} />
              </Svg>
            </Animated.View>
            <Animated.View style={[styles.ripple, { transform: [{ scale: r2Scale }], opacity: r2Opacity }]}>
              <Svg width={118} height={118} viewBox="0 0 120 120">
                <Circle cx={60} cy={60} r={30} fill="none" stroke="#fff" strokeWidth={3} />
              </Svg>
            </Animated.View>

            {/* Leaf — animated scale + rotate from bottom-left pivot */}
            <Animated.View style={[styles.leaf, { transform: [{ scale: leafScale }, { rotate: leafRotate }], opacity: leafOpacity }]}>
              <Svg width={118} height={118} viewBox="0 0 120 120">
                <Path d={LEAF_D} fill="#fff" />
              </Svg>
            </Animated.View>

            {/* Vein — stroke draws on via dashoffset */}
            <View style={styles.veinWrap}>
              <Svg width={118} height={118} viewBox="0 0 120 120">
                <AnimPath
                  d={VEIN_D}
                  fill="none"
                  stroke="rgba(217,80,38,0.35)"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeDasharray="100"
                  strokeDashoffset={veinDraw}
                />
              </Svg>
            </View>
          </View>
        </Animated.View>

        {/* ── Brand name ────────────────────────────────────── */}
        <Animated.Text style={[styles.brandName, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
          Bingent
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 24 },
  ripple: { position: 'absolute', top: 0, left: 0, width: 118, height: 118 },
  leaf: { position: 'absolute', top: 0, left: 0, width: 118, height: 118, transformOrigin: '36% 70%' },
  veinWrap: { position: 'absolute', top: 0, left: 0, width: 118, height: 118 },
  brandName: {
    fontFamily: serif,
    fontSize: 40,
    fontWeight: '600',
    color: INK_LIGHT,
    letterSpacing: -1.5,
  },
});
