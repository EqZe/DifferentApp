
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ImageSourcePropType,
  useColorScheme,
  I18nManager,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { api, type CategoryWithPosts } from '@/utils/api';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';
import LottieView from 'lottie-react-native';

// Enable RTL for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = layout.screenPadding;
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - (CARD_PADDING * 2) - CARD_GAP) / 2;

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

// Helper to map Material icon names to SF Symbols for iOS
function getIOSIconName(materialIconName: string): string {
  const iconMap: Record<string, string> = {
    'info': 'info.circle.fill',
    'notification-important': 'exclamationmark.circle.fill',
    'local-shipping': 'shippingbox.fill',
    'description': 'doc.text.fill',
    'lightbulb': 'lightbulb.fill',
    'help': 'questionmark.circle.fill',
    'star': 'star.fill',
    'store': 'storefront.fill',
    'folder': 'folder.fill',
    'phone': 'phone.fill',
    'label': 'tag.fill',
    'home': 'house.fill',
    'person': 'person.fill',
    'settings': 'gearshape.fill',
    'search': 'magnifyingglass',
    'email': 'envelope.fill',
    'calendar-today': 'calendar',
    'location-on': 'location.fill',
  };
  
  return iconMap[materialIconName] || 'folder.fill';
}

export default function HomeScreen() {
  const { user, isLoading, refreshUser } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? designColors.dark : designColors.light;
  
  const [categories, setCategories] = useState<CategoryWithPosts[]>([]);
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

  const loadCategories = useCallback(async () => {
    try {
      console.log('HomeScreen: Loading categories from new structure');
      const fetchedCategories = await api.getCategories();
      console.log('HomeScreen: Categories loaded:', fetchedCategories.map(c => `${c.name} (id: ${c.id}, icon: ${c.iconName})`));
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('HomeScreen: Failed to load categories', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadCategories();
      // Update greeting when component mounts
      setGreeting(getTimeBasedGreeting());
    }
  }, [loadCategories, user]);

  const onRefresh = async () => {
    console.log('HomeScreen: Refreshing categories and user data');
    setRefreshing(true);
    // Update greeting on refresh
    setGreeting(getTimeBasedGreeting());
    
    // Refresh user data from database to get latest hasContract value
    await refreshUser();
    
    // Then load categories
    await loadCategories();
  };

  const handleCategoryPress = async (categoryId: string, categoryName: string) => {
    console.log('HomeScreen: Opening category', categoryName, 'with ID', categoryId);
    
    // Check if category has only 1 post
    const category = categories.find(c => c.id === categoryId);
    if (category && category.postCount === 1) {
      console.log('HomeScreen: Category has only 1 post, navigating directly to post');
      try {
        // Fetch the single post for this category
        const posts = await api.getPostsByCategory(categoryId);
        if (posts.length === 1) {
          console.log('HomeScreen: Navigating directly to post', posts[0].id);
          // Navigate directly to the post with a flag to return to home
          router.push(`/post/${posts[0].id}?fromHome=true`);
          return;
        }
      } catch (error) {
        console.error('HomeScreen: Failed to fetch posts for single-post category', error);
        // Fall back to category view on error
      }
    }
    
    // Use category ID for routing (more reliable than name)
    router.push(`/(tabs)/(home)/category/${categoryId}`);
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
      {/* Header with Lottie Animation Background - Fixed at top */}
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
        
        {/* Company Logo - Position 50% lower (75px from bottom instead of 0) */}
        <Image
          source={require('@/assets/images/864198af-83b6-4cbd-bb45-8f2196a4449e.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* Header Content - Aligned to Bottom with Gap */}
        <SafeAreaView style={styles.header} edges={['top']}>
          <View style={styles.headerContent}>
            {/* Dynamic Time-Based Greeting - Single line with dynamic sizing */}
            <View style={styles.greetingContainer}>
              <Text 
                style={styles.greetingText} 
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {personalizedGreeting}
              </Text>
            </View>
          </View>
        </SafeAreaView>

      </View>

      {/* Modern Gradient Separator - Between header and content */}
      <View style={styles.gradientSeparator}>
        <LinearGradient
          colors={[
            '#169fde',
            isDark ? designColors.dark.background : designColors.light.background,
          ]}
          locations={[0, 1]}
          style={styles.gradientFill}
        />
      </View>

      {/* Content - Scrollable area below gradient */}
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
        {/* Categories Grid - 2 columns */}
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <IconSymbol
                ios_icon_name="folder"
                android_material_icon_name="folder"
                size={48}
                color={colors.textTertiary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>אין קטגוריות זמינות כרגע</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              התוכן יתעדכן בקרוב
            </Text>
          </View>
        ) : (
          <View style={styles.categoriesGrid}>
            {categories.map((category) => {
              const iconName = category.iconName || 'folder';
              const iosIconName = getIOSIconName(iconName);
              
              console.log(`HomeScreen: Rendering category "${category.name}" (ID: ${category.id}) with icon "${iconName}" (iOS: ${iosIconName})`);
              
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    isDark && styles.categoryCardDark,
                  ]}
                  onPress={() => handleCategoryPress(category.id, category.name)}
                  activeOpacity={0.7}
                >
                  {/* Cover Image with Blur and Centered Icon */}
                  <View style={styles.categoryImageContainer}>
                    {category.coverImage ? (
                      <>
                        {/* Blurred Background Image - Minimized blur */}
                        <Image
                          source={resolveImageSource(category.coverImage)}
                          style={styles.categoryImage}
                          resizeMode="cover"
                          blurRadius={1.5}
                        />
                        {/* Centered Icon on Blurred Image */}
                        <View style={styles.categoryIconOverlay}>
                          <View style={styles.categoryIconCircle}>
                            <IconSymbol
                              ios_icon_name={iosIconName}
                              android_material_icon_name={iconName}
                              size={48}
                              color="#FFFFFF"
                            />
                          </View>
                        </View>
                      </>
                    ) : (
                      <View style={[styles.categoryImagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={styles.categoryIconCircle}>
                          <IconSymbol
                            ios_icon_name={iosIconName}
                            android_material_icon_name={iconName}
                            size={48}
                            color={colors.textTertiary}
                          />
                        </View>
                      </View>
                    )}
                    
                    {/* Gold Badge for categories with contract_only posts */}
                    {category.hasContractOnlyPosts && (
                      <View style={styles.categoryBadgeContainer}>
                        <LinearGradient
                          colors={['#FFD700', '#FFA500']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.goldBadge}
                        >
                          <IconSymbol
                            ios_icon_name="star.fill"
                            android_material_icon_name="star"
                            size={10}
                            color="#FFFFFF"
                          />
                        </LinearGradient>
                      </View>
                    )}
                  </View>

                  {/* Card Content - Centered Title Only */}
                  <View style={styles.categoryCardContent}>
                    {/* Category Name - Centered */}
                    <Text style={[styles.categoryTitle, { color: colors.text }]} numberOfLines={2}>
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  
  // Header Wrapper with Lottie Background - Fixed at top with z-index
  headerWrapper: {
    height: 240,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
    zIndex: 11,
    opacity: 0.6,
  },
  header: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
    zIndex: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 30,
    position: 'relative',
  },
  // Logo - Position absolute 50% lower (75px from bottom instead of 0)
  logo: {
    width: 150,
    height: 150,
    position: 'absolute',
    left: layout.screenPadding,
    bottom: 75,
    zIndex: 13,
  },
  
  // Greeting Container - Full width, aligned to right
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingLeft: 160, // Space for the logo
  },
  
  // Dynamic Greeting - Prominent Typography - RTL Aligned, single line
  greetingText: {
    ...typography.h2,
    color: '#FFFFFF',
    textAlign: 'right',
    fontWeight: '700',
    writingDirection: 'rtl',
  },

  // Gradient Separator - Modern transition between header and content
  gradientSeparator: {
    position: 'absolute',
    top: 240,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 5,
  },
  gradientFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  content: {
    flex: 1,
    marginTop: 320,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  
  // Categories Grid - 2 columns
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  
  // Category Card - Modern with visible drop shadow
  categoryCard: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    // Visible drop shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  categoryCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  categoryImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: designColors.light.backgroundSecondary,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Icon Overlay - Centered on blurred image
  categoryIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(39, 159, 222, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  
  categoryBadgeContainer: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  
  // GOLD BADGE for categories with contract_only posts
  goldBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Card Content - Centered Title Only
  categoryCardContent: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  categoryTitle: {
    ...typography.h5,
    textAlign: 'center',
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
