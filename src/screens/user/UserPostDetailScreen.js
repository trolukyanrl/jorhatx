import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import {
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import { authService } from '../../services/auth';
import UserBottomNav from '../../components/UserBottomNav';
import AdminBottomNav from '../../components/AdminBottomNav';

const UserPostDetailScreen = () => {
  const route = useRoute();
  const post = route.params?.post;
  const imageWidth = Dimensions.get('window').width - 24;
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    const role = await authService.getUserRole();
    setUserRole(role || 'user');
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
          <Text variant="titleLarge" style={styles.title}>
            {post.title || post.name || 'Untitled Post'}
          </Text>
          <Text style={styles.meta}>Category: {post.category || post.type || 'General'}</Text>
          <Text style={styles.meta}>Price: Rs. {post.price || 0}</Text>
          <Text style={styles.meta}>Description:</Text>
          <Text style={styles.description}>{post.description || 'No description'}</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserPostDetailScreen;
