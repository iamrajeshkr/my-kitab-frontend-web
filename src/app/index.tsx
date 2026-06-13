import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { usePrefs } from '@/lib/prefs';
import { colors } from '@/lib/theme';

export default function Index() {
  const prefs = usePrefs();
  if (!prefs.ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <Redirect href={prefs.onboarded ? '/(tabs)' : '/onboarding'} />;
}
