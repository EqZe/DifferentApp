
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { api, type Task } from '@/utils/api';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 32,
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
    elevation: 3,
  },
  taskCardCompleted: {
    backgroundColor: '#F8FAFB',
    opacity: 0.7,
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
  loadingAnimation: {
    width: 200,
    height: 200,
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
  return `${day} ${month}`;
}

// Animated Task Card Component
function AnimatedTaskCard({ 
  task, 
  onComplete, 
  isAnimating 
}: { 
  task: Task; 
  onComplete: (taskId: string, requiresPending: boolean, currentStatus: string) => void;
  isAnimating: boolean;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isAnimating) {
      // After 3 seconds, animate the card down
      translateY.value = withDelay(
        3000,
        withTiming(300, { duration: 600 })
      );
      opacity.value = withDelay(
        3000,
        withTiming(0, { duration: 600 })
      );
    }
  }, [isAnimating]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const isDone = task.status === 'DONE';
  const isPending = task.status === 'PENDING';
  const isYet = task.status === 'YET';
  const dueDateText = formatDate(task.dueDate);
  
  // Determine button text based on status and requirements
  let buttonText = 'התחל';
  if (task.requiresPending) {
    if (task.status === 'YET') {
      buttonText = 'התחל';
    } else if (task.status === 'PENDING') {
      buttonText = 'סיימתי';
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
    <Animated.View
      style={[
        styles.taskCard,
        isDone && styles.taskCardCompleted,
        animatedStyle,
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
        <Text style={styles.taskDescription}>
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
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isPending && styles.actionButtonPending,
            ]}
            onPress={() => onComplete(task.id, task.requiresPending, task.status)}
          >
            <Text style={styles.actionButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function TasksScreen() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animatingTaskIds, setAnimatingTaskIds] = useState<Set<string>>(new Set());
  const { colors } = useTheme();
  const confettiRef = useRef<any>(null);

  const loadTasks = useCallback(async () => {
    if (!user) return;

    const loadStartTime = Date.now();

    try {
      console.log('TasksScreen: Loading tasks for user', user.id);
      const fetchedTasks = await api.getTasks(user.id);
      console.log('TasksScreen: Tasks loaded', fetchedTasks.length);
      setTasks(fetchedTasks);
      
      // Check if loading took less than 1 second
      const loadDuration = Date.now() - loadStartTime;
      
      if (loadDuration < 1000) {
        // If it loaded quickly (< 1 second), don't show loader at all
        console.log('TasksScreen: Data loaded quickly (', loadDuration, 'ms), skipping loader');
      } else {
        // Ensure loading animation displays for at least 2.5 seconds
        const remainingTime = Math.max(0, 2500 - loadDuration);
        
        if (remainingTime > 0) {
          console.log('TasksScreen: Waiting', remainingTime, 'ms to ensure 2.5 second minimum loading display');
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      }
    } catch (error) {
      console.error('TasksScreen: Failed to load tasks', error);
      
      // Still ensure 2.5 second minimum display even on error
      const loadDuration = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, 2500 - loadDuration);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
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
    console.log('TasksScreen: Refreshing tasks');
    setRefreshing(true);
    loadTasks();
  };

  const handleCompleteTask = async (taskId: string, requiresPending: boolean, currentStatus: string) => {
    try {
      console.log('TasksScreen: User tapped complete button', { taskId, requiresPending, currentStatus });
      
      // Determine if this will result in DONE status
      const willBeDone = (!requiresPending) || (requiresPending && currentStatus === 'PENDING');
      
      // Optimistically update UI immediately
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === taskId) {
            let newStatus: 'YET' | 'PENDING' | 'DONE';
            
            if (requiresPending) {
              if (currentStatus === 'YET') {
                newStatus = 'PENDING';
              } else if (currentStatus === 'PENDING') {
                newStatus = 'DONE';
              } else {
                newStatus = 'DONE';
              }
            } else {
              newStatus = 'DONE';
            }
            
            return { ...task, status: newStatus };
          }
          return task;
        })
      );
      
      // Trigger confetti if task is being completed to DONE
      if (willBeDone) {
        console.log('TasksScreen: Task completed! Triggering confetti animation 🎉');
        confettiRef.current?.start();
        
        // Mark this task as animating
        setAnimatingTaskIds(prev => new Set(prev).add(taskId));
        
        // After 3.6 seconds (3s wait + 0.6s animation), remove from animating set
        setTimeout(() => {
          setAnimatingTaskIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
        }, 3600);
      }
      
      // Update backend
      const updatedTask = await api.completeTask(taskId, requiresPending);
      
      // Update with server response (in case of any discrepancies)
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? updatedTask : task
        )
      );
      
      console.log('TasksScreen: Task status updated successfully to', updatedTask.status);
    } catch (error) {
      console.error('TasksScreen: Failed to update task status', error);
      // Revert optimistic update on error
      loadTasks();
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#2784F5', '#1a5fb8']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <LottieView
            source={{ uri: 'https://lottie.host/6f61ecb2-edc0-4962-9779-c5cb64c8799e/LgBcgiSDs0.json' }}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const yetTasks = tasks.filter(t => t.status === 'YET');
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const doneTasks = tasks.filter(t => t.status === 'DONE');
  const sortedTasks = [...yetTasks, ...pendingTasks, ...doneTasks];

  return (
    <LinearGradient colors={['#2784F5', '#1a5fb8']} style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>משימות</Text>
          <Text style={styles.subtitle}>המשימות שלך לקראת הנסיעה</Text>
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
          {sortedTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={64}
                color="#FFFFFF"
              />
              <Text style={styles.emptyText}>אין משימות כרגע</Text>
            </View>
          ) : (
            sortedTasks.map((task) => (
              <AnimatedTaskCard
                key={task.id}
                task={task}
                onComplete={handleCompleteTask}
                isAnimating={animatingTaskIds.has(task.id)}
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
