import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ScrollView, RefreshControl } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Query } from 'react-native-appwrite';
import { useFocusEffect } from '@react-navigation/native';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import { authService } from '../../services/auth';
import { wishlistService } from '../../services/wishlist';
import UserBottomNav from '../../components/UserBottomNav';
import AdminBottomNav from '../../components/AdminBottomNav';

const WishlistScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    loadUserRole();
    loadWishlistItems();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadWishlistItems();
    }, [])
  );

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

  const loadWishlistItems = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const userId = currentUser?.$id || null;
      const wishlistIds = await wishlistService.getWishlistIds(userId);

      if (!wishlistIds.length || !POSTS_COLLECTION_ID) {
        setItems([]);
        return;
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.equal('$id', wishlistIds), Query.limit(100)]
      );

      const docs = result.documents || [];
      const ordered = wishlistIds
        .map((id) => docs.find((doc) => doc.$id === id))
        .filter(Boolean);
      setItems(ordered);
    } catch (error) {
      console.error('Load wishlist items error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async () => {
    const role = await authService.getUserRole();
    setUserRole(role || 'user');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWishlistItems();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Wishlist
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Your saved items
          </Text>
        </Card.Content>
      </Card>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <Card>
            <Card.Content>
              <Text>Loading wishlist...</Text>
            </Card.Content>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <Card.Content>
              <Text style={styles.emptyTitle}>No items in wishlist</Text>
              <Text variant="bodySmall" style={styles.emptyText}>
                Tap the heart icon on listings to add items.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          items.map((post) => {
            const imageIds = parseImageIds(post.imageIds);
            const firstImageId = imageIds[0];
            return (
              <Card key={post.$id} style={styles.postCard}>
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
          })
        )}
      </ScrollView>

      {userRole === 'admin' ? (
        <AdminBottomNav activeTab="home" />
      ) : (
        <UserBottomNav activeTab="home" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 10,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  title: {
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 6,
    color: '#666',
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    color: '#666',
  },
  postCard: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 160,
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
});

export default WishlistScreen;
