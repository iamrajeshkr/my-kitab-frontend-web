import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { usePrefs } from '@/lib/prefs';
import { colors } from '@/lib/theme';

// Show the Threshold once per app launch (not on every tab return).
let crossedThreshold = false;

export default function Index() {
  const prefs = usePrefs();
  if (!prefs.ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!prefs.onboarded) return <Redirect href="/onboarding" />;
  if (!crossedThreshold) {
    crossedThreshold = true;
    return <Redirect href={'/threshold' as Href} />;
  }
  return <Redirect href="/(tabs)" />;
}
