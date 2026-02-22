
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import React, { useState, useEffect, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api, type Container } from '@/utils/api';
import { designColors, typography, spacing, radius, shadows } from '@/styles/designSystem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: designColors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  subtitle: {
    ...typography.body,
    color: designColors.text.secondary,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h3,
    color: designColors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  containerCard: {
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  containerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  containerIdText: {
    ...typography.h3,
    color: designColors.text.primary,
  },
  stepsContainer: {
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  stepLabel: {
    ...typography.body,
    color: designColors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  stepStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepDate: {
    ...typography.caption,
    color: designColors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
}

interface StepInfo {
  label: string;
  date: string | null;
  completed: boolean;
}

function ContainerCard({ container }: { container: Container }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const steps: StepInfo[] = [
    {
      label: 'פריטים מוכנים',
      date: container.itemsReady,
      completed: !!container.itemsReady,
    },
    {
      label: 'פריטים שולמו',
      date: container.itemsPaid,
      completed: !!container.itemsPaid,
    },
    {
      label: 'פריטים במחסן',
      date: container.itemsInGarage,
      completed: !!container.itemsInGarage,
    },
    {
      label: 'פריטים על המכולה',
      date: container.itemsOnContainer,
      completed: !!container.itemsOnContainer,
    },
    {
      label: 'מכולה נשלחה',
      date: container.containerSent,
      completed: !!container.containerSent,
    },
    {
      label: 'מכולה הגיעה',
      date: container.containerArrive,
      completed: !!container.containerArrive,
    },
  ];

  const formattedDate = formatDate(container.itemsReady);
  const dateDisplay = formattedDate;

  return (
    <Animated.View entering={FadeInDown} style={styles.containerCard}>
      <View style={styles.containerHeader}>
        <Text style={styles.containerIdText}>
          {container.containerIdPerUser}
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const stepDateFormatted = formatDate(step.date);
          const stepDateDisplay = stepDateFormatted;
          
          return (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepStatus}>
                <Text style={styles.stepDate}>{stepDateDisplay}</Text>
                <IconSymbol
                  ios_icon_name={step.completed ? 'checkmark.circle.fill' : 'circle'}
                  android_material_icon_name={step.completed ? 'check-circle' : 'radio-button-unchecked'}
                  size={20}
                  color={step.completed ? designColors.primary : designColors.text.tertiary}
                />
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function ContainersScreen() {
  const { user } = useUser();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadContainers = useCallback(async () => {
    if (!user?.id) {
      console.log('ContainersScreen (iOS): No user ID, skipping load');
      setLoading(false);
      return;
    }

    try {
      console.log('ContainersScreen (iOS): Loading containers for user', user.id);
      const data = await api.getContainers(user.id);
      console.log('ContainersScreen (iOS): Loaded containers:', data.length);
      setContainers(data);
    } catch (error: any) {
      console.error('ContainersScreen (iOS): Failed to load containers', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  const onRefresh = useCallback(() => {
    console.log('ContainersScreen (iOS): Refreshing containers');
    setRefreshing(true);
    loadContainers();
  }, [loadContainers]);

  if (loading) {
    return (
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e'] : ['#f8f9fa', '#e9ecef']}
        style={styles.container}
      >
        <SafeAreaView style={styles.loadingContainer} edges={['top']}>
          <ActivityIndicator size="large" color={designColors.primary} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const titleText = 'מכולות';
  const subtitleText = 'מעקב אחר סטטוס המכולות שלך';
  const emptyText = 'אין מכולות עדיין';

  return (
    <LinearGradient
      colors={isDark ? ['#1a1a2e', '#16213e'] : ['#f8f9fa', '#e9ecef']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={designColors.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>
          </View>

          {containers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="shippingbox"
                android_material_icon_name="inventory"
                size={64}
                color={designColors.text.tertiary}
              />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          ) : (
            containers.map((container) => (
              <ContainerCard key={container.id} container={container} />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
