
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ImageSourcePropType,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { api, type Post } from '@/utils/api';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? designColors.dark : designColors.light;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    try {
      console.log('HomeScreen: Loading posts for user', user?.hasContract);
      const fetchedPosts = await api.getPosts(user?.hasContract);
      console.log('HomeScreen: Posts loaded', fetchedPosts.length);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('HomeScreen: Failed to load posts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('HomeScreen: Refreshing posts');
    setRefreshing(true);
    loadPosts();
  };

  const handlePostPress = (postId: string) => {
    console.log('HomeScreen: Opening post', postId);
    router.push(`/post/${postId}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designColors.primary} />
        </SafeAreaView>
      </View>
    );
  }

  const welcomeText = user?.hasSignedAgreement 
    ? 'ברוכים הבאים למערכת הליווי'
    : 'ברוכים הבאים';
  const userName = user?.fullName || '';
  const userStatus = user?.hasSignedAgreement ? 'לקוח פעיל' : 'משתמש רשום';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with gradient background */}
        <LinearGradient
          colors={[designColors.primary, designColors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Image
              source={require('@/assets/images/864198af-83b6-4cbd-bb45-8f2196a4449e.png')}
              style={styles.logo}
            />
            <Text style={styles.welcomeText}>{welcomeText}</Text>
            {user && (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName}</Text>
                <View style={styles.statusBadge}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.statusText}>{userStatus}</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={designColors.primary}
            />
          }
        >
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>תוכן ומידע</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              כל המידע החשוב במקום אחד
            </Text>
          </View>

          {/* Posts Grid */}
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <IconSymbol
                  ios_icon_name="doc.text"
                  android_material_icon_name="description"
                  size={48}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>אין תוכן זמין</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                התוכן יתעדכן בקרוב
              </Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {posts.map((post) => {
                const isPublic = post.visibility === 'public';
                const isLocked = !isPublic && !user?.hasContract;
                
                return (
                  <TouchableOpacity
                    key={post.id}
                    style={[
                      styles.postCard,
                      { backgroundColor: colors.surface },
                      isDark && styles.postCardDark,
                    ]}
                    onPress={() => handlePostPress(post.id)}
                    activeOpacity={0.7}
                  >
                    {/* Cover Image */}
                    {post.coverImage && (
                      <View style={styles.coverImageContainer}>
                        <Image
                          source={resolveImageSource(post.coverImage)}
                          style={styles.coverImage}
                          resizeMode="cover"
                        />
                        {isLocked && (
                          <View style={styles.lockedOverlay}>
                            <BlurView intensity={30} style={StyleSheet.absoluteFill} />
                            <View style={styles.lockIconContainer}>
                              <IconSymbol
                                ios_icon_name="lock.fill"
                                android_material_icon_name="lock"
                                size={24}
                                color="#FFFFFF"
                              />
                            </View>
                          </View>
                        )}
                        
                        {/* Category Badge on Image */}
                        <View style={styles.imageBadgeContainer}>
                          <View style={[
                            styles.imageBadge,
                            isPublic ? styles.publicImageBadge : styles.contractImageBadge,
                          ]}>
                            <IconSymbol
                              ios_icon_name={isPublic ? 'globe' : 'lock.fill'}
                              android_material_icon_name={isPublic ? 'public' : 'lock'}
                              size={10}
                              color="#FFFFFF"
                            />
                            <Text style={styles.imageBadgeText}>
                              {isPublic ? 'ציבורי' : 'חוזה'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Card Content - RTL Optimized */}
                    <View style={styles.postCardContent}>
                      {/* Title */}
                      <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
                        {post.title}
                      </Text>

                      {/* Locked State Message */}
                      {isLocked && (
                        <View style={styles.lockedMessage}>
                          <IconSymbol
                            ios_icon_name="info.circle"
                            android_material_icon_name="info"
                            size={14}
                            color={designColors.locked}
                          />
                          <Text style={styles.lockedMessageText}>
                            זמין לאחר חתימת חוזה
                          </Text>
                        </View>
                      )}

                      {/* Action Footer */}
                      <View style={styles.postFooter}>
                        <View style={styles.readMoreContainer}>
                          <Text style={[styles.readMoreText, { color: designColors.primary }]}>
                            קרא עוד
                          </Text>
                          <IconSymbol
                            ios_icon_name="chevron.left"
                            android_material_icon_name="chevron-left"
                            size={16}
                            color={designColors.primary}
                          />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: layout.screenPadding,
  },
  headerContent: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: spacing.md,
  },
  welcomeText: {
    ...typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  userInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  userName: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    textAlign: 'right',
  },
  postsGrid: {
    gap: spacing.lg,
  },
  
  // Post Card - Modern Design with Shadow
  postCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  postCardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  coverImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: designColors.light.backgroundSecondary,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBadgeContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  imageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    ...shadows.md,
  },
  publicImageBadge: {
    backgroundColor: 'rgba(39, 132, 245, 0.9)',
  },
  contractImageBadge: {
    backgroundColor: 'rgba(245, 173, 39, 0.9)',
  },
  imageBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  
  // Card Content - RTL Optimized
  postCardContent: {
    padding: spacing.lg,
  },
  postTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
    textAlign: 'right',
    lineHeight: 28,
  },
  lockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: designColors.lockedBg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  lockedMessageText: {
    ...typography.labelSmall,
    color: designColors.locked,
    flex: 1,
    textAlign: 'right',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  readMoreText: {
    ...typography.label,
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
});
