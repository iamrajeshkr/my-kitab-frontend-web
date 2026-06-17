import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/lib/theme';

// Swipe right→left to reveal + commit delete; tap to open. Collapses on delete.
export function SwipeRow({ children, onPress, onDelete, height = 64 }: { children: ReactNode; onPress?: () => void; onDelete: () => void; height?: number }) {
  const tx = useSharedValue(0);
  const h = useSharedValue(height);
  const op = useSharedValue(1);
  const fire = () => onDelete();
  const open = () => onPress?.();

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onUpdate((e) => { tx.value = Math.min(0, e.translationX); })
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -90 || e.velocityX < -700) {
        tx.value = withTiming(-500, { duration: 180 });
        op.value = withTiming(0, { duration: 180 });
        h.value = withTiming(0, { duration: 200 }, (f) => { if (f) runOnJS(fire)(); });
      } else {
        tx.value = withTiming(0);
      }
    });
  const tap = Gesture.Tap().maxDistance(10).onEnd((_e, ok) => { if (ok) runOnJS(open)(); });
  const gesture = Gesture.Exclusive(pan, tap);

  const wrap = useAnimatedStyle(() => ({ height: h.value, opacity: op.value }));
  const row = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <Animated.View style={[styles.outer, wrap]}>
      <View style={styles.delBg}><Ionicons name="trash-outline" size={20} color="#FFFFFF" /></View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.row, row]}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { overflow: 'hidden', justifyContent: 'center' },
  delBg: { position: 'absolute', right: 0, top: 4, bottom: 4, width: 84, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  row: { backgroundColor: colors.bg, justifyContent: 'center', flex: 1 },
});
