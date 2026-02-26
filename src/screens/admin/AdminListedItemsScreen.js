import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Image } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Query } from 'react-native-appwrite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import AdminBottomNav from '../../components/AdminBottomNav';

const AdminListedItemsScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    try {
      if (!POSTS_COLLECTION_ID) {
        setItems([]);
        return;
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.orderDesc('$createdAt'), Query.limit(100)]
      );

      const adminItems = (result.documents || []).filter(
        (post) =>
          post.role === 'admin' ||
          post.createdByRole === 'admin' ||
          post.isAdminPost === true
      );

      setItems(adminItems);
    } catch (error) {
      console.error('Load listed items error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
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

  const renderItem = ({ item }) => {
    const imageIds = parseImageIds(item.imageIds);
    const firstImageId = imageIds[0];

    return (
      <Card
        style={styles.itemCard}
        onPress={() => navigation.navigate('AdminListedItemDetail', { itemId: item.$id })}
      >
        {firstImageId && LISTING_IMAGES_BUCKET_ID ? (
          <Image
            source={{ uri: getStorageFileViewUrl(LISTING_IMAGES_BUCKET_ID, firstImageId) }}
            style={styles.itemImage}
          />
        ) : null}
        <Card.Content>
          <Text variant="titleSmall" style={styles.title}>
            {item.title || 'Untitled Item'}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            Category: {item.category || 'General'}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            Price: Rs. {item.price || 0}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            Posted: {item.$createdAt ? new Date(item.$createdAt).toLocaleString() : 'N/A'}
          </Text>
          <View style={styles.tagWrap}>
            <Chip compact style={styles.tagChip} icon="shield-crown-outline">
              Admin Post
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.heading}>
        Listed Items ({items.length})
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.$id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>{loading ? 'Loading items...' : 'No listed items found.'}</Text>
          </View>
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
      />
      <AdminBottomNav activeTab="main" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  heading: {
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
  },
  listContent: {
    paddingBottom: 96,
  },
  itemCard: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  title: {
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  meta: {
    color: '#555',
    marginTop: 2,
  },
  tagWrap: {
    marginTop: 8,
    flexDirection: 'row',
  },
  tagChip: {
    backgroundColor: '#e8f5e9',
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
});

export default AdminListedItemsScreen;
