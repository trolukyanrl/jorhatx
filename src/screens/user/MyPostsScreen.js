import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, RefreshControl } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Query } from 'react-native-appwrite';
import { useNavigation } from '@react-navigation/native';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import { authService } from '../../services/auth';
import UserBottomNav from '../../components/UserBottomNav';

const MyPostsScreen = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMyPosts();
  }, []);

  const loadMyPosts = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.$id || !POSTS_COLLECTION_ID) {
        setPosts([]);
        return;
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.equal('createdBy', currentUser.$id), Query.orderDesc('$createdAt'), Query.limit(100)]
      );

      setPosts(result.documents || []);
    } catch (error) {
      console.error('Load my posts error:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyPosts();
    setRefreshing(false);
  };

  const parseImageIds = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text variant="titleMedium" style={styles.title}>
          My Posts
        </Text>

        {loading ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text>Loading your posts...</Text>
            </Card.Content>
          </Card>
        ) : posts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text variant="bodySmall" style={styles.emptyText}>
                Tap Sell to add your first post.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.grid}>
            {posts.map((post) => {
              const imageIds = parseImageIds(post.imageIds);
              const firstImageId = imageIds[0];

              return (
                <Card
                  key={post.$id}
                  style={styles.postCard}
                  onPress={() => navigation.navigate('UserPostDetail', { post, fromMyPosts: true })}
                >
                  {firstImageId && LISTING_IMAGES_BUCKET_ID ? (
                    <Image
                      source={{ uri: getStorageFileViewUrl(LISTING_IMAGES_BUCKET_ID, firstImageId) }}
                      style={styles.postImage}
                    />
                  ) : null}
                  <Card.Content>
                    <Text variant="titleSmall" style={styles.postTitle}>
                      {post.title || 'Untitled'}
                    </Text>
                    <Text variant="bodySmall" style={styles.postMeta}>
                      {(post.category || 'General').toString()}
                      {post.price ? ` | Rs. ${post.price}` : ''}
                    </Text>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <UserBottomNav activeTab="profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 96,
  },
  title: {
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  postCard: {
    width: '48%',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#eee',
  },
  postTitle: {
    fontWeight: '600',
    color: '#222',
  },
  postMeta: {
    marginTop: 6,
    color: '#666',
  },
  emptyCard: {
    borderRadius: 8,
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    color: '#666',
  },
});

export default MyPostsScreen;
