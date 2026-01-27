
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { api, type Post } from '@/utils/api';
import { useRouter } from 'expo-router';
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
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
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
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  postContent: {
    padding: 20,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2784F5',
    marginBottom: 8,
    textAlign: 'right',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  publicBadge: {
    backgroundColor: '#e3f2fd',
  },
  contractBadge: {
    backgroundColor: '#fff3e0',
  },
  badgeIcon: {
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  publicBadgeText: {
    color: '#2784F5',
  },
  contractBadgeText: {
    color: '#F5AD27',
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
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

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
      <LinearGradient colors={['#2784F5', '#1a5fb8']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const welcomeText = user?.hasSignedAgreement 
    ? 'ברוכים הבאים למערכת הליווי שלנו'
    : 'ברוכים הבאים';

  const userName = user?.fullName || '';

  return (
    <LinearGradient colors={['#2784F5', '#1a5fb8']} style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/864198af-83b6-4cbd-bb45-8f2196a4449e.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>{welcomeText}</Text>
          {user && (
            <Text style={styles.subtitle}>
              {userName}
            </Text>
          )}
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
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={64}
                color="#FFFFFF"
              />
              <Text style={styles.emptyText}>אין תוכן זמין כרגע</Text>
            </View>
          ) : (
            posts.map((post) => {
              const postTitle = post.title;
              const coverImage = post.coverImage;
              const visibility = post.visibility;
              const isPublic = visibility === 'public';
              const badgeText = isPublic ? 'ציבורי' : 'חוזה בלבד';

              return (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => handlePostPress(post.id)}
                  activeOpacity={0.7}
                >
                  {coverImage && (
                    <Image
                      source={resolveImageSource(coverImage)}
                      style={styles.coverImage}
                      resizeMode="cover"
                    />
                  )}
                  
                  <View style={styles.postContent}>
                    <Text style={styles.postTitle}>{postTitle}</Text>
                    
                    <View style={[
                      styles.visibilityBadge,
                      isPublic ? styles.publicBadge : styles.contractBadge
                    ]}>
                      <IconSymbol
                        ios_icon_name={isPublic ? 'globe' : 'lock.fill'}
                        android_material_icon_name={isPublic ? 'public' : 'lock'}
                        size={16}
                        color={isPublic ? '#2784F5' : '#F5AD27'}
                        style={styles.badgeIcon}
                      />
                      <Text style={[
                        styles.badgeText,
                        isPublic ? styles.publicBadgeText : styles.contractBadgeText
                      ]}>
                        {badgeText}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
