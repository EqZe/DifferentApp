
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { api, type Post } from '@/utils/api';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
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
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2784F5',
    marginBottom: 12,
  },
  postContent: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postButton: {
    backgroundColor: '#F5AD27',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function HomeScreen() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    try {
      console.log('HomeScreen: Loading posts for user', user?.hasSignedAgreement);
      const fetchedPosts = await api.getPosts(user?.hasSignedAgreement);
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

  const handleButtonPress = (link: string) => {
    console.log('HomeScreen: Opening link', link);
    Linking.openURL(link).catch((err) => {
      console.error('HomeScreen: Failed to open link', err);
    });
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
              {user.fullName}
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
            posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postContent}>{post.content}</Text>
                
                {post.imageUrl && (
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={styles.postImage}
                  />
                )}

                {post.buttonText && post.buttonLink && (
                  <TouchableOpacity
                    style={styles.postButton}
                    onPress={() => handleButtonPress(post.buttonLink!)}
                  >
                    <Text style={styles.postButtonText}>{post.buttonText}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
