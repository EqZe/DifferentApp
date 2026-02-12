
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

const { width } = Dimensions.get('window');

// Schedule data interfaces
interface ScheduleEvent {
  description: string;
  time?: string;
}

interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  assignedPerson?: 'avishi' | 'agent' | 'roni';
  events: ScheduleEvent[];
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
    paddingBottom: spacing.xxl * 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  monthTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: designColors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  weekDayText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as any,
    color: designColors.textSecondary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    gap: 0,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  calendarCell: {
    flex: 1,
    backgroundColor: designColors.surface,
    padding: spacing.sm,
    minHeight: 70,
    borderWidth: 0.5,
    borderColor: designColors.border,
  },
  calendarCellWithEvents: {
    minHeight: 180,
    padding: spacing.md,
  },
  calendarCellToday: {
    backgroundColor: designColors.primaryLight,
    borderColor: designColors.primary,
    borderWidth: 2,
  },
  calendarCellOtherMonth: {
    opacity: 0.3,
  },
  calendarCellHidden: {
    opacity: 0,
    minHeight: 0,
    padding: 0,
    borderWidth: 0,
  },
  dayNumberContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayNumber: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: designColors.text,
  },
  dayNumberToday: {
    backgroundColor: designColors.primary,
    color: '#FFFFFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    overflow: 'hidden',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
  },
  assignedPersonBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 50,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 0,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  assignedPersonText: {
    fontSize: 11,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  eventsContainer: {
    gap: 6,
    marginTop: 42,
  },
  eventBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 0,
    backgroundColor: designColors.primary,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventBadgeWithTime: {
    backgroundColor: designColors.accent,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  moreEventsText: {
    fontSize: 10,
    color: designColors.primary,
    fontWeight: typography.weights.bold as any,
    marginTop: 4,
    textAlign: 'center',
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
  selectedDayCard: {
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
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
  selectedDayPersonBadge: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    alignSelf: 'center',
  },
  selectedDayPersonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: '#FFFFFF',
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
    gap: spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: designColors.background,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: designColors.primary,
    ...shadows.sm,
  },
  eventItemWithTime: {
    borderLeftColor: designColors.accent,
  },
  eventContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  eventTime: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: designColors.accent,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  eventDescription: {
    fontSize: typography.sizes.md,
    color: designColors.text,
    textAlign: 'right',
    lineHeight: typography.sizes.md * 1.5,
  },
  noEventsText: {
    fontSize: typography.sizes.md,
    color: designColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },
  monthNavButtonHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  monthNavButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: designColors.background,
  },
});

// Helper function to detect if text is Hebrew
const isHebrew = (text: string): boolean => {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
};

// Helper to get display name for assigned person
const getPersonDisplayName = (person: 'avishi' | 'agent' | 'roni'): string => {
  const names = {
    avishi: 'אבישי',
    agent: 'סוכנת',
    roni: 'רוני',
  };
  return names[person];
};

// Helper to get color for assigned person
const getPersonColor = (person: 'avishi' | 'agent' | 'roni'): string => {
  const colors = {
    avishi: '#4CAF50',
    agent: '#FF9800',
    roni: '#2196F3',
  };
  return colors[person];
};

// Helper to detect if an event description is an assigned person
const detectAssignedPerson = (description: string): 'avishi' | 'agent' | 'roni' | null => {
  const normalized = description.toLowerCase().trim();
  
  // Check for exact matches (Hebrew and English)
  if (normalized === 'אבישי' || normalized === 'avishi') {
    return 'avishi';
  }
  if (normalized === 'סוכנת' || normalized === 'agent') {
    return 'agent';
  }
  if (normalized === 'רוני' || normalized === 'roni') {
    return 'roni';
  }
  
  return null;
};

// Parse schedule data from database
const parseScheduleData = (scheduleJson: any): ScheduleDay[] => {
  if (!scheduleJson || !Array.isArray(scheduleJson.schedule)) {
    return [];
  }
  
  return scheduleJson.schedule.map((day: any) => {
    let assignedPerson: 'avishi' | 'agent' | 'roni' | undefined = undefined;
    const regularEvents: ScheduleEvent[] = [];
    
    // Separate assigned person from regular events
    if (day.events && Array.isArray(day.events)) {
      day.events.forEach((event: any) => {
        const detectedPerson = detectAssignedPerson(event.description);
        
        if (detectedPerson) {
          // This event is actually an assigned person
          assignedPerson = detectedPerson;
          console.log('ScheduleScreen (iOS): Detected assigned person:', detectedPerson, 'for date:', day.date);
        } else {
          // This is a regular event
          regularEvents.push({
            description: event.description,
            time: event.time,
          });
        }
      });
    }
    
    // Sort events: timed events first
    regularEvents.sort((a: ScheduleEvent, b: ScheduleEvent) => {
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });
    
    return {
      date: day.date,
      dayOfWeek: day.day_of_week,
      assignedPerson,
      events: regularEvents,
    };
  });
};

// Find the month with the most events
const findMonthWithMostEvents = (scheduleData: ScheduleDay[]): Date => {
  if (scheduleData.length === 0) {
    return new Date();
  }

  const eventCountByMonth: { [key: string]: number } = {};

  scheduleData.forEach(day => {
    const parts = day.date.split('.');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10) + 2000;
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
    console.log('ScheduleScreen (iOS): Month with most events:', bestMonthKey, 'with', maxCount, 'events');
    return new Date(year, month - 1, 1);
  }

  return new Date();
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
        console.log('ScheduleScreen (iOS): Schedule data retrieved', data.schedule);
        const parsedSchedule = parseScheduleData(data.schedule);
        setScheduleData(parsedSchedule);
        setPersonName(data.schedule.person_name || user.fullName || '');
        console.log('ScheduleScreen (iOS): Parsed schedule days:', parsedSchedule.length);
        
        if (!hasInitializedMonth && parsedSchedule.length > 0) {
          const bestMonth = findMonthWithMostEvents(parsedSchedule);
          setCurrentMonth(bestMonth);
          setHasInitializedMonth(true);
          console.log('ScheduleScreen (iOS): Auto-opened to month with most events');
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

  const dayHasContent = useCallback((day: CalendarDay): boolean => {
    if (!day.scheduleDay) return false;
    const filteredEvents = filterEventsByLanguage(day.scheduleDay.events);
    return filteredEvents.length > 0 || Boolean(day.scheduleDay.assignedPerson);
  }, [filterEventsByLanguage]);

  const weekHasEvents = useCallback((week: CalendarDay[]): boolean => {
    return week.some(day => dayHasContent(day));
  }, [dayHasContent]);

  // Check if a specific month has any events with the current language filter
  const monthHasEvents = useCallback((year: number, month: number): boolean => {
    console.log('ScheduleScreen (iOS): Checking if month has events:', year, month);
    
    const hasEvents = scheduleData.some(day => {
      const parts = day.date.split('.');
      if (parts.length !== 3) return false;
      
      const dayMonth = parseInt(parts[1], 10);
      const dayYear = parseInt(parts[2], 10) + 2000;
      
      if (dayYear !== year || dayMonth !== month + 1) return false;
      
      // Check if this day has assigned person
      if (day.assignedPerson) {
        console.log('ScheduleScreen (iOS): Month has assigned person on', day.date);
        return true;
      }
      
      // Check if this day has filtered events
      const filteredEvents = filterEventsByLanguage(day.events);
      if (filteredEvents.length > 0) {
        console.log('ScheduleScreen (iOS): Month has filtered events on', day.date);
        return true;
      }
      
      return false;
    });
    
    console.log('ScheduleScreen (iOS): Month', year, month, 'has events:', hasEvents);
    return hasEvents;
  }, [scheduleData, filterEventsByLanguage]);

  const calendarGrid = useMemo((): CalendarDay[][] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();
    
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    const scheduleMap = new Map<string, ScheduleDay>();
    scheduleData.forEach(day => {
      scheduleMap.set(day.date, day);
    });
    
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    
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
      console.log('ScheduleScreen (iOS): No events for this day');
      return;
    }
    
    const dayIndex = scheduleData.findIndex(d => d.date === calendarDay.scheduleDay?.date);
    if (dayIndex !== -1) {
      console.log('ScheduleScreen (iOS): Navigating to day view for', calendarDay.scheduleDay.date);
      setSelectedDayIndex(dayIndex);
      setViewMode('day');
    }
  }, [scheduleData]);

  const renderCalendarCell = (calendarDay: CalendarDay, index: number, hasEventsInRow: boolean, shouldHide: boolean) => {
    const filteredEvents = calendarDay.scheduleDay 
      ? filterEventsByLanguage(calendarDay.scheduleDay.events)
      : [];
    
    const assignedPerson = calendarDay.scheduleDay?.assignedPerson;
    
    const maxVisibleEvents = 3;
    const visibleEvents = filteredEvents.slice(0, maxVisibleEvents);
    const remainingCount = filteredEvents.length - maxVisibleEvents;
    
    const dayNumberText = String(calendarDay.dayNumber);
    const personDisplayName = assignedPerson ? getPersonDisplayName(assignedPerson) : '';
    const personColor = assignedPerson ? getPersonColor(assignedPerson) : '';
    
    const hasContent = assignedPerson || filteredEvents.length > 0;
    
    if (shouldHide) {
      return (
        <View key={index} style={styles.calendarCellHidden} />
      );
    }
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarCell,
          hasContent && styles.calendarCellWithEvents,
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
        
        {assignedPerson && (
          <View style={[styles.assignedPersonBadge, { backgroundColor: personColor }]}>
            <Text style={styles.assignedPersonText} numberOfLines={1}>
              {personDisplayName}
            </Text>
          </View>
        )}
        
        {visibleEvents.length > 0 && (
          <View style={styles.eventsContainer}>
            {visibleEvents.map((event, eventIndex) => {
              const hasTime = Boolean(event.time);
              const eventDescriptionText = event.description;
              const topPosition = 90 + (eventIndex * 38);
              
              return (
                <View
                  key={eventIndex}
                  style={[
                    styles.eventBadge,
                    hasTime && styles.eventBadgeWithTime,
                    { top: topPosition },
                  ]}
                >
                  <Text style={styles.eventBadgeText} numberOfLines={1}>
                    {eventDescriptionText}
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
    const eventTimeText = event.time || '';
    const eventDescriptionText = event.description;
    
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
          size={24}
          color={hasTime ? designColors.accent : designColors.primary}
        />
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
    );
  };

  const renderDayView = () => {
    if (scheduleData.length === 0) {
      return null;
    }

    const selectedDay = scheduleData[selectedDayIndex];
    const filteredEvents = filterEventsByLanguage(selectedDay.events);
    const hasEvents = filteredEvents.length > 0;
    const assignedPerson = selectedDay.assignedPerson;
    const personDisplayName = assignedPerson ? getPersonDisplayName(assignedPerson) : '';
    const personColor = assignedPerson ? getPersonColor(assignedPerson) : '';
    const noEventsMessage = languageFilter === 'hebrew'
      ? 'אין אירועים בעברית ליום זה'
      : 'No events in English for this day';

    return (
      <React.Fragment>
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
                    console.log('ScheduleScreen (iOS): Selected day', index);
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

        <View style={styles.selectedDayCard}>
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayOfWeek}>{selectedDay.dayOfWeek}</Text>
            <Text style={styles.selectedDayDate}>{selectedDay.date}</Text>
            
            {assignedPerson && (
              <View style={[styles.selectedDayPersonBadge, { backgroundColor: personColor }]}>
                <Text style={styles.selectedDayPersonText}>
                  {personDisplayName}
                </Text>
              </View>
            )}
          </View>

          {hasEvents ? (
            <View style={styles.eventsList}>
              {filteredEvents.map((event, eventIndex) => renderEvent(event, eventIndex))}
            </View>
          ) : (
            <Text style={styles.noEventsText}>
              {noEventsMessage}
            </Text>
          )}
        </View>
      </React.Fragment>
    );
  };

  const renderFullScheduleView = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const currentMonthName = monthNames[currentMonth.getMonth()];
    const currentYear = currentMonth.getFullYear();
    const monthTitle = `${currentMonthName} ${currentYear}`;
    
    // Calculate previous and next month
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthYear = prevMonth.getFullYear();
    const prevMonthIndex = prevMonth.getMonth();
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthYear = nextMonth.getFullYear();
    const nextMonthIndex = nextMonth.getMonth();
    
    // Check if previous and next months have events
    const hasPrevMonthEvents = monthHasEvents(prevMonthYear, prevMonthIndex);
    const hasNextMonthEvents = monthHasEvents(nextMonthYear, nextMonthIndex);
    
    return (
      <React.Fragment>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => {
              if (hasPrevMonthEvents) {
                setCurrentMonth(prevMonth);
                console.log('ScheduleScreen (iOS): Previous month');
              }
            }}
            style={[
              styles.monthNavButton,
              !hasPrevMonthEvents && styles.monthNavButtonHidden
            ]}
            disabled={!hasPrevMonthEvents}
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
              if (hasNextMonthEvents) {
                setCurrentMonth(nextMonth);
                console.log('ScheduleScreen (iOS): Next month');
              }
            }}
            style={[
              styles.monthNavButton,
              !hasNextMonthEvents && styles.monthNavButtonHidden
            ]}
            disabled={!hasNextMonthEvents}
          >
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="arrow-forward"
              size={24}
              color={designColors.primary}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayHeader}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {calendarGrid.map((week, weekIndex) => {
            const hasEvents = weekHasEvents(week);
            
            if (!hasEvents) {
              return null;
            }
            
            // Find first and last day with content in this week
            let firstContentIndex = -1;
            let lastContentIndex = -1;
            
            for (let i = 0; i < week.length; i++) {
              if (dayHasContent(week[i])) {
                if (firstContentIndex === -1) {
                  firstContentIndex = i;
                }
                lastContentIndex = i;
              }
            }
            
            return (
              <View key={weekIndex} style={styles.calendarRow}>
                {week.map((day, dayIndex) => {
                  // Hide days before first content or after last content
                  const shouldHide = dayIndex < firstContentIndex || dayIndex > lastContentIndex;
                  return renderCalendarCell(day, dayIndex, hasEvents, shouldHide);
                })}
              </View>
            );
          })}
        </View>
      </React.Fragment>
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>לוח זמנים</Text>
        {hasSchedule && <Text style={styles.headerSubtitle}>{greetingText}</Text>}
      </View>

      {hasSchedule ? (
        <React.Fragment>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'full' && styles.toggleButtonActive,
              ]}
              onPress={() => {
                console.log('ScheduleScreen (iOS): Switched to full view');
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
                console.log('ScheduleScreen (iOS): Switched to day view');
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

          <View style={styles.languageToggle}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                languageFilter === 'hebrew' && styles.languageButtonActive,
              ]}
              onPress={() => {
                console.log('ScheduleScreen (iOS): Language filter set to Hebrew');
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
                console.log('ScheduleScreen (iOS): Language filter set to English');
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
