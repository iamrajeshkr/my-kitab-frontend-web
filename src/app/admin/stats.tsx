import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, type AdminStats } from '@/lib/api';
import { colors, serif } from '@/lib/theme';
import { PressScale } from '@/components/press';

const MOOD_COLORS: Record<string, string> = {
  bright: '#D9A74A',   // Warm Gold
  clear: '#4A90E2',    // Sky Blue
  cloudy: '#8E8E93',   // Slate Grey
  restless: '#C75B39', // Terracotta Orange
  heavy: '#4B3F8C',    // Deep Purple
};

function formatToIST(isoString: string): string {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const year = istDate.getFullYear();
  
  let hours = istDate.getHours();
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  
  return `${day}/${month}/${year}, ${strTime}`;
}

export default function AdminStatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.getAdminStats();
      setStats(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch telemetry statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const signupMax = useMemo(() => {
    if (!stats?.signupSeries.length) return 1;
    return Math.max(...stats.signupSeries.map(s => s.count), 1);
  }, [stats]);

  const dauMax = useMemo(() => {
    if (!stats?.dauSeries.length) return 1;
    return Math.max(...stats.dauSeries.map(s => s.count), 1);
  }, [stats]);

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Fetching Bingent Telemetry...</Text>
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: colors.bg, padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.accent} />
        <Text style={styles.errorTitle}>Access Denied / Error</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <PressScale haptic style={styles.retryButton} onPress={() => loadStats()}>
          <Text style={styles.retryButtonText}>Tap to Retry</Text>
        </PressScale>
        <PressScale haptic style={[styles.retryButton, { backgroundColor: 'transparent', marginTop: 12 }]} onPress={() => router.back()}>
          <Text style={[styles.retryButtonText, { color: colors.muted }]}>Go Back</Text>
        </PressScale>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <PressScale haptic onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </PressScale>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Bingent Engine</Text>
          <Text style={styles.headerSubtitle}>Real-time App Telemetry & Metrics</Text>
        </View>
        <PressScale haptic onPress={() => loadStats(true)} hitSlop={12}>
          <Ionicons name="refresh-outline" size={24} color={colors.ink} />
        </PressScale>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadStats(true)} tintColor={colors.accent} />
        }
      >
        {/* Core metrics grid */}
        <Text style={styles.sectionTitle}>Key Aggregates</Text>
        <View style={styles.gridRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Users</Text>
            <Text style={styles.metricValue}>{stats.summary.totalUsers}</Text>
            <View style={styles.cardBreakdownRow}>
              <Text style={styles.breakdownSub}>Reg: {stats.summary.registeredUsers}</Text>
              <Text style={styles.breakdownSub}>Guest: {stats.summary.guestUsers}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active Users</Text>
            <Text style={styles.metricValue}>{stats.summary.mau}</Text>
            <View style={styles.cardBreakdownRow}>
              <Text style={styles.breakdownSub}>WAU: {stats.summary.wau}</Text>
              <Text style={styles.breakdownSub}>MAU (30d)</Text>
            </View>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Practice Engagement</Text>
            <Text style={styles.metricValue}>
              {stats.summary.completedSits + stats.summary.reflections + stats.summary.highlights}
            </Text>
            <View style={styles.cardBreakdownRow}>
              <Text style={styles.breakdownSub}>Sits: {stats.summary.completedSits}</Text>
              <Text style={styles.breakdownSub}>Refs: {stats.summary.reflections}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Telemetry Events</Text>
            <Text style={styles.metricValue}>{stats.summary.totalEvents}</Text>
            <View style={styles.cardBreakdownRow}>
              <Text style={styles.breakdownSub}>Saved: {stats.summary.savedItems}</Text>
              <Text style={styles.breakdownSub}>Logged events</Text>
            </View>
          </View>
        </View>

        {/* User Growth Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>New Registrations (Last 30 Days)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
            {stats.signupSeries.map((s, idx) => {
              const height = (s.count / signupMax) * 80;
              const isToday = idx === stats.signupSeries.length - 1;
              return (
                <View key={s.date} style={styles.barItem}>
                  <Text style={styles.barValue}>{s.count > 0 ? s.count : ''}</Text>
                  <View style={[styles.bar, { height: Math.max(height, 2) }, isToday && styles.barToday]} />
                  <Text style={styles.barLabel}>{s.date.split('-')[2]}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* DAU Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Active Users (Last 30 Days)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
            {stats.dauSeries.map((s, idx) => {
              const height = (s.count / dauMax) * 80;
              const isToday = idx === stats.dauSeries.length - 1;
              return (
                <View key={s.date} style={styles.barItem}>
                  <Text style={styles.barValue}>{s.count > 0 ? s.count : ''}</Text>
                  <View style={[styles.bar, { height: Math.max(height, 2), backgroundColor: colors.indigo }, isToday && styles.barToday]} />
                  <Text style={styles.barLabel}>{s.date.split('-')[2]}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Mood/Weather Distribution */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Inner Weather Check-Ins</Text>
          {Object.entries(stats.moodBreakdown).length === 0 ? (
            <Text style={styles.emptyText}>No check-ins logged yet.</Text>
          ) : (
            <View style={styles.moodList}>
              {Object.entries(stats.moodBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([mood, count]) => {
                  const total = Object.values(stats.moodBreakdown).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  const color = MOOD_COLORS[mood] || colors.muted;

                  return (
                    <View key={mood} style={styles.moodRow}>
                      <View style={styles.moodMeta}>
                        <Text style={styles.moodName}>{mood}</Text>
                        <Text style={styles.moodCount}>{count} ({percentage.toFixed(0)}%)</Text>
                      </View>
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
                      </View>
                    </View>
                  );
                })}
            </View>
          )}
        </View>

        {/* Event Logs Metrics */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Activity Telemetry breakdown</Text>
          <View style={styles.eventBreakdownContainer}>
            {Object.entries(stats.eventTypeBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <View key={type} style={styles.eventRow}>
                  <Text style={styles.eventName}>{type}</Text>
                  <Text style={styles.eventCount}>{count}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Language Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Locale Settings</Text>
          <View style={styles.langContainer}>
            <View style={styles.langStat}>
              <Text style={styles.langValue}>{stats.languageBreakdown.en || 0}</Text>
              <Text style={styles.langLabel}>English (en)</Text>
            </View>
            <View style={[styles.langStat, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Text style={styles.langValue}>{stats.languageBreakdown.hi || 0}</Text>
              <Text style={styles.langLabel}>Hindi (hi)</Text>
            </View>
          </View>
        </View>

        {/* Recent Registrations Log */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Recent Registrations (IST)</Text>
          <View style={styles.regList}>
            {stats.recentRegistrations.map((u, i) => {
              const regDate = formatToIST(u.created_at);
              const label = u.is_guest ? 'Guest Profile' : 'Registered User';
              return (
                <View key={u.username || `guest-${i}`} style={[styles.regRow, i > 0 && styles.borderTop]}>
                  <View style={styles.regMain}>
                    <Text style={styles.regUsername} numberOfLines={1}>
                      {u.is_guest ? 'Guest' : `@${u.username}`}
                    </Text>
                    <Text style={styles.regDisplayName} numberOfLines={1}>
                      {u.display_name || '(No display name)'}
                    </Text>
                  </View>
                  <View style={styles.regSide}>
                    <Text style={styles.regDate}>{regDate}</Text>
                    <Text style={[styles.regBadge, u.is_guest ? styles.badgeGuest : styles.badgeUser]}>
                      {label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.muted,
    fontFamily: serif,
    fontStyle: 'italic',
  },
  errorTitle: {
    fontSize: 20,
    color: colors.ink,
    fontFamily: serif,
    marginTop: 16,
    fontWeight: 'bold',
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: colors.inkInverse,
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: serif,
    color: colors.ink,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: serif,
    color: colors.ink,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingLeft: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 6,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.ink,
    marginVertical: 4,
  },
  cardBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  breakdownSub: {
    fontSize: 10,
    color: colors.muted,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 14,
  },
  chartScroll: {
    paddingRight: 10,
  },
  barItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    justifyContent: 'flex-end',
    width: 24,
    height: 120,
  },
  barValue: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 4,
    fontWeight: '600',
  },
  bar: {
    width: 12,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  barToday: {
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  barLabel: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 12,
    fontFamily: serif,
  },
  moodList: {
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  moodRow: {
    marginBottom: 12,
  },
  moodMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moodName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    textTransform: 'capitalize',
  },
  moodCount: {
    fontSize: 11,
    color: colors.muted,
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  eventBreakdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  eventRow: {
    width: '48%',
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: '1%',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  eventName: {
    fontSize: 11,
    color: colors.ink,
    fontWeight: '500',
  },
  eventCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent,
  },
  langContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  langStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.ink,
  },
  langLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  regList: {
    marginTop: 4,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  regRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  regMain: {
    flex: 1,
    marginRight: 12,
  },
  regUsername: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.ink,
  },
  regDisplayName: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  regSide: {
    alignItems: 'flex-end',
  },
  regDate: {
    fontSize: 11,
    color: colors.muted,
  },
  regBadge: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
    fontWeight: 'bold',
  },
  badgeGuest: {
    backgroundColor: colors.border,
    color: colors.muted,
  },
  badgeUser: {
    backgroundColor: colors.accentSoft,
    color: colors.accent,
  },
});
