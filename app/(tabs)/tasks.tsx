
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { api, Task } from '@/utils/api';

export default function TasksScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.hasSignedAgreement) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      console.log('Loading tasks for user:', user.id);
      const loadedTasks = await api.getTasks(user.id);
      console.log('Tasks loaded:', loadedTasks.length);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      console.log('Completing task:', taskId);
      await api.completeTask(taskId);
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, isCompleted: true } : task
      ));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  if (!user) {
    return null;
  }

  // Show message if user hasn't signed agreement yet
  if (!user.hasSignedAgreement) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.emptyStateContainer}>
          <View style={styles.iconCircle}>
            <LinearGradient
              colors={['#F5AD27', '#E09A1F']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={48}
                color="#FFFFFF"
              />
            </LinearGradient>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            תכונה זו תהיה זמינה לאחר חתימת ההסכם
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text + '99' }]}>
            לאחר שתחתום על ההסכם, תוכל לראות את המשימות שלך לפני הנסיעה לסין
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#2784F5', '#1E6FD9']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>המשימות שלי</Text>
            <Text style={styles.headerSubtitle}>משימות לפני הנסיעה לסין</Text>
          </View>
        </LinearGradient>

        {/* Travel Date Card */}
        {user.travelDate && (
          <View style={styles.contentContainer}>
            <View style={[styles.travelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.travelCardHeader}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={24}
                  color="#2784F5"
                />
                <Text style={[styles.travelCardTitle, { color: colors.text }]}>תאריך הנסיעה</Text>
              </View>
              <Text style={[styles.travelDate, { color: colors.text }]}>
                {new Date(user.travelDate).toLocaleDateString('he-IL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Tasks List */}
        <View style={styles.contentContainer}>
          {isLoading && tasks.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2784F5" />
              <Text style={[styles.loadingText, { color: colors.text + '99' }]}>טוען משימות...</Text>
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={64}
                color={colors.text + '33'}
              />
              <Text style={[styles.emptyText, { color: colors.text + '99' }]}>
                אין משימות כרגע
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.text + '66' }]}>
                המשימות שלך יופיעו כאן
              </Text>
            </View>
          ) : (
            <View style={styles.tasksContainer}>
              {tasks.map((task, index) => (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    task.isCompleted && styles.taskCardCompleted,
                  ]}
                >
                  <View style={styles.taskHeader}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        { borderColor: task.isCompleted ? '#10B981' : colors.border },
                        task.isCompleted && styles.checkboxCompleted,
                      ]}
                      onPress={() => !task.isCompleted && handleCompleteTask(task.id)}
                      disabled={task.isCompleted}
                    >
                      {task.isCompleted && (
                        <IconSymbol
                          ios_icon_name="checkmark"
                          android_material_icon_name="check"
                          size={18}
                          color="#FFFFFF"
                        />
                      )}
                    </TouchableOpacity>
                    <View style={styles.taskContent}>
                      <Text
                        style={[
                          styles.taskTitle,
                          { color: colors.text },
                          task.isCompleted && styles.taskTitleCompleted,
                        ]}
                      >
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text
                          style={[
                            styles.taskDescription,
                            { color: colors.text + '99' },
                            task.isCompleted && styles.taskDescriptionCompleted,
                          ]}
                        >
                          {task.description}
                        </Text>
                      )}
                      {task.dueDate && (
                        <View style={styles.dueDateContainer}>
                          <IconSymbol
                            ios_icon_name="clock"
                            android_material_icon_name="schedule"
                            size={14}
                            color={task.isCompleted ? colors.text + '66' : '#F5AD27'}
                          />
                          <Text
                            style={[
                              styles.dueDate,
                              { color: task.isCompleted ? colors.text + '66' : '#F5AD27' },
                            ]}
                          >
                            {new Date(task.dueDate).toLocaleDateString('he-IL')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  travelCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  travelCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  travelCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  travelDate: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  tasksContainer: {
    gap: 12,
  },
  taskCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'right',
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  dueDateContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#F5AD27',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
