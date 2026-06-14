import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { hasSession } from '@/lib/api';
import { usePrefs } from '@/lib/prefs';
import { colors } from '@/lib/theme';

// Show the Threshold once per app launch (not on every tab return).
let crossedThreshold = false;

export default function Index() {
  const prefs = usePrefs();
  const [session, setSession] = useState<'loading' | 'in' | 'out'>('loading');

  useEffect(() => {
    hasSession().then((h) => setSession(h ? 'in' : 'out'));
  }, []);

  if (!prefs.ready || session === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // No session → value-first onboarding (it ends by creating the account).
  if (session === 'out') return <Redirect href="/onboarding" />;
  if (!crossedThreshold) {
    crossedThreshold = true;
    return <Redirect href={'/threshold' as Href} />;
  }
  return <Redirect href="/(tabs)" />;
}
