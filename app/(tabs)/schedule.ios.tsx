
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
  events: ScheduleEvent[];
}

interface ScheduleData {
  schedule: ScheduleDay[];
  personName?: string;
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridDayCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  dayCard: {
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  gridDayHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayOfWeek: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: designColors.text,
    textAlign: 'right',
  },
  gridDayOfWeek: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: designColors.text,
    textAlign: 'center',
  },
  dayDate: {
    fontSize: typography.sizes.sm,
    color: designColors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  gridDayDate: {
    fontSize: typography.sizes.xs,
    color: designColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  eventsList: {
    gap: spacing.sm,
  },
  gridEventsList: {
    gap: spacing.xs,
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
  gridEventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: designColors.background,
    borderRadius: radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: designColors.primary,
  },
  eventItemWithTime: {
    borderLeftColor: designColors.accent,
  },
  eventContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  gridEventContent: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  eventTime: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: designColors.accent,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  gridEventTime: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as any,
    color: designColors.accent,
    textAlign: 'right',
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: typography.sizes.md,
    color: designColors.text,
    textAlign: 'right',
  },
  gridEventDescription: {
    fontSize: typography.sizes.xs,
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
  gridNoEventsText: {
    fontSize: typography.sizes.xs,
    color: designColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
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

export default function ScheduleScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const [scheduleData, setScheduleData] = useState<ScheduleDay[]>([]);
  const [personName, setPersonName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'full'>('full');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [languageFilter, setLanguageFilter] = useState<'all' | 'hebrew' | 'english'>('all');

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
  }, [user]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const onRefresh = useCallback(async () => {
    console.log('ScheduleScreen (iOS): Refreshing schedule');
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  }, [loadSchedule]);

  // Filter events based on language selection
  const filterEventsByLanguage = useCallback((events: ScheduleEvent[]): ScheduleEvent[] => {
    if (languageFilter === 'all') {
      return events;
    }
    
    return events.filter(event => {
      const eventIsHebrew = isHebrew(event.description);
      if (languageFilter === 'hebrew') {
        return eventIsHebrew;
      } else {
        return !eventIsHebrew;
      }
    });
  }, [languageFilter]);

  const renderEvent = (event: ScheduleEvent, index: number, isGrid: boolean = false) => {
    const hasTime = Boolean(event.time);
    
    return (
      <View
        key={index}
        style={[
          isGrid ? styles.gridEventItem : styles.eventItem,
          hasTime && styles.eventItemWithTime
        ]}
      >
        <IconSymbol
          ios_icon_name={hasTime ? 'clock.fill' : 'circle.fill'}
          android_material_icon_name={hasTime ? 'access-time' : 'circle'}
          size={isGrid ? 14 : 20}
          color={hasTime ? designColors.accent : designColors.primary}
        />
        <View style={isGrid ? styles.gridEventContent : styles.eventContent}>
          {hasTime && (
            <Text style={isGrid ? styles.gridEventTime : styles.eventTime}>
              {event.time}
            </Text>
          )}
          <Text style={isGrid ? styles.gridEventDescription : styles.eventDescription}>
            {event.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderDayCard = (day: ScheduleDay, index: number) => {
    const filteredEvents = filterEventsByLanguage(day.events);
    const hasEvents = filteredEvents.length > 0;
    
    return (
      <View key={index} style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderLeft}>
            <Text style={styles.dayOfWeek}>{day.dayOfWeek}</Text>
            <Text style={styles.dayDate}>{day.date}</Text>
          </View>
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="calendar-today"
            size={24}
            color={designColors.primary}
          />
        </View>
        
        {hasEvents ? (
          <View style={styles.eventsList}>
            {filteredEvents.map((event, eventIndex) => renderEvent(event, eventIndex, false))}
          </View>
        ) : (
          <Text style={styles.noEventsText}>אין אירועים מתוכננים ליום זה</Text>
        )}
      </View>
    );
  };

  const renderGridDayCard = (day: ScheduleDay, index: number) => {
    const filteredEvents = filterEventsByLanguage(day.events);
    const hasEvents = filteredEvents.length > 0;
    
    return (
      <View key={index} style={styles.gridDayCard}>
        <View style={styles.gridDayHeader}>
          <Text style={styles.gridDayOfWeek}>{day.dayOfWeek}</Text>
          <Text style={styles.gridDayDate}>{day.date}</Text>
        </View>
        
        {hasEvents ? (
          <View style={styles.gridEventsList}>
            {filteredEvents.map((event, eventIndex) => renderEvent(event, eventIndex, true))}
          </View>
        ) : (
          <Text style={styles.gridNoEventsText}>אין אירועים</Text>
        )}
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

    return (
      <>
        {/* Language toggle for Day View */}
        <View style={styles.languageToggle}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              languageFilter === 'all' && styles.languageButtonActive,
            ]}
            onPress={() => {
              console.log('ScheduleScreen (iOS): Language filter set to all');
              setLanguageFilter('all');
            }}
          >
            <Text
              style={[
                styles.languageButtonText,
                languageFilter === 'all' && styles.languageButtonTextActive,
              ]}
            >
              הכל
            </Text>
          </TouchableOpacity>
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

        {/* Day selector */}
        <View style={styles.daySelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorScroll}
          >
            {scheduleData.map((day, index) => {
              const isActive = index === selectedDayIndex;
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
                    {day.dayOfWeek.substring(0, 3)}
                  </Text>
                  <Text
                    style={[
                      styles.daySelectorDate,
                      isActive && styles.daySelectorDateActive,
                    ]}
                  >
                    {day.date.split('.')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected day details */}
        <View style={styles.selectedDayCard}>
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayOfWeek}>{selectedDay.dayOfWeek}</Text>
            <Text style={styles.selectedDayDate}>{selectedDay.date}</Text>
          </View>

          {hasEvents ? (
            <View style={styles.eventsList}>
              {filteredEvents.map((event, eventIndex) => renderEvent(event, eventIndex, false))}
            </View>
          ) : (
            <Text style={styles.noEventsText}>
              {languageFilter === 'all' 
                ? 'אין אירועים מתוכננים ליום זה'
                : languageFilter === 'hebrew'
                ? 'אין אירועים בעברית ליום זה'
                : 'No events in English for this day'}
            </Text>
          )}
        </View>
      </>
    );
  };

  const renderFullScheduleView = () => {
    return (
      <View style={styles.gridContainer}>
        {scheduleData.map((day, index) => renderGridDayCard(day, index))}
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
