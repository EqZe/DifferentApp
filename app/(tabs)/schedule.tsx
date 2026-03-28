
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  PanResponder,
  Animated as RNAnimated,
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

// New schedule data interfaces matching the new JSON format
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
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  assignedPersonText: {
    fontSize: 12,
    fontWeight: '800' as any,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    writingDirection: 'rtl',
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
  /* ── Day view ── */
  dayViewContainer: {
    paddingHorizontal: spacing.lg,
  },
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
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroAgentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  heroAgentText: {
    fontSize: 13,
    fontWeight: '800' as any,
    color: '#FFFFFF',
    letterSpacing: 0.4,
    writingDirection: 'rtl',
  },
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
  timelineCard: {
    flex: 1,
    marginLeft: spacing.sm,
    backgroundColor: designColors.surface,
    borderRadius: 16,
    padding: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: designColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 2,
  },
  timelineCardWithTime: {
    borderLeftWidth: 4,
    borderLeftColor: designColors.primary,
  },
  timelineCardType: {
    fontSize: 10,
    fontWeight: '700' as any,
    color: designColors.primary,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'right',
    opacity: 0.75,
  },
  timelineCardDescription: {
    fontSize: 15,
    fontWeight: '600' as any,
    color: designColors.text.primary,
    lineHeight: 22,
    letterSpacing: 0.1,
    textAlign: 'right',
  },
  timelineCardTime: {
    fontSize: 12,
    fontWeight: '700' as any,
    color: designColors.primary,
    textAlign: 'right',
    marginTop: 8,
    letterSpacing: 0.5,
    opacity: 0.85,
  },

  /* No events */
  noEventsContainer: {
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
  noEventsText: {
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: typography.sizes.md * 1.5,
  },
});

// Parse schedule data from new JSON format
const parseScheduleData = (scheduleJson: any): DaySchedule[] => {
  console.log('ScheduleScreen: Parsing schedule data', scheduleJson);
  
  if (!scheduleJson || !scheduleJson.days) {
    console.log('ScheduleScreen: No days found in schedule data');
    return [];
  }
  
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
  
  console.log('ScheduleScreen: Parsed', daysArray.length, 'days');
  return daysArray;
};

// Helper to get day name based on language
const getDayAbbreviation = (dayOfWeek: number, language: 'hebrew' | 'english'): string => {
  if (language === 'hebrew') {
    const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return hebrewDayNames[dayOfWeek];
  } else {
    const englishAbbreviations = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return englishAbbreviations[dayOfWeek];
  }
};

// Helper to get full day name based on language
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

// Helper to get agent badge colors (gradient)
const getAgentBadgeColors = (agentText: string | null): [string, string] => {
  if (!agentText) return ['#9C27B0', '#BA68C8'];

  const normalizedAgent = agentText.trim().toLowerCase();

  // Green for "סוכנת" / "agent"
  if (normalizedAgent.includes('סוכנת') || normalizedAgent.includes('agent')) {
    return ['#4CAF50', '#66BB6A'];
  }

  // Purple for everyone else (including avishai / אבישי / roni / רוני)
  return ['#9C27B0', '#BA68C8'];
};

// Animated Calendar Cell Component
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
  }, [calendarDay.isToday, pulseAnimation]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: shadowOpacity.value,
    };
  });
  
  const pulseStyle = useAnimatedStyle(() => {
    if (!calendarDay.isToday) return {};
    
    const opacity = interpolate(
      pulseAnimation.value,
      [0, 1],
      [0.3, 0.8],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
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
  
  if (!calendarDay.scheduleDay) {
    return null;
  }
  
  const filteredEvents = filterEventsByLanguage(calendarDay.scheduleDay.events);
  
  const rawAgentText = languageFilter === 'hebrew'
    ? calendarDay.scheduleDay.agent_he
    : calendarDay.scheduleDay.agent_en;
  const agentText = rawAgentText ? rawAgentText.replace(/\s*\(female\)/i, '').trim() : rawAgentText;
  
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
        <Text
          style={[
            styles.dayNumber,
            calendarDay.isToday && styles.dayNumberToday,
          ]}
        >
          {dayNumberText}
        </Text>
        <Text style={styles.dayAbbreviation}>
          {dayAbbrev}
        </Text>
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
      
      {filteredEvents.map((event, eventIndex) => {
        const eventDescriptionText = languageFilter === 'hebrew' ? event.description_he : event.description_en;
        
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

// Helper to get event type label
const getEventTypeLabel = (type: string, language: 'hebrew' | 'english'): string => {
  if (language === 'hebrew') {
    const map: Record<string, string> = {
      flight: 'טיסה', business: 'עסקי', meeting: 'פגישה',
      accommodation: 'לינה', personal: 'אישי', other: '',
    };
    return map[type] ?? '';
  } else {
    const map: Record<string, string> = {
      flight: 'FLIGHT', business: 'BUSINESS', meeting: 'MEETING',
      accommodation: 'STAY', personal: 'PERSONAL', other: '',
    };
    return map[type] ?? '';
  }
};

// Timeline Event Card Component
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
      style={styles.timelineItem}
    >
      {/* Rail */}
      <View style={styles.timelineRail}>
        <View style={hasTime ? styles.timelineDot : styles.timelineDotNoTime} />
        {!isLast && <View style={styles.timelineConnector} />}
        {hasTime ? (
          <Text style={styles.timelineTimeLabel}>{event.time}</Text>
        ) : (
          <Text style={styles.timelineTimeLabelEmpty}>{'  '}</Text>
        )}
      </View>

      {/* Card */}
      <AnimatedTouchable
        style={[
          styles.timelineCard,
          hasTime && styles.timelineCardWithTime,
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {typeLabel !== '' && (
          <Text style={styles.timelineCardType}>{typeLabel}</Text>
        )}
        <Text style={styles.timelineCardDescription}>{description}</Text>
        {hasTime && (
          <Text style={styles.timelineCardTime}>{event.time}</Text>
        )}
      </AnimatedTouchable>
    </Animated.View>
  );
});

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

  const swipeAnim = useRef(new RNAnimated.Value(0)).current;
  // Keep a ref to the current daysWithEvents length so the panResponder
  // (created once) always reads the up-to-date boundary value.
  const daysWithEventsLengthRef = useRef(0);
  const selectedDayIndexRef = useRef(0);

  // Scroll-enable state + stable ref so the stale-closure panResponder can call it
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const setScrollEnabledRef = useRef<(v: boolean) => void>(() => {});
  setScrollEnabledRef.current = setIsScrollEnabled;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 30,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 30,
      onPanResponderGrant: () => {
        setScrollEnabledRef.current(false);
      },
      onPanResponderMove: (_, gestureState) => {
        swipeAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const SWIPE_THRESHOLD = 50;
        const totalDays = daysWithEventsLengthRef.current;
        const currentIndex = selectedDayIndexRef.current;
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // At last day — bounce back, no navigation
          if (currentIndex >= totalDays - 1) {
            console.log('ScheduleScreen: Swipe left blocked — already at last day');
            RNAnimated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
            setScrollEnabledRef.current(true);
            return;
          }
          console.log('ScheduleScreen: Swipe left → next day');
          RNAnimated.timing(swipeAnim, {
            toValue: -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            swipeAnim.setValue(400);
            setSelectedDayIndex(prev => {
              const next = Math.min(prev + 1, daysWithEventsLengthRef.current - 1);
              selectedDayIndexRef.current = next;
              return next;
            });
            RNAnimated.timing(swipeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => setScrollEnabledRef.current(true));
          });
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // At first day — bounce back, no navigation
          if (currentIndex <= 0) {
            console.log('ScheduleScreen: Swipe right blocked — already at first day');
            RNAnimated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
            setScrollEnabledRef.current(true);
            return;
          }
          console.log('ScheduleScreen: Swipe right → previous day');
          RNAnimated.timing(swipeAnim, {
            toValue: 400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            swipeAnim.setValue(-400);
            setSelectedDayIndex(prev => {
              const next = Math.max(prev - 1, 0);
              selectedDayIndexRef.current = next;
              return next;
            });
            RNAnimated.timing(swipeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => setScrollEnabledRef.current(true));
          });
        } else {
          RNAnimated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setScrollEnabledRef.current(true);
        }
      },
      onPanResponderTerminate: () => {
        RNAnimated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
        setScrollEnabledRef.current(true);
      },
    })
  ).current;

  const loadSchedule = useCallback(async () => {
    if (!user?.id) {
      console.log('ScheduleScreen: No user ID, skipping schedule load');
      setLoading(false);
      return;
    }

    try {
      console.log('ScheduleScreen: Loading schedule for user', user.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('schedule')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('ScheduleScreen: Failed to fetch schedule', error);
        errorLogger.logError(error, 'Failed to fetch user schedule');
        setScheduleData([]);
        setLoading(false);
        return;
      }

      if (data?.schedule) {
        console.log('ScheduleScreen: Schedule data retrieved');
        const parsedSchedule = parseScheduleData(data.schedule);
        setScheduleData(parsedSchedule);
        setPersonName(user.fullName || '');
        console.log('ScheduleScreen: Parsed schedule days:', parsedSchedule.length);
      } else {
        console.log('ScheduleScreen: No schedule data found');
        setScheduleData([]);
      }
    } catch (error) {
      console.error('ScheduleScreen: Error loading schedule', error);
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
    console.log('ScheduleScreen: Refreshing schedule');
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  }, [loadSchedule]);

  const getAllEvents = useCallback((events: { [key: string]: Event }): Event[] => {
    return Object.values(events);
  }, []);

  const filterEventsByLanguage = useCallback((events: { [key: string]: Event }): Event[] => {
    const allEvents = getAllEvents(events);
    return allEvents.filter(event => {
      if (languageFilter === 'hebrew') {
        return event.description_he && event.description_he.trim() !== '';
      } else {
        return event.description_en && event.description_en.trim() !== '';
      }
    });
  }, [languageFilter, getAllEvents]);

  const daysWithEvents = useMemo(() => {
    return scheduleData.filter(day => {
      const filteredEvents = filterEventsByLanguage(day.events);
      const hasAgent = languageFilter === 'hebrew'
        ? (day.agent_he && day.agent_he.trim() !== '')
        : (day.agent_en && day.agent_en.trim() !== '');
      return filteredEvents.length > 0 || hasAgent;
    });
  }, [scheduleData, filterEventsByLanguage, languageFilter]);

  // Keep refs in sync so the stale-closure-safe panResponder can read current values
  useEffect(() => {
    daysWithEventsLengthRef.current = daysWithEvents.length;
  }, [daysWithEvents.length]);

  useEffect(() => {
    selectedDayIndexRef.current = selectedDayIndex;
  }, [selectedDayIndex]);

  const allDaysWithEvents = useMemo(() => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
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
          isToday: dayNum === todayDate && dayMonth - 1 === todayMonth && dayYear === todayYear,
          scheduleDay: day,
          fullDate,
        });
      }
    });
    
    daysInCalendar.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    
    console.log('ScheduleScreen: Total days with events across all months:', daysInCalendar.length);
    return daysInCalendar;
  }, [scheduleData, filterEventsByLanguage, languageFilter]);

  const calculateCellHeight = useCallback((calendarDay: CalendarDay): number => {
    if (!calendarDay.scheduleDay) {
      return 50;
    }
    
    const filteredEvents = filterEventsByLanguage(calendarDay.scheduleDay.events);
    const rawAgentText2 = languageFilter === 'hebrew'
      ? calendarDay.scheduleDay.agent_he
      : calendarDay.scheduleDay.agent_en;
    const hasAgent = rawAgentText2 && rawAgentText2.trim() !== '';
    
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
    
    const bottomPadding = 12;
    
    return baseHeight + agentHeight + totalEventsHeight + bottomPadding;
  }, [filterEventsByLanguage, languageFilter]);

  const daysWithRowHeights = useMemo(() => {
    const daysPerRow = 3;
    const rows: { days: CalendarDay[]; maxHeight: number }[] = [];
    
    console.log('ScheduleScreen: Total days:', allDaysWithEvents.length, 'Days per row: 3 (fixed)');
    
    for (let i = 0; i < allDaysWithEvents.length; i += daysPerRow) {
      const rowDays = allDaysWithEvents.slice(i, i + daysPerRow);
      const heights = rowDays.map(day => calculateCellHeight(day));
      const maxHeight = Math.max(...heights);
      
      console.log(`ScheduleScreen: Row ${Math.floor(i / daysPerRow)} - Heights:`, heights, 'Max:', maxHeight);
      
      rows.push({
        days: rowDays,
        maxHeight,
      });
    }
    
    return rows;
  }, [allDaysWithEvents, calculateCellHeight]);

  const getCellWidth = useMemo(() => {
    const daysPerRow = 3;
    const gapCount = daysPerRow - 1;
    const totalGapWidth = gapCount * spacing.sm;
    const availableWidth = width - spacing.lg * 2 - totalGapWidth;
    return availableWidth / daysPerRow;
  }, []);

  const handleDayPress = useCallback((calendarDay: CalendarDay) => {
    if (!calendarDay.scheduleDay) {
      console.log('ScheduleScreen: No events for this day');
      return;
    }
    
    const dayIndex = daysWithEvents.findIndex(d => d.date === calendarDay.scheduleDay?.date);
    if (dayIndex !== -1) {
      console.log('ScheduleScreen: Navigating to day view for', calendarDay.scheduleDay.date);
      setSelectedDayIndex(dayIndex);
      setViewMode('day');
      toggleIndicatorPosition.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [daysWithEvents, toggleIndicatorPosition]);

  const handleViewModeChange = (mode: 'day' | 'full') => {
    console.log('ScheduleScreen: Switched to', mode, 'view');
    setViewMode(mode);
    toggleIndicatorPosition.value = withSpring(mode === 'full' ? 0 : 1, {
      damping: 20,
      stiffness: 300,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLanguageChange = (lang: 'hebrew' | 'english') => {
    console.log('ScheduleScreen: Language filter set to', lang);
    setLanguageFilter(lang);
    languageIndicatorPosition.value = withSpring(lang === 'hebrew' ? 0 : 1, {
      damping: 20,
      stiffness: 300,
    });
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

  const renderDayView = () => {
    if (daysWithEvents.length === 0) {
      return null;
    }

    const selectedDay = daysWithEvents[selectedDayIndex];
    const filteredEvents = filterEventsByLanguage(selectedDay.events);
    const hasEvents = filteredEvents.length > 0;
    const rawAgentText = languageFilter === 'hebrew' ? selectedDay.agent_he : selectedDay.agent_en;
    const agentText = rawAgentText ? rawAgentText.replace(/\s*\(female\)/i, '').trim() : rawAgentText;
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
      <Animated.View
        style={styles.dayViewContainer}
        entering={FadeIn.duration(250)}
      >
        {/* Day selector is NOT part of the swipeable area */}
        <View style={styles.daySelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorScroll}
          >
            {daysWithEvents.map((day, index) => {
              const isActive = index === selectedDayIndex;
              return (
                <AnimatedTouchable
                  key={index}
                  entering={FadeInDown.delay(index * 30).springify()}
                  style={[
                    styles.daySelectorItem,
                    isActive && styles.daySelectorItemActive,
                  ]}
                  onPress={() => {
                    console.log('ScheduleScreen: Selected day', index);
                    setSelectedDayIndex(index);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.daySelectorDayOfWeek, isActive && styles.daySelectorDayOfWeekActive]}>
                    {day.day_of_week.substring(0, 3)}
                  </Text>
                  <Text style={[styles.daySelectorDate, isActive && styles.daySelectorDateActive]}>
                    {day.date.split('.')[0]}
                  </Text>
                </AnimatedTouchable>
              );
            })}
          </ScrollView>
        </View>

        {/* Swipe gesture wraps ONLY the content below the day selector */}
        <RNAnimated.View
          style={{ flex: 1, transform: [{ translateX: swipeAnim }] }}
          {...panResponder.panHandlers}
        >
          {/* Hero card */}
          <Animated.View style={styles.heroCard} entering={FadeInDown.delay(50).springify()}>
            <AnimatedLinearGradient
              colors={agentBadgeColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              {/* Top row: day name + agent pill */}
              <View style={styles.heroTopRow}>
                <Text style={styles.heroDayOfWeek}>{fullDayName}</Text>
                {hasAgent && (
                  <View style={styles.heroAgentPill}>
                    <View style={styles.heroAgentDot} />
                    <Text style={styles.heroAgentText}>{agentText}</Text>
                  </View>
                )}
              </View>
              {/* Bottom row: big date + event count */}
              <View style={styles.heroBottomRow}>
                <Text style={styles.heroDate}>{selectedDay.date}</Text>
                {hasEvents && (
                  <View style={styles.heroEventCountWrap}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="calendar-today"
                      size={12}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Text style={styles.heroEventCountText}>{eventCountLabel}</Text>
                  </View>
                )}
              </View>
            </AnimatedLinearGradient>
          </Animated.View>

          {hasEvents ? (
            <View style={styles.timeline}>
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
              style={styles.noEventsContainer}
              entering={FadeInUp.delay(300).springify()}
            >
              <View style={styles.noEventsCircle}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={32}
                  color={designColors.primary}
                />
              </View>
              <Text style={[styles.noEventsText, { fontSize: 16, fontWeight: '700', color: designColors.text.primary, marginBottom: 4 }]}>
                {noEventsTitle}
              </Text>
              <Text style={styles.noEventsText}>{noEventsSub}</Text>
            </Animated.View>
          )}
        </RNAnimated.View>
      </Animated.View>
    );
  };

  const renderFullScheduleView = () => {
    return (
      <Animated.View 
        style={styles.calendarGrid}
        entering={FadeIn.duration(300)}
      >
        {daysWithRowHeights.map((row, rowIndex) => {
          const daysPerRow = 3;
          
          return (
            <View key={rowIndex} style={styles.calendarRow}>
              {row.days.map((day, dayIndex) => {
                return (
                  <View key={dayIndex} style={{ width: getCellWidth }}>
                    <AnimatedCalendarCell
                      calendarDay={day}
                      index={rowIndex * daysPerRow + dayIndex}
                      rowMaxHeight={row.maxHeight}
                      languageFilter={languageFilter}
                      filterEventsByLanguage={filterEventsByLanguage}
                      handleDayPress={handleDayPress}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
      </Animated.View>
    );
  };

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

  const hasSchedule = scheduleData.length > 0;
  const greetingText = personName ? `לוח הזמנים של ${personName}` : 'לוח הזמנים שלך';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[designColors.primaryLight, designColors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View 
        style={styles.header}
        entering={FadeInDown.springify()}
      >
        <Text style={styles.headerTitle}>לוח זמנים</Text>
        {hasSchedule && <Text style={styles.headerSubtitle}>{greetingText}</Text>}
      </Animated.View>

      {hasSchedule ? (
        <React.Fragment>
          <Animated.View 
            style={styles.viewToggle}
            entering={FadeInDown.delay(100).springify()}
          >
            <AnimatedLinearGradient
              colors={[designColors.primary, designColors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.toggleIndicator, toggleIndicatorStyle]}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => handleViewModeChange('full')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  viewMode === 'full' && styles.toggleButtonTextActive,
                ]}
              >
                לוח מלא
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => handleViewModeChange('day')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  viewMode === 'day' && styles.toggleButtonTextActive,
                ]}
              >
                תצוגת יום
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            style={styles.languageToggle}
            entering={FadeInDown.delay(150).springify()}
          >
            <AnimatedLinearGradient
              colors={[designColors.secondary, designColors.secondaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.languageIndicator, languageIndicatorStyle]}
            />
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => handleLanguageChange('hebrew')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  languageFilter === 'hebrew' && styles.languageButtonTextActive,
                ]}
              >
                עברית
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => handleLanguageChange('english')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  languageFilter === 'english' && styles.languageButtonTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={isScrollEnabled}
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
          <Animated.View 
            style={styles.emptyStateIcon}
            entering={ZoomIn.springify()}
          >
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={80}
              color={designColors.text.secondary}
            />
          </Animated.View>
          <Animated.Text 
            style={styles.emptyStateTitle}
            entering={FadeInUp.delay(100).springify()}
          >
            אין לוח זמנים זמין
          </Animated.Text>
          <Animated.Text 
            style={styles.emptyStateText}
            entering={FadeInUp.delay(200).springify()}
          >
            לוח הזמנים שלך יופיע כאן לאחר שהמנהל יגדיר אותו עבורך.{'\n'}
            משוך למטה כדי לרענן.
          </Animated.Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
