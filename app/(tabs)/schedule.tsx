
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: designColors.border,
    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3,
  },
  calendarCellToday: {
    backgroundColor: designColors.primaryLight,
    borderColor: designColors.primary,
    borderWidth: 2,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textAlign: 'center',
    overflow: 'hidden',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
  },
  dayAbbreviation: {
    fontSize: 9,
    color: designColors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'lowercase',
  },
  assignedPersonBadge: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    marginBottom: spacing.xs,
  },
  assignedPersonText: {
    fontSize: 11,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    flexWrap: 'wrap',
  },
  eventBadge: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 0,
    backgroundColor: designColors.primary,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '700' as any,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    flexWrap: 'wrap',
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

// Parse schedule data from new JSON format
const parseScheduleData = (scheduleJson: any): DaySchedule[] => {
  console.log('ScheduleScreen: Parsing schedule data', scheduleJson);
  
  if (!scheduleJson || !scheduleJson.days) {
    console.log('ScheduleScreen: No days found in schedule data');
    return [];
  }
  
  const daysArray: DaySchedule[] = [];
  
  // Convert the days object to an array
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
  daysArray.forEach(day => {
    console.log('ScheduleScreen: Day', day.date, '- events:', Object.keys(day.events).length, 'agent:', day.agent_he || day.agent_en);
  });
  
  return daysArray;
};

// Find the first month with events (chronologically)
const findFirstMonthWithEvents = (scheduleData: DaySchedule[]): Date => {
  if (scheduleData.length === 0) {
    return new Date();
  }

  // Parse all dates and find the earliest one with events
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
    // Return the first day of that month
    const firstOfMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    console.log('ScheduleScreen: First month with events:', firstOfMonth.toLocaleDateString());
    return firstOfMonth;
  }

  return new Date();
};

// Helper to get day abbreviation
const getDayAbbreviation = (dayOfWeek: number): string => {
  const abbreviations = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return abbreviations[dayOfWeek];
};

// Helper to get agent badge color based on agent name
const getAgentBadgeColor = (agentText: string | null): string => {
  if (!agentText) return '#FF9800'; // Default orange
  
  const normalizedAgent = agentText.trim().toLowerCase();
  
  // Check for אבישי or רוני - orange
  if (normalizedAgent.includes('אבישי') || normalizedAgent.includes('רוני')) {
    return '#FF9800'; // Orange
  }
  
  // Check for סוכנת - green
  if (normalizedAgent.includes('סוכנת')) {
    return '#4CAF50'; // Green
  }
  
  // Default orange for any other agent
  return '#FF9800';
};

export default function ScheduleScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const [scheduleData, setScheduleData] = useState<DaySchedule[]>([]);
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
        
        if (!hasInitializedMonth && parsedSchedule.length > 0) {
          const firstMonth = findFirstMonthWithEvents(parsedSchedule);
          setCurrentMonth(firstMonth);
          setHasInitializedMonth(true);
          console.log('ScheduleScreen: Auto-opened to first month with events');
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

  // Get all events from a day (no filtering by type - display ALL events)
  const getAllEvents = useCallback((events: { [key: string]: Event }): Event[] => {
    return Object.values(events);
  }, []);

  // Filter events by language only
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

  // Filter schedule data to only show days with events
  const daysWithEvents = useMemo(() => {
    return scheduleData.filter(day => {
      const filteredEvents = filterEventsByLanguage(day.events);
      const hasAgent = languageFilter === 'hebrew'
        ? (day.agent_he && day.agent_he.trim() !== '')
        : (day.agent_en && day.agent_en.trim() !== '');
      return filteredEvents.length > 0 || hasAgent;
    });
  }, [scheduleData, filterEventsByLanguage, languageFilter]);

  // Check if a specific month has any events with the current language filter
  const monthHasEvents = useCallback((year: number, month: number): boolean => {
    const hasEvents = scheduleData.some(day => {
      const parts = day.date.split('.');
      if (parts.length !== 3) return false;
      
      const dayNum = parseInt(parts[0], 10);
      const dayMonth = parseInt(parts[1], 10);
      const dayYear = parseInt(parts[2], 10) + 2000;
      
      if (dayYear !== year || dayMonth !== month + 1) return false;
      
      // Check if this day has agent
      const hasAgent = languageFilter === 'hebrew'
        ? (day.agent_he && day.agent_he.trim() !== '')
        : (day.agent_en && day.agent_en.trim() !== '');
      
      if (hasAgent) {
        return true;
      }
      
      // Check if this day has filtered events
      const filteredEvents = filterEventsByLanguage(day.events);
      if (filteredEvents.length > 0) {
        return true;
      }
      
      return false;
    });
    
    return hasEvents;
  }, [scheduleData, filterEventsByLanguage, languageFilter]);

  // Get only days with events for the current month
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
      
      // Only include days from the current month
      if (dayYear !== year || dayMonth !== month + 1) return;
      
      // Check if this day has content
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
    
    // Sort by day number
    daysInMonth.sort((a, b) => a.dayNumber - b.dayNumber);
    
    console.log('ScheduleScreen: Days with events in current month:', daysInMonth.length, 'for', year, month + 1);
    return daysInMonth;
  }, [currentMonth, scheduleData, filterEventsByLanguage, languageFilter]);

  // Calculate cell heights for each day
  const calculateCellHeight = useCallback((calendarDay: CalendarDay): number => {
    if (!calendarDay.scheduleDay) {
      return 50;
    }
    
    const filteredEvents = filterEventsByLanguage(calendarDay.scheduleDay.events);
    const agentText = languageFilter === 'hebrew'
      ? calendarDay.scheduleDay.agent_he
      : calendarDay.scheduleDay.agent_en;
    const hasAgent = agentText && agentText.trim() !== '';
    
    const baseHeight = 50; // Day number + abbreviation
    const agentHeight = hasAgent ? 40 : 0;
    const eventHeight = 40; // Each event badge height
    const totalEventsHeight = filteredEvents.length * eventHeight;
    
    return baseHeight + agentHeight + totalEventsHeight;
  }, [filterEventsByLanguage, languageFilter]);

  // Group days into rows of 3 and calculate max height for each row
  const daysWithRowHeights = useMemo(() => {
    const daysPerRow = 3;
    const rows: { days: CalendarDay[]; maxHeight: number }[] = [];
    
    for (let i = 0; i < daysWithEventsInCurrentMonth.length; i += daysPerRow) {
      const rowDays = daysWithEventsInCurrentMonth.slice(i, i + daysPerRow);
      const heights = rowDays.map(day => calculateCellHeight(day));
      const maxHeight = Math.max(...heights);
      
      rows.push({
        days: rowDays,
        maxHeight,
      });
    }
    
    return rows;
  }, [daysWithEventsInCurrentMonth, calculateCellHeight]);

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
    }
  }, [daysWithEvents]);

  const renderCalendarCell = (calendarDay: CalendarDay, index: number, rowMaxHeight: number) => {
    if (!calendarDay.scheduleDay) {
      return null;
    }
    
    const filteredEvents = filterEventsByLanguage(calendarDay.scheduleDay.events);
    
    const agentText = languageFilter === 'hebrew'
      ? calendarDay.scheduleDay.agent_he
      : calendarDay.scheduleDay.agent_en;
    
    const hasAgent = agentText && agentText.trim() !== '';
    const agentBadgeColor = getAgentBadgeColor(agentText);
    
    // Format date as "day/month" (e.g., "3/12" for December 3rd)
    const monthNumber = calendarDay.fullDate.getMonth() + 1;
    const dayNumberText = `${calendarDay.dayNumber}/${monthNumber}`;
    
    const dayOfWeek = calendarDay.fullDate.getDay();
    const dayAbbrev = getDayAbbreviation(dayOfWeek);
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarCell,
          calendarDay.isToday && styles.calendarCellToday,
          { height: rowMaxHeight },
        ]}
        onPress={() => handleDayPress(calendarDay)}
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
          <Text style={styles.dayAbbreviation}>
            {dayAbbrev}
          </Text>
        </View>
        
        {hasAgent && (
          <View style={[styles.assignedPersonBadge, { backgroundColor: agentBadgeColor }]}>
            <Text style={styles.assignedPersonText}>
              {agentText}
            </Text>
          </View>
        )}
        
        {filteredEvents.map((event, eventIndex) => {
          const eventDescriptionText = languageFilter === 'hebrew' ? event.description_he : event.description_en;
          
          return (
            <View
              key={eventIndex}
              style={styles.eventBadge}
            >
              <Text style={styles.eventBadgeText}>
                {eventDescriptionText}
              </Text>
            </View>
          );
        })}
      </TouchableOpacity>
    );
  };

  const renderEvent = (event: Event, index: number) => {
    const hasTime = Boolean(event.time);
    const eventTimeText = event.time || '';
    const eventDescriptionText = languageFilter === 'hebrew' ? event.description_he : event.description_en;
    
    return (
      <View
        key={index}
        style={styles.eventItem}
      >
        <IconSymbol
          ios_icon_name={hasTime ? 'clock.fill' : 'circle.fill'}
          android_material_icon_name={hasTime ? 'access-time' : 'circle'}
          size={24}
          color={designColors.primary}
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
    if (daysWithEvents.length === 0) {
      return null;
    }

    const selectedDay = daysWithEvents[selectedDayIndex];
    const filteredEvents = filterEventsByLanguage(selectedDay.events);
    const hasEvents = filteredEvents.length > 0;
    const agentText = languageFilter === 'hebrew' ? selectedDay.agent_he : selectedDay.agent_en;
    const agentBadgeColor = getAgentBadgeColor(agentText);
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
            {daysWithEvents.map((day, index) => {
              const isActive = index === selectedDayIndex;
              const dayOfWeekShort = day.day_of_week.substring(0, 3);
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

        <View style={styles.selectedDayCard}>
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayOfWeek}>{selectedDay.day_of_week}</Text>
            <Text style={styles.selectedDayDate}>{selectedDay.date}</Text>
            
            {agentText && agentText.trim() !== '' && (
              <View style={[styles.selectedDayPersonBadge, { backgroundColor: agentBadgeColor }]}>
                <Text style={styles.selectedDayPersonText}>
                  {agentText}
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
                console.log('ScheduleScreen: Previous month');
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
                console.log('ScheduleScreen: Next month');
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
        
        <View style={styles.calendarGrid}>
          {daysWithRowHeights.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.calendarRow}>
              {row.days.map((day, dayIndex) => {
                return renderCalendarCell(day, dayIndex, row.maxHeight);
              })}
            </View>
          ))}
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
