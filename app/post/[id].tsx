
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ImageSourcePropType,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/IconSymbol';
import { api, type Post } from '@/utils/api';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { useUser } from '@/contexts/UserContext';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? designColors.dark : designColors.light;
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      console.log('PostDetailScreen: Loading post', id);
      setError(null);
      
      const fetchedPost = await api.getPostWithBlocks(id);
      
      if (!fetchedPost) {
        setError('הפוסט לא נמצא או שאין לך הרשאה לצפות בו');
        setPost(null);
      } else {
        console.log('PostDetailScreen: Post loaded with blocks', fetchedPost.blocks?.length || 0);
        setPost(fetchedPost);
      }
    } catch (err) {
      console.error('PostDetailScreen: Failed to load post', err);
      setError('שגיאה בטעינת הפוסט');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('PostDetailScreen: Refreshing post');
    setRefreshing(true);
    loadPost();
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'טוען...',
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={designColors.primary} />
        </View>
      </>
    );
  }

  if (error || !post) {
    const errorMessage = error || 'הפוסט לא נמצא';
    
    return (
      <>
        <Stack.Screen
          options={{
            title: 'שגיאה',
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.errorIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="error"
              size={48}
              color={designColors.error}
            />
          </View>
          <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
        </View>
      </>
    );
  }

  const isPublic = post.visibility === 'public';
  const isLocked = !isPublic && !user?.hasContract;
  const blocks = post.blocks || [];
  
  // Show only first 2 blocks for locked content
  const visibleBlocks = isLocked ? blocks.slice(0, 2) : blocks;
  const hasMoreBlocks = isLocked && blocks.length > 2;

  return (
    <>
      <Stack.Screen
        options={{
          title: post.title,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <ScrollView
            style={styles.scrollView}
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
            {/* Cover Image */}
            {post.coverImage && (
              <View style={styles.coverImageContainer}>
                <Image
                  source={resolveImageSource(post.coverImage)}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                {isLocked && (
                  <View style={styles.coverOverlay}>
                    <LinearGradient
                      colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.lockBadge}>
                      <IconSymbol
                        ios_icon_name="lock.fill"
                        android_material_icon_name="lock"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.lockBadgeText}>תוכן נעול</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Content Container */}
            <View style={styles.contentContainer}>
              {/* Title and Badge */}
              <View style={styles.titleSection}>
                <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
                <View style={[
                  styles.visibilityBadge,
                  isPublic ? styles.publicBadge : styles.contractBadge,
                ]}>
                  <IconSymbol
                    ios_icon_name={isPublic ? 'globe' : 'lock.fill'}
                    android_material_icon_name={isPublic ? 'public' : 'lock'}
                    size={14}
                    color={isPublic ? designColors.primary : designColors.secondary}
                  />
                  <Text style={[
                    styles.badgeText,
                    isPublic ? styles.publicBadgeText : styles.contractBadgeText,
                  ]}>
                    {isPublic ? 'תוכן ציבורי' : 'תוכן לחוזה בלבד'}
                  </Text>
                </View>
              </View>

              {/* Blocks Container */}
              <View style={styles.blocksContainer}>
                {visibleBlocks.map((block) => (
                  <BlockRenderer key={block.id} block={block} />
                ))}
              </View>

              {/* Locked Content Overlay */}
              {isLocked && hasMoreBlocks && (
                <View style={styles.lockedContentContainer}>
                  {/* Gradient Fade */}
                  <LinearGradient
                    colors={[
                      'transparent',
                      isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      isDark ? '#0F172A' : '#FFFFFF',
                    ]}
                    style={styles.fadeGradient}
                  />
                  
                  {/* Lock Message Card */}
                  <View style={[styles.lockMessageCard, { backgroundColor: colors.surface }, isDark && styles.lockMessageCardDark]}>
                    <View style={[styles.lockIconCircle, { backgroundColor: designColors.secondaryBg }]}>
                      <IconSymbol
                        ios_icon_name="lock.fill"
                        android_material_icon_name="lock"
                        size={32}
                        color={designColors.secondary}
                      />
                    </View>
                    
                    <Text style={[styles.lockMessageTitle, { color: colors.text }]}>
                      תוכן זה זמין ללקוחות בלבד
                    </Text>
                    
                    <Text style={[styles.lockMessageDescription, { color: colors.textSecondary }]}>
                      כדי לצפות בתוכן המלא, יש לחתום על חוזה עם החברה.
                      פנה למנהל המערכת לפרטים נוספים.
                    </Text>
                    
                    <View style={styles.lockMessageFeatures}>
                      <View style={styles.featureItem}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check-circle"
                          size={20}
                          color={designColors.success}
                        />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                          גישה מלאה לכל התכנים
                        </Text>
                      </View>
                      
                      <View style={styles.featureItem}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check-circle"
                          size={20}
                          color={designColors.success}
                        />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                          ליווי אישי לאורך התהליך
                        </Text>
                      </View>
                      
                      <View style={styles.featureItem}>
                        <IconSymbol
                          ios_icon_name="checkmark.circle.fill"
                          android_material_icon_name="check-circle"
                          size={20}
                          color={designColors.success}
                        />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                          תמיכה ועדכונים שוטפים
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.screenPadding,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.h4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  coverImageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: designColors.light.backgroundSecondary,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  lockBadgeText: {
    ...typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  publicBadge: {
    backgroundColor: designColors.primaryBg,
  },
  contractBadge: {
    backgroundColor: designColors.secondaryBg,
  },
  badgeText: {
    ...typography.label,
    fontWeight: '600',
  },
  publicBadgeText: {
    color: designColors.primary,
  },
  contractBadgeText: {
    color: designColors.secondary,
  },
  blocksContainer: {
    marginBottom: spacing.lg,
  },
  lockedContentContainer: {
    position: 'relative',
    marginTop: -spacing.xxxl,
    paddingTop: spacing.xxxl,
  },
  fadeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  lockMessageCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  lockMessageCardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  lockMessageTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lockMessageDescription: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  lockMessageFeatures: {
    width: '100%',
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
});
