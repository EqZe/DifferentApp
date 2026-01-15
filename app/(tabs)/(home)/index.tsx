
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import Constants from 'expo-constants';

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  isPreAgreement: boolean;
  orderIndex: number;
  createdAt: string;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Loading posts for user:', user.fullName, 'Agreement status:', user.hasSignedAgreement);
      
      // Get backend URL from app.json configuration
      const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;
      console.log('Backend URL:', BACKEND_URL);
      
      if (!BACKEND_URL) {
        throw new Error('Backend URL not configured');
      }

      // Call the posts API endpoint with hasSignedAgreement query parameter
      // The API filters posts based on whether user has signed agreement
      const response = await fetch(`${BACKEND_URL}/api/posts?hasSignedAgreement=${user.hasSignedAgreement}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Posts API error:', response.status, errorText);
        throw new Error(`Failed to load posts: ${response.status}`);
      }

      const loadedPosts: Post[] = await response.json();
      console.log('Posts loaded from API:', loadedPosts.length);
      
      // Sort posts by orderIndex (API should return them sorted, but ensure it)
      const sortedPosts = loadedPosts.sort((a, b) => a.orderIndex - b.orderIndex);
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      // Show empty state or error message to user
      setPosts([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleButtonPress = (link: string) => {
    console.log('Opening link:', link);
    Linking.openURL(link).catch((err) => {
      console.error('Error opening link:', err);
    });
  };

  if (!user) {
    return null;
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
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>שלום, {user.fullName}</Text>
              <Text style={styles.subGreeting}>{user.city}</Text>
            </View>
            <View style={styles.statusBadge}>
              <IconSymbol
                ios_icon_name={user.hasSignedAgreement ? 'checkmark.circle.fill' : 'clock.fill'}
                android_material_icon_name={user.hasSignedAgreement ? 'check-circle' : 'schedule'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {user.hasSignedAgreement ? 'לאחר חתימה' : 'לפני חתימה'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Status Card */}
        <View style={styles.contentContainer}>
          <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statusCardHeader}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={24}
                color="#F5AD27"
              />
              <Text style={[styles.statusCardTitle, { color: colors.text }]}>סטטוס התהליך</Text>
            </View>
            <Text style={[styles.statusCardText, { color: colors.text + '99' }]}>
              {user.hasSignedAgreement
                ? 'חתמת על ההסכם! כעת תוכל לגשת לכל המידע והכלים הדרושים לתהליך הייבוא.'
                : 'אתה בשלב הראשוני. לאחר חתימת ההסכם, תקבל גישה מלאה למערכת הליווי.'}
            </Text>
            {user.hasSignedAgreement && user.travelDate && (
              <View style={styles.travelDateContainer}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={18}
                  color="#2784F5"
                />
                <Text style={[styles.travelDateText, { color: colors.text }]}>
                  תאריך נסיעה: {new Date(user.travelDate).toLocaleDateString('he-IL')}
                </Text>
              </View>
            )}
          </View>

          {/* Posts */}
          <View style={styles.postsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>מידע ומשאבים</Text>
            {isLoading && posts.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.text + '99' }]}>טוען תוכן...</Text>
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  ios_icon_name="doc.text"
                  android_material_icon_name="description"
                  size={48}
                  color={colors.text + '33'}
                />
                <Text style={[styles.emptyText, { color: colors.text + '99' }]}>
                  אין תוכן זמין כרגע
                </Text>
              </View>
            ) : (
              posts.map((post, index) => (
                <View
                  key={post.id}
                  style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  {post.imageUrl && (
                    <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
                  )}
                  <View style={styles.postContent}>
                    <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
                    <Text style={[styles.postText, { color: colors.text + '99' }]}>{post.content}</Text>
                    {post.buttonText && post.buttonLink && (
                      <TouchableOpacity
                        style={styles.postButton}
                        onPress={() => handleButtonPress(post.buttonLink!)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#F5AD27', '#E09A1F']}
                          style={styles.postButtonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.postButtonText}>{post.buttonText}</Text>
                          <IconSymbol
                            ios_icon_name="arrow.left"
                            android_material_icon_name="arrow-back"
                            size={18}
                            color="#FFFFFF"
                          />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
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
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusCardText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  travelDateContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 8,
  },
  travelDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  postsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'right',
  },
  postCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postContent: {
    padding: 20,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right',
  },
  postText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 16,
  },
  postButton: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#F5AD27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  postButtonGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
