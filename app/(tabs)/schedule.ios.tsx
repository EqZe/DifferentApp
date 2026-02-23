
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { designColors, typography, spacing, radius, shadows } from '@/styles/designSystem';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { errorLogger } from '@/utils/errorLogger';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Event {
  description_he: string;
  description_en: string;
  time: string | null;
  type: 'flight' | 'business' | 'meeting' | 'accommodation' | 'personal' | 'other';
}

interface DaySchedule {
  date: string;
  day_of_week: string;
  agent_he: string | null;
  agent_en: string | null;
  events: { [key: string]: Event };
}

interface ScheduleData {
  days: { [key: string]: DaySchedule };
}

interface CalendarDay {
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  scheduleDay?: DaySchedule;
  fullDate: Date;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: designColors.text.primary,
    textAlign: 'right',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    ...shadows.md,
    position: 'relative',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    zIndex: 2,
  },
  toggleButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: designColors.text.secondary,
    letterSpacing: 0.2,
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold as any,
  },
  toggleIndicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.md,
    ...shadows.lg,
  },
  languageToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    ...shadows.md,
    position: 'relative',
  },
  languageButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    zIndex: 2,
  },
  languageButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: designColors.text.secondary,
    letterSpacing: 0.2,
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold as any,
  },
  languageIndicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.md,
    ...shadows.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  calendarGrid: {
    paddingHorizontal: spacing.lg,
  },
  calendarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  calendarCell: {
    backgroundColor: designColors.surface,
    padding: spacing.md,
    paddingBottom: spacing.md + 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: designColors.border,
    ...shadows.sm,
  },
  calendarCellToday: {
    backgroundColor: designColors.primaryBg,
    borderColor: designColors.primary,
    borderWidth: 2,
    ...shadows.md,
  },
  dayNumberContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayNumber: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: designColors.text.primary,
  },
  dayNumberToday: {
    backgroundColor: designColors.primary,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    textAlign: 'center',
    overflow: 'hidden',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    ...shadows.sm,
  },
  dayAbbreviation: {
    fontSize: 9,
    color: designColors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  assignedPersonBadge: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  assignedPersonText: {
    fontSize: 11,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventBadge: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: designColors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * 1.6,
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Day View Styles ──────────────────────────────────────────────────────────

const dayViewStyles = StyleSheet.create({
  dayViewWrapper: {
    paddingHorizontal: spacing.lg,
  },

  /* Day selector */
  daySelector: {
    marginBottom: spacing.lg,
  },
  daySelectorScroll: {
    paddingHorizontal: spacing.sm,
  },
  daySelectorItem: {
    width: 70,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    marginHorizontal: spacing.xs,
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: designColors.border,
    ...shadows.sm,
  },
  daySelectorItemActive: {
    backgroundColor: designColors.primary,
    borderColor: designColors.primary,
    ...shadows.lg,
  },
  daySelectorDayOfWeek: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as any,
    color: designColors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daySelectorDayOfWeekActive: { color: '#FFFFFF' },
  daySelectorDate: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: designColors.text.primary,
  },
  daySelectorDateActive: { color: '#FFFFFF' },

  /* Hero card */
  heroCard: {
    borderRadius: 18,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  heroGradient: {
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: 16,
  },
  /* Top row: day name (right) + agent pill (left) */
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroDayOfWeek: {
    fontSize: 17,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'right',
  },
  heroAgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  heroAgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  heroAgentText: {
    fontSize: 12,
    fontWeight: '700' as any,
    color: '#FFFFFF',
  },
  /* Bottom row: big date (right) + event count (left) */
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroDate: {
    fontSize: 32,
    fontWeight: '800' as any,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroEventCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  heroEventCountText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500' as any,
  },

  /* Timeline */
  timeline: {
    paddingBottom: spacing.xxl,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  /* Rail */
  timelineRail: {
    width: 56,
    alignItems: 'center',
    paddingTop: 4,
    flexShrink: 0,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: designColors.primary,
    borderWidth: 3,
    borderColor: designColors.background,
    zIndex: 2,
    ...shadows.sm,
  },
  timelineDotNoTime: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: designColors.text.secondary,
    borderWidth: 2,
    borderColor: designColors.background,
    zIndex: 2,
    marginTop: 2,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: designColors.border,
    marginTop: 4,
    minHeight: 30,
  },
  timelineTimeLabel: {
    fontSize: 11,
    fontWeight: '700' as any,
    color: designColors.primary,
    letterSpacing: 0.5,
    marginTop: 6,
    textAlign: 'center',
  },
  timelineTimeLabelEmpty: {
    fontSize: 11,
    color: 'transparent',
    marginTop: 6,
  },

  /* Event card */
  timelineCard: {
    flex: 1,
    marginLeft: spacing.sm,
    backgroundColor: designColors.surface,
    borderRadius: 16,
    padding: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: designColors.border,
    ...shadows.sm,
    marginBottom: 2,
  },
  timelineCardWithTime: {
    borderLeftWidth: 3,
    borderLeftColor: designColors.primary,
  },
  timelineCardType: {
    fontSize: 10,
    fontWeight: '700' as any,
    color: designColors.text.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 5,
    textAlign: 'right',
  },
  timelineCardDescription: {
    fontSize: typography.sizes.md,
    color: designColors.text.primary,
    lineHeight: typography.sizes.md * 1.55,
    letterSpacing: 0.1,
    textAlign: 'right',
  },
  timelineCardTime: {
    fontSize: 13,
    fontWeight: '700' as any,
    color: designColors.primary,
    textAlign: 'right',
    marginTop: 6,
    letterSpacing: 0.2,
  },

  /* No events */
  noEventsWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: designColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: designColors.border,
    ...shadows.sm,
  },
  noEventsCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: designColors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  noEventsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700' as any,
    color: designColors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  noEventsSubtitle: {
    fontSize: typography.sizes.sm,
    color: designColors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.6,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseScheduleData = (scheduleJson: any): DaySchedule[] => {
  if (!scheduleJson || !scheduleJson.days) return [];
  const daysArray: DaySchedule[] = [];
  Object.keys(scheduleJson.days).forEach((dayKey) => {
    const day = scheduleJson.days[dayKey];
    daysArray.push({
      date: day.date,
      day_of_week: day.day_of_week,
      agent_he: day.agent_he,
      agent_en: day.agent_en,
      events: day.events || {},
    });
  });
  return daysArray;
};

const getDayAbbreviation = (dayOfWeek: number, language: 'hebrew' | 'english'): string => {
  if (language === 'hebrew') {
    const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return hebrewDayNames[dayOfWeek];
  } else {
    const englishAbbreviations = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return englishAbbreviations[dayOfWeek];
  }
};

const getFullDayName = (dayOfWeekString: string, language: 'hebrew' | 'english'): string => {
  if (language === 'hebrew') {
    const dayMap: { [key: string]: string } = {
      'Sunday': 'ראשון',
      'Monday': 'שני',
      'Tuesday': 'שלישי',
      'Wednesday': 'רביעי',
      'Thursday': 'חמישי',
      'Friday': 'שישי',
      'Saturday': 'שבת',
    };
    return dayMap[dayOfWeekString] || dayOfWeekString;
  }
  return dayOfWeekString;
};

const getAgentBadgeColors = (agentText: string | null): [string, string] => {
  if (!agentText) return ['#9C27B0', '#BA68C8']; // Purple for empty/null
  
  const normalizedAgent = agentText.trim().toLowerCase();
  
  // Check if it's "סוכנת" (agent) - gets green
  if (normalizedAgent.includes('סוכנת') || normalizedAgent === 'agent') {
    return ['#4CAF50', '#66BB6A']; // Green for agent
  }
  
  // Check if it's Avishai or Roni - gets orange
  if (normalizedAgent.includes('אבישי') || normalizedAgent.includes('רוני')) {
    return ['#FF9800', '#FFB74D']; // Orange for Avishai/Roni
  }
  
  // Everyone else gets purple
  return ['#9C27B0', '#BA68C8']; // Purple for others
};

const getEventTypeLabel = (type: string, language: 'hebrew' | 'english'): string => {
  if (language === 'hebrew') {
    const map: Record<string, string> = {
      flight: 'טיסה',
      business: 'עסקי',
      meeting: 'פגישה',
      accommodation: 'לינה',
      personal: 'אישי',
      other: '',
    };
    return map[type] ?? '';
  } else {
    const map: Record<string, string> = {
      flight: 'FLIGHT',
      business: 'BUSINESS',
      meeting: 'MEETING',
      accommodation: 'STAY',
      personal: 'PERSONAL',
      other: '',
    };
    return map[type] ?? '';
  }
};

// ─── Calendar Cell (full view) ────────────────────────────────────────────────

const AnimatedCalendarCell = React.memo(({
  calendarDay,
  index,
  rowMaxHeight,
  languageFilter,
  filterEventsByLanguage,
  handleDayPress,
}: any) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.05);
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    if (calendarDay.isToday) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [calendarDay.isToday]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => {
    if (!calendarDay.isToday) return {};
    return {
      opacity: interpolate(pulseAnimation.value, [0, 1], [0.3, 0.8], Extrapolate.CLAMP),
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.15, { duration: 150 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.05, { duration: 150 });
  };

  if (!calendarDay.scheduleDay) return null;

  const filteredEvents = filterEventsByLanguage(calendarDay.scheduleDay.events);
  const agentText = languageFilter === 'hebrew'
    ? calendarDay.scheduleDay.agent_he
    : calendarDay.scheduleDay.agent_en;
  const hasAgent = agentText && agentText.trim() !== '';
  const agentBadgeColors = getAgentBadgeColors(agentText);

  const monthNumber = calendarDay.fullDate.getMonth() + 1;
  const dayNumberText = `${calendarDay.dayNumber}/${monthNumber}`;
  const dayOfWeek = calendarDay.fullDate.getDay();
  const dayAbbrev = getDayAbbreviation(dayOfWeek, languageFilter);

  return (
    <AnimatedTouchable
      entering={FadeInDown.delay(index * 50).springify()}
      style={[
        styles.calendarCell,
        calendarDay.isToday && styles.calendarCellToday,
        { height: rowMaxHeight },
        animatedStyle,
      ]}
      onPress={() => handleDayPress(calendarDay)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      {calendarDay.isToday && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: designColors.primary,
              borderRadius: radius.lg,
              opacity: 0.1,
            },
            pulseStyle,
          ]}
        />
      )}

      <View style={styles.dayNumberContainer}>
        <Text style={[styles.dayNumber, calendarDay.isToday && styles.dayNumberToday]}>
          {dayNumberText}
        </Text>
        <Text style={styles.dayAbbreviation}>{dayAbbrev}</Text>
      </View>

      {hasAgent && (
        <AnimatedLinearGradient
          colors={agentBadgeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.assignedPersonBadge}
          entering={FadeIn.delay(index * 50 + 100)}
        >
          <Text style={styles.assignedPersonText}>
            {agentText}
          </Text>
        </AnimatedLinearGradient>
      )}

      {filteredEvents.map((event: Event, eventIndex: number) => {
        const eventDescriptionText = languageFilter === 'hebrew'
          ? event.description_he
          : event.description_en;
        return (
          <AnimatedLinearGradient
            key={eventIndex}
            colors={[designColors.primary, designColors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.eventBadge}
            entering={FadeIn.delay(index * 50 + 150 + eventIndex * 50)}
          >
            <Text style={styles.eventBadgeText}>
              {eventDescriptionText}
            </Text>
          </AnimatedLinearGradient>
        );
      })}
    </AnimatedTouchable>
  );
});

// ─── Timeline Event Card (day view) ──────────────────────────────────────────

const TimelineEventCard = React.memo(({ event, index, isLast, languageFilter }: {
  event: Event;
  index: number;
  isLast: boolean;
  languageFilter: 'hebrew' | 'english';
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const hasTime = Boolean(event.time);
  const description = languageFilter === 'hebrew' ? event.description_he : event.description_en;
  const typeLabel = getEventTypeLabel(event.type ?? 'other', languageFilter);

  return (
    <Animated.View
      entering={FadeInDown.delay(150 + index * 80).springify()}
      style={dayViewStyles.timelineItem}
    >
      {/* Rail */}
      <View style={dayViewStyles.timelineRail}>
        <View style={hasTime ? dayViewStyles.timelineDot : dayViewStyles.timelineDotNoTime} />
        {!isLast && <View style={dayViewStyles.timelineConnector} />}
        {hasTime ? (
          <Text style={dayViewStyles.timelineTimeLabel}>{event.time}</Text>
        ) : (
          <Text style={dayViewStyles.timelineTimeLabelEmpty}>{'  '}</Text>
        )}
      </View>

      {/* Card */}
      <AnimatedTouchable
        style={[
          dayViewStyles.timelineCard,
          hasTime && dayViewStyles.timelineCardWithTime,
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {typeLabel !== '' && (
          <Text style={dayViewStyles.timelineCardType}>{typeLabel}</Text>
        )}
        <Text style={dayViewStyles.timelineCardDescription}>{description}</Text>
        {hasTime && (
          <Text style={dayViewStyles.timelineCardTime}>{event.time}</Text>
        )}
      </AnimatedTouchable>
    </Animated.View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const [scheduleData, setScheduleData] = useState<DaySchedule[]>([]);
  const [personName, setPersonName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'full'>('day');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [languageFilter, setLanguageFilter] = useState<'hebrew' | 'english'>('hebrew');

  const toggleIndicatorPosition = useSharedValue(viewMode === 'full' ? 0 : 1);
  const languageIndicatorPosition = useSharedValue(languageFilter === 'hebrew' ? 0 : 1);

  const loadSchedule = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('schedule')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        errorLogger.logError(error, 'Failed to fetch user schedule');
        setScheduleData([]);
        setLoading(false);
        return;
      }

      if (data?.schedule) {
        const parsedSchedule = parseScheduleData(data.schedule);
        setScheduleData(parsedSchedule);
        setPersonName(user.fullName || '');
      } else {
        setScheduleData([]);
      }
    } catch (error) {
      errorLogger.logError(error, 'Error loading schedule');
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  }, [loadSchedule]);

  const getAllEvents = useCallback((events: { [key: string]: Event }): Event[] => {
    return Object.values(events);
  }, []);

  const filterEventsByLanguage = useCallback((events: { [key: string]: Event }): Event[] => {
    return Object.values(events).filter(event => {
      if (languageFilter === 'hebrew') {
        return event.description_he && event.description_he.trim() !== '';
      } else {
        return event.description_en && event.description_en.trim() !== '';
      }
    });
  }, [languageFilter]);

  const daysWithEvents = useMemo(() => {
    return scheduleData.filter(day => {
      const filteredEvents = filterEventsByLanguage(day.events);
      const hasAgent = languageFilter === 'hebrew'
        ? (day.agent_he && day.agent_he.trim() !== '')
        : (day.agent_en && day.agent_en.trim() !== '');
      return filteredEvents.length > 0 || hasAgent;
    });
  }, [scheduleData, filterEventsByLanguage, languageFilter]);

  const allDaysWithEvents = useMemo(() => {
    const today = new Date();
    const daysInCalendar: CalendarDay[] = [];

    scheduleData.forEach(day => {
      const parts = day.date.split('.');
      if (parts.length !== 3) return;

      const dayNum = parseInt(parts[0], 10);
      const dayMonth = parseInt(parts[1], 10);
      const dayYear = parseInt(parts[2], 10) + 2000;

      const filteredEvents = filterEventsByLanguage(day.events);
      const hasAgent = languageFilter === 'hebrew'
        ? (day.agent_he && day.agent_he.trim() !== '')
        : (day.agent_en && day.agent_en.trim() !== '');

      if (filteredEvents.length > 0 || hasAgent) {
        const fullDate = new Date(dayYear, dayMonth - 1, dayNum);
        daysInCalendar.push({
          dayNumber: dayNum,
          isCurrentMonth: true,
          isToday:
            dayNum === today.getDate() &&
            dayMonth - 1 === today.getMonth() &&
            dayYear === today.getFullYear(),
          scheduleDay: day,
          fullDate,
        });
      }
    });

    daysInCalendar.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    return daysInCalendar;
  }, [scheduleData, filterEventsByLanguage, languageFilter]);

  const calculateCellHeight = useCallback((calendarDay: CalendarDay): number => {
    if (!calendarDay.scheduleDay) return 50;
    const filteredEvents = filterEventsByLanguage(calendarDay.scheduleDay.events);
    const agentText = languageFilter === 'hebrew'
      ? calendarDay.scheduleDay.agent_he
      : calendarDay.scheduleDay.agent_en;
    const hasAgent = agentText && agentText.trim() !== '';
    
    const baseHeight = 50;
    const agentHeight = hasAgent ? 48 : 0;
    
    // Calculate dynamic height for each event based on text length
    let totalEventsHeight = 0;
    filteredEvents.forEach(event => {
      const eventText = languageFilter === 'hebrew' ? event.description_he : event.description_en;
      const textLength = eventText.length;
      // Estimate height: base 48px + additional height for longer text
      // Roughly 15 characters per line at font size 11
      const estimatedLines = Math.ceil(textLength / 15);
      const eventHeight = Math.max(48, 32 + (estimatedLines * 16));
      totalEventsHeight += eventHeight;
    });
    
    return baseHeight + agentHeight + totalEventsHeight + 12;
  }, [filterEventsByLanguage, languageFilter]);

  const daysWithRowHeights = useMemo(() => {
    const daysPerRow = 3;
    const rows: { days: CalendarDay[]; maxHeight: number }[] = [];
    for (let i = 0; i < allDaysWithEvents.length; i += daysPerRow) {
      const rowDays = allDaysWithEvents.slice(i, i + daysPerRow);
      const heights = rowDays.map(day => calculateCellHeight(day));
      rows.push({ days: rowDays, maxHeight: Math.max(...heights) });
    }
    return rows;
  }, [allDaysWithEvents, calculateCellHeight]);

  const getCellWidth = useMemo(() => {
    const daysPerRow = 3;
    const totalGapWidth = (daysPerRow - 1) * spacing.sm;
    return (width - spacing.lg * 2 - totalGapWidth) / daysPerRow;
  }, []);

  const handleDayPress = useCallback((calendarDay: CalendarDay) => {
    if (!calendarDay.scheduleDay) return;
    const dayIndex = daysWithEvents.findIndex(d => d.date === calendarDay.scheduleDay?.date);
    if (dayIndex !== -1) {
      setSelectedDayIndex(dayIndex);
      setViewMode('day');
      toggleIndicatorPosition.value = withSpring(1, { damping: 20, stiffness: 300 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [daysWithEvents, toggleIndicatorPosition]);

  const handleViewModeChange = (mode: 'day' | 'full') => {
    setViewMode(mode);
    toggleIndicatorPosition.value = withSpring(mode === 'full' ? 0 : 1, { damping: 20, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLanguageChange = (lang: 'hebrew' | 'english') => {
    setLanguageFilter(lang);
    languageIndicatorPosition.value = withSpring(lang === 'hebrew' ? 0 : 1, { damping: 20, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleIndicatorStyle = useAnimatedStyle(() => {
    const containerWidth = width - spacing.lg * 2 - spacing.xs * 2;
    const buttonWidth = containerWidth / 2;
    return {
      width: buttonWidth,
      left: spacing.xs + toggleIndicatorPosition.value * buttonWidth,
    };
  });

  const languageIndicatorStyle = useAnimatedStyle(() => {
    const containerWidth = width - spacing.lg * 2 - spacing.xs * 2;
    const buttonWidth = containerWidth / 2;
    return {
      width: buttonWidth,
      left: spacing.xs + languageIndicatorPosition.value * buttonWidth,
    };
  });

  // ── Render: Day View ────────────────────────────────────────────────────────

  const renderDayView = () => {
    if (daysWithEvents.length === 0) return null;

    const selectedDay = daysWithEvents[selectedDayIndex];
    const filteredEvents = filterEventsByLanguage(selectedDay.events);
    const hasEvents = filteredEvents.length > 0;

    const agentText = languageFilter === 'hebrew' ? selectedDay.agent_he : selectedDay.agent_en;
    const hasAgent = agentText && agentText.trim() !== '';
    const agentBadgeColors = getAgentBadgeColors(agentText);
    const fullDayName = getFullDayName(selectedDay.day_of_week, languageFilter);

    const noEventsTitle = languageFilter === 'hebrew' ? 'אין אירועים' : 'No Events';
    const noEventsSub = languageFilter === 'hebrew'
      ? 'אין אירועים ביום זה.'
      : 'Nothing scheduled for this day.';
    const eventCountLabel = languageFilter === 'hebrew'
      ? `${filteredEvents.length} אירועים`
      : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`;

    return (
      <Animated.View style={dayViewStyles.dayViewWrapper} entering={FadeIn.duration(250)}>

        {/* Day selector */}
        <View style={dayViewStyles.daySelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dayViewStyles.daySelectorScroll}
          >
            {daysWithEvents.map((day, index) => {
              const isActive = index === selectedDayIndex;
              return (
                <AnimatedTouchable
                  key={index}
                  entering={FadeInDown.delay(index * 30).springify()}
                  style={[
                    dayViewStyles.daySelectorItem,
                    isActive && dayViewStyles.daySelectorItemActive,
                  ]}
                  onPress={() => {
                    setSelectedDayIndex(index);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    dayViewStyles.daySelectorDayOfWeek,
                    isActive && dayViewStyles.daySelectorDayOfWeekActive,
                  ]}>
                    {day.day_of_week.substring(0, 3)}
                  </Text>
                  <Text style={[
                    dayViewStyles.daySelectorDate,
                    isActive && dayViewStyles.daySelectorDateActive,
                  ]}>
                    {day.date.split('.')[0]}
                  </Text>
                </AnimatedTouchable>
              );
            })}
          </ScrollView>
        </View>

        {/* Hero card */}
        <Animated.View style={dayViewStyles.heroCard} entering={FadeInDown.delay(50).springify()}>
          <AnimatedLinearGradient
            colors={agentBadgeColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dayViewStyles.heroGradient}
          >
            {/* Top row: day name + agent pill */}
            <View style={dayViewStyles.heroTopRow}>
              <Text style={dayViewStyles.heroDayOfWeek}>{fullDayName}</Text>
              {hasAgent && (
                <View style={dayViewStyles.heroAgentPill}>
                  <View style={dayViewStyles.heroAgentDot} />
                  <Text style={dayViewStyles.heroAgentText}>{agentText}</Text>
                </View>
              )}
            </View>

            {/* Bottom row: big date + event count */}
            <View style={dayViewStyles.heroBottomRow}>
              <Text style={dayViewStyles.heroDate}>{selectedDay.date}</Text>
              {hasEvents && (
                <View style={dayViewStyles.heroEventCountWrap}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={12}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={dayViewStyles.heroEventCountText}>{eventCountLabel}</Text>
                </View>
              )}
            </View>
          </AnimatedLinearGradient>
        </Animated.View>

        {/* Timeline or empty state */}
        {hasEvents ? (
          <View style={dayViewStyles.timeline}>
            {filteredEvents.map((event, eventIndex) => (
              <TimelineEventCard
                key={eventIndex}
                event={event}
                index={eventIndex}
                isLast={eventIndex === filteredEvents.length - 1}
                languageFilter={languageFilter}
              />
            ))}
          </View>
        ) : (
          <Animated.View
            style={dayViewStyles.noEventsWrap}
            entering={FadeInUp.delay(300).springify()}
          >
            <View style={dayViewStyles.noEventsCircle}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={32}
                color={designColors.primary}
              />
            </View>
            <Text style={dayViewStyles.noEventsTitle}>{noEventsTitle}</Text>
            <Text style={dayViewStyles.noEventsSubtitle}>{noEventsSub}</Text>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  // ── Render: Full Schedule View ──────────────────────────────────────────────

  const renderFullScheduleView = () => (
    <Animated.View style={styles.calendarGrid} entering={FadeIn.duration(300)}>
      {daysWithRowHeights.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.calendarRow}>
          {row.days.map((day, dayIndex) => (
            <View key={dayIndex} style={{ width: getCellWidth }}>
              <AnimatedCalendarCell
                calendarDay={day}
                index={rowIndex * 3 + dayIndex}
                rowMaxHeight={row.maxHeight}
                languageFilter={languageFilter}
                filterEventsByLanguage={filterEventsByLanguage}
                handleDayPress={handleDayPress}
              />
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={[designColors.primaryLight, designColors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────

  const hasSchedule = scheduleData.length > 0;
  const greetingText = personName ? `לוח הזמנים של ${personName}` : 'לוח הזמנים שלך';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[designColors.primaryLight, designColors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={styles.header} entering={FadeInDown.springify()}>
        <Text style={styles.headerTitle}>לוח זמנים</Text>
        {hasSchedule && <Text style={styles.headerSubtitle}>{greetingText}</Text>}
      </Animated.View>

      {hasSchedule ? (
        <React.Fragment>
          {/* View toggle */}
          <Animated.View style={styles.viewToggle} entering={FadeInDown.delay(100).springify()}>
            <AnimatedLinearGradient
              colors={[designColors.primary, designColors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.toggleIndicator, toggleIndicatorStyle]}
            />
            <TouchableOpacity style={styles.toggleButton} onPress={() => handleViewModeChange('full')}>
              <Text style={[styles.toggleButtonText, viewMode === 'full' && styles.toggleButtonTextActive]}>
                לוח מלא
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleButton} onPress={() => handleViewModeChange('day')}>
              <Text style={[styles.toggleButtonText, viewMode === 'day' && styles.toggleButtonTextActive]}>
                תצוגת יום
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Language toggle */}
          <Animated.View style={styles.languageToggle} entering={FadeInDown.delay(150).springify()}>
            <AnimatedLinearGradient
              colors={[designColors.secondary, designColors.secondaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.languageIndicator, languageIndicatorStyle]}
            />
            <TouchableOpacity style={styles.languageButton} onPress={() => handleLanguageChange('hebrew')}>
              <Text style={[styles.languageButtonText, languageFilter === 'hebrew' && styles.languageButtonTextActive]}>
                עברית
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.languageButton} onPress={() => handleLanguageChange('english')}>
              <Text style={[styles.languageButtonText, languageFilter === 'english' && styles.languageButtonTextActive]}>
                English
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={designColors.primary}
              />
            }
          >
            {viewMode === 'day' ? renderDayView() : renderFullScheduleView()}
          </ScrollView>
        </React.Fragment>
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={designColors.primary}
            />
          }
        >
          <Animated.View style={styles.emptyStateIcon} entering={ZoomIn.springify()}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={80}
              color={designColors.text.secondary}
            />
          </Animated.View>
          <Animated.Text style={styles.emptyStateTitle} entering={FadeInUp.delay(100).springify()}>
            אין לוח זמנים זמין
          </Animated.Text>
          <Animated.Text style={styles.emptyStateText} entering={FadeInUp.delay(200).springify()}>
            לוח הזמנים שלך יופיע כאן לאחר שהמנהל יגדיר אותו עבורך.{'\n'}
            משוך למטה כדי לרענן.
          </Animated.Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
