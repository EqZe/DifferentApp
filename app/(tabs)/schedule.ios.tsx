
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
    flexWrap: 'wrap',
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
    flexWrap: 'wrap',
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
  dayViewContainer: {
    paddingHorizontal: spacing.lg,
  },
  dayViewHeader: {
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: designColors.border,
  },
  dayViewDateContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayViewDayOfWeek: {
    fontSize: typography.sizes.xxxl + 4,
    fontWeight: typography.weights.bold as any,
    color: designColors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(39, 132, 245, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dayViewDate: {
    fontSize: typography.sizes.lg,
    color: designColors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  dayViewAgentBadge: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  dayViewAgentText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  daySelectorDayOfWeekActive: {
    color: '#FFFFFF',
  },
  daySelectorDate: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: designColors.text.primary,
  },
  daySelectorDateActive: {
    color: '#FFFFFF',
  },
  eventsSection: {
    gap: spacing.md,
  },
  eventCard: {
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
    borderLeftWidth: 4,
    borderLeftColor: designColors.primary,
    borderWidth: 1,
    borderColor: designColors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  eventIconContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: designColors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    borderWidth: 2,
    borderColor: designColors.primary + '20',
  },
  eventContent: {
    flex: 1,
  },
  eventTime: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: designColors.primary,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  eventDescription: {
    fontSize: typography.sizes.md,
    color: designColors.text.primary,
    lineHeight: typography.sizes.md * 1.6,
    letterSpacing: 0.2,
  },
  noEventsContainer: {
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: designColors.border,
  },
  noEventsIcon: {
    marginBottom: spacing.md,
  },
  noEventsText: {
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    lineHeight: typography.sizes.md * 1.5,
  },
});

// Parse schedule data from new JSON format
const parseScheduleData = (scheduleJson: any): DaySchedule[] => {
  console.log('ScheduleScreen (iOS): Parsing schedule data', scheduleJson);
  
  if (!scheduleJson || !scheduleJson.days) {
    console.log('ScheduleScreen (iOS): No days found in schedule data');
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
  
  console.log('ScheduleScreen (iOS): Parsed', daysArray.length, 'days');
  return daysArray;
};

// Find the first month with events (chronologically)
const findFirstMonthWithEvents = (scheduleData: DaySchedule[]): Date => {
  if (scheduleData.length === 0) {
    return new Date();
  }

  let earliestDate: Date | null = null;

  scheduleData.forEach(day => {
    const parts = day.date.split('.');
    if (parts.length === 3) {
      const dayNum = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10) + 2000;
      
      const eventCount = Object.keys(day.events).length;
      const hasAgent = day.agent_he || day.agent_en;
      
      if (eventCount > 0 || hasAgent) {
        const date = new Date(year, month - 1, dayNum);
        if (!earliestDate || date < earliestDate) {
          earliestDate = date;
        }
      }
    }
  });

  if (earliestDate) {
    const firstOfMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    console.log('ScheduleScreen (iOS): First month with events:', firstOfMonth.toLocaleDateString());
    return firstOfMonth;
  }

  return new Date();
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
  if (!agentText) return ['#FF9800', '#F57C00'];
  
  const normalizedAgent = agentText.trim().toLowerCase();
  
  if (normalizedAgent.includes('אבישי') || normalizedAgent.includes('רוני')) {
    return ['#FF9800', '#F57C00'];
  }
  
  if (normalizedAgent.includes('סוכנת')) {
    return ['#4CAF50', '#388E3C'];
  }
  
  return ['#FF9800', '#F57C00'];
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
  }, [calendarDay.isToday]);
  
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
        { minHeight: rowMaxHeight },
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

// Animated Event Card Component
const AnimatedEventCard = React.memo(({ event, index, languageFilter }: any) => {
  const scale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  
  useEffect(() => {
    iconRotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500 }),
        withTiming(5, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);
  
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${iconRotation.value}deg` }],
    };
  });
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };
  
  const hasTime = Boolean(event.time);
  const eventTimeText = event.time || '';
  const eventDescriptionText = languageFilter === 'hebrew' ? event.description_he : event.description_en;
  
  return (
    <AnimatedTouchable
      entering={FadeInUp.delay(index * 100).springify()}
      style={[styles.eventCard, animatedCardStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <View style={styles.eventHeader}>
        <Animated.View style={[styles.eventIconContainer, animatedIconStyle]}>
          <IconSymbol
            ios_icon_name={hasTime ? 'clock.fill' : 'circle.fill'}
            android_material_icon_name={hasTime ? 'access-time' : 'circle'}
            size={24}
            color={designColors.primary}
          />
        </Animated.View>
        <View style={styles.eventContent}>
          {hasTime && (
            <Text style={styles.eventTime}>
              {eventTimeText}
            </Text>
          )}
          <Text style={styles.eventDescription}>
            {eventDescriptionText}
          </Text>
        </View>
      </View>
    </AnimatedTouchable>
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hasInitializedMonth, setHasInitializedMonth] = useState(false);

  const toggleIndicatorPosition = useSharedValue(viewMode === 'full' ? 0 : 1);
  const languageIndicatorPosition = useSharedValue(languageFilter === 'hebrew' ? 0 : 1);

  const loadSchedule = useCallback(async () => {
    if (!user?.id) {
      console.log('ScheduleScreen (iOS): No user ID, skipping schedule load');
      setLoading(false);
      return;
    }

    try {
      console.log('ScheduleScreen (iOS): Loading schedule for user', user.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('schedule')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('ScheduleScreen (iOS): Failed to fetch schedule', error);
        errorLogger.logError(error, 'Failed to fetch user schedule');
        setScheduleData([]);
        setLoading(false);
        return;
      }

      if (data?.schedule) {
        console.log('ScheduleScreen (iOS): Schedule data retrieved');
        const parsedSchedule = parseScheduleData(data.schedule);
        setScheduleData(parsedSchedule);
        setPersonName(user.fullName || '');
        console.log('ScheduleScreen (iOS): Parsed schedule days:', parsedSchedule.length);
        
        if (!hasInitializedMonth && parsedSchedule.length > 0) {
          const firstMonth = findFirstMonthWithEvents(parsedSchedule);
          setCurrentMonth(firstMonth);
          setHasInitializedMonth(true);
          console.log('ScheduleScreen (iOS): Auto-opened to first month with events');
        }
      } else {
        console.log('ScheduleScreen (iOS): No schedule data found');
        setScheduleData([]);
      }
    } catch (error) {
      console.error('ScheduleScreen (iOS): Error loading schedule', error);
      errorLogger.logError(error, 'Error loading schedule');
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  }, [user, hasInitializedMonth]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const onRefresh = useCallback(async () => {
    console.log('ScheduleScreen (iOS): Refreshing schedule');
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

  const daysWithEventsInCurrentMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    const daysInMonth: CalendarDay[] = [];
    
    scheduleData.forEach(day => {
      const parts = day.date.split('.');
      if (parts.length !== 3) return;
      
      const dayNum = parseInt(parts[0], 10);
      const dayMonth = parseInt(parts[1], 10);
      const dayYear = parseInt(parts[2], 10) + 2000;
      
      if (dayYear !== year || dayMonth !== month + 1) return;
      
      const filteredEvents = filterEventsByLanguage(day.events);
      const hasAgent = languageFilter === 'hebrew'
        ? (day.agent_he && day.agent_he.trim() !== '')
        : (day.agent_en && day.agent_en.trim() !== '');
      
      if (filteredEvents.length > 0 || hasAgent) {
        const fullDate = new Date(dayYear, dayMonth - 1, dayNum);
        daysInMonth.push({
          dayNumber: dayNum,
          isCurrentMonth: true,
          isToday: dayNum === todayDate && dayMonth - 1 === todayMonth && dayYear === todayYear,
          scheduleDay: day,
          fullDate,
        });
      }
    });
    
    daysInMonth.sort((a, b) => a.dayNumber - b.dayNumber);
    
    console.log('ScheduleScreen (iOS): Days with events in current month:', daysInMonth.length);
    return daysInMonth;
  }, [currentMonth, scheduleData, filterEventsByLanguage, languageFilter]);

  const calculateCellHeight = useCallback((calendarDay: CalendarDay): number => {
    if (!calendarDay.scheduleDay) {
      return 50;
    }
    
    const filteredEvents = filterEventsByLanguage(calendarDay.scheduleDay.events);
    const agentText = languageFilter === 'hebrew'
      ? calendarDay.scheduleDay.agent_he
      : calendarDay.scheduleDay.agent_en;
    const hasAgent = agentText && agentText.trim() !== '';
    
    const baseHeight = 50;
    const agentHeight = hasAgent ? 40 : 0;
    const eventHeight = 40;
    const totalEventsHeight = filteredEvents.length * eventHeight;
    const bottomPadding = 12;
    
    return baseHeight + agentHeight + totalEventsHeight + bottomPadding;
  }, [filterEventsByLanguage, languageFilter]);

  const daysWithRowHeights = useMemo(() => {
    const totalDays = daysWithEventsInCurrentMonth.length;
    const daysPerRow = totalDays % 4 === 0 ? 4 : 3;
    const rows: { days: CalendarDay[]; maxHeight: number }[] = [];
    
    console.log('ScheduleScreen (iOS): Total days:', totalDays, 'Days per row:', daysPerRow);
    
    for (let i = 0; i < daysWithEventsInCurrentMonth.length; i += daysPerRow) {
      const rowDays = daysWithEventsInCurrentMonth.slice(i, i + daysPerRow);
      const heights = rowDays.map(day => calculateCellHeight(day));
      const maxHeight = Math.max(...heights);
      
      console.log(`ScheduleScreen (iOS): Row ${Math.floor(i / daysPerRow)} - Heights:`, heights, 'Max:', maxHeight);
      
      rows.push({
        days: rowDays,
        maxHeight,
      });
    }
    
    return rows;
  }, [daysWithEventsInCurrentMonth, calculateCellHeight]);

  const getCellWidth = useMemo(() => {
    const totalDays = daysWithEventsInCurrentMonth.length;
    const daysPerRow = totalDays % 4 === 0 ? 4 : 3;
    const gapCount = daysPerRow - 1;
    const totalGapWidth = gapCount * spacing.sm;
    const availableWidth = width - spacing.lg * 2 - totalGapWidth;
    return availableWidth / daysPerRow;
  }, [daysWithEventsInCurrentMonth.length]);

  const handleDayPress = useCallback((calendarDay: CalendarDay) => {
    if (!calendarDay.scheduleDay) {
      console.log('ScheduleScreen (iOS): No events for this day');
      return;
    }
    
    const dayIndex = daysWithEvents.findIndex(d => d.date === calendarDay.scheduleDay?.date);
    if (dayIndex !== -1) {
      console.log('ScheduleScreen (iOS): Navigating to day view for', calendarDay.scheduleDay.date);
      setSelectedDayIndex(dayIndex);
      setViewMode('day');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [daysWithEvents]);

  const handleViewModeChange = (mode: 'day' | 'full') => {
    console.log('ScheduleScreen (iOS): Switched to', mode, 'view');
    setViewMode(mode);
    toggleIndicatorPosition.value = withSpring(mode === 'full' ? 0 : 1, {
      damping: 20,
      stiffness: 300,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLanguageChange = (lang: 'hebrew' | 'english') => {
    console.log('ScheduleScreen (iOS): Language filter set to', lang);
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
    const agentText = languageFilter === 'hebrew' ? selectedDay.agent_he : selectedDay.agent_en;
    const agentBadgeColors = getAgentBadgeColors(agentText);
    const noEventsMessage = languageFilter === 'hebrew'
      ? 'אין אירועים בעברית ליום זה'
      : 'No events in English for this day';
    
    const fullDayName = getFullDayName(selectedDay.day_of_week, languageFilter);

    return (
      <Animated.View 
        style={styles.dayViewContainer}
        entering={FadeIn.duration(300)}
      >
        <View style={styles.daySelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorScroll}
          >
            {daysWithEvents.map((day, index) => {
              const isActive = index === selectedDayIndex;
              const dayOfWeekShort = day.day_of_week.substring(0, 3);
              const dayNumberOnly = day.date.split('.')[0];
              
              return (
                <AnimatedTouchable
                  key={index}
                  entering={FadeInDown.delay(index * 30).springify()}
                  style={[
                    styles.daySelectorItem,
                    isActive && styles.daySelectorItemActive,
                  ]}
                  onPress={() => {
                    console.log('ScheduleScreen (iOS): Selected day', index);
                    setSelectedDayIndex(index);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.daySelectorDayOfWeek,
                      isActive && styles.daySelectorDayOfWeekActive,
                    ]}
                  >
                    {dayOfWeekShort}
                  </Text>
                  <Text
                    style={[
                      styles.daySelectorDate,
                      isActive && styles.daySelectorDateActive,
                    ]}
                  >
                    {dayNumberOnly}
                  </Text>
                </AnimatedTouchable>
              );
            })}
          </ScrollView>
        </View>

        <Animated.View 
          style={styles.dayViewHeader}
          entering={ZoomIn.springify()}
        >
          <View style={styles.dayViewDateContainer}>
            <Text style={styles.dayViewDayOfWeek}>{fullDayName}</Text>
            <Text style={styles.dayViewDate}>{selectedDay.date}</Text>
          </View>
          
          {agentText && agentText.trim() !== '' && (
            <AnimatedLinearGradient
              colors={agentBadgeColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dayViewAgentBadge}
              entering={FadeIn.delay(200)}
            >
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.dayViewAgentText}>
                {agentText}
              </Text>
            </AnimatedLinearGradient>
          )}
        </Animated.View>

        {hasEvents ? (
          <View style={styles.eventsSection}>
            {filteredEvents.map((event, eventIndex) => (
              <AnimatedEventCard
                key={eventIndex}
                event={event}
                index={eventIndex}
                languageFilter={languageFilter}
              />
            ))}
          </View>
        ) : (
          <Animated.View 
            style={styles.noEventsContainer}
            entering={FadeInUp.delay(300).springify()}
          >
            <View style={styles.noEventsIcon}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={48}
                color={designColors.text.secondary}
              />
            </View>
            <Text style={styles.noEventsText}>
              {noEventsMessage}
            </Text>
          </Animated.View>
        )}
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
          const totalDays = daysWithEventsInCurrentMonth.length;
          const daysPerRow = totalDays % 4 === 0 ? 4 : 3;
          
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
