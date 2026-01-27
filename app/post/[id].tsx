
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
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api, type Post } from '@/utils/api';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2784F5',
    marginBottom: 16,
    textAlign: 'right',
  },
  blocksContainer: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2784F5" />
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
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      </>
    );
  }

  const postTitle = post.title;
  const coverImage = post.coverImage;
  const blocks = post.blocks || [];

  return (
    <>
      <Stack.Screen
        options={{
          title: postTitle,
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2784F5"
            />
          }
        >
          {coverImage && (
            <View style={styles.coverImageContainer}>
              <Image
                source={resolveImageSource(coverImage)}
                style={styles.coverImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.contentContainer}>
            <Text style={styles.title}>{postTitle}</Text>

            <View style={styles.blocksContainer}>
              {blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
