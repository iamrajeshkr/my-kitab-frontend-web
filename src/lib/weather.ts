import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';

// Inner weather — the mood-first vocabulary the whole home reshapes around.
export type Weather = 'heavy' | 'restless' | 'cloudy' | 'clear' | 'bright';

export interface WeatherDef {
  key: Weather;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string; // accent used when selected
}

export const WEATHERS: WeatherDef[] = [
  { key: 'heavy', label: 'Heavy', icon: 'rainy-outline', tint: colors.muted },
  { key: 'restless', label: 'Restless', icon: 'pulse-outline', tint: colors.indigo },
  { key: 'cloudy', label: 'Cloudy', icon: 'cloudy-outline', tint: colors.muted },
  { key: 'clear', label: 'Clear', icon: 'partly-sunny-outline', tint: colors.accent },
  { key: 'bright', label: 'Bright', icon: 'sunny-outline', tint: colors.accent },
];

// Short second-person phrase used in copy + sent as the compose intent prefix.
export const WEATHER_PHRASE: Record<Weather, string> = {
  heavy: 'feeling heavy and low',
  restless: 'restless and unable to settle',
  cloudy: 'cloudy and unclear',
  clear: 'calm and clear',
  bright: 'bright and open',
};
