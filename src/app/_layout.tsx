import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlayerProvider } from '@/lib/player';
import { PrefsProvider } from '@/lib/prefs';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <PrefsProvider>
      <PlayerProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </PlayerProvider>
    </PrefsProvider>
  );
}
