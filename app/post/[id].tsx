
import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
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

const { width: screenWidth } = Dimensions.get('window');

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

  const loadPost = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

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
            headerBackTitle: 'חזור',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
            headerShadowVisible: true,
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
            headerBackTitle: 'חזור',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
            headerShadowVisible: true,
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
  
  const visibleBlocks = isLocked ? blocks.slice(0, 2) : blocks;
  const hasMoreBlocks = isLocked && blocks.length > 2;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerTransparent: true,
          headerBackTitle: 'חזור',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          {/* Hero Cover Image - Full Width */}
          {post.coverImage && (
            <View style={styles.heroCoverContainer}>
              <Image
                source={resolveImageSource(post.coverImage)}
                style={styles.heroCoverImage}
                resizeMode="cover"
              />
              {/* Gradient Overlay for Text Readability */}
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                style={styles.heroGradient}
              />
              
              {/* Lock Badge on Cover */}
              {isLocked && (
                <View style={styles.heroLockBadge}>
                  <BlurView intensity={80} style={styles.lockBadgeBlur}>
                    <IconSymbol
                      ios_icon_name="lock.fill"
                      android_material_icon_name="lock"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.heroLockText}>תוכן נעול</Text>
                  </BlurView>
                </View>
              )}
            </View>
          )}

          {/* Article Content Container - Modern News Style */}
          <View style={[styles.articleContainer, { backgroundColor: colors.background }]}>
            {/* Article Header */}
            <View style={styles.articleHeader}>
              {/* Category Badge */}
              <View style={[
                styles.categoryBadge,
                isPublic ? styles.publicCategoryBadge : styles.contractCategoryBadge,
              ]}>
                <IconSymbol
                  ios_icon_name={isPublic ? 'globe' : 'lock.fill'}
                  android_material_icon_name={isPublic ? 'public' : 'lock'}
                  size={12}
                  color={isPublic ? designColors.primary : designColors.secondary}
                />
                <Text style={[
                  styles.categoryText,
                  isPublic ? styles.publicCategoryText : styles.contractCategoryText,
                ]}>
                  {isPublic ? 'תוכן ציבורי' : 'תוכן לחוזה בלבד'}
                </Text>
              </View>

              {/* Article Title */}
              <Text style={[styles.articleTitle, { color: colors.text }]}>
                {post.title}
              </Text>

              {/* Article Meta */}
              <View style={styles.articleMeta}>
                <View style={styles.metaItem}>
                  <IconSymbol
                    ios_icon_name="clock"
                    android_material_icon_name="access-time"
                    size={14}
                    color={colors.textTertiary}
                  />
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    זמן קריאה: {Math.max(2, Math.ceil(blocks.length * 0.5))} דקות
                  </Text>
                </View>
              </View>
            </View>

            {/* Article Divider */}
            <View style={[styles.articleDivider, { backgroundColor: colors.border }]} />

            {/* Article Body - Blocks */}
            <View style={styles.articleBody}>
              {visibleBlocks.map((block, index) => (
                <View key={block.id} style={styles.blockWrapper}>
                  <BlockRenderer block={block} />
                </View>
              ))}
            </View>

            {/* Locked Content Overlay - Premium Design */}
            {isLocked && hasMoreBlocks && (
              <View style={styles.lockedOverlayContainer}>
                {/* Smooth Gradient Fade */}
                <LinearGradient
                  colors={[
                    'transparent',
                    isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                    isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    isDark ? '#0F172A' : '#FFFFFF',
                  ]}
                  style={styles.fadeGradient}
                />
                
                {/* Premium Lock Card */}
                <View style={[
                  styles.premiumLockCard,
                  { backgroundColor: colors.surface },
                  isDark && styles.premiumLockCardDark,
                ]}>
                  {/* Lock Icon with Glow */}
                  <View style={styles.lockIconWrapper}>
                    <View style={[styles.lockIconGlow, { backgroundColor: designColors.secondaryBg }]} />
                    <View style={[styles.lockIconCircle, { backgroundColor: designColors.secondary }]}>
                      <IconSymbol
                        ios_icon_name="lock.fill"
                        android_material_icon_name="lock"
                        size={28}
                        color="#FFFFFF"
                      />
                    </View>
                  </View>
                  
                  {/* Lock Message */}
                  <Text style={[styles.lockTitle, { color: colors.text }]}>
                    תוכן זה זמין ללקוחות בלבד
                  </Text>
                  
                  <Text style={[styles.lockDescription, { color: colors.textSecondary }]}>
                    כדי לצפות בתוכן המלא ולקבל גישה לכל המידע והליווי האישי,
                    יש לחתום על חוזה עם החברה.
                  </Text>
                  
                  {/* Features List */}
                  <View style={styles.featuresList}>
                    <View style={styles.featureRow}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={20}
                        color={designColors.success}
                      />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                        גישה מלאה לכל התכנים והמדריכים
                      </Text>
                    </View>
                    
                    <View style={styles.featureRow}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={20}
                        color={designColors.success}
                      />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                        ליווי אישי לאורך כל התהליך
                      </Text>
                    </View>
                    
                    <View style={styles.featureRow}>
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
                  
                  {/* Contact Info */}
                  <View style={[styles.contactInfo, { backgroundColor: colors.backgroundSecondary }]}>
                    <IconSymbol
                      ios_icon_name="info.circle"
                      android_material_icon_name="info"
                      size={18}
                      color={designColors.primary}
                    />
                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                      פנה למנהל המערכת לפרטים נוספים
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
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
    paddingBottom: 120,
  },
  
  // Hero Cover - Full Width Modern Design
  heroCoverContainer: {
    width: screenWidth,
    height: 320,
    position: 'relative',
    backgroundColor: '#000',
  },
  heroCoverImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroLockBadge: {
    position: 'absolute',
    top: spacing.lg + 60,
    right: spacing.lg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  lockBadgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  heroLockText: {
    ...typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Article Container - News Site Style
  articleContainer: {
    marginTop: -spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.xl,
    paddingHorizontal: layout.screenPadding,
  },
  
  // Article Header
  articleHeader: {
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  publicCategoryBadge: {
    backgroundColor: designColors.primaryBg,
  },
  contractCategoryBadge: {
    backgroundColor: designColors.secondaryBg,
  },
  categoryText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  publicCategoryText: {
    color: designColors.primary,
  },
  contractCategoryText: {
    color: designColors.secondary,
  },
  articleTitle: {
    ...typography.displaySmall,
    marginBottom: spacing.md,
    textAlign: 'right',
    lineHeight: 42,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
  },
  
  // Article Divider
  articleDivider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  
  // Article Body - FIXED: Better spacing between blocks
  articleBody: {
    marginBottom: spacing.xl,
  },
  blockWrapper: {
    marginBottom: spacing.xl,
  },
  
  // Locked Overlay - Premium Design
  lockedOverlayContainer: {
    position: 'relative',
    marginTop: -spacing.xxxl * 2,
    paddingTop: spacing.xxxl * 2,
  },
  fadeGradient: {
    position: 'absolute',
    top: 0,
    left: -layout.screenPadding,
    right: -layout.screenPadding,
    height: 200,
  },
  premiumLockCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.xl,
  },
  premiumLockCardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  lockIconWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  lockIconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: radius.full,
    opacity: 0.3,
    top: -10,
    left: -10,
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lockDescription: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
  featuresList: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
    flex: 1,
    textAlign: 'right',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    width: '100%',
  },
  contactText: {
    ...typography.bodySmall,
    flex: 1,
    textAlign: 'right',
  },
});
