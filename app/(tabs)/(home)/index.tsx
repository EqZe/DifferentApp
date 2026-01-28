
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  ActivityIndicator,
  ImageSourcePropType,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { api, type Post } from '@/utils/api';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';
import LottieView from 'lottie-react-native';

// Enable RTL for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

// Helper function to get time-based greeting in Hebrew
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'בוקר טוב';
  } else if (hour >= 12 && hour < 18) {
    return 'צהריים טובים';
  } else {
    return 'ערב טוב';
  }
}

export default function HomeScreen() {
  const { user, isLoading, refreshUser } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? designColors.dark : designColors.light;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());

  // Redirect to register if user is null
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('HomeScreen: No user found, redirecting to register');
      router.replace('/register');
    }
  }, [user, isLoading, router]);

  const loadPosts = useCallback(async () => {
    try {
      console.log('HomeScreen: Loading ALL posts (public + contract_only)');
      const fetchedPosts = await api.getPosts();
      console.log('HomeScreen: Posts loaded', fetchedPosts.length, 'posts');
      console.log('HomeScreen: Post visibilities:', fetchedPosts.map(p => ({ title: p.title, visibility: p.visibility })));
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('HomeScreen: Failed to load posts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
      // Update greeting when component mounts
      setGreeting(getTimeBasedGreeting());
    }
  }, [loadPosts, user]);

  const onRefresh = async () => {
    console.log('HomeScreen: Refreshing posts and user data');
    setRefreshing(true);
    // Update greeting on refresh
    setGreeting(getTimeBasedGreeting());
    
    // Refresh user data from database to get latest hasContract value
    await refreshUser();
    
    // Then load posts
    await loadPosts();
  };

  const handlePostPress = (postId: string) => {
    console.log('HomeScreen: Opening post', postId);
    router.push(`/post/${postId}`);
  };

  // Don't render if no user
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designColors.primary} />
        </SafeAreaView>
      </View>
    );
  }

  const firstName = user?.fullName?.split(' ')[0] || '';
  const personalizedGreeting = firstName ? `${greeting}, ${firstName}` : greeting;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with Lottie Animation Background */}
        <View style={styles.headerWrapper}>
          {/* Blue Gradient Background */}
          <LinearGradient
            colors={[designColors.primary, designColors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Lottie Animation Layer */}
          <LottieView
            source={{ uri: 'https://lottie.host/fcc59560-b2cd-4dad-85d1-02d5cf35c039/OcOTugphwV.json' }}
            autoPlay
            loop
            style={styles.lottieAnimation}
            resizeMode="cover"
          />
          
          {/* Header Content - Aligned to Bottom with Gap */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Company Logo */}
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/864198af-83b6-4cbd-bb45-8f2196a4449e.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              {/* Dynamic Time-Based Greeting */}
              <Text style={styles.greetingText}>{personalizedGreeting}</Text>
            </View>
          </View>

          {/* Gradient Transition Overlay */}
          <LinearGradient
            colors={[
              'transparent',
              isDark ? 'rgba(18, 18, 18, 0.3)' : 'rgba(255, 255, 255, 0.3)',
              isDark ? 'rgba(18, 18, 18, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              isDark ? designColors.dark.background : designColors.light.background,
            ]}
            locations={[0, 0.5, 0.8, 1]}
            style={styles.gradientTransition}
          />
        </View>

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
              <Text style={[styles.emptyTitle, { color: colors.text }]}>אין תוכן זמין כרגע</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                התוכן יתעדכן בקרוב
              </Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {posts.map((post) => {
                const isContractOnly = post.visibility === 'contract_only';
                const isPublic = post.visibility === 'public';
                const isLocked = isContractOnly && !user?.hasContract;
                
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
                            <BlurView intensity={40} style={StyleSheet.absoluteFill} />
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
                        
                        {/* Gold Badge for contract_only posts - Visible to ALL logged-in users */}
                        {isContractOnly && (
                          <View style={styles.imageBadgeContainer}>
                            <LinearGradient
                              colors={['#FFD700', '#FFA500']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.goldBadge}
                            >
                              <IconSymbol
                                ios_icon_name="star.fill"
                                android_material_icon_name="star"
                                size={12}
                                color="#FFFFFF"
                              />
                              <Text style={styles.goldBadgeText}>חוזה</Text>
                            </LinearGradient>
                          </View>
                        )}
                        
                        {/* Blue Badge for public posts */}
                        {isPublic && (
                          <View style={styles.imageBadgeContainer}>
                            <View style={styles.publicImageBadge}>
                              <IconSymbol
                                ios_icon_name="globe"
                                android_material_icon_name="public"
                                size={10}
                                color="#FFFFFF"
                              />
                              <Text style={styles.imageBadgeText}>ציבורי</Text>
                            </View>
                          </View>
                        )}
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
                            ios_icon_name="info.circle.fill"
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
                          <IconSymbol
                            ios_icon_name="chevron.left"
                            android_material_icon_name="chevron-left"
                            size={16}
                            color={designColors.primary}
                          />
                          <Text style={[styles.readMoreText, { color: designColors.primary }]}>
                            קרא עוד
                          </Text>
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
  
  // Header Wrapper with Lottie Background
  headerWrapper: {
    height: 220,
    position: 'relative',
    overflow: 'visible',
  },
  lottieAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  header: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? spacing.lg : spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  logoContainer: {
    width: 70,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  
  // Dynamic Greeting - Prominent Typography
  greetingText: {
    ...typography.h2,
    color: '#FFFFFF',
    textAlign: 'right',
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.md,
  },

  // Gradient Transition from Header to Content
  gradientTransition: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  
  content: {
    flex: 1,
    marginTop: -40,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: 120,
  },
  postsGrid: {
    gap: spacing.md,
  },
  
  // Post Card - Clean Modern Design with Shadow
  postCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  postCardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  coverImageContainer: {
    width: '100%',
    height: 180,
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
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  imageBadgeContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  
  // GOLD BADGE for contract_only posts - Premium look
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    ...shadows.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  goldBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Blue badge for public posts
  publicImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(39, 132, 245, 0.95)',
    ...shadows.sm,
  },
  imageBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  
  // Card Content - RTL Optimized
  postCardContent: {
    padding: spacing.md,
  },
  postTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
    textAlign: 'right',
    lineHeight: 26,
    fontWeight: '600',
  },
  lockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: designColors.lockedBg,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  lockedMessageText: {
    ...typography.caption,
    color: designColors.locked,
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  readMoreText: {
    ...typography.labelSmall,
    fontWeight: '700',
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
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
});
