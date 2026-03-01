
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
  I18nManager,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { errorLogger } from '@/utils/errorLogger';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Schedule data interfaces
interface ScheduleEvent {
  description: string;
  time?: string;
}

interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  events: ScheduleEvent[];
  assignedPerson?: 'avishi' | 'agent' | 'roni';
}

interface ScheduleData {
  schedule: ScheduleDay[];
  personName?: string;
}

interface CalendarDay {
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  scheduleDay?: ScheduleDay;
  fullDate: Date;
}

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
    color: designColors.text,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.md,
    color: designColors.textSecondary,
    textAlign: 'right',
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: designColors.primary,
  },
  toggleButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: designColors.textSecondary,
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  languageToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  languageButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: designColors.accent,
  },
  languageButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: designColors.textSecondary,
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  calendarContainer: {
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.md,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  monthTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: designColors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekDayText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as any,
    color: designColors.textSecondary,
  },
  calendarGrid: {
    gap: 1,
    backgroundColor: designColors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  calendarRow: {
    flexDirection: 'row',
    gap: 1,
  },
  calendarCell: {
    flex: 1,
    backgroundColor: designColors.background,
    padding: spacing.xs,
  },
  calendarCellWithEvents: {
    minHeight: 120,
  },
  calendarCellWithoutEvents: {
    minHeight: 40,
  },
  calendarCellToday: {
    backgroundColor: designColors.primaryLight,
  },
  calendarCellOtherMonth: {
    opacity: 0.3,
  },
  dayNumberContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dayNumber: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: designColors.text,
  },
  dayNumberToday: {
    backgroundColor: designColors.primary,
    color: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  eventsContainer: {
    gap: 3,
  },
  eventLine: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 3,
    backgroundColor: designColors.primary,
  },
  eventLineWithTime: {
    backgroundColor: designColors.accent,
  },
  eventText: {
    fontSize: 10,
    color: '#FFFFFF',
    numberOfLines: 2,
  },
  moreEventsText: {
    fontSize: 10,
    color: designColors.primary,
    fontWeight: typography.weights.semibold as any,
    marginTop: 2,
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
    color: designColors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.sizes.md,
    color: designColors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * 1.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayViewContainer: {
    flex: 1,
  },
  selectedDayCard: {
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  selectedDayHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: designColors.primary,
  },
  selectedDayOfWeek: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: designColors.text,
    textAlign: 'center',
  },
  selectedDayDate: {
    fontSize: typography.sizes.lg,
    color: designColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  assignedPersonBadge: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignSelf: 'center',
  },
  assignedPersonBadgeAvishi: {
    backgroundColor: '#4CAF50',
  },
  assignedPersonBadgeAgent: {
    backgroundColor: '#FF9800',
  },
  assignedPersonBadgeRoni: {
    backgroundColor: '#2196F3',
  },
  assignedPersonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  daySelector: {
    marginBottom: spacing.lg,
  },
  daySelectorScroll: {
    paddingHorizontal: spacing.sm,
  },
  daySelectorItem: {
    width: 70,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginHorizontal: spacing.xs,
    backgroundColor: designColors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: designColors.border,
  },
  daySelectorItemActive: {
    backgroundColor: designColors.primary,
    borderColor: designColors.primary,
  },
  daySelectorDayOfWeek: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as any,
    color: designColors.textSecondary,
    marginBottom: spacing.xs,
  },
  daySelectorDayOfWeekActive: {
    color: '#FFFFFF',
  },
  daySelectorDate: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: designColors.text,
  },
  daySelectorDateActive: {
    color: '#FFFFFF',
  },
  eventsList: {
    gap: spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: designColors.background,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: designColors.primary,
  },
  eventItemWithTime: {
    borderLeftColor: designColors.accent,
  },
  eventContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  eventTime: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: designColors.accent,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  eventDescription: {
    fontSize: typography.sizes.md,
    color: designColors.text,
    textAlign: 'right',
  },
  noEventsText: {
    fontSize: typography.sizes.md,
    color: designColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  swipeHintText: {
    fontSize: typography.sizes.xs,
    color: designColors.textSecondary,
    fontStyle: 'italic',
  },
});

// Helper function to detect if text is Hebrew
const isHebrew = (text: string): boolean => {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
};

// Parse schedule data from database
const parseScheduleData = (scheduleJson: any): ScheduleDay[] => {
  if (!scheduleJson || !Array.isArray(scheduleJson.schedule)) {
    return [];
  }
  
  return scheduleJson.schedule.map((day: any) => ({
    date: day.date,
    dayOfWeek: day.day_of_week,
    assignedPerson: day.assigned_person,
    events: day.events
      .map((event: any) => ({
        description: event.description,
        time: event.time,
      }))
      .sort((a: ScheduleEvent, b: ScheduleEvent) => {
        // Events with time appear before events without time
        if (a.time && !b.time) return -1;
        if (!a.time && b.time) return 1;
        // If both have time, sort by time
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      }),
  }));
};

// Find the month with the most events
const findMonthWithMostEvents = (scheduleData: ScheduleDay[]): Date => {
  if (scheduleData.length === 0) {
    return new Date();
  }

  const eventCountByMonth: { [key: string]: number } = {};

  scheduleData.forEach(day => {
    // Parse date format: "7.1.25" -> day.month.year
    const parts = day.date.split('.');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10) + 2000; // Convert 25 to 2025
      const monthKey = `${year}-${month}`;
      
      eventCountByMonth[monthKey] = (eventCountByMonth[monthKey] || 0) + day.events.length;
    }
  });

  let maxCount = 0;
  let bestMonthKey = '';

  for (const monthKey in eventCountByMonth) {
    if (eventCountByMonth[monthKey] > maxCount) {
      maxCount = eventCountByMonth[monthKey];
      bestMonthKey = monthKey;
    }
  }

  if (bestMonthKey) {
    const [year, month] = bestMonthKey.split('-').map(Number);
    console.log('ScheduleScreen: Month with most events:', bestMonthKey, 'with', maxCount, 'events');
    return new Date(year, month - 1, 1);
  }

  return new Date();
};

// Get person display name
const getPersonDisplayName = (person?: 'avishi' | 'agent' | 'roni'): string => {
  switch (person) {
    case 'avishi':
      return 'אבישי';
    case 'agent':
      return 'סוכנת';
    case 'roni':
      return 'רוני';
    default:
      return '';
  }
};

export default function ScheduleScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const [scheduleData, setScheduleData] = useState<ScheduleDay[]>([]);
  const [personName, setPersonName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'full'>('full');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [languageFilter, setLanguageFilter] = useState<'hebrew' | 'english'>('hebrew');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hasInitializedMonth, setHasInitializedMonth] = useState(false);

  // Gesture handling for swipe
  const translateX = useSharedValue(0);

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
        console.log('ScheduleScreen: Schedule data retrieved', data.schedule);
        const parsedSchedule = parseScheduleData(data.schedule);
        setScheduleData(parsedSchedule);
        setPersonName(data.schedule.person_name || user.fullName || '');
        console.log('ScheduleScreen: Parsed schedule days:', parsedSchedule.length);
        
        // Auto-open to month with most events (only once on initial load)
        if (!hasInitializedMonth && parsedSchedule.length > 0) {
          const bestMonth = findMonthWithMostEvents(parsedSchedule);
          setCurrentMonth(bestMonth);
          setHasInitializedMonth(true);
          console.log('ScheduleScreen: Auto-opened to month with most events');
        }
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
  }, [user, hasInitializedMonth]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const onRefresh = useCallback(async () => {
    console.log('ScheduleScreen: Refreshing schedule');
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  }, [loadSchedule]);

  // Filter events based on language selection
  const filterEventsByLanguage = useCallback((events: ScheduleEvent[]): ScheduleEvent[] => {
    return events.filter(event => {
      const eventIsHebrew = isHebrew(event.description);
      if (languageFilter === 'hebrew') {
        return eventIsHebrew;
      } else {
        return !eventIsHebrew;
      }
    });
  }, [languageFilter]);

  // Check if a week has any events
  const weekHasEvents = useCallback((week: CalendarDay[]): boolean => {
    return week.some(day => {
      if (!day.scheduleDay) return false;
      const filteredEvents = filterEventsByLanguage(day.scheduleDay.events);
      return filteredEvents.length > 0;
    });
  }, [filterEventsByLanguage]);

  // Generate calendar grid for the current month
  const calendarGrid = useMemo((): CalendarDay[][] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();
    
    // Today
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Create a map of schedule data by date string
    const scheduleMap = new Map<string, ScheduleDay>();
    scheduleData.forEach(day => {
      scheduleMap.set(day.date, day);
    });
    
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    
    // Fill in days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNumber = prevMonthLastDay - i;
      const fullDate = new Date(year, month - 1, dayNumber);
      currentWeek.push({
        dayNumber,
        isCurrentMonth: false,
        isToday: false,
        fullDate,
      });
    }
    
    // Fill in days of current month
    for (let day = 1; day <= lastDate; day++) {
      const fullDate = new Date(year, month, day);
      const dateString = `${day}.${month + 1}.${String(year).slice(-2)}`;
      const scheduleDay = scheduleMap.get(dateString);
      
      currentWeek.push({
        dayNumber: day,
        isCurrentMonth: true,
        isToday: day === todayDate && month === todayMonth && year === todayYear,
        scheduleDay,
        fullDate,
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill in days from next month
    if (currentWeek.length > 0) {
      const remainingDays = 7 - currentWeek.length;
      for (let day = 1; day <= remainingDays; day++) {
        const fullDate = new Date(year, month + 1, day);
        currentWeek.push({
          dayNumber: day,
          isCurrentMonth: false,
          isToday: false,
          fullDate,
        });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [currentMonth, scheduleData]);

  const handleDayPress = useCallback((calendarDay: CalendarDay) => {
    if (!calendarDay.scheduleDay) {
      console.log('ScheduleScreen: No events for this day');
      return;
    }
    
    // Find the index of this day in scheduleData
    const dayIndex = scheduleData.findIndex(d => d.date === calendarDay.scheduleDay?.date);
    if (dayIndex !== -1) {
      console.log('ScheduleScreen: Navigating to day view for', calendarDay.scheduleDay.date);
      setSelectedDayIndex(dayIndex);
      setViewMode('day');
    }
  }, [scheduleData]);

  // Handle swipe to change days
  const handleSwipeToNextDay = useCallback(() => {
    if (selectedDayIndex < scheduleData.length - 1) {
      console.log('ScheduleScreen: Swiped to next day');
      setSelectedDayIndex(prev => prev + 1);
    }
  }, [selectedDayIndex, scheduleData.length]);

  const handleSwipeToPrevDay = useCallback(() => {
    if (selectedDayIndex > 0) {
      console.log('ScheduleScreen: Swiped to previous day');
      setSelectedDayIndex(prev => prev - 1);
    }
  }, [selectedDayIndex]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = width * 0.3;
      
      if (event.translationX > threshold) {
        // Swipe right - go to previous day
        runOnJS(handleSwipeToPrevDay)();
      } else if (event.translationX < -threshold) {
        // Swipe left - go to next day
        runOnJS(handleSwipeToNextDay)();
      }
      
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderCalendarCell = (calendarDay: CalendarDay, index: number, hasEventsInRow: boolean) => {
    const filteredEvents = calendarDay.scheduleDay 
      ? filterEventsByLanguage(calendarDay.scheduleDay.events)
      : [];
    
    const maxVisibleEvents = 4;
    const visibleEvents = filteredEvents.slice(0, maxVisibleEvents);
    const remainingCount = filteredEvents.length - maxVisibleEvents;
    
    const dayNumberText = String(calendarDay.dayNumber);
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarCell,
          hasEventsInRow ? styles.calendarCellWithEvents : styles.calendarCellWithoutEvents,
          calendarDay.isToday && styles.calendarCellToday,
          !calendarDay.isCurrentMonth && styles.calendarCellOtherMonth,
        ]}
        onPress={() => handleDayPress(calendarDay)}
        disabled={!calendarDay.scheduleDay}
      >
        <View style={styles.dayNumberContainer}>
          <Text
            style={[
              styles.dayNumber,
              calendarDay.isToday && styles.dayNumberToday,
            ]}
          >
            {dayNumberText}
          </Text>
        </View>
        
        {visibleEvents.length > 0 && (
          <View style={styles.eventsContainer}>
            {visibleEvents.map((event, eventIndex) => {
              const hasTime = Boolean(event.time);
              const eventText = event.time 
                ? `${event.time} ${event.description}`
                : event.description;
              
              return (
                <View
                  key={eventIndex}
                  style={[
                    styles.eventLine,
                    hasTime && styles.eventLineWithTime,
                  ]}
                >
                  <Text style={styles.eventText} numberOfLines={2}>
                    {eventText}
                  </Text>
                </View>
              );
            })}
            
            {remainingCount > 0 && (
              <Text style={styles.moreEventsText}>
                +{remainingCount} more
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEvent = (event: ScheduleEvent, index: number) => {
    const hasTime = Boolean(event.time);
    
    return (
      <View
        key={index}
        style={[
          styles.eventItem,
          hasTime && styles.eventItemWithTime
        ]}
      >
        <IconSymbol
          ios_icon_name={hasTime ? 'clock.fill' : 'circle.fill'}
          android_material_icon_name={hasTime ? 'access-time' : 'circle'}
          size={20}
          color={hasTime ? designColors.accent : designColors.primary}
        />
        <View style={styles.eventContent}>
          {hasTime && (
            <Text style={styles.eventTime}>
              {event.time}
            </Text>
          )}
          <Text style={styles.eventDescription}>
            {event.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderDayView = () => {
    if (scheduleData.length === 0) {
      return null;
    }

    const selectedDay = scheduleData[selectedDayIndex];
    const filteredEvents = filterEventsByLanguage(selectedDay.events);
    const hasEvents = filteredEvents.length > 0;
    const personDisplayName = getPersonDisplayName(selectedDay.assignedPerson);

    return (
      <GestureHandlerRootView style={styles.dayViewContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={animatedStyle}>
            {/* Day selector */}
            <View style={styles.daySelector}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daySelectorScroll}
              >
                {scheduleData.map((day, index) => {
                  const isActive = index === selectedDayIndex;
                  const dayOfWeekShort = day.dayOfWeek.substring(0, 3);
                  const dayNumberOnly = day.date.split('.')[0];
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.daySelectorItem,
                        isActive && styles.daySelectorItemActive,
                      ]}
                      onPress={() => {
                        console.log('ScheduleScreen: Selected day', index);
                        setSelectedDayIndex(index);
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
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Swipe hint */}
            <View style={styles.swipeHint}>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={16}
                color={designColors.textSecondary}
              />
              <Text style={styles.swipeHintText}>החלק לצדדים כדי לעבור בין ימים</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={16}
                color={designColors.textSecondary}
              />
            </View>

            {/* Selected day details */}
            <View style={styles.selectedDayCard}>
              <View style={styles.selectedDayHeader}>
                <Text style={styles.selectedDayOfWeek}>{selectedDay.dayOfWeek}</Text>
                <Text style={styles.selectedDayDate}>{selectedDay.date}</Text>
                
                {personDisplayName && (
                  <View
                    style={[
                      styles.assignedPersonBadge,
                      selectedDay.assignedPerson === 'avishi' && styles.assignedPersonBadgeAvishi,
                      selectedDay.assignedPerson === 'agent' && styles.assignedPersonBadgeAgent,
                      selectedDay.assignedPerson === 'roni' && styles.assignedPersonBadgeRoni,
                    ]}
                  >
                    <Text style={styles.assignedPersonText}>{personDisplayName}</Text>
                  </View>
                )}
              </View>

              {hasEvents ? (
                <View style={styles.eventsList}>
                  {filteredEvents.map((event, eventIndex) => renderEvent(event, eventIndex))}
                </View>
              ) : (
                <Text style={styles.noEventsText}>
                  {languageFilter === 'hebrew'
                    ? 'אין אירועים בעברית ליום זה'
                    : 'No events in English for this day'}
                </Text>
              )}
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    );
  };

  const renderFullScheduleView = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const monthTitle = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    
    return (
      <View style={styles.calendarContainer}>
        {/* Month header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(currentMonth);
              newMonth.setMonth(newMonth.getMonth() - 1);
              setCurrentMonth(newMonth);
              console.log('ScheduleScreen: Previous month');
            }}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={designColors.primary}
            />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(currentMonth);
              newMonth.setMonth(newMonth.getMonth() + 1);
              setCurrentMonth(newMonth);
              console.log('ScheduleScreen: Next month');
            }}
          >
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={24}
              color={designColors.primary}
            />
          </TouchableOpacity>
        </View>
        
        {/* Week days header */}
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayHeader}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarGrid.map((week, weekIndex) => {
            const hasEvents = weekHasEvents(week);
            
            return (
              <View key={weekIndex} style={styles.calendarRow}>
                {week.map((day, dayIndex) => renderCalendarCell(day, dayIndex, hasEvents))}
              </View>
            );
          })}
        </View>
      </View>
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>לוח זמנים</Text>
        {hasSchedule && <Text style={styles.headerSubtitle}>{greetingText}</Text>}
      </View>

      {hasSchedule ? (
        <>
          {/* View toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'full' && styles.toggleButtonActive,
              ]}
              onPress={() => {
                console.log('ScheduleScreen: Switched to full view');
                setViewMode('full');
              }}
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
              style={[
                styles.toggleButton,
                viewMode === 'day' && styles.toggleButtonActive,
              ]}
              onPress={() => {
                console.log('ScheduleScreen: Switched to day view');
                setViewMode('day');
              }}
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
          </View>

          {/* Language toggle - shown in BOTH views */}
          <View style={styles.languageToggle}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                languageFilter === 'hebrew' && styles.languageButtonActive,
              ]}
              onPress={() => {
                console.log('ScheduleScreen: Language filter set to Hebrew');
                setLanguageFilter('hebrew');
              }}
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
              style={[
                styles.languageButton,
                languageFilter === 'english' && styles.languageButtonActive,
              ]}
              onPress={() => {
                console.log('ScheduleScreen: Language filter set to English');
                setLanguageFilter('english');
              }}
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
          </View>

          {/* Schedule content */}
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
        </>
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
          <View style={styles.emptyStateIcon}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={80}
              color={designColors.textSecondary}
            />
          </View>
          <Text style={styles.emptyStateTitle}>אין לוח זמנים זמין</Text>
          <Text style={styles.emptyStateText}>
            לוח הזמנים שלך יופיע כאן לאחר שהמנהל יגדיר אותו עבורך.{'\n'}
            משוך למטה כדי לרענן.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
