
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  I18nManager,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { api, type Task } from '@/utils/api';
import ConfettiCannon from 'react-native-confetti-cannon';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'right',
    opacity: 0.9,
    fontWeight: '400',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  filterLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  taskCardCompleted: {
    backgroundColor: '#F0F1F3',
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
    lineHeight: 26,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  statusIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconYet: {
    backgroundColor: '#F3F4F6',
  },
  statusIconPending: {
    backgroundColor: '#FEF3E2',
  },
  statusIconDone: {
    backgroundColor: '#E8F5E9',
  },
  taskDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'right',
    fontWeight: '400',
  },
  taskDescriptionCompleted: {
    color: '#9CA3AF',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskDate: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#2784F5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  actionButtonPending: {
    backgroundColor: '#F5AD27',
  },
  actionButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedBadgeText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FEF3E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingBadgeText: {
    color: '#F5AD27',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.85,
    marginTop: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
});

function formatDate(dateString: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('he-IL', { month: 'short' });
  const dayText = String(day);
  return `${dayText} ${month}`;
}

// Task Card Component
function TaskCard({ 
  task, 
  onComplete, 
}: { 
  task: Task; 
  onComplete: (taskId: string, requiresPending: boolean, currentStatus: string) => void;
}) {
  const isDone = task.status === 'DONE';
  const isPending = task.status === 'PENDING';
  const isYet = task.status === 'YET';
  const dueDateText = formatDate(task.dueDate);
  
  // Determine if button should be disabled (pending tasks cannot be completed)
  const isDisabled = isPending;
  
  // Determine button text based on status and requirements
  let buttonText = 'התחל';
  if (task.requiresPending) {
    if (task.status === 'YET') {
      buttonText = 'התחל';
    } else if (task.status === 'PENDING') {
      buttonText = 'בתהליך';
    }
  } else {
    buttonText = 'סיימתי';
  }
  
  // Icon names
  let iosIconName = 'circle';
  let androidIconName = 'radio-button-unchecked';
  let iconColor = '#9CA3AF';
  
  if (isDone) {
    iosIconName = 'checkmark.circle.fill';
    androidIconName = 'check-circle';
    iconColor = '#4CAF50';
  } else if (isPending) {
    iosIconName = 'clock.fill';
    androidIconName = 'schedule';
    iconColor = '#F5AD27';
  }

  return (
    <View
      style={[
        styles.taskCard,
        isDone && styles.taskCardCompleted,
      ]}
    >
      <View style={styles.taskHeader}>
        <View
          style={[
            styles.statusIconContainer,
            isYet && styles.statusIconYet,
            isPending && styles.statusIconPending,
            isDone && styles.statusIconDone,
          ]}
        >
          <IconSymbol
            ios_icon_name={iosIconName}
            android_material_icon_name={androidIconName}
            size={20}
            color={iconColor}
          />
        </View>
        
        <View style={styles.taskTitleContainer}>
          <Text
            style={[
              styles.taskTitle,
              isDone && styles.taskTitleCompleted,
            ]}
          >
            {task.title}
          </Text>
        </View>
      </View>

      {task.description && (
        <Text style={[
          styles.taskDescription,
          isDone && styles.taskDescriptionCompleted,
        ]}>
          {task.description}
        </Text>
      )}

      <View style={styles.taskFooter}>
        {dueDateText && (
          <View style={styles.dateContainer}>
            <Text style={styles.taskDate}>{dueDateText}</Text>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={16}
              color="#9CA3AF"
            />
          </View>
        )}
        
        {isDone ? (
          <View style={styles.completedBadge}>
            <IconSymbol
              ios_icon_name="checkmark"
              android_material_icon_name="check"
              size={16}
              color="#2E7D32"
            />
            <Text style={styles.completedBadgeText}>הושלם</Text>
          </View>
        ) : isPending ? (
          <View style={styles.pendingBadge}>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="schedule"
              size={16}
              color="#F5AD27"
            />
            <Text style={styles.pendingBadgeText}>בתהליך</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isDisabled && styles.actionButtonDisabled,
            ]}
            onPress={() => {
              if (!isDisabled) {
                onComplete(task.id, task.requiresPending, task.status);
              }
            }}
            disabled={isDisabled}
          >
            <Text style={styles.actionButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TasksScreen() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const { colors } = useTheme();
  const confettiRef = useRef<any>(null);

  const loadTasks = useCallback(async () => {
    if (!user) return;

    try {
      console.log('TasksScreen (iOS): Loading tasks for user', user.id);
      const fetchedTasks = await api.getTasks(user.id);
      console.log('TasksScreen (iOS): Tasks loaded', fetchedTasks.length);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('TasksScreen (iOS): Failed to load tasks', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, loadTasks]);

  const onRefresh = () => {
    console.log('TasksScreen (iOS): Refreshing tasks');
    setRefreshing(true);
    loadTasks();
  };

  const handleCompleteTask = useCallback((taskId: string, requiresPending: boolean, currentStatus: string) => {
    console.log('🎯 INSTANT CLICK (iOS) - Task button pressed', taskId);
    
    // Prevent completing pending tasks
    if (currentStatus === 'PENDING') {
      console.log('⚠️ Cannot complete pending task (iOS)', taskId);
      return;
    }
    
    // Calculate new status ONCE upfront
    const newStatus: 'YET' | 'PENDING' | 'DONE' = 
      requiresPending 
        ? (currentStatus === 'YET' ? 'PENDING' : 'DONE')
        : 'DONE';
    
    // 🎉 INSTANT CONFETTI - Fire IMMEDIATELY if completing to DONE
    if (newStatus === 'DONE' && confettiRef.current) {
      confettiRef.current.start();
      console.log('🎉 CONFETTI FIRED INSTANTLY (iOS)');
    }
    
    // 🚀 INSTANT UI UPDATE - Optimistic update happens NOW
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    console.log('🚀 UI UPDATED INSTANTLY (iOS) to status:', newStatus);
    
    // 📡 BACKGROUND API CALL - Fire and forget (non-blocking)
    api.completeTask(taskId, requiresPending)
      .then(updatedTask => {
        console.log('✅ Backend confirmed (iOS):', updatedTask.status);
        // Sync with server response silently
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      })
      .catch(error => {
        console.error('❌ Backend failed (iOS), reverting:', error);
        // Revert on error
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
      });
  }, [confettiRef]);

  if (loading) {
    return (
      <LinearGradient colors={['#2784F5', '#1a5fb8']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Filter tasks based on showCompleted toggle
  const filteredTasks = showCompleted 
    ? tasks 
    : tasks.filter(t => t.status !== 'DONE');

  const emptyMessage = showCompleted 
    ? 'אין משימות כרגע'
    : 'אין משימות פעילות כרגע';

  return (
    <LinearGradient colors={['#2784F5', '#1a5fb8']} style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>משימות</Text>
          <Text style={styles.subtitle}>המשימות שלך לקראת הנסיעה</Text>
        </View>

        {/* Filter Toggle */}
        <View style={styles.filterContainer}>
          <Switch
            value={showCompleted}
            onValueChange={setShowCompleted}
            trackColor={{ false: '#FFFFFF40', true: '#F5AD27' }}
            thumbColor={showCompleted ? '#FFFFFF' : '#E0E0E0'}
            ios_backgroundColor="#FFFFFF40"
          />
          <Text style={styles.filterLabel}>הצג משימות שהושלמו</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
            />
          }
        >
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={64}
                color="#FFFFFF"
              />
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleCompleteTask}
              />
            ))
          )}
        </ScrollView>

        {/* Confetti animation overlay */}
        <View style={styles.confettiContainer}>
          <ConfettiCannon
            ref={confettiRef}
            count={150}
            origin={{ x: -10, y: 0 }}
            autoStart={false}
            fadeOut={true}
            fallSpeed={2500}
            colors={['#2784F5', '#F5AD27', '#4CAF50', '#FF6B6B', '#FFD93D', '#6BCF7F']}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
