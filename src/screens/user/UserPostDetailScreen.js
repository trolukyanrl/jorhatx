import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
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

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    setPost(initialPost);
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
                icon="pencil-outline"
                size={22}
                onPress={() => navigation.navigate('CreateListing', { editPost: post })}
              />
              <IconButton
                icon="delete-outline"
                size={22}
                iconColor="#d32f2f"
                onPress={handleDelete}
              />
            </View>
          ) : null}

          <>
            <Text variant="titleLarge" style={styles.title}>
              {post.title || post.name || 'Untitled Post'}
            </Text>
            <Text style={styles.meta}>Category: {post.category || post.type || 'General'}</Text>
            <Text style={styles.meta}>Price: Rs. {post.price || 0}</Text>
            {post.location ? <Text style={styles.meta}>Location: {post.location}</Text> : null}
            {post.state ? <Text style={styles.meta}>State: {post.state}</Text> : null}
            {post.district ? <Text style={styles.meta}>District: {post.district}</Text> : null}
            {post.village ? <Text style={styles.meta}>Village/Town: {post.village}</Text> : null}
            {post.area ? <Text style={styles.meta}>Area/Landmark: {post.area}</Text> : null}
            {post.pinCode ? <Text style={styles.meta}>PIN Code: {post.pinCode}</Text> : null}
            <Text style={styles.meta}>Description:</Text>
            <Text style={styles.description}>{post.description || 'No description'}</Text>
          </>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserPostDetailScreen;
