import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { Avatar, Card, Text, IconButton, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  USERS_COLLECTION_ID,
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
  const [ownerName, setOwnerName] = useState('');

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

  const resolveUserName = async (userId, fallbackName = '') => {
    const fromPost = (fallbackName || '').trim();
    if (fromPost) return fromPost;
    if (!userId) return '';
    try {
      const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
      return (userDoc?.name || userDoc?.email || '').trim();
    } catch (error) {
      return '';
    }
  };

  const getOwnerFallbackLabel = (userId) => (userId ? `User ${userId.slice(-4)}` : 'User');

  useEffect(() => {
    let isActive = true;

    const loadOwnerName = async () => {
      if (!post) {
        setOwnerName('');
        return;
      }
      const resolved = await resolveUserName(post.createdBy, post.createdByName || '');
      if (!isActive) return;
      setOwnerName(resolved || getOwnerFallbackLabel(post.createdBy));
    };

    loadOwnerName();
    return () => {
      isActive = false;
    };
  }, [post?.createdBy, post?.createdByName]);

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
  const ownerDisplayName = ownerName || getOwnerFallbackLabel(post.createdBy);
  const ownerInitial = ownerDisplayName.trim().charAt(0).toUpperCase() || 'U';

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

  const handleOpenChat = async () => {
    if (!post?.createdBy) {
      Alert.alert('Chat unavailable', 'Post owner is not available for this listing.');
      return;
    }

    if (currentUserId && post.createdBy === currentUserId) {
      Alert.alert('Chat unavailable', 'This is your own post.');
      return;
    }

    const sellerName = await resolveUserName(post.createdBy, post.createdByName || '');

    navigation.navigate('ChatConversation', {
      postId: post.$id,
      postTitle: post.title || post.name || 'Listing',
      otherUserId: post.createdBy,
      otherUserName: sellerName,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
        <View style={styles.ownerCard}>
          <Avatar.Text size={36} label={ownerInitial} style={styles.ownerAvatar} labelStyle={styles.ownerAvatarLabel} />
          <View style={styles.ownerTextWrap}>
            <Text style={styles.ownerLabel}>Posted by</Text>
            <Text style={styles.ownerName} numberOfLines={1}>
              {ownerDisplayName}
            </Text>
          </View>
        </View>
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

            {!canManagePost ? (
              <Button
                mode="contained"
                icon="chat-outline"
                onPress={handleOpenChat}
                style={styles.chatButton}
              >
                Chat with Seller
              </Button>
            ) : null}
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
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  ownerAvatar: {
    backgroundColor: '#4f46e5',
  },
  ownerAvatarLabel: {
    color: '#fff',
    fontSize: 14,
  },
  ownerTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  ownerLabel: {
    color: '#666',
    fontSize: 11,
  },
  ownerName: {
    marginTop: 1,
    color: '#222',
    fontWeight: '700',
    fontSize: 15,
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
  chatButton: {
    marginTop: 16,
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
