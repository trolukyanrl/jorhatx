import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { Card, Text, IconButton, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import { authService } from '../../services/auth';
import UserBottomNav from '../../components/UserBottomNav';
import AdminBottomNav from '../../components/AdminBottomNav';

const UserPostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const initialPost = route.params?.post || null;
  const fromMyPosts = route.params?.fromMyPosts === true;
  const imageWidth = Dimensions.get('window').width - 24;
  const [userRole, setUserRole] = useState('user');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [post, setPost] = useState(initialPost);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialPost?.title || '');
  const [category, setCategory] = useState(initialPost?.category || '');
  const [price, setPrice] = useState((initialPost?.price ?? '').toString());
  const [description, setDescription] = useState(initialPost?.description || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    setPost(initialPost);
    setTitle(initialPost?.title || '');
    setCategory(initialPost?.category || '');
    setPrice((initialPost?.price ?? '').toString());
    setDescription(initialPost?.description || '');
  }, [initialPost]);

  const loadUserInfo = async () => {
    const role = await authService.getUserRole();
    const user = await authService.getCurrentUser();
    setUserRole(role || 'user');
    setCurrentUserId(user?.$id || null);
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

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text>Post not found.</Text>
        </View>
        {userRole === 'admin' ? (
          <AdminBottomNav activeTab="home" />
        ) : (
          <UserBottomNav activeTab="home" />
        )}
      </View>
    );
  }

  const imageIds = parseImageIds(post.imageIds);
  const canManagePost = fromMyPosts && !!currentUserId && post.createdBy === currentUserId;

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const numericPrice = Number(price);

    if (!trimmedTitle) {
      Alert.alert('Validation', 'Please enter title.');
      return;
    }
    if (!trimmedCategory) {
      Alert.alert('Validation', 'Please enter category.');
      return;
    }
    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Validation', 'Please enter a valid price.');
      return;
    }

    try {
      setSaving(true);
      const updated = await databases.updateDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        post.$id,
        {
          title: trimmedTitle,
          category: trimmedCategory,
          price: numericPrice,
          description: trimmedDescription,
        }
      );

      setPost(updated);
      setIsEditing(false);
      Alert.alert('Success', 'Post updated.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await databases.deleteDocument(DATABASE_ID, POSTS_COLLECTION_ID, post.$id);
            Alert.alert('Deleted', 'Post deleted successfully.');
            navigation.replace('MyPosts');
          } catch (error) {
            Alert.alert('Error', error?.message || 'Failed to delete post.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
        {imageIds.length > 0 && LISTING_IMAGES_BUCKET_ID ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {imageIds.map((imageId) => (
              <Image
                key={imageId}
                source={{ uri: getStorageFileViewUrl(LISTING_IMAGES_BUCKET_ID, imageId) }}
                style={[styles.image, { width: imageWidth }]}
              />
            ))}
          </ScrollView>
        ) : null}
        <Card.Content>
          {canManagePost ? (
            <View style={styles.actionRow}>
              <IconButton
                icon={isEditing ? 'content-save-outline' : 'pencil-outline'}
                size={22}
                onPress={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={saving}
              />
              <IconButton
                icon={isEditing ? 'close' : 'delete-outline'}
                size={22}
                iconColor={isEditing ? '#666' : '#d32f2f'}
                onPress={isEditing ? () => setIsEditing(false) : handleDelete}
                disabled={saving}
              />
            </View>
          ) : null}

          {isEditing ? (
            <>
              <TextInput
                mode="outlined"
                label="Title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Category"
                value={category}
                onChangeText={setCategory}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={styles.input}
              />
            </>
          ) : (
            <>
              <Text variant="titleLarge" style={styles.title}>
                {post.title || post.name || 'Untitled Post'}
              </Text>
              <Text style={styles.meta}>Category: {post.category || post.type || 'General'}</Text>
              <Text style={styles.meta}>Price: Rs. {post.price || 0}</Text>
              <Text style={styles.meta}>Description:</Text>
              <Text style={styles.description}>{post.description || 'No description'}</Text>
            </>
          )}
        </Card.Content>
        </Card>
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
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 96,
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    height: 220,
    backgroundColor: '#eee',
  },
  title: {
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  meta: {
    color: '#555',
    marginTop: 4,
  },
  description: {
    color: '#444',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  input: {
    marginBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserPostDetailScreen;
