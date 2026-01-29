
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
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
} from 'react-native-reanimated';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    // RTL layout - flip horizontally
    transform: [{ scaleX: -1 }],
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    // Flip content back to normal inside flipped card
    transform: [{ scaleX: -1 }],
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2784F5',
    flex: 1,
    marginRight: 12,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
    // Flip content back to normal inside flipped card
    transform: [{ scaleX: -1 }],
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    // Flip content back to normal inside flipped card
    transform: [{ scaleX: -1 }],
  },
  taskDate: {
    fontSize: 14,
    color: '#999999',
  },
  completeButton: {
    backgroundColor: '#F5AD27',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 16,
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
  return date.toLocaleDateString('he-IL');
}

export default function TasksScreen() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const confettiRef = useRef<any>(null);

  const loadTasks = useCallback(async () => {
    if (!user) return;

    try {
      console.log('TasksScreen: Loading tasks for user', user.id);
      const fetchedTasks = await api.getTasks(user.id);
      console.log('TasksScreen: Tasks loaded', fetchedTasks.length);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('TasksScreen: Failed to load tasks', error);
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
      const willBeDone = (!requiresPending) || (requiresPending && currentStatus === 'PENDING');
      if (willBeDone) {
        console.log('TasksScreen: Task completed! Triggering confetti animation 🎉');
        confettiRef.current?.start();
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
          <ActivityIndicator size="large" color="#FFFFFF" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          {tasks.length === 0 ? (
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
            tasks.map((task) => {
              const isDone = task.status === 'DONE';
              const isPending = task.status === 'PENDING';
              const dueDateText = formatDate(task.dueDate);
              
              // Determine button text based on status and requirements
              let buttonText = 'התחל משימה';
              if (task.requiresPending) {
                if (task.status === 'YET') {
                  buttonText = 'התחל משימה';
                } else if (task.status === 'PENDING') {
                  buttonText = 'סמן כהושלם';
                }
              } else {
                buttonText = 'סמן כהושלם';
              }
              
              return (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    isDone && styles.taskCardCompleted,
                  ]}
                >
                  <View style={styles.taskHeader}>
                    <Text
                      style={[
                        styles.taskTitle,
                        isDone && styles.taskTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                    <IconSymbol
                      ios_icon_name={
                        isDone ? 'checkmark.circle.fill' : isPending ? 'clock.fill' : 'circle'
                      }
                      android_material_icon_name={
                        isDone ? 'check-circle' : isPending ? 'schedule' : 'radio-button-unchecked'
                      }
                      size={24}
                      color={isDone ? '#4CAF50' : isPending ? '#F5AD27' : '#CCCCCC'}
                    />
                  </View>

                  {task.description && (
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                  )}

                  <View style={styles.taskFooter}>
                    <Text style={styles.taskDate}>
                      {dueDateText}
                    </Text>
                    <Text style={styles.taskDate}>תאריך יעד:</Text>
                    
                    {isDone ? (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>הושלם</Text>
                      </View>
                    ) : isPending ? (
                      <TouchableOpacity
                        style={[styles.completeButton, { backgroundColor: '#F5AD27' }]}
                        onPress={() => handleCompleteTask(task.id, task.requiresPending, task.status)}
                      >
                        <Text style={styles.completeButtonText}>{buttonText}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => handleCompleteTask(task.id, task.requiresPending, task.status)}
                      >
                        <Text style={styles.completeButtonText}>{buttonText}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
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
